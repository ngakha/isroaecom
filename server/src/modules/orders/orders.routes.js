const router = require('express').Router();
const controller = require('./orders.controller');
const { validate } = require('../../core/middleware/validate');
const { authenticate, authorize } = require('../../core/middleware/auth');
const schemas = require('./orders.validation');

// Admin - list all orders
router.get('/',
  authenticate,
  authorize('shop_manager'),
  validate(schemas.listQuery, 'query'),
  controller.list
);

// Admin - stats
router.get('/stats',
  authenticate,
  authorize('shop_manager'),
  controller.getStats
);

// Admin - get single order
router.get('/:id',
  authenticate,
  authorize('shop_manager'),
  controller.getById
);

// Create order (from checkout)
router.post('/',
  validate(schemas.createOrder),
  controller.create
);

// Admin - update status
router.patch('/:id/status',
  authenticate,
  authorize('shop_manager'),
  validate(schemas.updateStatus),
  controller.updateStatus
);

module.exports = router;
