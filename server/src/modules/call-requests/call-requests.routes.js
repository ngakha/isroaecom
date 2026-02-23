const router = require('express').Router();
const controller = require('./call-requests.controller');
const { validate } = require('../../core/middleware/validate');
const { authenticate, authorize } = require('../../core/middleware/auth');
const schemas = require('./call-requests.validation');

// Public
router.get('/mode', controller.getMode);
router.post('/', validate(schemas.createRequest), controller.create);

// Admin (shop_manager+)
router.get('/stats', authenticate, authorize('shop_manager'), controller.getStats);
router.get('/', authenticate, authorize('shop_manager'), validate(schemas.listQuery, 'query'), controller.list);
router.get('/:id', authenticate, authorize('shop_manager'), controller.getById);
router.patch('/:id/status', authenticate, authorize('shop_manager'), validate(schemas.updateStatus), controller.updateStatus);
router.delete('/:id', authenticate, authorize(), controller.delete);

module.exports = router;
