const Joi = require('joi');

const addItem = Joi.object({
  productId: Joi.string().uuid().required(),
  variantId: Joi.string().uuid().optional(),
  quantity: Joi.number().integer().min(1).max(999).default(1),
});

const updateItem = Joi.object({
  quantity: Joi.number().integer().min(0).max(999).required(),
});

const mergeCarts = Joi.object({
  sessionId: Joi.string().required(),
});

module.exports = { addItem, updateItem, mergeCarts };
