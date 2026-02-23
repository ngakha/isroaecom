const Joi = require('joi');

const addressSchema = Joi.object({
  first_name: Joi.string().max(100).required(),
  last_name: Joi.string().max(100).required(),
  address_line1: Joi.string().max(500).required(),
  address_line2: Joi.string().allow('').max(500).optional(),
  city: Joi.string().max(100).required(),
  state: Joi.string().allow('').max(100).optional(),
  postal_code: Joi.string().allow('').max(20).optional(),
  country: Joi.string().max(100).required(),
  phone: Joi.string().allow('').max(20).optional(),
});

const createOrder = Joi.object({
  customerId: Joi.string().uuid().optional(),
  customerEmail: Joi.string().email().required(),
  customerName: Joi.string().max(200).required(),
  items: Joi.array().items(
    Joi.object({
      productId: Joi.string().uuid().required(),
      variantId: Joi.string().uuid().optional(),
      name: Joi.string().max(500).required(),
      sku: Joi.string().max(100).optional(),
      price: Joi.number().min(0).required(),
      quantity: Joi.number().integer().min(1).required(),
    })
  ).min(1).required(),
  shippingAddress: addressSchema.required(),
  billingAddress: addressSchema.optional(),
  paymentMethod: Joi.string().max(50).optional(),
  couponCode: Joi.string().max(50).optional(),
  taxAmount: Joi.number().min(0).optional(),
  shippingAmount: Joi.number().min(0).optional(),
  discountAmount: Joi.number().min(0).optional(),
  currency: Joi.string().max(3).optional(),
  notes: Joi.string().max(2000).optional(),
});

const updateStatus = Joi.object({
  status: Joi.string().valid(
    'pending', 'confirmed', 'processing', 'shipped',
    'delivered', 'completed', 'cancelled', 'refund_requested', 'refunded'
  ).required(),
  note: Joi.string().max(500).optional(),
});

const listQuery = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
  status: Joi.string().valid(
    'pending', 'confirmed', 'processing', 'shipped',
    'delivered', 'completed', 'cancelled', 'refund_requested', 'refunded'
  ).optional(),
  customerId: Joi.string().uuid().optional(),
  search: Joi.string().max(200).optional(),
  sortBy: Joi.string().valid('created_at', 'total', 'order_number').optional(),
  sortOrder: Joi.string().valid('asc', 'desc').optional(),
  archived: Joi.string().valid('true', 'false', 'all').optional(),
});

module.exports = { createOrder, updateStatus, listQuery };
