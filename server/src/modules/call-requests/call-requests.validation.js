const Joi = require('joi');

// Name: at least 2 words, only letters (Georgian/Latin), spaces, hyphens, min 3 chars
const namePattern = /^[\p{L}][\p{L}\s\-]{1,}[\p{L}]$/u;
// Georgian phone: +995 5XXXXXXXX or 5XXXXXXXX (digits only after optional +995)
const phonePattern = /^(?:\+995\s?)?5\d{8}$/;

const createRequest = Joi.object({
  customerName: Joi.string().max(200).required()
    .regex(namePattern)
    .custom((value, helpers) => {
      const parts = value.trim().split(/\s+/);
      if (parts.length < 2) {
        return helpers.error('any.invalid');
      }
      return value;
    })
    .messages({
      'string.pattern.base': 'Please enter your real first and last name',
      'any.invalid': 'Please enter both first and last name',
    }),
  phone: Joi.string().max(50).required()
    .regex(phonePattern)
    .messages({
      'string.pattern.base': 'Please enter a valid Georgian phone number (e.g. +995 5XX XXX XXX)',
    }),
  productId: Joi.string().uuid().allow(null).optional(),
  productName: Joi.string().max(500).allow('', null).optional(),
  message: Joi.string().max(2000).allow('', null).optional(),
});

const listQuery = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
  status: Joi.string().valid('new', 'contacted', 'completed', 'cancelled').optional(),
  search: Joi.string().max(200).allow('').optional(),
  sortBy: Joi.string().valid('created_at', 'customer_name', 'status').optional(),
  sortOrder: Joi.string().valid('asc', 'desc').optional(),
});

const updateStatus = Joi.object({
  status: Joi.string().valid('new', 'contacted', 'completed', 'cancelled').required(),
});

module.exports = {
  createRequest,
  listQuery,
  updateStatus,
};
