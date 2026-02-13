const customersService = require('./customers.service');

class CustomersController {
  async list(req, res, next) {
    try {
      const result = await customersService.list(req.query);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const customer = await customersService.findById(req.params.id);
      res.json({ data: customer });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const customer = await customersService.update(req.params.id, req.body);
      res.json({ data: customer });
    } catch (error) {
      next(error);
    }
  }

  // ─── Addresses ───────────────────────────────────

  async getAddresses(req, res, next) {
    try {
      const customerId = req.params.customerId || req.user.id;
      const addresses = await customersService.getAddresses(customerId);
      res.json({ data: addresses });
    } catch (error) {
      next(error);
    }
  }

  async addAddress(req, res, next) {
    try {
      const customerId = req.params.customerId || req.user.id;
      const address = await customersService.addAddress(customerId, req.body);
      res.status(201).json({ data: address });
    } catch (error) {
      next(error);
    }
  }

  async updateAddress(req, res, next) {
    try {
      const customerId = req.params.customerId || req.user.id;
      const address = await customersService.updateAddress(req.params.addressId, customerId, req.body);
      res.json({ data: address });
    } catch (error) {
      next(error);
    }
  }

  async deleteAddress(req, res, next) {
    try {
      const customerId = req.params.customerId || req.user.id;
      await customersService.deleteAddress(req.params.addressId, customerId);
      res.json({ message: 'Address deleted' });
    } catch (error) {
      next(error);
    }
  }

  // ─── Wishlist ────────────────────────────────────

  async getWishlist(req, res, next) {
    try {
      const wishlist = await customersService.getWishlist(req.user.id);
      res.json({ data: wishlist });
    } catch (error) {
      next(error);
    }
  }

  async addToWishlist(req, res, next) {
    try {
      const item = await customersService.addToWishlist(req.user.id, req.body.productId);
      res.status(201).json({ data: item });
    } catch (error) {
      next(error);
    }
  }

  async removeFromWishlist(req, res, next) {
    try {
      await customersService.removeFromWishlist(req.user.id, req.params.productId);
      res.json({ message: 'Removed from wishlist' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new CustomersController();
