const router = require('express').Router();
const controller = require('./products.controller');
const { validate } = require('../../core/middleware/validate');
const { authenticate, authorize, optionalAuth } = require('../../core/middleware/auth');
const schemas = require('./products.validation');

// ─── Public (Storefront) ──────────────────────────
router.get('/', validate(schemas.listQuery, 'query'), controller.list);
router.get('/search', controller.search);
router.get('/slug/:slug', controller.getBySlug);
router.get('/categories', controller.listCategories);
router.get('/:id/related', controller.getRelated);
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

// ─── Images ───────────────────────────────────────
router.post('/:id/images',
  authenticate,
  authorize('shop_manager', 'content_editor'),
  validate(schemas.addImages),
  controller.addImages
);

router.delete('/:id/images/:imageId',
  authenticate,
  authorize('shop_manager', 'content_editor'),
  controller.removeImage
);

router.put('/:id/images/reorder',
  authenticate,
  authorize('shop_manager', 'content_editor'),
  validate(schemas.reorderImages),
  controller.reorderImages
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

// ─── Attributes ──────────────────────────────────
router.post('/:id/attributes',
  authenticate,
  authorize('shop_manager', 'content_editor'),
  validate(schemas.createAttribute),
  controller.addAttribute
);

router.put('/:id/attributes/:attributeId',
  authenticate,
  authorize('shop_manager', 'content_editor'),
  validate(schemas.updateAttribute),
  controller.updateAttribute
);

router.delete('/:id/attributes/:attributeId',
  authenticate,
  authorize('shop_manager'),
  controller.deleteAttribute
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
