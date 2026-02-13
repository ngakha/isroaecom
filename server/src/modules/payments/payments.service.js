const crypto = require('crypto');
const { getDatabase } = require('../../core/database');
const { AppError } = require('../../core/middleware/error-handler');
const ordersService = require('../orders/orders.service');
const pluginConfig = require('../../../config/plugins');

/**
 * Payment Provider Interface
 * Each provider must implement: initiate(), verify(), webhook()
 */
class PaymentProviderBase {
  constructor(config) {
    this.config = config;
  }

  async initiate(order) {
    throw new Error('Not implemented');
  }

  async verify(transactionId) {
    throw new Error('Not implemented');
  }

  async handleWebhook(payload, signature) {
    throw new Error('Not implemented');
  }
}

/**
 * BOG (Bank of Georgia) Payment Provider
 */
class BOGProvider extends PaymentProviderBase {
  async initiate(order) {
    // BOG integration placeholder
    // In production, this calls BOG's API to create a payment session
    return {
      provider: 'bog',
      paymentUrl: `https://ipay.ge/pay?order_id=${order.id}`,
      transactionId: `bog_${Date.now()}`,
    };
  }

  async verify(transactionId) {
    // Verify payment status with BOG API
    return { status: 'completed', transactionId };
  }

  async handleWebhook(payload, signature) {
    // Verify BOG webhook signature
    // In production, validate using BOG's HMAC signature
    return { orderId: payload.order_id, status: payload.status };
  }
}

/**
 * TBC Payment Provider
 */
class TBCProvider extends PaymentProviderBase {
  async initiate(order) {
    return {
      provider: 'tbc',
      paymentUrl: `https://ecommerce.ufc.ge/pay?order_id=${order.id}`,
      transactionId: `tbc_${Date.now()}`,
    };
  }

  async verify(transactionId) {
    return { status: 'completed', transactionId };
  }

  async handleWebhook(payload, signature) {
    return { orderId: payload.order_id, status: payload.status };
  }
}

/**
 * Stripe Payment Provider
 */
class StripeProvider extends PaymentProviderBase {
  async initiate(order) {
    // Stripe Checkout Session placeholder
    return {
      provider: 'stripe',
      paymentUrl: `https://checkout.stripe.com/session_${order.id}`,
      transactionId: `stripe_${Date.now()}`,
    };
  }

  async verify(transactionId) {
    return { status: 'completed', transactionId };
  }

  async handleWebhook(payload, signature) {
    // Verify Stripe webhook signature
    const secret = this.config.webhookSecret;
    if (!secret) throw new AppError('Webhook secret not configured', 500);

    // In production: stripe.webhooks.constructEvent(payload, signature, secret)
    return {
      orderId: payload.data?.object?.metadata?.order_id,
      status: payload.type === 'checkout.session.completed' ? 'completed' : 'failed',
    };
  }
}

// Provider registry
const PROVIDERS = {
  bog: BOGProvider,
  tbc: TBCProvider,
  stripe: StripeProvider,
};

class PaymentsService {
  constructor() {
    this.db = () => getDatabase();
  }

  getProvider(name) {
    const config = pluginConfig.payments.providers[name];
    if (!config || !config.enabled) {
      throw new AppError(`Payment provider "${name}" is not enabled`, 400);
    }

    const ProviderClass = PROVIDERS[name];
    if (!ProviderClass) {
      throw new AppError(`Payment provider "${name}" is not supported`, 400);
    }

    return new ProviderClass(config);
  }

  /**
   * Initiate payment for an order
   */
  async checkout(orderId, providerName) {
    const order = await ordersService.findById(orderId);
    if (order.payment_status === 'completed') {
      throw new AppError('Order already paid', 400);
    }

    const provider = this.getProvider(providerName);
    const result = await provider.initiate(order);

    // Update order with payment info
    await ordersService.updatePaymentStatus(orderId, 'processing', result.transactionId);

    return result;
  }

  /**
   * Handle webhook callback from payment provider
   */
  async handleWebhook(providerName, payload, signature) {
    const provider = this.getProvider(providerName);
    const result = await provider.handleWebhook(payload, signature);

    if (result.orderId) {
      const paymentStatus = result.status === 'completed' ? 'completed' : 'failed';
      await ordersService.updatePaymentStatus(result.orderId, paymentStatus);

      // If payment completed, confirm the order
      if (paymentStatus === 'completed') {
        try {
          await ordersService.updateStatus(result.orderId, 'confirmed', 'Payment received');
        } catch {
          // Order might already be confirmed
        }
      }
    }

    return result;
  }

  /**
   * List available payment methods
   */
  getAvailableMethods() {
    const methods = [];
    const { providers } = pluginConfig.payments;

    for (const [name, config] of Object.entries(providers)) {
      if (config.enabled) {
        methods.push({ name, label: name.toUpperCase() });
      }
    }

    return methods;
  }
}

module.exports = new PaymentsService();
