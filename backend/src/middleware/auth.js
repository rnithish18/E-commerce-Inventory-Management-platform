'use strict';

/**
 * middleware/auth.js
 * requireAuth – verifies the "token" cookie, loads the current user from the
 * DB so the role is always fresh, and rejects deleted users.
 */

const jwt = require('jsonwebtoken');
const config = require('../config');
const db = require('../db');

async function requireAuth(req, res, next) {
  try {
    const token = req.cookies && req.cookies.token;

    if (!token) {
      return res
        .status(401)
        .json({ error: { message: 'Authentication required' } });
    }

    // Verify signature and expiry.
    // algorithms is explicitly restricted to HS256 to prevent algorithm-
    // confusion attacks (e.g. RS256 / "alg:none" substitution).
    let payload;
    try {
      payload = jwt.verify(token, config.jwtSecret, { algorithms: ['HS256'] });
    } catch {
      return res
        .status(401)
        .json({ error: { message: 'Authentication required' } });
    }

    // Load current user from DB so the role is always up-to-date
    // and deleted users are rejected automatically.
    const result = await db.query(
      'SELECT id, name, email, role FROM users WHERE id = $1',
      [payload.id]
    );

    if (result.rowCount === 0) {
      return res
        .status(401)
        .json({ error: { message: 'Authentication required' } });
    }

    req.user = result.rows[0];
    return next();
  } catch (err) {
    return next(err);
  }
}

module.exports = { requireAuth };
