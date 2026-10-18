'use strict';

/**
 * middleware/validate.js
 * Checks express-validator results and returns a structured 400 if invalid.
 */

const { validationResult } = require('express-validator');

/**
 * Place this after your validation chain in the route definition.
 * Returns 400 with { error: { message, details } } when validation fails.
 */
function validate(req, res, next) {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }

  const details = errors.array().map((e) => ({
    field: e.path,
    message: e.msg,
  }));

  return res.status(400).json({
    error: {
      message: 'Validation failed',
      details,
    },
  });
}

module.exports = { validate };
