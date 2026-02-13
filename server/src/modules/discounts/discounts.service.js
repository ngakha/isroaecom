const { v4: uuid } = require('uuid');
const { getDatabase } = require('../../core/database');
const { AppError } = require('../../core/middleware/error-handler');

class DiscountsService {
  constructor() {
    this.db = () => getDatabase();
  }

  async list({ page = 1, limit = 25, active }) {
    const db = this.db();
    let query = db('discounts');

    if (active === 'true') {
      const now = new Date();
      query = query
        .where('is_active', true)
        .where('starts_at', '<=', now)
        .where(function () {
          this.whereNull('ends_at').orWhere('ends_at', '>=', now);
        });
    }

    const [{ count }] = await query.clone().count('id as count');
    const offset = (page - 1) * limit;

    const discounts = await query
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset);

    return {
      data: discounts,
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
    const discount = await db('discounts').where({ id }).first();
    if (!discount) throw new AppError('Discount not found', 404);
    return discount;
  }

  async create(data) {
    const db = this.db();
    const id = uuid();

    // Check for duplicate code
    if (data.code) {
      const existing = await db('discounts')
        .where({ code: data.code.toUpperCase() })
        .first();
      if (existing) throw new AppError('Coupon code already exists', 409);
    }

    const [discount] = await db('discounts')
      .insert({
        id,
        name: data.name,
        code: data.code ? data.code.toUpperCase() : null,
        type: data.type, // 'percentage' | 'fixed' | 'free_shipping'
        value: data.value,
        minimum_order_amount: data.minimumOrderAmount || 0,
        maximum_discount_amount: data.maximumDiscountAmount || null,
        usage_limit: data.usageLimit || null,
        usage_count: 0,
        per_customer_limit: data.perCustomerLimit || null,
        applies_to: data.appliesTo || 'all', // 'all' | 'specific_products' | 'specific_categories'
        applicable_ids: data.applicableIds ? JSON.stringify(data.applicableIds) : null,
        is_automatic: data.isAutomatic || false,
        is_active: data.isActive !== false,
        starts_at: data.startsAt || new Date(),
        ends_at: data.endsAt || null,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning('*');

    return discount;
  }

  async update(id, data) {
    const db = this.db();
    const updateData = { updated_at: new Date() };

    if (data.name !== undefined) updateData.name = data.name;
    if (data.code !== undefined) updateData.code = data.code.toUpperCase();
    if (data.type !== undefined) updateData.type = data.type;
    if (data.value !== undefined) updateData.value = data.value;
    if (data.minimumOrderAmount !== undefined) updateData.minimum_order_amount = data.minimumOrderAmount;
    if (data.maximumDiscountAmount !== undefined) updateData.maximum_discount_amount = data.maximumDiscountAmount;
    if (data.usageLimit !== undefined) updateData.usage_limit = data.usageLimit;
    if (data.perCustomerLimit !== undefined) updateData.per_customer_limit = data.perCustomerLimit;
    if (data.appliesTo !== undefined) updateData.applies_to = data.appliesTo;
    if (data.applicableIds !== undefined) updateData.applicable_ids = JSON.stringify(data.applicableIds);
    if (data.isAutomatic !== undefined) updateData.is_automatic = data.isAutomatic;
    if (data.isActive !== undefined) updateData.is_active = data.isActive;
    if (data.startsAt !== undefined) updateData.starts_at = data.startsAt;
    if (data.endsAt !== undefined) updateData.ends_at = data.endsAt;

    const [discount] = await db('discounts').where({ id }).update(updateData).returning('*');
    if (!discount) throw new AppError('Discount not found', 404);
    return discount;
  }

  async delete(id) {
    const db = this.db();
    const deleted = await db('discounts').where({ id }).del();
    if (!deleted) throw new AppError('Discount not found', 404);
  }

  /**
   * Validate and apply a coupon code to a cart
   */
  async applyCoupon(code, { subtotal, customerId, items }) {
    const db = this.db();
    const now = new Date();

    const discount = await db('discounts')
      .where({ code: code.toUpperCase(), is_active: true })
      .where('starts_at', '<=', now)
      .where(function () {
        this.whereNull('ends_at').orWhere('ends_at', '>=', now);
      })
      .first();

    if (!discount) throw new AppError('Invalid or expired coupon code', 400);

    // Check usage limit
    if (discount.usage_limit && discount.usage_count >= discount.usage_limit) {
      throw new AppError('Coupon usage limit reached', 400);
    }

    // Check per-customer limit
    if (discount.per_customer_limit && customerId) {
      const customerUsage = await db('orders')
        .where({ customer_id: customerId, coupon_code: code.toUpperCase() })
        .whereNotIn('status', ['cancelled'])
        .count('id as count')
        .first();

      if (parseInt(customerUsage.count) >= discount.per_customer_limit) {
        throw new AppError('You have already used this coupon', 400);
      }
    }

    // Check minimum order amount
    if (subtotal < discount.minimum_order_amount) {
      throw new AppError(
        `Minimum order amount of ${discount.minimum_order_amount} required`,
        400
      );
    }

    // Calculate discount amount
    let discountAmount = 0;

    if (discount.type === 'percentage') {
      discountAmount = (subtotal * discount.value) / 100;
      if (discount.maximum_discount_amount) {
        discountAmount = Math.min(discountAmount, discount.maximum_discount_amount);
      }
    } else if (discount.type === 'fixed') {
      discountAmount = Math.min(discount.value, subtotal);
    } else if (discount.type === 'free_shipping') {
      discountAmount = 0; // Shipping discount handled separately
    }

    return {
      valid: true,
      discount: {
        id: discount.id,
        code: discount.code,
        type: discount.type,
        value: discount.value,
      },
      discountAmount: Math.round(discountAmount * 100) / 100,
    };
  }

  /**
   * Increment usage count after order
   */
  async incrementUsage(code) {
    const db = this.db();
    await db('discounts')
      .where({ code: code.toUpperCase() })
      .increment('usage_count', 1);
  }
}

module.exports = new DiscountsService();
