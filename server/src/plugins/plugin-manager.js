const pluginConfig = require('../../config/plugins');

/**
 * Plugin Manager
 * Loads and manages plugins based on config/plugins.js
 *
 * Plugins can hook into:
 * - Payment processing
 * - Shipping calculation
 * - Media storage
 * - Email delivery
 *
 * Each plugin type follows an adapter/provider pattern,
 * allowing swappable implementations per project.
 */
class PluginManager {
  constructor() {
    this.providers = {
      payments: {},
      shipping: {},
      media: null,
      email: null,
    };
  }

  loadAll() {
    this.loadPaymentProviders();
    this.loadShippingProviders();
    console.log('[Plugins] All plugins loaded');
  }

  loadPaymentProviders() {
    const { providers } = pluginConfig.payments;
    const enabled = [];

    for (const [name, settings] of Object.entries(providers)) {
      if (settings.enabled) {
        this.providers.payments[name] = settings;
        enabled.push(name);
      }
    }

    if (enabled.length > 0) {
      console.log(`[Plugins] Payment providers: ${enabled.join(', ')}`);
    }
  }

  loadShippingProviders() {
    const { providers } = pluginConfig.shipping;
    const enabled = [];

    for (const [name, settings] of Object.entries(providers)) {
      if (settings.enabled) {
        this.providers.shipping[name] = settings;
        enabled.push(name);
      }
    }

    if (enabled.length > 0) {
      console.log(`[Plugins] Shipping providers: ${enabled.join(', ')}`);
    }
  }

  getPaymentProvider(name) {
    return this.providers.payments[name] || null;
  }

  getShippingProvider(name) {
    return this.providers.shipping[name] || null;
  }

  getEnabledPaymentProviders() {
    return Object.keys(this.providers.payments);
  }

  getEnabledShippingProviders() {
    return Object.keys(this.providers.shipping);
  }
}

module.exports = PluginManager;
