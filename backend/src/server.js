'use strict';

/**
 * server.js
 * Entry point: loads dotenv, validates required env vars, starts the app.
 *
 * SECURITY: env values are NEVER printed or logged here.
 * Missing required keys cause an immediate exit with a clear message.
 */

require('dotenv').config();

const config = require('./config');

// ── Validate required environment variables ───────────────────────────────────
const missing = [];
if (!config.jwtSecret)   missing.push('JWT_SECRET');
if (!config.databaseUrl) missing.push('DATABASE_URL');

if (missing.length > 0) {
  console.error(
    `[server] Missing required environment variable(s): ${missing.join(', ')}. ` +
    'Please set them in your .env file and restart.'
  );
  process.exit(1);
}

// Warn when CLIENT_URL is absent – cross-origin requests will be blocked by
// the CORS config in app.js. The value itself is never printed.
if (!config.clientUrl) {
  console.warn(
    '[server] CLIENT_URL is not set – cross-origin requests will be blocked. ' +
    'Set CLIENT_URL in your .env file if you are running a frontend.'
  );
}

// ── Start the app ─────────────────────────────────────────────────────────────
const app = require('./app');
const { closePool } = require('./db');

const server = app.listen(config.port, () => {
  console.log(
    `[server] Running in ${config.nodeEnv} mode on port ${config.port}`
  );
});

// ── Graceful shutdown ─────────────────────────────────────────────────────────
let shuttingDown = false;

async function shutdown(signal) {
  // Prevent duplicate execution if two signals arrive back-to-back.
  if (shuttingDown) return;
  shuttingDown = true;

  console.log(`[server] Received ${signal}; shutting down gracefully…`);

  // Force-exit if shutdown takes longer than 10 s.
  const forceExit = setTimeout(() => {
    console.error('[server] Shutdown timed out – forcing exit.');
    process.exit(1);
  }, 10_000);
  forceExit.unref(); // don't let this timer prevent the event-loop from draining

  try {
    // 1. Stop accepting new HTTP requests.
    await new Promise((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });

    // 2. Drain and close the PostgreSQL connection pool.
    await closePool();

    clearTimeout(forceExit);
    console.log('[server] HTTP server and database pool closed cleanly.');
    process.exitCode = 0;
  } catch (err) {
    clearTimeout(forceExit);
    console.error('[server] Error during shutdown:', err.message);
    process.exitCode = 1;
  }
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));
