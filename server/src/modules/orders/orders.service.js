const { v4: uuid } = require('uuid');
const { getDatabase } = require('../../core/database');
const { AppError } = require('../../core/middleware/error-handler');
const LifecycleHooks = require('../../plugins/hooks/lifecycle');

const hooks = new LifecycleHooks('orders');

// Order status pipeline
const STATUS_FLOW = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: ['completed', 'refund_requested'],
  completed: [],
  cancelled: [],
  refund_requested: ['refunded', 'delivered'],
  refunded: [],
};

class OrdersService {
  constructor() {
    this.db = () => getDatabase();
  }

  async list({ page = 1, limit = 25, status, customerId, search, sortBy = 'created_at', sortOrder = 'desc' }) {
    const db = this.db();
    let query = db('orders');

    if (status) query = query.where('orders.status', status);
    if (customerId) query = query.where('orders.customer_id', customerId);
    if (search) {
      query = query.where((b) => {
        b.whereILike('orders.order_number', `%${search}%`)
          .orWhereILike('orders.customer_email', `%${search}%`);
      });
    }

    const [{ count }] = await query.clone().count('orders.id as count');
    const offset = (page - 1) * limit;

    const orders = await query
      .select('orders.*')
      .orderBy(`orders.${sortBy}`, sortOrder)
      .limit(limit)
      .offset(offset);

    return {
      data: orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(count),
        totalPages: Math.ceil(count / limit),
      },
    };
  }

  async findById(id) {
    const db = this.db();
    const order = await db('orders').where({ id }).first();
    if (!order) throw new AppError('Order not found', 404);

    const [items, history, shippingAddress, billingAddress] = await Promise.all([
      db('order_items')
        .where({ order_id: id })
        .select('order_items.*'),
      db('order_status_history')
        .where({ order_id: id })
        .orderBy('created_at', 'desc'),
      db('order_addresses').where({ order_id: id, type: 'shipping' }).first(),
      db('order_addresses').where({ order_id: id, type: 'billing' }).first(),
    ]);

    return { ...order, items, history, shippingAddress, billingAddress };
  }

  /**
   * Create order from cart
   */
  async create(data) {
    await hooks.run('beforeCreate', data);
    const db = this.db();

    return db.transaction(async (trx) => {
      const id = uuid();
      const orderNumber = await this.generateOrderNumber(trx);

      // Calculate totals
      let subtotal = 0;
      for (const item of data.items) {
        subtotal += item.price * item.quantity;
      }

      const taxAmount = data.taxAmount || 0;
      const shippingAmount = data.shippingAmount || 0;
      const discountAmount = data.discountAmount || 0;
      const total = subtotal + taxAmount + shippingAmount - discountAmount;

      // Create order
      const [order] = await trx('orders')
        .insert({
          id,
          order_number: orderNumber,
          customer_id: data.customerId || null,
          customer_email: data.customerEmail,
          customer_name: data.customerName,
          status: 'pending',
          subtotal,
          tax_amount: taxAmount,
          shipping_amount: shippingAmount,
          discount_amount: discountAmount,
          total,
          currency: data.currency || 'GEL',
          payment_method: data.paymentMethod || null,
          payment_status: 'pending',
          coupon_code: data.couponCode || null,
          notes: data.notes || null,
          created_at: new Date(),
          updated_at: new Date(),
        })
        .returning('*');

      // Create order items
      const orderItems = data.items.map((item) => ({
        id: uuid(),
        order_id: id,
        product_id: item.productId,
        variant_id: item.variantId || null,
        name: item.name,
        sku: item.sku || null,
        price: item.price,
        quantity: item.quantity,
        total: item.price * item.quantity,
      }));

      await trx('order_items').insert(orderItems);

      // Save addresses
      if (data.shippingAddress) {
        await trx('order_addresses').insert({
          id: uuid(),
          order_id: id,
          type: 'shipping',
          ...data.shippingAddress,
        });
      }

      if (data.billingAddress) {
        await trx('order_addresses').insert({
          id: uuid(),
          order_id: id,
          type: 'billing',
          ...data.billingAddress,
        });
      }

      // Record status history
      await trx('order_status_history').insert({
        id: uuid(),
        order_id: id,
        status: 'pending',
        note: 'Order created',
        created_at: new Date(),
      });

      // Decrease stock
      for (const item of data.items) {
        if (item.variantId) {
          await trx('product_variants')
            .where({ id: item.variantId })
            .decrement('stock_quantity', item.quantity);
        } else {
          await trx('products')
            .where({ id: item.productId })
            .decrement('stock_quantity', item.quantity);
        }
      }

      await hooks.run('afterCreate', order);
      return this.findById(id);
    });
  }

  /**
   * Update order status with pipeline validation
   */
  async updateStatus(id, newStatus, note = null, userId = null) {
    const db = this.db();
    const order = await db('orders').where({ id }).first();
    if (!order) throw new AppError('Order not found', 404);

    const allowedStatuses = STATUS_FLOW[order.status];
    if (!allowedStatuses || !allowedStatuses.includes(newStatus)) {
      throw new AppError(
        `Cannot transition from "${order.status}" to "${newStatus}". Allowed: ${allowedStatuses?.join(', ') || 'none'}`,
        400
      );
    }

    await db('orders').where({ id }).update({
      status: newStatus,
      updated_at: new Date(),
    });

    await db('order_status_history').insert({
      id: uuid(),
      order_id: id,
      status: newStatus,
      note,
      changed_by: userId,
      created_at: new Date(),
    });

    // If cancelled, restore stock
    if (newStatus === 'cancelled') {
      await this.restoreStock(id);
    }

    return this.findById(id);
  }

  async updatePaymentStatus(id, paymentStatus, transactionId = null) {
    const db = this.db();
    await db('orders').where({ id }).update({
      payment_status: paymentStatus,
      transaction_id: transactionId,
      updated_at: new Date(),
    });
  }

  async restoreStock(orderId) {
    const db = this.db();
    const items = await db('order_items').where({ order_id: orderId });

    for (const item of items) {
      if (item.variant_id) {
        await db('product_variants')
          .where({ id: item.variant_id })
          .increment('stock_quantity', item.quantity);
      } else {
        await db('products')
          .where({ id: item.product_id })
          .increment('stock_quantity', item.quantity);
      }
    }
  }

  async generateOrderNumber(trx) {
    const prefix = 'ORD';
    const date = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    const [result] = await trx.raw(
      "SELECT nextval(pg_get_serial_sequence('order_counter', 'id')) as seq"
    ).catch(() => [{ seq: Math.floor(Math.random() * 99999) }]);
    const seq = String(result?.seq || Date.now() % 99999).padStart(5, '0');
    return `${prefix}-${date}-${seq}`;
  }

  /**
   * Dashboard statistics
   */
  async getStats() {
    const db = this.db();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalOrders, todayOrders, totalRevenue, todayRevenue, statusCounts] = await Promise.all([
      db('orders').count('id as count').first(),
      db('orders').where('created_at', '>=', today).count('id as count').first(),
      db('orders')
        .whereIn('status', ['confirmed', 'processing', 'shipped', 'delivered', 'completed'])
        .sum('total as sum').first(),
      db('orders')
        .where('created_at', '>=', today)
        .whereIn('status', ['confirmed', 'processing', 'shipped', 'delivered', 'completed'])
        .sum('total as sum').first(),
      db('orders')
        .select('status')
        .count('id as count')
        .groupBy('status'),
    ]);

    return {
      totalOrders: parseInt(totalOrders.count),
      todayOrders: parseInt(todayOrders.count),
      totalRevenue: parseFloat(totalRevenue.sum || 0),
      todayRevenue: parseFloat(todayRevenue.sum || 0),
      statusCounts: statusCounts.reduce((acc, row) => {
        acc[row.status] = parseInt(row.count);
        return acc;
      }, {}),
    };
  }
}

module.exports = new OrdersService();
