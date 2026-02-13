const paymentsService = require('./payments.service');

class PaymentsController {
  async checkout(req, res, next) {
    try {
      const result = await paymentsService.checkout(req.body.orderId, req.body.provider);
      res.json({ data: result });
    } catch (error) {
      next(error);
    }
  }

  async webhook(req, res, next) {
    try {
      const signature = req.headers['x-webhook-signature'] || req.headers['stripe-signature'] || '';
      const result = await paymentsService.handleWebhook(req.params.provider, req.body, signature);
      res.json({ received: true, ...result });
    } catch (error) {
      // Always return 200 to webhooks to prevent retries
      console.error('[Payment Webhook Error]', error.message);
      res.status(200).json({ received: true, error: error.message });
    }
  }

  async getAvailableMethods(req, res) {
    const methods = paymentsService.getAvailableMethods();
    res.json({ data: methods });
  }
}

module.exports = new PaymentsController();
