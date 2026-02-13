const config = require('../../../config/default');

/**
 * Global Error Handler
 * Catches all unhandled errors and returns safe responses
 */
function errorHandler(err, req, res, _next) {
  // Log full error in development
  if (config.app.env === 'development') {
    console.error('[Error]', err);
  } else {
    // In production, only log message (no stack traces)
    console.error('[Error]', err.message);
  }

  // CORS error
  if (err.message && err.message.includes('CORS')) {
    return res.status(403).json({ error: 'Origin not allowed' });
  }

  // Joi validation error (in case it slips through)
  if (err.isJoi) {
    return res.status(400).json({
      error: 'Validation failed',
      details: err.details?.map((d) => ({
        field: d.path.join('.'),
        message: d.message,
      })),
    });
  }

  // Knex/PostgreSQL errors
  if (err.code) {
    switch (err.code) {
      case '23505': // unique_violation
        return res.status(409).json({ error: 'Resource already exists' });
      case '23503': // foreign_key_violation
        return res.status(400).json({ error: 'Referenced resource not found' });
      case '23502': // not_null_violation
        return res.status(400).json({ error: 'Missing required field' });
    }
  }

  // Custom app errors
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      error: err.message,
      ...(err.code && { code: err.code }),
    });
  }

  // Default 500 - never expose internals in production
  res.status(500).json({
    error: config.app.env === 'development'
      ? err.message
      : 'Internal server error',
  });
}

/**
 * Custom Application Error
 */
class AppError extends Error {
  constructor(message, statusCode = 400, code = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

/**
 * 404 Handler
 */
function notFoundHandler(req, res) {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
}

module.exports = { errorHandler, AppError, notFoundHandler };
