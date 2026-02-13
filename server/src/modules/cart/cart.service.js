const { v4: uuid } = require('uuid');
const { getDatabase } = require('../../core/database');
const { AppError } = require('../../core/middleware/error-handler');

class CartService {
  constructor() {
    this.db = () => getDatabase();
  }

  /**
   * Get or create a cart for a user/session
   */
  async getCart(identifier) {
    const db = this.db();
    const { customerId, sessionId } = identifier;

    let cart;

    if (customerId) {
      cart = await db('carts').where({ customer_id: customerId }).first();
    } else if (sessionId) {
      cart = await db('carts').where({ session_id: sessionId }).first();
    }

    if (!cart) {
      const id = uuid();
      [cart] = await db('carts')
        .insert({
          id,
          customer_id: customerId || null,
          session_id: sessionId || null,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          created_at: new Date(),
          updated_at: new Date(),
        })
        .returning('*');
    }

    const items = await db('cart_items')
      .join('products', 'cart_items.product_id', 'products.id')
      .where('cart_items.cart_id', cart.id)
      .select(
        'cart_items.*',
        'products.name',
        'products.price as product_price',
        'products.sale_price',
        'products.stock_quantity',
        'products.status'
      );

    // Enrich with variant data
    for (const item of items) {
      if (item.variant_id) {
        const variant = await db('product_variants').where({ id: item.variant_id }).first();
        if (variant) {
          item.variant_name = variant.name;
          item.variant_price = variant.price;
          item.variant_stock = variant.stock_quantity;
        }
      }
    }

    // Calculate totals
    let subtotal = 0;
    const validItems = items.filter((item) => item.status === 'published');
    for (const item of validItems) {
      const price = item.variant_id
        ? (item.variant_price || item.product_price)
        : (item.sale_price || item.product_price);
      subtotal += price * item.quantity;
    }

    return {
      ...cart,
      items: validItems,
      subtotal,
      itemCount: validItems.reduce((sum, item) => sum + item.quantity, 0),
    };
  }

  /**
   * Add item to cart
   */
  async addItem(identifier, { productId, variantId, quantity = 1 }) {
    const db = this.db();

    // Validate product exists and is available
    const product = await db('products')
      .where({ id: productId, is_deleted: false, status: 'published' })
      .first();

    if (!product) throw new AppError('Product not found or unavailable', 404);

    // Check stock
    let availableStock = product.stock_quantity;
    if (variantId) {
      const variant = await db('product_variants').where({ id: variantId }).first();
      if (!variant) throw new AppError('Variant not found', 404);
      availableStock = variant.stock_quantity;
    }

    // Get or create cart
    const cart = await this.getCart(identifier);

    // Check if item already in cart
    const existingItem = await db('cart_items')
      .where({
        cart_id: cart.id,
        product_id: productId,
        variant_id: variantId || null,
      })
      .first();

    const newQuantity = existingItem ? existingItem.quantity + quantity : quantity;

    if (product.track_inventory && newQuantity > availableStock) {
      throw new AppError(`Only ${availableStock} items available`, 400);
    }

    if (existingItem) {
      await db('cart_items')
        .where({ id: existingItem.id })
        .update({ quantity: newQuantity, updated_at: new Date() });
    } else {
      await db('cart_items').insert({
        id: uuid(),
        cart_id: cart.id,
        product_id: productId,
        variant_id: variantId || null,
        quantity,
        created_at: new Date(),
        updated_at: new Date(),
      });
    }

    // Update cart timestamp
    await db('carts').where({ id: cart.id }).update({ updated_at: new Date() });

    return this.getCart(identifier);
  }

  /**
   * Update item quantity
   */
  async updateItem(identifier, itemId, { quantity }) {
    const db = this.db();
    const cart = await this.getCart(identifier);

    const item = await db('cart_items')
      .where({ id: itemId, cart_id: cart.id })
      .first();

    if (!item) throw new AppError('Cart item not found', 404);

    if (quantity <= 0) {
      await db('cart_items').where({ id: itemId }).del();
    } else {
      // Check stock
      const product = await db('products').where({ id: item.product_id }).first();
      let availableStock = product.stock_quantity;

      if (item.variant_id) {
        const variant = await db('product_variants').where({ id: item.variant_id }).first();
        availableStock = variant.stock_quantity;
      }

      if (product.track_inventory && quantity > availableStock) {
        throw new AppError(`Only ${availableStock} items available`, 400);
      }

      await db('cart_items')
        .where({ id: itemId })
        .update({ quantity, updated_at: new Date() });
    }

    return this.getCart(identifier);
  }

  /**
   * Remove item from cart
   */
  async removeItem(identifier, itemId) {
    const db = this.db();
    const cart = await this.getCart(identifier);

    const deleted = await db('cart_items')
      .where({ id: itemId, cart_id: cart.id })
      .del();

    if (!deleted) throw new AppError('Cart item not found', 404);

    return this.getCart(identifier);
  }

  /**
   * Clear entire cart
   */
  async clearCart(identifier) {
    const db = this.db();
    const cart = await this.getCart(identifier);
    await db('cart_items').where({ cart_id: cart.id }).del();
    return this.getCart(identifier);
  }

  /**
   * Merge guest cart into customer cart (after login)
   */
  async mergeCarts(sessionId, customerId) {
    const db = this.db();

    const guestCart = await db('carts').where({ session_id: sessionId }).first();
    if (!guestCart) return;

    let customerCart = await db('carts').where({ customer_id: customerId }).first();

    if (!customerCart) {
      // Just transfer ownership
      await db('carts')
        .where({ id: guestCart.id })
        .update({ customer_id: customerId, session_id: null });
      return;
    }

    // Merge items
    const guestItems = await db('cart_items').where({ cart_id: guestCart.id });

    for (const item of guestItems) {
      const existing = await db('cart_items')
        .where({
          cart_id: customerCart.id,
          product_id: item.product_id,
          variant_id: item.variant_id,
        })
        .first();

      if (existing) {
        await db('cart_items')
          .where({ id: existing.id })
          .update({ quantity: existing.quantity + item.quantity });
      } else {
        await db('cart_items').insert({
          ...item,
          id: uuid(),
          cart_id: customerCart.id,
        });
      }
    }

    // Delete guest cart
    await db('cart_items').where({ cart_id: guestCart.id }).del();
    await db('carts').where({ id: guestCart.id }).del();
  }

  /**
   * Cleanup expired carts (run via cron)
   */
  async cleanupExpired() {
    const db = this.db();
    const expired = await db('carts')
      .where('expires_at', '<', new Date())
      .whereNull('customer_id')
      .pluck('id');

    if (expired.length) {
      await db('cart_items').whereIn('cart_id', expired).del();
      await db('carts').whereIn('id', expired).del();
    }

    return expired.length;
  }
}

module.exports = new CartService();
