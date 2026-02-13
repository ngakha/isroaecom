const router = require('express').Router();
const controller = require('./customers.controller');
const { authenticate, authorize } = require('../../core/middleware/auth');

// Admin - list all customers
router.get('/', authenticate, authorize('shop_manager'), controller.list);
router.get('/:id', authenticate, authorize('shop_manager'), controller.getById);
router.put('/:id', authenticate, authorize('shop_manager'), controller.update);

// Customer addresses (admin view)
router.get('/:customerId/addresses', authenticate, authorize('shop_manager'), controller.getAddresses);

// Customer self-service
router.get('/me/addresses', authenticate, controller.getAddresses);
router.post('/me/addresses', authenticate, controller.addAddress);
router.put('/me/addresses/:addressId', authenticate, controller.updateAddress);
router.delete('/me/addresses/:addressId', authenticate, controller.deleteAddress);

// Wishlist
router.get('/me/wishlist', authenticate, controller.getWishlist);
router.post('/me/wishlist', authenticate, controller.addToWishlist);
router.delete('/me/wishlist/:productId', authenticate, controller.removeFromWishlist);

module.exports = router;
