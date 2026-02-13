const router = require('express').Router();
const controller = require('./shipping.controller');
const { authenticate, authorize } = require('../../core/middleware/auth');

// Public - calculate rates
router.post('/rates', controller.calculateRates);

// Admin - manage shipping zones
router.get('/zones', authenticate, authorize('shop_manager'), controller.listZones);
router.post('/zones', authenticate, authorize('shop_manager'), controller.createZone);
router.put('/zones/:id', authenticate, authorize('shop_manager'), controller.updateZone);
router.delete('/zones/:id', authenticate, authorize('shop_manager'), controller.deleteZone);

module.exports = router;
