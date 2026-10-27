const { Pool } = require('../backend/node_modules/pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({ connectionString: 'postgresql://shopnest:shopnest123@localhost:5432/shopnest_db' });
const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, '../database/seed/image-manifest.json'), 'utf8'));
const manifestMap = new Map(manifest.map(m => [m.slug, m]));

async function main() {
  const { rows: products } = await pool.query('SELECT id, slug, name, brand, needs_image FROM products ORDER BY name ASC');
  console.log('Total products in DB:', products.length);

  const results = [];
  for (const p of products) {
    const { rows: imgs } = await pool.query(
      'SELECT id, url, alt_text, sort_order, is_primary, source_url, license, verified FROM product_images WHERE product_id = $1 ORDER BY sort_order ASC',
      [p.id]
    );
    const man = manifestMap.get(p.slug);
    results.push({
      id: p.id,
      slug: p.slug,
      db_name: p.name,
      db_brand: p.brand,
      db_needs_image: p.needs_image,
      images: imgs,
      manifest: man ? {
        name: man.name,
        brand: man.brand,
        needs_image: man.needs_image,
        license: man.license,
        source_url: (man.images && man.images[0] && man.images[0].source_url) || man.source_url || '',
        primary_url: man.primary_url
      } : null
    });
  }
  fs.writeFileSync(path.join(__dirname, '../db_products_audit.json'), JSON.stringify(results, null, 2));
  console.log('Audit dumped to db_products_audit.json');
  await pool.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
