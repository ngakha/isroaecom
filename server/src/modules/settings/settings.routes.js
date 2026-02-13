const router = require('express').Router();
const controller = require('./settings.controller');
const { authenticate, authorize } = require('../../core/middleware/auth');

// All settings routes require super_admin or shop_manager
router.get('/', authenticate, authorize('shop_manager'), controller.getAll);
router.get('/:group', authenticate, authorize('shop_manager'), controller.getByGroup);
router.put('/', authenticate, authorize('shop_manager'), controller.update);

module.exports = router;
