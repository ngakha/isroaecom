const router = require('express').Router();
const controller = require('./products.controller');
const { validate } = require('../../core/middleware/validate');
const { authenticate, authorize, optionalAuth } = require('../../core/middleware/auth');
const schemas = require('./products.validation');

// ─── Public (Storefront) ──────────────────────────
router.get('/', validate(schemas.listQuery, 'query'), controller.list);
router.get('/slug/:slug', controller.getBySlug);
router.get('/categories', controller.listCategories);
router.get('/:id', controller.getById);

// ─── Admin ─────────────────────────────────────────
router.post('/',
  authenticate,
  authorize('shop_manager', 'content_editor'),
  validate(schemas.createProduct),
  controller.create
);

router.put('/:id',
  authenticate,
  authorize('shop_manager', 'content_editor'),
  validate(schemas.updateProduct),
  controller.update
);

router.delete('/:id',
  authenticate,
  authorize('shop_manager'),
  controller.delete
);

// ─── Variants ──────────────────────────────────────
router.post('/:id/variants',
  authenticate,
  authorize('shop_manager', 'content_editor'),
  validate(schemas.createVariant),
  controller.addVariant
);

router.put('/:id/variants/:variantId',
  authenticate,
  authorize('shop_manager', 'content_editor'),
  validate(schemas.updateVariant),
  controller.updateVariant
);

router.delete('/:id/variants/:variantId',
  authenticate,
  authorize('shop_manager'),
  controller.deleteVariant
);

// ─── Categories (admin) ───────────────────────────
router.post('/categories',
  authenticate,
  authorize('shop_manager', 'content_editor'),
  validate(schemas.createCategory),
  controller.createCategory
);

router.put('/categories/:id',
  authenticate,
  authorize('shop_manager', 'content_editor'),
  validate(schemas.updateCategory),
  controller.updateCategory
);

router.delete('/categories/:id',
  authenticate,
  authorize('shop_manager'),
  controller.deleteCategory
);

module.exports = router;
