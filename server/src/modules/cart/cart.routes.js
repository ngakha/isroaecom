const router = require('express').Router();
const controller = require('./cart.controller');
const { validate } = require('../../core/middleware/validate');
const { optionalAuth, authenticate } = require('../../core/middleware/auth');
const schemas = require('./cart.validation');

// All cart routes support both guest (x-session-id) and authenticated users
router.get('/', optionalAuth, controller.getCart.bind(controller));
router.post('/items', optionalAuth, validate(schemas.addItem), controller.addItem.bind(controller));
router.put('/items/:itemId', optionalAuth, validate(schemas.updateItem), controller.updateItem.bind(controller));
router.delete('/items/:itemId', optionalAuth, controller.removeItem.bind(controller));
router.delete('/', optionalAuth, controller.clearCart.bind(controller));

// Merge guest cart into customer cart after login
router.post('/merge', authenticate, validate(schemas.mergeCarts), controller.mergeCarts.bind(controller));

module.exports = router;
