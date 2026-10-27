const { Pool } = require('../backend/node_modules/pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({ connectionString: 'postgresql://shopnest:shopnest123@localhost:5432/shopnest_db' });

async function run() {
  const { rows: products } = await pool.query('SELECT id, slug, name, brand, needs_image FROM products ORDER BY name ASC');
  console.log(`Found ${products.length} products in database.`);

  const mismatchesToRemove = [
    'funskool-monopoly-india-board-game',
    'lego-classic-creative-bricks-box-484pcs',
    'logitech-mx-master-3s-wireless-mouse',
    'atomic-habits-by-james-clear',
    'the-alchemist-by-paulo-coelho'
  ];

  for (const p of products) {
    const baseSlug = p.slug.replace(/-[0-9a-f]{8}$/, '');
    
    if (mismatchesToRemove.includes(baseSlug)) {
      console.log(`Removing mismatch/unlicensed image for: ${p.name} (${baseSlug})`);
      await pool.query('DELETE FROM product_images WHERE product_id = $1', [p.id]);
      await pool.query(
        `INSERT INTO product_images (product_id, url, alt_text, sort_order, is_primary, source_url, license, verified)
         VALUES ($1, $2, $3, 0, true, $4, $5, false)`,
        [
          p.id,
          '/products/photo-coming-soon.svg',
          `${p.name} (Photo coming soon)`,
          'ShopNest Standard Placeholder',
          'CC0 1.0 Universal'
        ]
      );
      await pool.query('UPDATE products SET needs_image = true WHERE id = $1', [p.id]);
    } else if (baseSlug === 'samsung-galaxy-s24-ultra') {
      console.log(`Fixing Samsung S24 Ultra images (keeping only exact S24 Ultra photo)...`);
      await pool.query('DELETE FROM product_images WHERE product_id = $1 AND source_url LIKE $2', [p.id, '%webtekno%']);
      await pool.query('UPDATE product_images SET is_primary = true, sort_order = 0 WHERE product_id = $1', [p.id]);
      await pool.query('UPDATE products SET needs_image = false WHERE id = $1', [p.id]);
    }
  }

  // Update image-manifest.json
  const manifestPath = path.join(__dirname, '../database/seed/image-manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

  for (const m of manifest) {
    if (mismatchesToRemove.includes(m.slug)) {
      m.verified = false;
      m.needs_image = true;
      m.primary_url = '/products/photo-coming-soon.svg';
      m.images_count = 1;
      m.images = [{
        sort_order: 0,
        is_primary: true,
        url: '/products/photo-coming-soon.svg',
        alt: `${m.name} (Photo coming soon)`,
        source_url: 'ShopNest Standard Placeholder',
        license: 'CC0 1.0 Universal',
        attribution: 'ShopNest Design Studio',
        verified: false
      }];
      m.license = 'CC0 1.0 Universal';
      m.attribution = 'ShopNest Design Studio';
    } else if (m.slug === 'samsung-galaxy-s24-ultra') {
      m.images = m.images.filter(img => !img.source_url.includes('webtekno'));
      if (m.images.length > 0) {
        m.images[0].sort_order = 0;
        m.images[0].is_primary = true;
        m.primary_url = m.images[0].url;
      }
      m.images_count = m.images.length;
    }
  }
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log('image-manifest.json updated.');

  // Delete physical mismatched folders if needed or leave them safely removed from DB/manifest
  // Let's now output the full 42 audit table
  const auditRows = [];
  for (const p of products) {
    const baseSlug = p.slug.replace(/-[0-9a-f]{8}$/, '');
    const { rows: imgs } = await pool.query('SELECT url, source_url, license, verified FROM product_images WHERE product_id = $1 ORDER BY sort_order ASC', [p.id]);
    const { rows: updatedP } = await pool.query('SELECT needs_image FROM products WHERE id = $1', [p.id]);
    const primaryImg = imgs[0] || { url: '/products/photo-coming-soon.svg', source_url: 'N/A', license: 'N/A', verified: false };
    
    let visualMatch = 'no';
    if (!updatedP[0].needs_image && primaryImg.verified) {
      visualMatch = 'yes';
    } else if (mismatchesToRemove.includes(baseSlug)) {
      visualMatch = 'no (mismatch/copyright removed)';
    } else {
      visualMatch = 'no (no photo yet)';
    }

    auditRows.push({
      slug: p.slug,
      baseSlug,
      name: p.name,
      brand: p.brand,
      file: primaryImg.url,
      source_url: primaryImg.source_url || 'N/A',
      license: primaryImg.license || 'N/A',
      visual_match: visualMatch,
      needs_image: updatedP[0].needs_image
    });
  }

  fs.writeFileSync(path.join(__dirname, '../docs/audit_table_42.json'), JSON.stringify(auditRows, null, 2));
  console.log(`Generated docs/audit_table_42.json with ${auditRows.length} rows.`);

  await pool.end();
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
