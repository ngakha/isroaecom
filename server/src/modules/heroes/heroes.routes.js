const router = require('express').Router();
const controller = require('./heroes.controller');
const { validate } = require('../../core/middleware/validate');
const { authenticate, authorize } = require('../../core/middleware/auth');
const schemas = require('./heroes.validation');

// Public
router.get('/', controller.listPublic);

// Admin (super_admin only)
router.get('/admin', authenticate, authorize(), controller.listAll);
router.get('/mode', authenticate, authorize(), controller.getMode);
router.put('/mode', authenticate, authorize(), validate(schemas.updateMode), controller.updateMode);
router.post('/', authenticate, authorize(), validate(schemas.createSlide), controller.create);
router.put('/reorder', authenticate, authorize(), validate(schemas.reorderSlides), controller.reorder);
router.put('/:id', authenticate, authorize(), validate(schemas.updateSlide), controller.update);
router.delete('/:id', authenticate, authorize(), controller.delete);

module.exports = router;
