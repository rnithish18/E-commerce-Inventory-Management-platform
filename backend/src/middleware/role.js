'use strict';

/**
 * middleware/role.js
 * requireAdmin – must be placed AFTER requireAuth.
 * Checks req.user.role === 'admin'; rejects with 403 otherwise.
 */

function requireAdmin(req, res, next) {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return res
    .status(403)
    .json({ error: { message: 'Admin access required' } });
}

module.exports = { requireAdmin };
