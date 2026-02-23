const Joi = require('joi');

const createProduct = Joi.object({
  name: Joi.string().min(1).max(500).required(),
  description: Joi.string().allow('', null).max(10000).optional(),
  sku: Joi.string().allow('', null).max(100).optional(),
  price: Joi.number().min(0).required(),
  salePrice: Joi.number().min(0).optional(),
  costPrice: Joi.number().min(0).optional(),
  taxRate: Joi.number().min(0).max(100).optional(),
  stockQuantity: Joi.number().integer().min(0).optional(),
  lowStockThreshold: Joi.number().integer().min(0).optional(),
  trackInventory: Joi.boolean().optional(),
  weight: Joi.number().min(0).optional(),
  status: Joi.string().valid('draft', 'published', 'archived').optional(),
  metaTitle: Joi.string().allow('', null).max(200).optional(),
  metaDescription: Joi.string().allow('', null).max(500).optional(),
  categoryIds: Joi.array().items(Joi.string().uuid()).optional(),
});

const updateProduct = createProduct.fork(
  ['name', 'price'],
  (schema) => schema.optional()
);

const createCategory = Joi.object({
  name: Joi.string().min(1).max(200).required(),
  description: Joi.string().max(2000).optional(),
  parentId: Joi.string().uuid().allow(null).optional(),
  imageUrl: Joi.string().allow('', null).max(500).optional(),
  sortOrder: Joi.number().integer().optional(),
});

const updateCategory = createCategory.fork(['name'], (schema) => schema.optional());

const createVariant = Joi.object({
  name: Joi.string().min(1).max(200).required(),
  sku: Joi.string().max(100).optional(),
  price: Joi.number().min(0).required(),
  salePrice: Joi.number().min(0).optional(),
  stockQuantity: Joi.number().integer().min(0).optional(),
  attributes: Joi.object().optional(),
  imageId: Joi.string().uuid().allow(null).optional(),
});

const updateVariant = createVariant.fork(['name', 'price'], (schema) => schema.optional());

const listQuery = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
  search: Joi.string().max(200).optional(),
  categoryId: Joi.string().uuid().optional(),
  status: Joi.string().valid('draft', 'published', 'archived').optional(),
  onSale: Joi.string().valid('true', 'false').optional(),
  sortBy: Joi.string().valid('created_at', 'name', 'price', 'stock_quantity').optional(),
  sortOrder: Joi.string().valid('asc', 'desc').optional(),
});

const createAttribute = Joi.object({
  key: Joi.string().min(1).max(100).required(),
  value: Joi.string().min(1).max(2000).required(),
});

const updateAttribute = Joi.object({
  key: Joi.string().min(1).max(100).optional(),
  value: Joi.string().min(1).max(2000).optional(),
});

const addImages = Joi.object({
  mediaIds: Joi.array().items(Joi.string().uuid()).min(1).required(),
});

const reorderImages = Joi.object({
  imageIds: Joi.array().items(Joi.string().uuid()).min(1).required(),
});

module.exports = {
  createProduct,
  updateProduct,
  createCategory,
  updateCategory,
  createVariant,
  updateVariant,
  createAttribute,
  updateAttribute,
  listQuery,
  addImages,
  reorderImages,
};
