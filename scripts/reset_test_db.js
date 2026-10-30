const { Pool } = require('../backend/node_modules/pg');

const pool = new Pool({
  connectionString: 'postgresql://shopnest:shopnest123@localhost:5432/postgres'
});

async function resetTestDb() {
  console.log('Resetting shopnest_test_db from template shopnest_db...');
  try {
    // Terminate existing connections to test db and shopnest_db if any
    await pool.query(`
      SELECT pg_terminate_backend(pg_stat_activity.pid)
      FROM pg_stat_activity
      WHERE pg_stat_activity.datname IN ('shopnest_test_db', 'shopnest_db')
        AND pid <> pg_backend_pid();
    `);
    await pool.query('DROP DATABASE IF EXISTS shopnest_test_db;');
    await pool.query('CREATE DATABASE shopnest_test_db WITH TEMPLATE shopnest_db OWNER shopnest;');
    console.log('✓ shopnest_test_db successfully recreated from template shopnest_db.');
  } catch (err) {
    console.error('Failed to reset test db:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

resetTestDb();
