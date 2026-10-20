const { Client } = require('pg');

async function run() {
  const c = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://shopnest:shopnest123@localhost:5432/shopnest_db'
  });
  await c.connect();

  const tables = await c.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"
  );
  console.log('=== TABLES CREATED ===');
  console.log(tables.rows.map(r => r.table_name).join(', '));

  console.log('\n=== ROW COUNTS ===');
  const targetTables = [
    'categories',
    'products',
    'product_variants',
    'product_images',
    'users',
    'coupons',
    'inventory_movements',
    'orders',
    'carts'
  ];

  for (const t of targetTables) {
    try {
      const r = await c.query(`SELECT count(*)::int as count FROM "${t}"`);
      console.log(`${t.padEnd(22)}: ${r.rows[0].count}`);
    } catch (e) {
      console.log(`${t.padEnd(22)}: [Error: ${e.message}]`);
    }
  }

  console.log('\n=== SAMPLE CATEGORIES ===');
  const cats = await c.query('SELECT name, slug, icon FROM categories ORDER BY name');
  cats.rows.forEach(cat => console.log(`- ${cat.name} (${cat.slug})`));

  console.log('\n=== SAMPLE USERS ===');
  const users = await c.query('SELECT email, full_name, role FROM users ORDER BY role, email');
  users.rows.forEach(u => console.log(`- [${u.role}] ${u.email} (${u.full_name})`));

  console.log('\n=== SAMPLE COUPONS ===');
  const coupons = await c.query('SELECT code, type, value_paise, min_order_paise, is_active FROM coupons');
  coupons.rows.forEach(cp => console.log(`- ${cp.code}: ${cp.type} (${cp.value_paise / 100}%) min ₹${cp.min_order_paise / 100}`));

  await c.end();
}

run().catch(console.error);
