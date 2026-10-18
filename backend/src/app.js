'use strict';

/**
 * app.js
 * Builds and exports the Express application.
 * Does NOT call app.listen() – that is server.js's job.
 *
 * Middleware order (matches spec):
 *   helmet -> cors -> express.json -> cookie-parser ->
 *   routes under /api -> 404 handler -> error handler
 */

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const config = require('./config');
const authRoutes = require('./routes/auth.routes');
const adminRoutes = require('./routes/admin.routes');
const { notFoundHandler, errorHandler } = require('./middleware/error');

const app = express();

// ── Security headers ─────────────────────────────────────────────────────────
app.use(helmet());
app.disable('x-powered-by'); // belt-and-suspenders (helmet already removes it)

// ── CORS ─────────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: config.clientUrl || false, // only the configured CLIENT_URL
    credentials: true,
  })
);

// ── Body parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));

// ── Cookies ──────────────────────────────────────────────────────────────────
app.use(cookieParser());

// ── Health check (no DB access) ──────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.status(200).json({ ok: true });
});

// ── Feature routes ───────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);

// ── 404 & Error handlers (must be last) ──────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
