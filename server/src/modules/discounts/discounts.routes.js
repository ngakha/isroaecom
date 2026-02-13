const router = require('express').Router();
const controller = require('./discounts.controller');
const { authenticate, authorize } = require('../../core/middleware/auth');

// Public - apply coupon
router.post('/apply', controller.applyCoupon);

// Admin CRUD
router.get('/', authenticate, authorize('shop_manager'), controller.list);
router.get('/:id', authenticate, authorize('shop_manager'), controller.getById);
router.post('/', authenticate, authorize('shop_manager'), controller.create);
router.put('/:id', authenticate, authorize('shop_manager'), controller.update);
router.delete('/:id', authenticate, authorize('shop_manager'), controller.delete);

module.exports = router;
