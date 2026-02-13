const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const config = require('../../../config/default');

/**
 * Helmet - HTTP Security Headers
 * Sets headers like X-Content-Type-Options, X-Frame-Options,
 * Strict-Transport-Security, Content-Security-Policy, etc.
 */
function helmetMiddleware() {
  return helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'blob:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  });
}

/**
 * CORS - Cross-Origin Resource Sharing
 * Only allows requests from whitelisted origins
 */
function corsMiddleware() {
  return cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) return callback(null, true);

      if (config.security.cors.origins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('CORS policy: Origin not allowed'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400, // Preflight cache 24h
  });
}

/**
 * General API Rate Limiter
 * Prevents abuse and DDoS
 */
function rateLimitMiddleware() {
  return rateLimit({
    windowMs: config.security.rateLimit.windowMs,
    max: config.security.rateLimit.max,
    message: {
      error: 'Too many requests, please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
}

/**
 * Auth-specific Rate Limiter (stricter)
 * Prevents brute-force login attempts
 */
function loginRateLimitMiddleware() {
  return rateLimit({
    windowMs: config.security.loginRateLimit.windowMs,
    max: config.security.loginRateLimit.max,
    message: {
      error: 'Too many login attempts. Please try again in 15 minutes.',
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      // Rate limit by IP + email combination
      return `${req.ip}-${req.body?.email || 'unknown'}`;
    },
  });
}

module.exports = {
  helmetMiddleware,
  corsMiddleware,
  rateLimitMiddleware,
  loginRateLimitMiddleware,
};
