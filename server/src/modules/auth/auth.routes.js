const router = require('express').Router();
const controller = require('./auth.controller');
const { validate } = require('../../core/middleware/validate');
const { authenticate } = require('../../core/middleware/auth');
const { loginRateLimitMiddleware } = require('../../core/middleware/security');
const { checkAccountLockout } = require('../../core/middleware/auth');
const schemas = require('./auth.validation');

// Admin auth
router.post(
  '/admin/register',
  authenticate, // Only existing admins can create new admins
  validate(schemas.adminRegister),
  controller.adminRegister
);

router.post(
  '/admin/login',
  loginRateLimitMiddleware(),
  checkAccountLockout,
  validate(schemas.adminLogin),
  controller.adminLogin
);

// Customer auth
router.post(
  '/customer/register',
  validate(schemas.customerRegister),
  controller.customerRegister
);

router.post(
  '/customer/login',
  loginRateLimitMiddleware(),
  validate(schemas.customerLogin),
  controller.customerLogin
);

// Shared
router.post('/refresh', validate(schemas.refreshToken), controller.refreshToken);
router.post('/logout', controller.logout);
router.post('/change-password', authenticate, validate(schemas.changePassword), controller.changePassword);
router.get('/me', authenticate, controller.me);

module.exports = router;
