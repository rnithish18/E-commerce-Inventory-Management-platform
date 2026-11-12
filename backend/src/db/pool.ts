import { Pool } from 'pg';

// Strip ?sslmode=... from the connection string so we can control SSL
// programmatically. The pg driver's connection-string sslmode overrides the
// Pool 'ssl' option, so we must remove it and set ssl explicitly instead.
function buildPoolConfig() {
  const raw = process.env.DATABASE_URL ||
    'postgresql://shopnest:shopnest123@localhost:5432/shopnest_db';

  const isRemote =
    raw.includes('supabase') ||
    raw.includes('render.com') ||
    raw.includes('neon.tech') ||
    raw.includes('railway.app') ||
    // any host-based DB (not localhost)
    (!raw.includes('localhost') && !raw.includes('127.0.0.1'));

  // Remove sslmode from the query string so our ssl object takes effect
  const connectionString = raw.replace(/[?&]sslmode=[^&]*/g, (match) => {
    // If sslmode was the only query param, drop the '?'; otherwise drop '&sslmode=...'
    return match.startsWith('?') ? '' : '';
  });

  return {
    connectionString,
    max: 30,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
    // For hosted DBs (Supabase, Render, etc.) TLS is required but the pooler
    // presents a self-signed cert, so we skip CA chain verification.
    // The connection is still encrypted; this only affects certificate trust.
    ssl: isRemote ? { rejectUnauthorized: false } : undefined,
  } as const;
}

export const pool = new Pool(buildPoolConfig());

process.on('SIGINT', async () => {
  await pool.end();
  process.exit(0);
});
