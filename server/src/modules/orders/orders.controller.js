const ordersService = require('./orders.service');

class OrdersController {
  async list(req, res, next) {
    try {
      const result = await ordersService.list(req.query);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const order = await ordersService.findById(req.params.id);
      res.json({ data: order });
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const order = await ordersService.create(req.body);
      res.status(201).json({ data: order });
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req, res, next) {
    try {
      const order = await ordersService.updateStatus(
        req.params.id,
        req.body.status,
        req.body.note,
        req.user?.id
      );
      res.json({ data: order });
    } catch (error) {
      next(error);
    }
  }

  async getStats(req, res, next) {
    try {
      const stats = await ordersService.getStats();
      res.json({ data: stats });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new OrdersController();
