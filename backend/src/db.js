'use strict';

/**
 * db.js
 * Exports a single pg Pool built from DATABASE_URL.
 * The Pool is created lazily inside a getter so that merely
 * require()-ing this module does NOT open a connection.
 */

const { Pool } = require('pg');
const config = require('./config');

let _pool = null;

function getPool() {
  if (!_pool) {
    _pool = new Pool({
      connectionString: config.databaseUrl,
      // In production, require certificate verification. Neon issues certificates
      // from a public CA, so this is safe and preferred over rejectUnauthorized:false.
      // In development/test, SSL is disabled for local Postgres instances.
      ssl:
        config.nodeEnv === 'production'
          ? { rejectUnauthorized: true }
          : false,
    });

    // Log pool-level errors so they don't crash the process silently.
    // Never log the connection string or any credentials.
    _pool.on('error', (err) => {
      console.error('[db] Unexpected pool client error:', err.message);
    });
  }
  return _pool;
}

/**
 * Run a parameterized query.
 * @param {string} text     - SQL with $1 … $n placeholders
 * @param {any[]}  [params] - Parameter values (never build SQL by concatenation)
 */
async function query(text, params = []) {
  return getPool().query(text, params);
}

/**
 * Drain and close the connection pool.
 * Called by server.js during graceful shutdown.
 */
async function closePool() {
  if (_pool) {
    const poolToClose = _pool;
    _pool = null; // prevent new queries from being issued during drain
    await poolToClose.end();
  }
}

module.exports = { query, getPool, closePool };
