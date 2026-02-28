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

// Admin - export orders CSV
router.get('/export',
  authenticate,
  authorize('shop_manager'),
  validate(schemas.exportQuery, 'query'),
  controller.exportOrders
);

// Customer - my orders (MUST be before /:id to avoid param conflict)
router.get('/my-orders',
  authenticate,
  controller.myOrders
);

// Customer - my order detail
router.get('/my-orders/:id',
  authenticate,
  controller.myOrderDetail
);

// Admin - get single order
router.get('/:id',
  authenticate,
  authorize('shop_manager'),
  controller.getById
);

// Admin - create manual order
router.post('/admin-create',
  authenticate,
  authorize('shop_manager'),
  validate(schemas.adminCreateOrder),
  controller.adminCreate
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

// Admin - archive / unarchive
router.patch('/:id/archive',
  authenticate,
  authorize('shop_manager'),
  controller.archive
);

router.patch('/:id/unarchive',
  authenticate,
  authorize('shop_manager'),
  controller.unarchive
);

module.exports = router;
