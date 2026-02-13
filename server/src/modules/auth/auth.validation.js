const Joi = require('joi');

const adminRegister = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).max(128).required(),
  firstName: Joi.string().min(1).max(100).required(),
  lastName: Joi.string().min(1).max(100).required(),
  role: Joi.string().valid('shop_manager', 'content_editor').default('content_editor'),
});

const adminLogin = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const customerRegister = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).max(128).required(),
  firstName: Joi.string().min(1).max(100).required(),
  lastName: Joi.string().min(1).max(100).required(),
  phone: Joi.string().max(20).optional(),
});

const customerLogin = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const changePassword = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(8).max(128).required(),
});

const refreshToken = Joi.object({
  refreshToken: Joi.string().required(),
});

module.exports = {
  adminRegister,
  adminLogin,
  customerRegister,
  customerLogin,
  changePassword,
  refreshToken,
};
