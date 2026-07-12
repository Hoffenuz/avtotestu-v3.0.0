'use strict';

const { AppError, RateLimitError } = require('../utils/errors');
const config = require('../config');

/**
 * Global error handler — must be registered last in Express.
 */
function errorHandler(err, req, res, next) {
  // Determine status code
  const status = err.statusCode || 500;

  // Log internal errors
  if (status >= 500) {
    console.error(`[ERROR] ${req.method} ${req.path}:`, err.message, err.stack);
  }

  // Set Retry-After header for rate limit errors
  if (err instanceof RateLimitError && err.retryAfter) {
    res.set('Retry-After', String(Math.ceil(err.retryAfter)));
  }

  // Never leak internal details in production
  const message = (err.isOperational || config.nodeEnv !== 'production')
    ? err.message
    : 'Internal server error';

  res.status(status).json({ error: message });
}

module.exports = { errorHandler };
