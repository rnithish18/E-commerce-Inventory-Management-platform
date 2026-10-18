'use strict';

/**
 * middleware/error.js
 * Central JSON error handler + 404 handler.
 * In production, stack traces are never sent to the client.
 */

const config = require('../config');

/**
 * 404 handler – must be registered AFTER all routes.
 */
function notFoundHandler(req, res) {
  res.status(404).json({ error: { message: 'Not found' } });
}

/**
 * Central error handler – must be registered LAST (4 arguments).
 * Handles both operational errors (with a .status) and unexpected errors.
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // Determine safe status code
  const status =
    typeof err.status === 'number' && err.status >= 400 && err.status < 600
      ? err.status
      : 500;

  // Build the error message the client will see
  let message;
  if (status < 500) {
    // Operational / expected errors – safe to surface
    message = err.message || 'An error occurred';
  } else {
    // Unexpected server errors – hide internal details in production
    if (config.nodeEnv !== 'production') {
      message = err.message || 'Internal server error';
    } else {
      message = 'Internal server error';
    }
    // Log the real error server-side (but NOT request bodies, tokens, or secrets)
    console.error('[error]', err.message, config.nodeEnv !== 'production' ? err.stack : '');
  }

  res.status(status).json({ error: { message } });
}

module.exports = { notFoundHandler, errorHandler };
