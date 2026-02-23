/**
 * Plugin Configuration
 *
 * Enable/disable and configure plugins for each project.
 * Each plugin can have its own settings.
 */
module.exports = {
  // Payment providers
  payments: {
    // Enable the providers you need per project
    providers: {
      bog: {
        enabled: false,
        clientId: process.env.BOG_CLIENT_ID,
        clientSecret: process.env.BOG_CLIENT_SECRET,
        callbackUrl: process.env.BOG_CALLBACK_URL,
      },
      tbc: {
        enabled: false,
        clientId: process.env.TBC_CLIENT_ID,
        clientSecret: process.env.TBC_CLIENT_SECRET,
        callbackUrl: process.env.TBC_CALLBACK_URL,
      },
      stripe: {
        enabled: false,
        secretKey: process.env.STRIPE_SECRET_KEY,
        webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
      },
      cash_on_delivery: {
        enabled: true,
      },
    },
  },

  // Shipping providers
  shipping: {
    providers: {
      flat_rate: {
        enabled: true,
        defaultRate: 5.00,
      },
      weight_based: {
        enabled: false,
        ratePerKg: 2.00,
      },
      free_shipping: {
        enabled: true,
        minimumOrderAmount: 100.00,
      },
    },
  },

  // Media storage
  media: {
    provider: 'local', // 'local' | 's3' | 'cloudinary'
    local: {
      uploadDir: './uploads',
    },
  },

  // Email
  email: {
    provider: 'smtp', // 'smtp' | 'sendgrid' | 'mailgun'
  },
};
