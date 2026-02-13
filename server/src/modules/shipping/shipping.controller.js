const shippingService = require('./shipping.service');

class ShippingController {
  async calculateRates(req, res, next) {
    try {
      const rates = await shippingService.calculateRates(req.body);
      res.json({ data: rates });
    } catch (error) {
      next(error);
    }
  }

  async listZones(req, res, next) {
    try {
      const zones = await shippingService.listZones();
      res.json({ data: zones });
    } catch (error) {
      next(error);
    }
  }

  async createZone(req, res, next) {
    try {
      const zone = await shippingService.createZone(req.body);
      res.status(201).json({ data: zone });
    } catch (error) {
      next(error);
    }
  }

  async updateZone(req, res, next) {
    try {
      const zone = await shippingService.updateZone(req.params.id, req.body);
      res.json({ data: zone });
    } catch (error) {
      next(error);
    }
  }

  async deleteZone(req, res, next) {
    try {
      await shippingService.deleteZone(req.params.id);
      res.json({ message: 'Zone deleted' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ShippingController();
