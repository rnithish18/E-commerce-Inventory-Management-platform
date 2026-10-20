import 'dotenv/config';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://shopnest:shopnest123@localhost:5432/shopnest_db',
});

function slugify(text: string): string {
  return text.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');
}

interface ProductSeed {
  cat: string;
  name: string;
  brand: string;
  price: number;
  mrp: number;
  badge: string | null;
  stock: number;
  desc: string;
}

const products: ProductSeed[] = [
  // Electronics (10)
  { cat: 'electronics', name: 'Noise ColorFit Pro 5 Smart Watch', brand: 'Noise', price: 299900, mrp: 499900, badge: 'Hot', stock: 85, desc: 'Advanced fitness smartwatch with AMOLED display, heart rate monitoring, and 7-day battery life.' },
  { cat: 'electronics', name: 'Sony WH-1000XM5 Wireless Headphones', brand: 'Sony', price: 2499900, mrp: 2999900, badge: 'Trending', stock: 23, desc: 'Industry-leading noise canceling headphones with 30-hour battery and multipoint connection.' },
  { cat: 'electronics', name: 'Apple iPhone 15 128GB Blue', brand: 'Apple', price: 6999900, mrp: 7999900, badge: 'Hot', stock: 12, desc: 'iPhone 15 with Dynamic Island, 48MP camera, and USB-C connectivity. 128GB storage.' },
  { cat: 'electronics', name: 'Samsung Galaxy S24 Ultra', brand: 'Samsung', price: 8999900, mrp: 9999900, badge: 'New', stock: 8, desc: 'Flagship Samsung phone with S Pen, 200MP camera system, and Galaxy AI features.' },
  { cat: 'electronics', name: 'boAt Rockerz 550 Bluetooth Headphones', brand: 'boAt', price: 149900, mrp: 299900, badge: 'Best Seller', stock: 156, desc: 'Over-ear Bluetooth headphones with 20-hour playtime and ASAP charge technology.' },
  { cat: 'electronics', name: 'Realme Buds Air 5 Pro TWS Earbuds', brand: 'Realme', price: 499900, mrp: 699900, badge: null, stock: 67, desc: 'True wireless earbuds with active noise cancellation and 38-hour total playtime.' },
  { cat: 'electronics', name: 'HP 15 Laptop Intel Core i5 12th Gen', brand: 'HP', price: 5999900, mrp: 6999900, badge: 'Sale', stock: 15, desc: '15.6-inch FHD laptop, Intel Core i5, 16GB RAM, 512GB SSD, Windows 11 Home.' },
  { cat: 'electronics', name: 'Canon EOS R50 Mirrorless Camera', brand: 'Canon', price: 7499900, mrp: 8499900, badge: null, stock: 6, desc: '24.2MP mirrorless camera with 4K30p video, Eye AF, and compact RF-mount system.' },
  { cat: 'electronics', name: 'Logitech MX Master 3S Wireless Mouse', brand: 'Logitech', price: 799900, mrp: 999900, badge: 'Best Seller', stock: 89, desc: 'Advanced wireless mouse with MagSpeed electromagnetic scrolling and 8K DPI sensor.' },
  { cat: 'electronics', name: 'JBL Flip 6 Portable Bluetooth Speaker', brand: 'JBL', price: 899900, mrp: 1199900, badge: 'Sale', stock: 45, desc: 'IP67 waterproof portable Bluetooth speaker with bold JBL Pro Sound and 12-hour battery.' },
  // Fashion (8)
  { cat: 'fashion', name: 'Nike Air Force 1 Low White Sneakers', brand: 'Nike', price: 549900, mrp: 899900, badge: 'Best Seller', stock: 234, desc: "Classic low-top sneaker in iconic white leather. Men's sizes 6-12. Timeless streetwear essential." },
  { cat: 'fashion', name: "Levi's 511 Slim Fit Stretch Jeans", brand: "Levi's", price: 249900, mrp: 349900, badge: null, stock: 178, desc: 'Slim fit jeans in medium indigo wash denim with just the right amount of stretch.' },
  { cat: 'fashion', name: 'Adidas Originals Classic Track Jacket', brand: 'Adidas', price: 399900, mrp: 599900, badge: 'Sale', stock: 92, desc: 'Retro-inspired track jacket with iconic 3-stripe design. 100% recycled polyester.' },
  { cat: 'fashion', name: 'Allen Solly Formal Shirt Regular Fit', brand: 'Allen Solly', price: 149900, mrp: 249900, badge: null, stock: 320, desc: 'Regular fit formal shirt in solid blue, 100% premium cotton. Machine washable.' },
  { cat: 'fashion', name: 'Fabindia Cotton Kurta for Men', brand: 'Fabindia', price: 179900, mrp: 259900, badge: null, stock: 145, desc: 'Handwoven cotton kurta with traditional block print. Ethically crafted in India.' },
  { cat: 'fashion', name: 'H&M Floral Midi Dress', brand: 'H&M', price: 199900, mrp: 299900, badge: 'New', stock: 88, desc: 'Floral print midi dress with puff sleeves, V-neck, and tie waist belt. Relaxed fit.' },
  { cat: 'fashion', name: 'Woodland Waterproof Hiking Boots', brand: 'Woodland', price: 449900, mrp: 649900, badge: null, stock: 56, desc: 'Genuine leather waterproof hiking boots with anti-slip TPU outsole and cushioned insole.' },
  { cat: 'fashion', name: 'Peter England Classic Laptop Backpack', brand: 'Peter England', price: 129900, mrp: 199900, badge: null, stock: 112, desc: '30L laptop backpack with dedicated 15.6" laptop sleeve, USB charging port, and rain cover.' },
  // Home & Living (6)
  { cat: 'home-living', name: 'Prestige Iris 750W Mixer Grinder', brand: 'Prestige', price: 399900, mrp: 549900, badge: 'Best Seller', stock: 67, desc: '750W mixer grinder with 3 stainless steel jars, 3 speed control, and 5-year warranty.' },
  { cat: 'home-living', name: 'Milton Thermosteel Flask 1 Litre', brand: 'Milton', price: 89900, mrp: 129900, badge: null, stock: 234, desc: 'Double-wall vacuum insulated thermos bottle. Keeps beverages hot 24hr or cold 24hr.' },
  { cat: 'home-living', name: 'Amazon Basics King Bedsheet Set 1000 TC', brand: 'Amazon Basics', price: 149900, mrp: 249900, badge: 'Sale', stock: 89, desc: 'King size 100% long-staple cotton bedsheet set with 2 pillow covers. 1000 thread count.' },
  { cat: 'home-living', name: 'Pigeon Healthifry Digital Air Fryer 4L', brand: 'Pigeon', price: 349900, mrp: 499900, badge: 'Hot', stock: 34, desc: '4-litre digital air fryer with 8 preset cooking programs, LED touch panel, and rapid air technology.' },
  { cat: 'home-living', name: 'Nilkamal Plastic Chair Set of 4', brand: 'Nilkamal', price: 279900, mrp: 399900, badge: null, stock: 45, desc: 'Heavy-duty plastic chairs with UV-stabilized material. Suitable for indoor and outdoor use.' },
  { cat: 'home-living', name: 'Lifelong RO Water Purifier 10L', brand: 'Lifelong', price: 1299900, mrp: 1799900, badge: null, stock: 18, desc: 'RO+UV+UF+TDS water purifier with 7-stage purification, 10L tank, and mineral retention.' },
  // Beauty (5)
  { cat: 'beauty-personal-care', name: 'Lakme 9 to 5 Weightless Mousse Foundation', brand: 'Lakme', price: 59900, mrp: 79900, badge: 'Best Seller', stock: 312, desc: 'Weightless mousse foundation with SPF 30 and 24-hour coverage. Natural finish.' },
  { cat: 'beauty-personal-care', name: 'Mamaearth Vitamin C Face Serum 30ml', brand: 'Mamaearth', price: 59900, mrp: 99900, badge: 'Trending', stock: 445, desc: 'Vitamin C serum with turmeric for glowing, bright skin. Reduces dark spots in 4 weeks.' },
  { cat: 'beauty-personal-care', name: 'Philips BT3231 Cordless Beard Trimmer', brand: 'Philips', price: 149900, mrp: 249900, badge: null, stock: 89, desc: 'Cordless beard trimmer with 20 built-in length settings and DuraPower technology for 90-min runtime.' },
  { cat: 'beauty-personal-care', name: 'WOW Skin Science Apple Cider Vinegar Shampoo', brand: 'WOW', price: 39900, mrp: 59900, badge: null, stock: 567, desc: '300ml apple cider vinegar shampoo for scalp balance, frizz control, and healthy hair.' },
  { cat: 'beauty-personal-care', name: 'Forest Essentials Light Day Moisturiser', brand: 'Forest Essentials', price: 189900, mrp: 249900, badge: null, stock: 56, desc: 'Ayurvedic lightweight moisturiser with saffron, honey, and aloe vera for radiant skin.' },
  // Sports (5)
  { cat: 'sports-outdoors', name: 'Nivia Storm Match Football Size 5', brand: 'Nivia', price: 79900, mrp: 119900, badge: null, stock: 145, desc: 'FIFA-standard match football with 32-panel machine-stitched design. For all surfaces.' },
  { cat: 'sports-outdoors', name: 'Cosco Double Star Badminton Set', brand: 'Cosco', price: 149900, mrp: 229900, badge: 'Best Seller', stock: 78, desc: 'Complete badminton set with 2 premium rackets, 3 shuttlecocks, and carry bag.' },
  { cat: 'sports-outdoors', name: 'Strauss Anti-Slip Yoga Mat 6mm', brand: 'Strauss', price: 59900, mrp: 99900, badge: null, stock: 234, desc: '6mm thick EVA foam yoga mat with anti-slip surface and carrying strap.' },
  { cat: 'sports-outdoors', name: 'Yonex Nanoray 7000I Badminton Racket', brand: 'Yonex', price: 849900, mrp: 1099900, badge: null, stock: 23, desc: 'Isometric head shape graphite frame racket for advanced players. Pre-strung at 24lbs.' },
  { cat: 'sports-outdoors', name: 'Fitness Mantra Leather Gym Gloves', brand: 'Fitness Mantra', price: 39900, mrp: 69900, badge: 'Sale', stock: 189, desc: 'Anti-slip gym gloves with wrist support and breathable mesh back. Available S-XL.' },
  // Books (4)
  { cat: 'books-stationery', name: 'Atomic Habits by James Clear', brand: 'Penguin Random House', price: 39900, mrp: 59900, badge: 'Best Seller', stock: 456, desc: 'An easy and proven way to build good habits and break bad ones. 320 pages, paperback.' },
  { cat: 'books-stationery', name: 'The Alchemist by Paulo Coelho', brand: 'HarperCollins', price: 29900, mrp: 49900, badge: null, stock: 312, desc: 'A fable about following your dream. Over 65 million copies sold worldwide. Paperback.' },
  { cat: 'books-stationery', name: 'Pilot V7 Hi-Tecpoint Pen Pack of 10', brand: 'Pilot', price: 24900, mrp: 35000, badge: null, stock: 678, desc: 'Liquid ink rollerball pens with fine 0.7mm tip. Smooth, consistent writing.' },
  { cat: 'books-stationery', name: 'Classmate 6-Subject Spiral Notebook', brand: 'Classmate', price: 14900, mrp: 19900, badge: null, stock: 890, desc: 'A4 ruled notebook, 300 pages. Spiral-bound with soft cover and elastic closure.' },
  // Toys (4)
  { cat: 'toys-games', name: 'LEGO Classic Creative Bricks Box 484pcs', brand: 'LEGO', price: 399900, mrp: 499900, badge: 'Trending', stock: 67, desc: 'Classic LEGO building set with 484 bricks in 33 different colors. Suitable for ages 4+.' },
  { cat: 'toys-games', name: 'Funskool Monopoly India Board Game', brand: 'Funskool', price: 99900, mrp: 149900, badge: 'Best Seller', stock: 145, desc: 'Classic Monopoly board game with Indian edition streets and properties. 2-6 players.' },
  { cat: 'toys-games', name: 'Hot Wheels 20-Car Collector Gift Pack', brand: 'Hot Wheels', price: 119900, mrp: 179900, badge: null, stock: 234, desc: '20 collectible die-cast metal cars in 1:64 scale. Suitable for ages 3 and above.' },
  { cat: 'toys-games', name: "Rubik's Cube 3x3 Original Speed Cube", brand: "Rubik's", price: 59900, mrp: 89900, badge: 'Hot', stock: 345, desc: "Original 3x3 speed cube with smooth rotation mechanism. Multiple color schemes available." },
];

async function seed() {
  const client = await pool.connect();
  try {
    console.log('🌱 Starting ShopNest seed...');
    await client.query('BEGIN');

    // Clear in dependency order
    const tables = [
      'audit_log', 'wishlists', 'shipment_tracking_events', 'reviews',
      'coupon_redemptions', 'refunds', 'payment_attempts', 'order_items',
      'orders', 'cart_items', 'carts', 'coupons', 'inventory_movements',
      'product_variants', 'product_images', 'products', 'categories',
      'addresses', 'users',
    ];
    for (const t of tables) {
      await client.query(`DELETE FROM ${t}`);
    }
    console.log('🧹 Cleared existing data');

    // ── CATEGORIES ──
    const categoryDefs = [
      { name: 'Electronics', slug: 'electronics', icon: '💻' },
      { name: 'Fashion', slug: 'fashion', icon: '👗' },
      { name: 'Home & Living', slug: 'home-living', icon: '🏠' },
      { name: 'Beauty & Personal Care', slug: 'beauty-personal-care', icon: '💄' },
      { name: 'Sports & Outdoors', slug: 'sports-outdoors', icon: '⚽' },
      { name: 'Books & Stationery', slug: 'books-stationery', icon: '📚' },
      { name: 'Toys & Games', slug: 'toys-games', icon: '🧸' },
    ];

    const categoryIds: Record<string, string> = {};
    for (const cat of categoryDefs) {
      const id = uuidv4();
      categoryIds[cat.slug] = id;
      await client.query(
        'INSERT INTO categories (id, name, slug, icon) VALUES ($1, $2, $3, $4)',
        [id, cat.name, cat.slug, cat.icon]
      );
    }
    console.log(`✅ ${categoryDefs.length} categories seeded`);

    // ── ADMIN USER ──
    const adminId = uuidv4();
    const adminHash = await bcrypt.hash('Admin@123!', 12);
    await client.query(
      `INSERT INTO users (id, email, password_hash, full_name, phone, role)
       VALUES ($1, $2, $3, $4, $5, 'ADMIN')`,
      [adminId, 'admin@shopnest.com', adminHash, 'ShopNest Admin', '9000000000']
    );

    // ── CUSTOMER USERS ──
    const customerNames = [
      'Rahul Sharma', 'Priya Singh', 'Amit Kumar', 'Sneha Patel', 'Rohit Verma',
      'Anjali Gupta', 'Vikas Joshi', 'Pooja Mehta', 'Karan Malhotra', 'Ritu Agarwal',
    ];
    const customerHash = await bcrypt.hash('Customer@123!', 12);
    for (let i = 1; i <= 10; i++) {
      const id = uuidv4();
      await client.query(
        `INSERT INTO users (id, email, password_hash, full_name, phone, role)
         VALUES ($1, $2, $3, $4, $5, 'CUSTOMER')`,
        [id, `customer${i}@shopnest.com`, customerHash, customerNames[i - 1], `900000000${i}`]
      );
    }
    console.log('✅ 1 admin + 10 customers seeded');

    // ── PRODUCTS ──
    let productCount = 0;
    for (const p of products) {
      const pid = uuidv4();
      const slug = slugify(p.name) + '-' + pid.slice(0, 8);
      const catId = categoryIds[p.cat];
      if (!catId) throw new Error(`Category not found: ${p.cat}`);

      await client.query(
        `INSERT INTO products (id, category_id, name, slug, description, brand, price_paise, mrp_paise, badge, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true)`,
        [pid, catId, p.name, slug, p.desc, p.brand, p.price, p.mrp, p.badge]
      );

      // Product image (placeholder for demo)
      await client.query(
        'INSERT INTO product_images (id, product_id, url, alt_text, sort_order) VALUES ($1, $2, $3, $4, 0)',
        [uuidv4(), pid, `https://placehold.co/400x400/1e293b/f97316?text=${encodeURIComponent(p.brand.substring(0, 12))}`, p.name]
      );

      // Default variant
      const vid = uuidv4();
      const sku = slugify(p.brand).substring(0, 8) + '-' + pid.slice(0, 8);
      await client.query(
        `INSERT INTO product_variants (id, product_id, name, sku, stock_qty, reorder_threshold, price_adjustment_paise)
         VALUES ($1, $2, 'Default', $3, $4, $5, 0)`,
        [vid, pid, sku, p.stock, Math.max(5, Math.floor(p.stock * 0.1))]
      );

      // Initial stock movement
      await client.query(
        `INSERT INTO inventory_movements (id, product_id, variant_id, type, quantity_change, stock_before, stock_after, reason, actor_user_id)
         VALUES ($1, $2, $3, 'PURCHASE_IN', $4, 0, $4, 'Initial inventory from seed data', $5)`,
        [uuidv4(), pid, vid, p.stock, adminId]
      );

      productCount++;
    }
    console.log(`✅ ${productCount} products seeded with images, variants, and inventory movements`);

    // ── WELCOME10 COUPON ──
    await client.query(
      `INSERT INTO coupons (id, code, type, value_paise, min_order_paise, max_discount_paise, usage_limit, per_user_limit, is_active)
       VALUES ($1, 'WELCOME10', 'percent', 1000, 50000, 50000, 1000, 1, true)`,
      [uuidv4()]
    );
    console.log('✅ Coupon WELCOME10 seeded (10% off, min ₹500, max ₹500, 1 per user)');

    await client.query('COMMIT');
    console.log('\n🎉 Seed completed successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Demo credentials:');
    console.log('  Admin:    admin@shopnest.com / Admin@123!');
    console.log('  Customer: customer1@shopnest.com / Customer@123!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Seed failed:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch(process.exit);
