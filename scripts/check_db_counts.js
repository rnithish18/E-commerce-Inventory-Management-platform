const { Pool } = require('../backend/node_modules/pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://shopnest:shopnest123@localhost:5432/shopnest_db'
});

async function main() {
  const [p, o, u, v, img, r] = await Promise.all([
    pool.query('SELECT COUNT(*)::int as count FROM products'),
    pool.query('SELECT COUNT(*)::int as count FROM orders'),
    pool.query('SELECT COUNT(*)::int as count FROM users'),
    pool.query('SELECT COUNT(*)::int as count FROM product_variants'),
    pool.query('SELECT COUNT(*)::int as count FROM product_images'),
    pool.query('SELECT COUNT(*)::int as count FROM reviews')
  ]);

  const counts = {
    products: p.rows[0].count,
    orders: o.rows[0].count,
    users: u.rows[0].count,
    product_variants: v.rows[0].count,
    product_images: img.rows[0].count,
    reviews: r.rows[0].count
  };

  console.log(JSON.stringify(counts, null, 2));
  await pool.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
