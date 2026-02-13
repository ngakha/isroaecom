require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

module.exports = {
  app: {
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT, 10) || 5000,
    url: process.env.APP_URL || 'http://localhost:5000',
    adminUrl: process.env.ADMIN_URL || 'http://localhost:5173',
  },

  security: {
    jwt: {
      secret: process.env.JWT_SECRET,
      refreshSecret: process.env.JWT_REFRESH_SECRET,
      expiresIn: process.env.JWT_EXPIRES_IN || '15m',
      refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    },
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS, 10) || 12,
    cors: {
      origins: (process.env.CORS_ORIGINS || 'http://localhost:5173').split(','),
    },
    rateLimit: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
      max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,
    },
    loginRateLimit: {
      windowMs: 15 * 60 * 1000,
      max: parseInt(process.env.LOGIN_RATE_LIMIT_MAX, 10) || 5,
    },
    accountLockout: {
      maxAttempts: parseInt(process.env.ACCOUNT_LOCKOUT_ATTEMPTS, 10) || 5,
      durationMinutes: parseInt(process.env.ACCOUNT_LOCKOUT_DURATION_MIN, 10) || 30,
    },
  },

  upload: {
    dir: process.env.UPLOAD_DIR || './uploads',
    maxFileSize: (parseInt(process.env.MAX_FILE_SIZE_MB, 10) || 10) * 1024 * 1024,
    allowedTypes: (process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/png,image/webp').split(','),
  },

  mail: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.SMTP_FROM || 'noreply@yourstore.com',
  },

  store: {
    currency: process.env.DEFAULT_CURRENCY || 'GEL',
    language: process.env.DEFAULT_LANGUAGE || 'ka',
  },
};
