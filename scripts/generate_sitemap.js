const { Pool } = require('../backend/node_modules/pg');
const fs = require('fs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://shopnest:shopnest123@localhost:5432/shopnest_db',
});

async function main() {
  const catRes = await pool.query('SELECT slug FROM categories ORDER BY slug');
  const prodRes = await pool.query('SELECT slug, updated_at FROM products WHERE is_active = true ORDER BY name');

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  xml += '  <url>\n    <loc>https://shopnest.com/</loc>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n  </url>\n';
  xml += '  <url>\n    <loc>https://shopnest.com/shop</loc>\n    <changefreq>daily</changefreq>\n    <priority>0.9</priority>\n  </url>\n';

  for (const c of catRes.rows) {
    xml += `  <url>\n    <loc>https://shopnest.com/shop?category=${c.slug}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
  }

  for (const p of prodRes.rows) {
    const lastmod = new Date(p.updated_at || Date.now()).toISOString().split('T')[0];
    xml += `  <url>\n    <loc>https://shopnest.com/product/${p.slug}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.7</priority>\n  </url>\n`;
  }

  xml += '</urlset>\n';
  fs.writeFileSync('frontend/public/sitemap.xml', xml);
  console.log(`Generated frontend/public/sitemap.xml with ${catRes.rows.length} categories and ${prodRes.rows.length} products.`);
  await pool.end();
}

main().catch(console.error);
