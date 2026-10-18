'use strict';

/**
 * controllers/auth.controller.js
 * Handles register, login, logout, and me.
 *
 * Security rules enforced here:
 *  - role is NEVER read from the request body (admin lock).
 *  - password_hash is NEVER returned to the client.
 *  - Wrong email and wrong password return the SAME 401 (no enumeration).
 *  - Timing similarity: if the email is not found a dummy bcrypt compare is run.
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const config = require('../config');

const BCRYPT_COST = 12;
const ONE_DAY_MS = 24 * 60 * 60 * 1000; // cookie maxAge
const ONE_DAY_S = 24 * 60 * 60;          // JWT expiry in seconds

// A real bcrypt hash, used only so login takes similar time when the email is unknown.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', BCRYPT_COST);

/** Shared cookie options – keeps settings DRY. */
function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.nodeEnv === 'production',
    maxAge: ONE_DAY_MS,
    // path:'/' ensures the cookie is scoped to the whole domain so that
    // clearCookie() in logout always matches, regardless of which route
    // originally set it.
    path: '/',
  };
}

/**
 * POST /api/auth/register
 * Body: { name, email, password }
 * Returns 201 { id, name, email, role }
 */
async function register(req, res, next) {
  try {
    // NOTE: role / isAdmin / any extra body field is intentionally ignored.
    const name = req.body.name.trim();
    const email = req.body.email.trim().toLowerCase();
    const { password } = req.body;

    const passwordHash = await bcrypt.hash(password, BCRYPT_COST);

    // role column is NOT in the INSERT – DB default 'customer' applies.
    const result = await db.query(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, name, email, role`,
      [name, email, passwordHash]
    );

    const user = result.rows[0];
    return res.status(201).json({ id: user.id, name: user.name, email: user.email, role: user.role });
  } catch (err) {
    // Unique-constraint violation on email
    if (err.code === '23505') {
      return res.status(409).json({ error: { message: 'Email already registered' } });
    }
    return next(err);
  }
}

/**
 * POST /api/auth/login
 * Body: { email, password }
 * Returns 200 { id, name, email, role } + sets httpOnly token cookie.
 */
async function login(req, res, next) {
  try {
    const email = req.body.email.trim().toLowerCase();
    const { password } = req.body;

    const result = await db.query(
      'SELECT id, name, email, role, password_hash FROM users WHERE email = $1',
      [email]
    );

    const user = result.rows[0] || null;

    // Always run bcrypt so timing is similar whether the email exists or not.
    const hashToCompare = user ? user.password_hash : DUMMY_HASH;
    const match = await bcrypt.compare(password, hashToCompare);

    if (!user || !match) {
      return res.status(401).json({ error: { message: 'Invalid email or password' } });
    }

    // Sign JWT – payload contains only the user id.
    // algorithm is explicit so it matches the HS256 restriction in requireAuth.
    const token = jwt.sign({ id: user.id }, config.jwtSecret, {
      expiresIn: ONE_DAY_S,
      algorithm: 'HS256',
    });

    res.cookie('token', token, cookieOptions());

    return res.status(200).json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * POST /api/auth/logout
 * Clears the token cookie, returns 200.
 */
function logout(req, res) {
  const { maxAge, ...clearOpts } = cookieOptions();
  res.clearCookie('token', clearOpts);
  return res.status(200).json({ ok: true });
}

/**
 * GET /api/auth/me
 * requireAuth must have run first – user is already on req.user.
 */
function me(req, res) {
  const { id, name, email, role } = req.user;
  return res.status(200).json({ id, name, email, role });
}

module.exports = { register, login, logout, me };