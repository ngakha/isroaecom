const { v4: uuid } = require('uuid');
const { getDatabase } = require('../../core/database');
const { AppError } = require('../../core/middleware/error-handler');

class CustomersService {
  constructor() {
    this.db = () => getDatabase();
  }

  async list({ page = 1, limit = 25, search, sortBy = 'created_at', sortOrder = 'desc' }) {
    const db = this.db();
    let query = db('customers').where('is_active', true);

    if (search) {
      query = query.where((b) => {
        b.whereILike('email', `%${search}%`)
          .orWhereILike('first_name', `%${search}%`)
          .orWhereILike('last_name', `%${search}%`)
          .orWhereILike('phone', `%${search}%`);
      });
    }

    const [{ count }] = await query.clone().count('id as count');
    const offset = (page - 1) * limit;

    const customers = await query
      .select('id', 'email', 'first_name', 'last_name', 'phone', 'is_active', 'last_login', 'created_at')
      .orderBy(sortBy, sortOrder)
      .limit(limit)
      .offset(offset);

    return {
      data: customers,
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
    const customer = await db('customers')
      .where({ id })
      .select('id', 'email', 'first_name', 'last_name', 'phone', 'is_active', 'last_login', 'created_at')
      .first();

    if (!customer) throw new AppError('Customer not found', 404);

    const [addresses, orderCount, totalSpent] = await Promise.all([
      db('customer_addresses').where({ customer_id: id }),
      db('orders').where({ customer_id: id }).count('id as count').first(),
      db('orders')
        .where({ customer_id: id })
        .whereIn('status', ['confirmed', 'processing', 'shipped', 'delivered', 'completed'])
        .sum('total as sum')
        .first(),
    ]);

    return {
      ...customer,
      addresses,
      orderCount: parseInt(orderCount.count),
      totalSpent: parseFloat(totalSpent.sum || 0),
    };
  }

  async update(id, data) {
    const db = this.db();
    const updateData = { updated_at: new Date() };

    if (data.firstName !== undefined) updateData.first_name = data.firstName;
    if (data.lastName !== undefined) updateData.last_name = data.lastName;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.isActive !== undefined) updateData.is_active = data.isActive;

    const [customer] = await db('customers')
      .where({ id })
      .update(updateData)
      .returning(['id', 'email', 'first_name', 'last_name', 'phone', 'is_active']);

    if (!customer) throw new AppError('Customer not found', 404);
    return customer;
  }

  // ─── Addresses ───────────────────────────────────

  async getAddresses(customerId) {
    const db = this.db();
    return db('customer_addresses').where({ customer_id: customerId });
  }

  async addAddress(customerId, data) {
    const db = this.db();
    const id = uuid();

    // If this is the default address, unset others
    if (data.isDefault) {
      await db('customer_addresses')
        .where({ customer_id: customerId })
        .update({ is_default: false });
    }

    const [address] = await db('customer_addresses')
      .insert({
        id,
        customer_id: customerId,
        label: data.label || 'Home',
        first_name: data.firstName,
        last_name: data.lastName,
        address_line1: data.addressLine1,
        address_line2: data.addressLine2 || null,
        city: data.city,
        state: data.state || null,
        postal_code: data.postalCode || null,
        country: data.country,
        phone: data.phone || null,
        is_default: data.isDefault || false,
        created_at: new Date(),
      })
      .returning('*');

    return address;
  }

  async updateAddress(addressId, customerId, data) {
    const db = this.db();
    const updateData = {};

    if (data.label !== undefined) updateData.label = data.label;
    if (data.firstName !== undefined) updateData.first_name = data.firstName;
    if (data.lastName !== undefined) updateData.last_name = data.lastName;
    if (data.addressLine1 !== undefined) updateData.address_line1 = data.addressLine1;
    if (data.addressLine2 !== undefined) updateData.address_line2 = data.addressLine2;
    if (data.city !== undefined) updateData.city = data.city;
    if (data.state !== undefined) updateData.state = data.state;
    if (data.postalCode !== undefined) updateData.postal_code = data.postalCode;
    if (data.country !== undefined) updateData.country = data.country;
    if (data.phone !== undefined) updateData.phone = data.phone;

    if (data.isDefault) {
      await db('customer_addresses')
        .where({ customer_id: customerId })
        .update({ is_default: false });
      updateData.is_default = true;
    }

    const [address] = await db('customer_addresses')
      .where({ id: addressId, customer_id: customerId })
      .update(updateData)
      .returning('*');

    if (!address) throw new AppError('Address not found', 404);
    return address;
  }

  async deleteAddress(addressId, customerId) {
    const db = this.db();
    const deleted = await db('customer_addresses')
      .where({ id: addressId, customer_id: customerId })
      .del();
    if (!deleted) throw new AppError('Address not found', 404);
  }

  // ─── Wishlist ────────────────────────────────────

  async getWishlist(customerId) {
    const db = this.db();
    const products = await db('wishlists')
      .join('products', 'wishlists.product_id', 'products.id')
      .where({ 'wishlists.customer_id': customerId, 'products.is_deleted': false })
      .select('products.*', 'wishlists.created_at as wishlisted_at');

    if (!products.length) return products;

    const productIds = products.map((p) => p.id);
    const images = await db('product_images')
      .whereIn('product_id', productIds)
      .orderBy('sort_order');

    return products.map((product) => ({
      ...product,
      images: images.filter((img) => img.product_id === product.id),
    }));
  }

  async addToWishlist(customerId, productId) {
    const db = this.db();
    const existing = await db('wishlists').where({ customer_id: customerId, product_id: productId }).first();
    if (existing) return existing;

    const [item] = await db('wishlists')
      .insert({
        id: uuid(),
        customer_id: customerId,
        product_id: productId,
        created_at: new Date(),
      })
      .returning('*');

    return item;
  }

  async removeFromWishlist(customerId, productId) {
    const db = this.db();
    await db('wishlists').where({ customer_id: customerId, product_id: productId }).del();
  }
}

module.exports = new CustomersService();
