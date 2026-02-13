const router = require('express').Router();
const controller = require('./payments.controller');
const { validate } = require('../../core/middleware/validate');
const Joi = require('joi');

const checkoutSchema = Joi.object({
  orderId: Joi.string().uuid().required(),
  provider: Joi.string().required(),
});

router.post('/checkout', validate(checkoutSchema), controller.checkout);
router.post('/webhook/:provider', controller.webhook);
router.get('/methods', controller.getAvailableMethods);

module.exports = router;
