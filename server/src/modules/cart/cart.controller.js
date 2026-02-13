const cartService = require('./cart.service');

class CartController {
  getIdentifier(req) {
    if (req.user?.id && req.user.role === 'customer') {
      return { customerId: req.user.id };
    }
    // Use session ID from header for guest carts
    const sessionId = req.headers['x-session-id'];
    if (!sessionId) {
      return null;
    }
    return { sessionId };
  }

  async getCart(req, res, next) {
    try {
      const identifier = this.getIdentifier(req);
      if (!identifier) {
        return res.json({ data: { items: [], subtotal: 0, itemCount: 0 } });
      }
      const cart = await cartService.getCart(identifier);
      res.json({ data: cart });
    } catch (error) {
      next(error);
    }
  }

  async addItem(req, res, next) {
    try {
      const identifier = this.getIdentifier(req);
      if (!identifier) {
        return res.status(400).json({ error: 'Session ID required (x-session-id header)' });
      }
      const cart = await cartService.addItem(identifier, req.body);
      res.json({ data: cart });
    } catch (error) {
      next(error);
    }
  }

  async updateItem(req, res, next) {
    try {
      const identifier = this.getIdentifier(req);
      if (!identifier) {
        return res.status(400).json({ error: 'Session ID required' });
      }
      const cart = await cartService.updateItem(identifier, req.params.itemId, req.body);
      res.json({ data: cart });
    } catch (error) {
      next(error);
    }
  }

  async removeItem(req, res, next) {
    try {
      const identifier = this.getIdentifier(req);
      if (!identifier) {
        return res.status(400).json({ error: 'Session ID required' });
      }
      const cart = await cartService.removeItem(identifier, req.params.itemId);
      res.json({ data: cart });
    } catch (error) {
      next(error);
    }
  }

  async clearCart(req, res, next) {
    try {
      const identifier = this.getIdentifier(req);
      if (!identifier) {
        return res.status(400).json({ error: 'Session ID required' });
      }
      const cart = await cartService.clearCart(identifier);
      res.json({ data: cart });
    } catch (error) {
      next(error);
    }
  }

  async mergeCarts(req, res, next) {
    try {
      const { sessionId } = req.body;
      if (!sessionId || !req.user?.id) {
        return res.status(400).json({ error: 'Session ID and auth required' });
      }
      await cartService.mergeCarts(sessionId, req.user.id);
      const cart = await cartService.getCart({ customerId: req.user.id });
      res.json({ data: cart });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new CartController();
