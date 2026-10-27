const fs = require('fs');
const path = require('path');

const audit = JSON.parse(fs.readFileSync(path.join(__dirname, '../docs/audit_table_42.json'), 'utf8'));
const missing = audit.filter(p => p.needs_image);

const incomingDir = path.join(__dirname, '../incoming-images');
if (!fs.existsSync(incomingDir)) {
  fs.mkdirSync(incomingDir, { recursive: true });
}

let md = '# Incoming Product Images Directory\n\n';
md += 'Place your high-resolution product photographs in this directory to automatically process, optimize, and link them to ShopNest catalog items.\n\n';
md += '### How to Ingest Photos\n';
md += '1. Save your photograph using the product slug: `<slug>.(jpg|jpeg|png|webp)`\n';
md += '   - Example: `adidas-originals-classic-track-jacket.jpg`\n';
md += '2. For secondary gallery photos, use hyphen numbers: `<slug>-2.jpg`, `<slug>-3.jpg`\n';
md += '3. Execute the ingestion script:\n';
md += '   ```bash\n';
md += '   npm run images:ingest\n';
md += '   ```\n';
md += '4. The script validates resolution (min 400x400), strips EXIF metadata, generates WebP sets (320, 640, 960, 1280px) + blur placeholders with `sharp`, inserts rows into `product_images`, and flags `needs_image = false`.\n\n';
md += `### Catalog Products Requiring Photography (${missing.length} Products)\n\n`;
md += '| # | Product Slug | Name & Brand | Category Search Query |\n';
md += '| -: | :--- | :--- | :--- |\n';

missing.forEach((item, idx) => {
  const query = `${item.brand} ${item.name} high resolution official photo`;
  md += `| ${idx + 1} | \`${item.baseSlug}\` | **${item.name}** (${item.brand}) | \`${query}\` |\n`;
});

fs.writeFileSync(path.join(incomingDir, 'README.md'), md, 'utf8');
console.log(`Created incoming-images/README.md with ${missing.length} missing product items.`);
