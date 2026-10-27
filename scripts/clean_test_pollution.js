const { Pool } = require('../backend/node_modules/pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://shopnest:shopnest123@localhost:5432/shopnest_db',
});

async function clean() {
  const res = await pool.query("SELECT id, name FROM products WHERE name LIKE 'Studio Wireless Active Noise%' OR brand = 'ShopNest'");
  console.log('Found test polluted products:', res.rows.length);
  for (const row of res.rows) {
    await pool.query('DELETE FROM inventory_movements WHERE product_id = $1', [row.id]);
    await pool.query('DELETE FROM product_variants WHERE product_id = $1', [row.id]);
    await pool.query('DELETE FROM product_images WHERE product_id = $1', [row.id]);
    await pool.query('DELETE FROM products WHERE id = $1', [row.id]);
    console.log('Deleted polluted product:', row.name, row.id);
  }
  const count = await pool.query('SELECT COUNT(*) FROM products');
  console.log('Products count after cleanup:', count.rows[0].count);
  await pool.end();
}

clean().catch(console.error);
