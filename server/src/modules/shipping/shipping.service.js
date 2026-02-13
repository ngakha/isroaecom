const { v4: uuid } = require('uuid');
const { getDatabase } = require('../../core/database');
const { AppError } = require('../../core/middleware/error-handler');
const pluginConfig = require('../../../config/plugins');

class ShippingService {
  constructor() {
    this.db = () => getDatabase();
  }

  /**
   * Calculate shipping rates for a cart/order
   */
  async calculateRates({ items, shippingAddress, subtotal }) {
    const rates = [];
    const { providers } = pluginConfig.shipping;
    const totalWeight = items.reduce((sum, item) => sum + (item.weight || 0) * item.quantity, 0);

    // Flat rate
    if (providers.flat_rate?.enabled) {
      const db = this.db();
      const zone = await this.findZone(shippingAddress);
      const rate = zone?.flat_rate || providers.flat_rate.defaultRate;

      rates.push({
        id: 'flat_rate',
        name: 'Standard Delivery',
        description: 'Delivered in 3-5 business days',
        price: rate,
        estimatedDays: '3-5',
      });
    }

    // Weight-based
    if (providers.weight_based?.enabled && totalWeight > 0) {
      const price = totalWeight * providers.weight_based.ratePerKg;
      rates.push({
        id: 'weight_based',
        name: 'Weight-Based Shipping',
        description: `Based on total weight: ${totalWeight}kg`,
        price: Math.round(price * 100) / 100,
        estimatedDays: '3-7',
      });
    }

    // Free shipping
    if (providers.free_shipping?.enabled && subtotal >= providers.free_shipping.minimumOrderAmount) {
      rates.push({
        id: 'free_shipping',
        name: 'Free Shipping',
        description: `Free for orders over ${providers.free_shipping.minimumOrderAmount}`,
        price: 0,
        estimatedDays: '5-7',
      });
    }

    return rates;
  }

  /**
   * Find shipping zone for an address
   */
  async findZone(address) {
    const db = this.db();

    // Try to find a zone matching the country/city
    const zone = await db('shipping_zones')
      .where(function () {
        this.where('country', address.country)
          .orWhere('country', '*');
      })
      .first();

    return zone;
  }

  // ─── Admin: Shipping Zones Management ───────────

  async listZones() {
    const db = this.db();
    return db('shipping_zones').orderBy('name');
  }

  async createZone(data) {
    const db = this.db();
    const id = uuid();

    const [zone] = await db('shipping_zones')
      .insert({
        id,
        name: data.name,
        country: data.country || '*',
        regions: JSON.stringify(data.regions || []),
        flat_rate: data.flatRate || 0,
        free_shipping_threshold: data.freeShippingThreshold || null,
        is_active: true,
        created_at: new Date(),
      })
      .returning('*');

    return zone;
  }

  async updateZone(id, data) {
    const db = this.db();
    const updateData = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.country !== undefined) updateData.country = data.country;
    if (data.regions !== undefined) updateData.regions = JSON.stringify(data.regions);
    if (data.flatRate !== undefined) updateData.flat_rate = data.flatRate;
    if (data.freeShippingThreshold !== undefined) updateData.free_shipping_threshold = data.freeShippingThreshold;
    if (data.isActive !== undefined) updateData.is_active = data.isActive;

    const [zone] = await db('shipping_zones').where({ id }).update(updateData).returning('*');
    if (!zone) throw new AppError('Shipping zone not found', 404);
    return zone;
  }

  async deleteZone(id) {
    const db = this.db();
    const deleted = await db('shipping_zones').where({ id }).del();
    if (!deleted) throw new AppError('Shipping zone not found', 404);
  }
}

module.exports = new ShippingService();
