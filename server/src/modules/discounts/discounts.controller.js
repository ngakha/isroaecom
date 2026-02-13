const discountsService = require('./discounts.service');

class DiscountsController {
  async list(req, res, next) {
    try {
      const result = await discountsService.list(req.query);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const discount = await discountsService.findById(req.params.id);
      res.json({ data: discount });
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const discount = await discountsService.create(req.body);
      res.status(201).json({ data: discount });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const discount = await discountsService.update(req.params.id, req.body);
      res.json({ data: discount });
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      await discountsService.delete(req.params.id);
      res.json({ message: 'Discount deleted' });
    } catch (error) {
      next(error);
    }
  }

  async applyCoupon(req, res, next) {
    try {
      const result = await discountsService.applyCoupon(req.body.code, req.body);
      res.json({ data: result });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new DiscountsController();
