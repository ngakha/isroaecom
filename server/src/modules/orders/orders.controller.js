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

  async myOrders(req, res, next) {
    try {
      const result = await ordersService.list({
        ...req.query,
        customerId: req.user.id,
        archived: 'false',
      });
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async myOrderDetail(req, res, next) {
    try {
      const order = await ordersService.findById(req.params.id);
      // Verify ownership
      if (order.customer_id !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }
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

  async archive(req, res, next) {
    try {
      const order = await ordersService.archive(req.params.id);
      res.json({ data: order });
    } catch (error) {
      next(error);
    }
  }

  async unarchive(req, res, next) {
    try {
      const order = await ordersService.unarchive(req.params.id);
      res.json({ data: order });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new OrdersController();
