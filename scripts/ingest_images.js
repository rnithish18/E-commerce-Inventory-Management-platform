const fs = require('fs');
const path = require('path');
const sharp = require('../backend/node_modules/sharp');
const { Pool } = require('../backend/node_modules/pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://shopnest:shopnest123@localhost:5432/shopnest_db'
});

const INCOMING_DIR = path.join(__dirname, '../incoming-images');
const PRODUCTS_PUBLIC_DIR = path.join(__dirname, '../frontend/public/products');
const MANIFEST_PATH = path.join(__dirname, '../database/seed/image-manifest.json');

const VALID_EXTS = ['.jpg', '.jpeg', '.png', '.webp'];
const TARGET_WIDTHS = [320, 640, 960, 1280];

async function ingest() {
  console.log('--- ShopNest Image Ingestion Pipeline ---');
  if (!fs.existsSync(INCOMING_DIR)) {
    fs.mkdirSync(INCOMING_DIR, { recursive: true });
    console.log(`Created incoming directory at ${INCOMING_DIR}`);
  }

  const files = fs.readdirSync(INCOMING_DIR).filter(f => {
    const ext = path.extname(f).toLowerCase();
    return VALID_EXTS.includes(ext) && !f.startsWith('.');
  });

  if (files.length === 0) {
    console.log('No incoming image files found in incoming-images/');
    console.log('Please place files matching: <product-slug>.(jpg|jpeg|png|webp) or <slug>-2.<ext>');
    await pool.end();
    return;
  }

  console.log(`Discovered ${files.length} incoming candidate file(s):`, files);

  // Load manifest
  let manifest = [];
  if (fs.existsSync(MANIFEST_PATH)) {
    manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
  }
  const manifestMap = new Map(manifest.map(m => [m.slug, m]));

  const { rows: allProducts } = await pool.query('SELECT id, slug, name, brand, needs_image FROM products');
  const productMap = new Map();
  for (const p of allProducts) {
    const baseSlug = p.slug.replace(/-[0-9a-f]{8}$/, '');
    productMap.set(baseSlug, p);
    productMap.set(p.slug, p);
  }

  let processedCount = 0;

  for (const filename of files) {
    const ext = path.extname(filename).toLowerCase();
    const basename = path.basename(filename, ext);
    const filePath = path.join(INCOMING_DIR, filename);

    // Parse slug and optional index suffix (e.g. nike-air-force-1 or nike-air-force-1-2)
    const match = basename.match(/^(.+?)(?:-(\d+))?$/);
    if (!match) {
      console.warn(`[SKIP] Invalid filename format: ${filename}`);
      continue;
    }

    const baseSlug = match[1];
    const imageIndex = match[2] ? parseInt(match[2], 10) - 1 : 0;

    const product = productMap.get(baseSlug);
    if (!product) {
      console.warn(`[SKIP] No catalog product found matching slug "${baseSlug}"`);
      continue;
    }

    try {
      // Validate with sharp
      const image = sharp(filePath);
      const meta = await image.metadata();

      if (!meta.width || !meta.height) {
        console.warn(`[SKIP] Unable to read image dimensions for ${filename}`);
        continue;
      }

      if (meta.width < 320 || meta.height < 320) {
        console.warn(`[SKIP] Image resolution too low (${meta.width}x${meta.height}). Required >= 320x320: ${filename}`);
        continue;
      }

      console.log(`Processing ${filename} -> ${product.name} (Index ${imageIndex}, ${meta.width}x${meta.height})...`);

      const targetDir = path.join(PRODUCTS_PUBLIC_DIR, baseSlug);
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      // Generate responsive WebP sets (strips EXIF automatically)
      for (const width of TARGET_WIDTHS) {
        const outName = `image-${imageIndex}-${width}.webp`;
        const outPath = path.join(targetDir, outName);
        await sharp(filePath)
          .rotate() // auto-orient based on EXIF before stripping
          .resize({ width, withoutEnlargement: true })
          .webp({ quality: 85 })
          .toFile(outPath);
      }

      // Generate tiny blur-up placeholder
      const placeholderBuffer = await sharp(filePath)
        .rotate()
        .resize({ width: 24 })
        .webp({ quality: 20 })
        .toBuffer();
      const placeholderDataUri = `data:image/webp;base64,${placeholderBuffer.toString('base64')}`;
      fs.writeFileSync(path.join(targetDir, `image-${imageIndex}-placeholder.webp`), placeholderBuffer);

      const primaryUrl = `/products/${baseSlug}/image-${imageIndex}-640.webp`;
      const isPrimary = imageIndex === 0;

      // Update database
      // 1. Clear any placeholder row
      await pool.query(
        "DELETE FROM product_images WHERE product_id = $1 AND url LIKE '%photo-coming-soon%'",
        [product.id]
      );

      // 2. Check if this sort_order image already exists
      const { rows: existingRows } = await pool.query(
        'SELECT id FROM product_images WHERE product_id = $1 AND sort_order = $2',
        [product.id, imageIndex]
      );

      if (existingRows.length > 0) {
        await pool.query(
          `UPDATE product_images 
           SET url = $1, alt_text = $2, is_primary = $3, source_url = 'user-supplied', license = 'User-supplied / Rights granted', verified = true
           WHERE id = $4`,
          [primaryUrl, `${product.name} photograph`, isPrimary, existingRows[0].id]
        );
      } else {
        await pool.query(
          `INSERT INTO product_images (product_id, url, alt_text, sort_order, is_primary, source_url, license, verified)
           VALUES ($1, $2, $3, $4, $5, 'user-supplied', 'User-supplied / Rights granted', true)`,
          [product.id, primaryUrl, `${product.name} photograph`, imageIndex, isPrimary]
        );
      }

      // Update product needs_image flag
      await pool.query('UPDATE products SET needs_image = false WHERE id = $1', [product.id]);

      // Update manifest
      let manEntry = manifestMap.get(baseSlug);
      if (!manEntry) {
        manEntry = {
          slug: baseSlug,
          name: product.name,
          brand: product.brand,
          verified: true,
          needs_image: false,
          primary_url: primaryUrl,
          images_count: 1,
          images: [],
          license: 'User-supplied / Rights granted',
          attribution: 'ShopNest User Upload'
        };
        manifest.push(manEntry);
        manifestMap.set(baseSlug, manEntry);
      }

      manEntry.needs_image = false;
      manEntry.verified = true;
      if (isPrimary) manEntry.primary_url = primaryUrl;

      const srcsetStr = TARGET_WIDTHS.map(w => `/products/${baseSlug}/image-${imageIndex}-${w}.webp ${w}w`).join(', ');
      
      const newImgObj = {
        sort_order: imageIndex,
        is_primary: isPrimary,
        url: primaryUrl,
        srcset: srcsetStr,
        placeholder: placeholderDataUri,
        alt: `${product.name} photograph`,
        source_url: 'user-supplied',
        license: 'User-supplied / Rights granted',
        attribution: 'ShopNest Contributor',
        verified: true
      };

      const existingImgIdx = manEntry.images.findIndex(i => i.sort_order === imageIndex);
      if (existingImgIdx >= 0) {
        manEntry.images[existingImgIdx] = newImgObj;
      } else {
        manEntry.images.push(newImgObj);
        manEntry.images.sort((a, b) => a.sort_order - b.sort_order);
      }
      manEntry.images_count = manEntry.images.length;

      processedCount++;
      console.log(`[OK] Successfully ingested ${filename} for ${product.name}!`);
    } catch (err) {
      console.error(`[ERROR] Processing ${filename}:`, err);
    }
  }

  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2), 'utf8');
  console.log(`Updated manifest at ${MANIFEST_PATH}`);
  console.log(`Ingestion completed: ${processedCount} file(s) ingested.`);
  await pool.end();
}

ingest().catch(err => {
  console.error('Fatal ingestion error:', err);
  process.exit(1);
});
