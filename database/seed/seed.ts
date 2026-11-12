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
  img: string;
}

const products: ProductSeed[] = [
  // ── ELECTRONICS (30) ──────────────────────────────────────────────────
  { cat: 'electronics', name: 'Noise ColorFit Pro 5 Smart Watch', brand: 'Noise', price: 299900, mrp: 499900, badge: 'Sale', stock: 85, desc: 'Advanced fitness smartwatch with AMOLED display, heart rate monitoring, and 7-day battery life.', img: 'https://images.pexels.com/photos/267394/pexels-photo-267394.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { cat: 'electronics', name: 'Sony WH-1000XM5 Wireless Headphones', brand: 'Sony', price: 2499900, mrp: 2999900, badge: null, stock: 23, desc: 'Industry-leading noise canceling headphones with 30-hour battery and multipoint connection.', img: 'https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { cat: 'electronics', name: 'Apple iPhone 15 128GB Blue', brand: 'Apple', price: 6999900, mrp: 7999900, badge: 'Sale', stock: 12, desc: 'iPhone 15 with Dynamic Island, 48MP camera, and USB-C connectivity. 128GB storage.', img: 'https://images.pexels.com/photos/788946/pexels-photo-788946.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { cat: 'electronics', name: 'Samsung Galaxy S24 Ultra', brand: 'Samsung', price: 8999900, mrp: 9999900, badge: 'New', stock: 8, desc: 'Flagship Samsung phone with S Pen, 200MP camera system, and Galaxy AI features.', img: 'https://images.pexels.com/photos/404280/pexels-photo-404280.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { cat: 'electronics', name: 'boAt Rockerz 550 Bluetooth Headphones', brand: 'boAt', price: 149900, mrp: 299900, badge: 'Best Seller', stock: 156, desc: 'Over-ear Bluetooth headphones with 20-hour playtime and ASAP charge technology.', img: 'https://images.pexels.com/photos/1649771/pexels-photo-1649771.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { cat: 'electronics', name: 'Realme Buds Air 5 Pro TWS Earbuds', brand: 'Realme', price: 499900, mrp: 699900, badge: null, stock: 67, desc: 'True wireless earbuds with active noise cancellation and 38-hour total playtime.', img: 'https://images.pexels.com/photos/3780681/pexels-photo-3780681.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { cat: 'electronics', name: 'HP 15 Laptop Intel Core i5 12th Gen', brand: 'HP', price: 5999900, mrp: 6999900, badge: 'Sale', stock: 15, desc: '15.6-inch FHD laptop, Intel Core i5, 16GB RAM, 512GB SSD, Windows 11 Home.', img: 'https://images.pexels.com/photos/18105/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=400' },
  { cat: 'electronics', name: 'Canon EOS R50 Mirrorless Camera', brand: 'Canon', price: 7499900, mrp: 8499900, badge: null, stock: 6, desc: '24.2MP mirrorless camera with 4K30p video, Eye AF, and compact RF-mount system.', img: 'https://images.pexels.com/photos/51383/photo-camera-subject-photographer-51383.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { cat: 'electronics', name: 'Logitech MX Master 3S Wireless Mouse', brand: 'Logitech', price: 799900, mrp: 999900, badge: 'Best Seller', stock: 89, desc: 'Advanced wireless mouse with MagSpeed electromagnetic scrolling and 8K DPI sensor.', img: 'https://images.pexels.com/photos/2115257/pexels-photo-2115257.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { cat: 'electronics', name: 'JBL Flip 6 Portable Bluetooth Speaker', brand: 'JBL', price: 899900, mrp: 1199900, badge: 'Sale', stock: 45, desc: 'IP67 waterproof portable Bluetooth speaker with bold JBL Pro Sound and 12-hour battery.', img: 'https://images.pexels.com/photos/1706694/pexels-photo-1706694.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { cat: 'electronics', name: 'OnePlus Nord CE 3 Lite 5G 128GB', brand: 'OnePlus', price: 1799900, mrp: 1999900, badge: null, stock: 54, desc: '6.72" FHD+ display, Snapdragon 695, 108MP camera, 67W SUPERVOOC charging, 5G.', img: 'https://images.pexels.com/photos/1092644/pexels-photo-1092644.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { cat: 'electronics', name: 'Mi Smart Band 7 Pro Fitness Tracker', brand: 'Xiaomi', price: 349900, mrp: 499900, badge: 'Sale', stock: 134, desc: '1.64" AMOLED always-on display, 110+ workout modes, SpO2 and stress monitoring.', img: 'https://images.pexels.com/photos/267394/pexels-photo-267394.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { cat: 'electronics', name: 'Dell 24 Inch FHD IPS Monitor', brand: 'Dell', price: 1299900, mrp: 1599900, badge: null, stock: 28, desc: '24" FHD 1080p IPS panel, 75Hz refresh, AMD FreeSync, HDMI + VGA, flicker-free.', img: 'https://images.pexels.com/photos/777001/pexels-photo-777001.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { cat: 'electronics', name: 'TP-Link Archer AX1800 Wi-Fi 6 Router', brand: 'TP-Link', price: 349900, mrp: 499900, badge: null, stock: 62, desc: 'Dual-band Wi-Fi 6 router, 1800Mbps, OFDMA, MU-MIMO, 4 antennas, parental controls.', img: 'https://images.pexels.com/photos/2881229/pexels-photo-2881229.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { cat: 'electronics', name: 'Seagate 2TB External Hard Drive', brand: 'Seagate', price: 449900, mrp: 599900, badge: 'Sale', stock: 97, desc: 'USB 3.0 portable 2TB external HDD, compatible with PC, Mac, and Xbox. Slim design.', img: 'https://images.pexels.com/photos/4792728/pexels-photo-4792728.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { cat: 'electronics', name: 'Samsung 870 EVO 500GB SSD', brand: 'Samsung', price: 349900, mrp: 449900, badge: null, stock: 73, desc: 'SATA III 2.5" SSD, 560MB/s read, 530MB/s write, 5-year warranty.', img: 'https://images.pexels.com/photos/4792728/pexels-photo-4792728.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { cat: 'electronics', name: 'Anker 65W GaN USB-C Charger', brand: 'Anker', price: 299900, mrp: 399900, badge: 'Best Seller', stock: 189, desc: 'Ultra-compact 65W GaN charger with 3 ports (2 USB-C + 1 USB-A). Foldable plug.', img: 'https://images.pexels.com/photos/4219830/pexels-photo-4219830.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { cat: 'electronics', name: 'Kindle Paperwhite 11th Gen 8GB', brand: 'Amazon', price: 1399900, mrp: 1699900, badge: null, stock: 41, desc: '6.8" glare-free display, adjustable warm light, waterproof, 10 weeks battery life.', img: 'https://images.pexels.com/photos/904616/pexels-photo-904616.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { cat: 'electronics', name: 'boAt Airdopes 141 TWS Earbuds', brand: 'boAt', price: 99900, mrp: 199900, badge: 'Best Seller', stock: 423, desc: 'TWS earbuds with 42-hour total playtime, BEAST mode low latency, IPX4 water resistance.', img: 'https://images.pexels.com/photos/3780681/pexels-photo-3780681.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { cat: 'electronics', name: 'Zebronics Zeb-Action Pro Webcam 1080p', brand: 'Zebronics', price: 149900, mrp: 199900, badge: null, stock: 56, desc: '1080p Full HD webcam with built-in mic, plug-and-play USB, 90 degree wide-angle lens.', img: 'https://images.pexels.com/photos/777001/pexels-photo-777001.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { cat: 'electronics', name: 'Redmi Note 13 5G 128GB Midnight Black', brand: 'Redmi', price: 1799900, mrp: 1999900, badge: 'New', stock: 76, desc: '6.67" AMOLED 120Hz, Dimensity 6080, 108MP OIS camera, 5000mAh, 33W turbo charge.', img: 'https://images.pexels.com/photos/1092644/pexels-photo-1092644.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { cat: 'electronics', name: 'Sony PlayStation 5 DualSense Controller', brand: 'Sony', price: 589900, mrp: 699900, badge: null, stock: 34, desc: 'Wireless PS5 controller with haptic feedback, adaptive triggers, and built-in mic.', img: 'https://images.pexels.com/photos/9072218/pexels-photo-9072218.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { cat: 'electronics', name: 'Noise Buds VS102 Pro Earbuds', brand: 'Noise', price: 89900, mrp: 149900, badge: 'Sale', stock: 212, desc: 'TWS earbuds with Quad-mic ENC, 50-hour playtime, BT 5.3, IPX5 water resistance.', img: 'https://images.pexels.com/photos/3780681/pexels-photo-3780681.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { cat: 'electronics', name: 'boAt Wave Leap Call Smartwatch', brand: 'boAt', price: 199900, mrp: 299900, badge: null, stock: 98, desc: '1.83" HD display, Bluetooth calling, SpO2, heart rate, 7-day battery, 100+ sports modes.', img: 'https://images.pexels.com/photos/267394/pexels-photo-267394.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { cat: 'electronics', name: 'Realme Narzo N55 128GB Prime Blue', brand: 'Realme', price: 1299900, mrp: 1499900, badge: null, stock: 55, desc: '6.72" FHD+ 90Hz display, Helio G88, 64MP AI camera, 5000mAh, 33W dart charge.', img: 'https://images.pexels.com/photos/404280/pexels-photo-404280.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { cat: 'electronics', name: 'Havells 46cm Tower Fan 3-Speed', brand: 'Havells', price: 349900, mrp: 449900, badge: 'Sale', stock: 48, desc: 'Alexa-compatible tower fan, 3 speed settings, 8-hour timer, remote control, 100cm height.', img: 'https://images.pexels.com/photos/4792728/pexels-photo-4792728.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { cat: 'electronics', name: 'Zebronics Wireless Keyboard Mouse Combo', brand: 'Zebronics', price: 79900, mrp: 129900, badge: null, stock: 234, desc: 'Wireless keyboard and mouse combo, 2.4GHz USB dongle, 12-month battery, spill-resistant.', img: 'https://images.pexels.com/photos/2115257/pexels-photo-2115257.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { cat: 'electronics', name: 'iBall Musi Fab Neckband Earphones', brand: 'iBall', price: 59900, mrp: 99900, badge: null, stock: 156, desc: 'Bluetooth 5.0 neckband with 24-hour playtime, magnetic earbuds, IPX5, voice assistant.', img: 'https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { cat: 'electronics', name: 'AmazonBasics USB 3.0 7-Port Hub', brand: 'Amazon Basics', price: 149900, mrp: 199900, badge: null, stock: 87, desc: '7-port USB 3.0 hub with 36W power adapter and individual on/off switches per port.', img: 'https://images.pexels.com/photos/4219830/pexels-photo-4219830.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { cat: 'electronics', name: 'boAt Stone 350 Pro Bluetooth Speaker', brand: 'boAt', price: 299900, mrp: 499900, badge: 'Sale', stock: 67, desc: '12W outdoor Bluetooth speaker, IPX7 waterproof, 12-hour playtime, 360 degree surround sound.', img: 'https://images.pexels.com/photos/1706694/pexels-photo-1706694.jpeg?auto=compress&cs=tinysrgb&w=400' },

  // ── FASHION (30) ──────────────────────────────────────────────────────
  { cat: 'fashion', name: 'Nike Air Force 1 Low White Sneakers', brand: 'Nike', price: 549900, mrp: 899900, badge: 'Best Seller', stock: 234, desc: 'Classic low-top sneaker in iconic white leather. Available in sizes 6-12. Timeless streetwear essential.', img: 'https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { cat: 'fashion', name: "Levi's 511 Slim Fit Stretch Jeans", brand: "Levi's", price: 249900, mrp: 349900, badge: null, stock: 178, desc: 'Slim fit jeans in medium indigo wash denim with just the right amount of stretch.', img: 'https://images.pexels.com/photos/1598507/pexels-photo-1598507.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { cat: 'fashion', name: 'Adidas Originals Classic Track Jacket', brand: 'Adidas', price: 399900, mrp: 599900, badge: 'Sale', stock: 92, desc: 'Retro-inspired track jacket with iconic 3-stripe design. 100% recycled polyester.', img: 'https://images.pexels.com/photos/8532616/pexels-photo-8532616.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { cat: 'fashion', name: 'Allen Solly Formal Shirt Regular Fit', brand: 'Allen Solly', price: 149900, mrp: 249900, badge: null, stock: 320, desc: 'Regular fit formal shirt in solid blue, 100% premium cotton. Machine washable.', img: 'https://images.pexels.com/photos/297933/pexels-photo-297933.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { cat: 'fashion', name: 'Fabindia Cotton Kurta for Men', brand: 'Fabindia', price: 179900, mrp: 259900, badge: null, stock: 145, desc: 'Handwoven cotton kurta with traditional block print. Ethically crafted in India.', img: 'https://images.pexels.com/photos/9558574/pexels-photo-9558574.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { cat: 'fashion', name: 'H&M Floral Midi Dress', brand: 'H&M', price: 199900, mrp: 299900, badge: 'New', stock: 88, desc: 'Floral print midi dress with puff sleeves, V-neck, and tie waist belt. Relaxed fit.', img: 'https://images.pexels.com/photos/985635/pexels-photo-985635.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { cat: 'fashion', name: 'Woodland Waterproof Hiking Boots', brand: 'Woodland', price: 449900, mrp: 649900, badge: null, stock: 56, desc: 'Genuine leather waterproof hiking boots with anti-slip TPU outsole and cushioned insole.', img: 'https://images.pexels.com/photos/267301/pexels-photo-267301.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { cat: 'fashion', name: 'Peter England Laptop Backpack 30L', brand: 'Peter England', price: 129900, mrp: 199900, badge: null, stock: 112, desc: '30L backpack with dedicated 15.6 inch laptop sleeve, USB charging port, and rain cover.', img: 'https://images.pexels.com/photos/1152077/pexels-photo-1152077.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { cat: 'fashion', name: 'Puma Men Running Shoes Flyer Flex', brand: 'Puma', price: 299900, mrp: 449900, badge: 'Sale', stock: 143, desc: 'Lightweight running shoes with SOFTFOAM+ sockliner and breathable mesh upper.', img: 'https://images.pexels.com/photos/1032110/pexels-photo-1032110.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { cat: 'fashion', name: 'Biba Women Printed Kurti', brand: 'Biba', price: 149900, mrp: 249900, badge: null, stock: 234, desc: 'Comfortable cotton printed kurti with round neck and three-quarter sleeves. Sizes XS-XXL.', img: 'https://images.pexels.com/photos/9558574/pexels-photo-9558574.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { cat: 'fashion', name: 'Arrow Formal Trousers Slim Fit', brand: 'Arrow', price: 199900, mrp: 299900, badge: null, stock: 189, desc: 'Wrinkle-resistant slim fit formal trousers in stretch fabric. Available 28-40 waist.', img: 'https://images.pexels.com/photos/1598507/pexels-photo-1598507.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { cat: 'fashion', name: 'Titan Raga Women Watch Rose Gold', brand: 'Titan', price: 599900, mrp: 849900, badge: null, stock: 45, desc: 'Elegant rose gold watch with mother-of-pearl dial, Swarovski crystals, leather strap.', img: 'https://images.pexels.com/photos/190819/pexels-photo-190819.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { cat: 'fashion', name: 'Wildcraft Cycling Helmet Adult', brand: 'Wildcraft', price: 99900, mrp: 179900, badge: 'Sale', stock: 78, desc: 'Polycarbonate shell cycling helmet with adjustable dial fit, 20 vents, removable visor.', img: 'https://images.pexels.com/photos/267301/pexels-photo-267301.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { cat: 'fashion', name: 'Anouk Women Georgette Saree Blue', brand: 'Anouk', price: 149900, mrp: 299900, badge: 'Sale', stock: 97, desc: 'Printed georgette saree with unstitched blouse piece. Lightweight, drapes beautifully.', img: 'https://images.pexels.com/photos/985635/pexels-photo-985635.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { cat: 'fashion', name: 'US Polo Assn Polo T-Shirt Navy', brand: 'US Polo Assn.', price: 149900, mrp: 249900, badge: null, stock: 312, desc: 'Classic polo T-shirt in 100% cotton pique. Ribbed collar and cuffs, 2-button placket.', img: 'https://images.pexels.com/photos/297933/pexels-photo-297933.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { cat: 'fashion', name: 'Mochi Women Block Heel Sandals', brand: 'Mochi', price: 199900, mrp: 349900, badge: 'Sale', stock: 76, desc: 'Block heel casual sandals with padded footbed and adjustable ankle strap. Sizes 3-8.', img: 'https://images.pexels.com/photos/267301/pexels-photo-267301.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { cat: 'fashion', name: 'Indian Terrain Casual Cargo Shorts', brand: 'Indian Terrain', price: 149900, mrp: 249900, badge: null, stock: 143, desc: 'Cotton cargo shorts with 6 pockets, drawstring waist, and relaxed fit. Sizes 28-38.', img: 'https://images.pexels.com/photos/1598507/pexels-photo-1598507.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { cat: 'fashion', name: 'Campus Spirit Sports Shoes', brand: 'Campus', price: 149900, mrp: 249900, badge: 'Best Seller', stock: 267, desc: 'Lightweight sports shoes with mesh upper, EVA midsole, and anti-skid rubber outsole.', img: 'https://images.pexels.com/photos/1032110/pexels-photo-1032110.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { cat: 'fashion', name: 'Dressberry Flared Midi Skirt', brand: 'Dressberry', price: 129900, mrp: 249900, badge: 'Sale', stock: 87, desc: 'Flared midi skirt with elasticated waist in polyester crepe. Sizes XS-XXL.', img: 'https://images.pexels.com/photos/985635/pexels-photo-985635.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { cat: 'fashion', name: 'Tommy Hilfiger Leather Belt Brown', brand: 'Tommy Hilfiger', price: 199900, mrp: 299900, badge: null, stock: 123, desc: 'Genuine leather dress belt with logo embossed buckle. Sizes 32-42, adjustable.', img: 'https://images.pexels.com/photos/1152077/pexels-photo-1152077.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { cat: 'fashion', name: 'Nike Dri-FIT Running Shorts 5-Inch', brand: 'Nike', price: 199900, mrp: 299900, badge: null, stock: 178, desc: '5-inch running shorts in moisture-wicking Dri-FIT fabric with built-in liner and phone pocket.', img: 'https://images.pexels.com/photos/8532616/pexels-photo-8532616.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { cat: 'fashion', name: 'Libas Women Rayon Straight Kurta', brand: 'Libas', price: 79900, mrp: 149900, badge: 'Sale', stock: 345, desc: 'Rayon straight-cut kurta with mandarin collar and floral print. Sizes XS-3XL.', img: 'https://images.pexels.com/photos/9558574/pexels-photo-9558574.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { cat: 'fashion', name: 'Red Tape Casual Loafers Brown', brand: 'Red Tape', price: 199900, mrp: 349900, badge: null, stock: 98, desc: 'Leather slip-on loafers with cushioned insole and durable rubber outsole. Sizes 6-12.', img: 'https://images.pexels.com/photos/267301/pexels-photo-267301.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { cat: 'fashion', name: 'Fabindia Linen Blend Shirt Men', brand: 'Fabindia', price: 229900, mrp: 329900, badge: null, stock: 76, desc: 'Premium linen-blend shirt in solid sage green with mandarin collar, slim fit.', img: 'https://images.pexels.com/photos/297933/pexels-photo-297933.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { cat: 'fashion', name: 'Vero Moda Women Blazer Grey', brand: 'Vero Moda', price: 299900, mrp: 499900, badge: 'Sale', stock: 54, desc: 'Single-button structured blazer with notch lapels and flap pockets. Sizes XS-XL.', img: 'https://images.pexels.com/photos/8532616/pexels-photo-8532616.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { cat: 'fashion', name: 'Wildcraft 20L Rucksack Olive', brand: 'Wildcraft', price: 199900, mrp: 299900, badge: null, stock: 112, desc: '20L rucksack with laptop sleeve, rain cover, and padded shoulder straps.', img: 'https://images.pexels.com/photos/1152077/pexels-photo-1152077.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { cat: 'fashion', name: 'Crocs Classic Clogs Unisex', brand: 'Crocs', price: 349900, mrp: 499900, badge: null, stock: 143, desc: 'Original Crocs foam clogs with ventilation ports and pivoting heel straps. Unisex sizing.', img: 'https://images.pexels.com/photos/1032110/pexels-photo-1032110.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { cat: 'fashion', name: 'AND Women Crepe Formal Shirt White', brand: 'AND', price: 149900, mrp: 249900, badge: null, stock: 189, desc: 'Crepe formal shirt with spread collar, full sleeves, and concealed button placket.', img: 'https://images.pexels.com/photos/985635/pexels-photo-985635.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { cat: 'fashion', name: 'FBB Basics Men Innerwear Pack of 3', brand: 'FBB', price: 29900, mrp: 59900, badge: null, stock: 456, desc: '3-pack cotton briefs with elasticated waistband, 95% cotton, 5% elastane. Sizes S-XL.', img: 'https://images.pexels.com/photos/297933/pexels-photo-297933.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { cat: 'fashion', name: 'Taneira Silk Dupatta Green', brand: 'Taneira', price: 299900, mrp: 499900, badge: null, stock: 54, desc: 'Pure silk dupatta with hand-woven zari border. Ethically sourced from Indian weavers.', img: 'https://images.pexels.com/photos/9558574/pexels-photo-9558574.jpeg?auto=compress&cs=tinysrgb&w=400' },

  // ── HOME & LIVING (25) ────────────────────────────────────────────────
  { cat: 'home-living', name: 'Prestige Iris 750W Mixer Grinder', brand: 'Prestige', price: 399900, mrp: 549900, badge: 'Best Seller', stock: 67, desc: '750W mixer grinder with 3 stainless steel jars, 3 speed control, and 5-year warranty.', img: 'https://images.pexels.com/photos/4397912/pexels-photo-4397912.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { cat: 'home-living', name: 'Milton Thermosteel Flask 1 Litre', brand: 'Milton', price: 89900, mrp: 129900, badge: null, stock: 234, desc: 'Double-wall vacuum insulated thermos bottle. Keeps beverages hot or cold for 24 hours.', img: 'https://images.pexels.com/photos/1346347/pexels-photo-1346347.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { cat: 'home-living', name: 'AmazonBasics King Bedsheet Set 1000 TC', brand: 'Amazon Basics', price: 149900, mrp: 249900, badge: 'Sale', stock: 89, desc: 'King size 100% long-staple cotton bedsheet set with 2 pillow covers. 1000 thread count.', img: 'https://images.pexels.com/photos/1648768/pexels-photo-1648768.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { cat: 'home-living', name: 'Pigeon Healthifry Digital Air Fryer 4L', brand: 'Pigeon', price: 349900, mrp: 499900, badge: null, stock: 34, desc: '4-litre digital air fryer with 8 preset cooking programs and rapid air technology.', img: 'https://images.pexels.com/photos/4397912/pexels-photo-4397912.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { cat: 'home-living', name: 'Nilkamal Plastic Chair Set of 4', brand: 'Nilkamal', price: 279900, mrp: 399900, badge: null, stock: 45, desc: 'Heavy-duty UV-stabilized plastic chairs suitable for indoor and outdoor use.', img: 'https://images.pexels.com/photos/1148955/pexels-photo-1148955.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { cat: 'home-living', name: 'Lifelong RO Water Purifier 10L', brand: 'Lifelong', price: 1299900, mrp: 1799900, badge: null, stock: 18, desc: 'RO+UV+UF+TDS water purifier with 7-stage purification and 10L storage tank.', img: 'https://images.pexels.com/photos/1346347/pexels-photo-1346347.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { cat: 'home-living', name: 'Borosil Carafe Glass Water Bottle 1L', brand: 'Borosil', price: 79900, mrp: 129900, badge: null, stock: 178, desc: 'Borosilicate glass water bottle with leak-proof lid and neoprene sleeve. 1 litre.', img: 'https://images.pexels.com/photos/1346347/pexels-photo-1346347.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { cat: 'home-living', name: 'Havells 1500W Room Heater', brand: 'Havells', price: 199900, mrp: 299900, badge: 'Sale', stock: 56, desc: 'Fan-assisted room heater with 1500W, 2 heat settings, overheat protection, 5-year warranty.', img: 'https://images.pexels.com/photos/4397912/pexels-photo-4397912.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { cat: 'home-living', name: 'Solimo Microfiber Comforter Double', brand: 'Amazon Basics', price: 149900, mrp: 249900, badge: 'Sale', stock: 123, desc: 'Double-size microfiber comforter, 200 GSM fill, machine washable, hypoallergenic.', img: 'https://images.pexels.com/photos/1648768/pexels-photo-1648768.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { cat: 'home-living', name: 'Prestige PKOSS Electric Kettle 1.5L', brand: 'Prestige', price: 79900, mrp: 129900, badge: null, stock: 234, desc: '1.5L stainless steel electric kettle with cordless 360 degree base and auto shut-off.', img: 'https://images.pexels.com/photos/4397912/pexels-photo-4397912.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { cat: 'home-living', name: 'Hindware Bathroom Accessory Set 5-Piece', brand: 'Hindware', price: 149900, mrp: 249900, badge: null, stock: 78, desc: '5-piece chrome-plated zinc alloy bathroom accessories: towel ring, hook, paper holder, soap dish + rack.', img: 'https://images.pexels.com/photos/1457847/pexels-photo-1457847.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { cat: 'home-living', name: 'Duroflex Wave Memory Foam Pillow', brand: 'Duroflex', price: 199900, mrp: 299900, badge: null, stock: 89, desc: 'Contour memory foam pillow with cooling gel layer and removable washable cover.', img: 'https://images.pexels.com/photos/1648768/pexels-photo-1648768.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { cat: 'home-living', name: 'Kuber Industries Non-Stick Frying Pan 24cm', brand: 'Kuber', price: 89900, mrp: 149900, badge: 'Sale', stock: 145, desc: '24cm non-stick frying pan with Bakelite handle, induction-compatible, PFOA-free coating.', img: 'https://images.pexels.com/photos/4397912/pexels-photo-4397912.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { cat: 'home-living', name: 'Philips Air Purifier AC1215 True HEPA', brand: 'Philips', price: 999900, mrp: 1299900, badge: 'Sale', stock: 23, desc: 'True HEPA air purifier, removes 99.97% of particles, 300 m3/h CADR, AeraSense real-time display.', img: 'https://images.pexels.com/photos/1457847/pexels-photo-1457847.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { cat: 'home-living', name: 'Solimo 500 TC Cotton Printed Bedsheet', brand: 'Amazon Basics', price: 69900, mrp: 129900, badge: 'Sale', stock: 189, desc: 'Queen-size 500TC printed cotton bedsheet with 2 pillow covers. Fade resistant.', img: 'https://images.pexels.com/photos/1648768/pexels-photo-1648768.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { cat: 'home-living', name: 'Hindware Smart Tank 15L Water Heater', brand: 'Hindware', price: 599900, mrp: 849900, badge: null, stock: 32, desc: '15L instant water heater with smart app control, BEE 5-star rated, Corrosion Shield.', img: 'https://images.pexels.com/photos/1457847/pexels-photo-1457847.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { cat: 'home-living', name: 'Pigeon Polypropylene Food Containers Set of 6', brand: 'Pigeon', price: 59900, mrp: 99900, badge: null, stock: 234, desc: 'Airtight modular food storage containers in 500ml capacity. BPA-free, microwave-safe.', img: 'https://images.pexels.com/photos/4397912/pexels-photo-4397912.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { cat: 'home-living', name: 'Butterfly Premium Wonder Wet Grinder 2L', brand: 'Butterfly', price: 299900, mrp: 449900, badge: 'Sale', stock: 34, desc: '2L table-top wet grinder with 150W motor, drum roller technology, and transparent lid.', img: 'https://images.pexels.com/photos/4397912/pexels-photo-4397912.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { cat: 'home-living', name: 'Spaces Organics Cotton Bath Towel 500 GSM', brand: 'Spaces', price: 69900, mrp: 129900, badge: null, stock: 178, desc: 'Oversized 500 GSM organic cotton bath towel. OEKO-TEX certified, quick-dry weave.', img: 'https://images.pexels.com/photos/1457847/pexels-photo-1457847.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { cat: 'home-living', name: 'Morphy Richards 2-Slice Pop-Up Toaster', brand: 'Morphy Richards', price: 149900, mrp: 199900, badge: null, stock: 89, desc: '2-slice pop-up toaster with 7 browning levels, mid-cycle cancel, crumb tray.', img: 'https://images.pexels.com/photos/4397912/pexels-photo-4397912.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { cat: 'home-living', name: 'Kuber Industries Fridge Organiser Set of 4', brand: 'Kuber', price: 49900, mrp: 99900, badge: 'Sale', stock: 234, desc: 'Set of 4 transparent refrigerator organizer bins with handles. BPA-free plastic.', img: 'https://images.pexels.com/photos/1457847/pexels-photo-1457847.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { cat: 'home-living', name: 'Prestige Svachh Induction Pressure Cooker 4.2L', brand: 'Prestige', price: 199900, mrp: 299900, badge: null, stock: 54, desc: '4.2L induction-compatible pressure cooker with deep-lid spill control and auto locking.', img: 'https://images.pexels.com/photos/4397912/pexels-photo-4397912.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { cat: 'home-living', name: 'Stanley Classic Vacuum Bottle 1.1L', brand: 'Stanley', price: 299900, mrp: 399900, badge: null, stock: 54, desc: 'Double-wall vacuum bottle keeps drinks hot 24hr, cold 24hr. BPA-free, dishwasher-safe.', img: 'https://images.pexels.com/photos/1346347/pexels-photo-1346347.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { cat: 'home-living', name: 'Noise Colorfit Grand 2 Smart Display Clock', brand: 'Noise', price: 149900, mrp: 249900, badge: 'New', stock: 56, desc: '5.5" HD color display smart clock with Alexa, weather, reminders, and ambient sensing.', img: 'https://images.pexels.com/photos/1457847/pexels-photo-1457847.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { cat: 'home-living', name: 'Godrej Edge Pro 621L Double Door Refrigerator', brand: 'Godrej', price: 5999900, mrp: 7499900, badge: null, stock: 8, desc: '621L frost-free double door refrigerator, 3-star energy rating, fresh zone, Nano Shield.', img: 'https://images.pexels.com/photos/1148955/pexels-photo-1148955.jpeg?auto=compress&cs=tinysrgb&w=400' },

  // ── BEAUTY & PERSONAL CARE (20) ───────────────────────────────────────
  { cat: 'beauty-personal-care', name: 'Lakme 9 to 5 Weightless Mousse Foundation', brand: 'Lakme', price: 59900, mrp: 79900, badge: 'Best Seller', stock: 312, desc: 'Weightless mousse foundation with SPF 30 and 24-hour coverage. Natural finish.', img: 'https://images.pexels.com/photos/2113855/pexels-photo-2113855.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { cat: 'beauty-personal-care', name: 'Mamaearth Vitamin C Face Serum 30ml', brand: 'Mamaearth', price: 59900, mrp: 99900, badge: null, stock: 445, desc: 'Vitamin C serum with turmeric for glowing skin. Reduces dark spots in 4 weeks.', img: 'https://images.pexels.com/photos/3737593/pexels-photo-3737593.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { cat: 'beauty-personal-care', name: 'Philips BT3231 Cordless Beard Trimmer', brand: 'Philips', price: 149900, mrp: 249900, badge: null, stock: 89, desc: 'Cordless beard trimmer with 20 built-in length settings and 90-min DuraPower runtime.', img: 'https://images.pexels.com/photos/3998429/pexels-photo-3998429.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { cat: 'beauty-personal-care', name: 'WOW Skin Science Apple Cider Vinegar Shampoo', brand: 'WOW', price: 39900, mrp: 59900, badge: null, stock: 567, desc: '300ml apple cider vinegar shampoo for scalp balance, frizz control, and healthy hair.', img: 'https://images.pexels.com/photos/3737593/pexels-photo-3737593.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { cat: 'beauty-personal-care', name: 'Forest Essentials Light Day Moisturiser', brand: 'Forest Essentials', price: 189900, mrp: 249900, badge: null, stock: 56, desc: 'Ayurvedic lightweight moisturiser with saffron, honey, and aloe vera for radiant skin.', img: 'https://images.pexels.com/photos/3737593/pexels-photo-3737593.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { cat: 'beauty-personal-care', name: 'Plum Goodbye Marks Pigmentation Serum', brand: 'Plum', price: 79900, mrp: 129900, badge: 'Sale', stock: 234, desc: '1% Alpha Arbutin + niacinamide serum to fade marks, dark spots, and even skin tone.', img: 'https://images.pexels.com/photos/3737593/pexels-photo-3737593.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { cat: 'beauty-personal-care', name: 'Dove Deeply Nourishing Body Wash 500ml', brand: 'Dove', price: 29900, mrp: 39900, badge: null, stock: 678, desc: 'Moisturising body wash with 1/4 moisturising cream, leaves skin soft and smooth.', img: 'https://images.pexels.com/photos/3737593/pexels-photo-3737593.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { cat: 'beauty-personal-care', name: 'Biotique Bio Honey Gel Foaming Face Wash 150ml', brand: 'Biotique', price: 19900, mrp: 29900, badge: null, stock: 456, desc: 'Ayurvedic foaming face wash with wild honey extract. Removes dirt and excess oil.', img: 'https://images.pexels.com/photos/3737593/pexels-photo-3737593.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { cat: 'beauty-personal-care', name: 'L\'Oreal Paris Revitalift Hyaluronic Acid Serum', brand: "L'Oreal Paris", price: 89900, mrp: 149900, badge: 'Sale', stock: 189, desc: '1.5% pure hyaluronic acid serum that plumps skin and reduces wrinkles in 1 week.', img: 'https://images.pexels.com/photos/3737593/pexels-photo-3737593.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { cat: 'beauty-personal-care', name: 'Gillette Mach3 Turbo Razor + 4 Cartridges', brand: 'Gillette', price: 69900, mrp: 99900, badge: null, stock: 345, desc: 'Triple-blade razor with anti-friction blades and pivoting head for a smooth, close shave.', img: 'https://images.pexels.com/photos/3998429/pexels-photo-3998429.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { cat: 'beauty-personal-care', name: 'Nykaa Cosmetics Matte To Last Lip Color', brand: 'Nykaa', price: 29900, mrp: 49900, badge: null, stock: 456, desc: 'Long-lasting matte liquid lipstick, 24 shades, non-drying formula with vitamin E.', img: 'https://images.pexels.com/photos/2113855/pexels-photo-2113855.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { cat: 'beauty-personal-care', name: 'mCaffeine Coffee Body Scrub 100g', brand: 'mCaffeine', price: 39900, mrp: 59900, badge: 'Best Seller', stock: 312, desc: 'Coffee exfoliating body scrub with coconut milk. Removes tan and dead skin cells.', img: 'https://images.pexels.com/photos/3737593/pexels-photo-3737593.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { cat: 'beauty-personal-care', name: 'Khadi Natural Neem Tulsi Face Wash 210ml', brand: 'Khadi Natural', price: 19900, mrp: 34900, badge: null, stock: 234, desc: 'Neem and tulsi herbal face wash for acne-prone skin. Soap-free, pH-balanced formula.', img: 'https://images.pexels.com/photos/3737593/pexels-photo-3737593.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { cat: 'beauty-personal-care', name: 'Sugar Cosmetics Matte Lipstick Transferproof', brand: 'SUGAR', price: 59900, mrp: 89900, badge: null, stock: 178, desc: 'Transfer-proof matte lipstick with 10-hour wear, 60+ shades, vitamin E-enriched.', img: 'https://images.pexels.com/photos/2113855/pexels-photo-2113855.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { cat: 'beauty-personal-care', name: 'Pantene Pro-V Total Damage Care Shampoo 650ml', brand: 'Pantene', price: 39900, mrp: 59900, badge: null, stock: 456, desc: 'Anti-damage shampoo with Pro-Vitamin formula. Strengthens hair and reduces breakage.', img: 'https://images.pexels.com/photos/3737593/pexels-photo-3737593.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { cat: 'beauty-personal-care', name: 'Olay Regenerist Micro-Sculpting Cream 50g', brand: 'Olay', price: 99900, mrp: 149900, badge: 'Sale', stock: 134, desc: 'Anti-aging cream with amino-peptide complex, hyaluronic acid. Visibly firms skin in 28 days.', img: 'https://images.pexels.com/photos/3737593/pexels-photo-3737593.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { cat: 'beauty-personal-care', name: 'Veet Sensitive Ready-to-Use Wax Strips', brand: 'Veet', price: 29900, mrp: 39900, badge: null, stock: 345, desc: '20 ready-to-use wax strips for sensitive skin with aloe vera and vitamin E.', img: 'https://images.pexels.com/photos/3737593/pexels-photo-3737593.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { cat: 'beauty-personal-care', name: 'Ponds Super Light Gel SPF 15 Moisturiser 150g', brand: 'Ponds', price: 29900, mrp: 39900, badge: 'Best Seller', stock: 567, desc: 'Oil-free moisturiser with hyaluron, SPF 15. 2x skin glow in 4 weeks. Non-greasy.', img: 'https://images.pexels.com/photos/3737593/pexels-photo-3737593.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { cat: 'beauty-personal-care', name: 'Nivea Men Deep Impact Deodorant 150ml', brand: 'Nivea', price: 24900, mrp: 34900, badge: null, stock: 456, desc: '48-hour protection deodorant with Deep Impact technology. Alcohol-free, fresh scent.', img: 'https://images.pexels.com/photos/3998429/pexels-photo-3998429.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { cat: 'beauty-personal-care', name: 'Wow Skin Science Onion Hair Mask 200ml', brand: 'WOW', price: 59900, mrp: 99900, badge: null, stock: 123, desc: 'Overnight hair mask with onion, biotin, and keratin. Reduces hair fall, adds shine.', img: 'https://images.pexels.com/photos/3737593/pexels-photo-3737593.jpeg?auto=compress&cs=tinysrgb&w=400' },

  // ── SPORTS & OUTDOORS (20) ────────────────────────────────────────────
  { cat: 'sports-outdoors', name: 'Nivia Storm Match Football Size 5', brand: 'Nivia', price: 79900, mrp: 119900, badge: null, stock: 145, desc: 'FIFA-standard match football with 32-panel machine-stitched design. For all surfaces.', img: 'https://images.pexels.com/photos/46798/the-ball-stadion-football-the-pitch-46798.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { cat: 'sports-outdoors', name: 'Cosco Double Star Badminton Set', brand: 'Cosco', price: 149900, mrp: 229900, badge: 'Best Seller', stock: 78, desc: 'Complete badminton set with 2 rackets, 3 shuttlecocks, and carry bag.', img: 'https://images.pexels.com/photos/3660204/pexels-photo-3660204.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { cat: 'sports-outdoors', name: 'Strauss Anti-Slip Yoga Mat 6mm', brand: 'Strauss', price: 59900, mrp: 99900, badge: null, stock: 234, desc: '6mm thick EVA foam yoga mat with anti-slip surface and carrying strap.', img: 'https://images.pexels.com/photos/4056723/pexels-photo-4056723.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { cat: 'sports-outdoors', name: 'Yonex Nanoray 7000I Badminton Racket', brand: 'Yonex', price: 849900, mrp: 1099900, badge: null, stock: 23, desc: 'Isometric head shape graphite frame racket for advanced players. Pre-strung at 24lbs.', img: 'https://images.pexels.com/photos/3660204/pexels-photo-3660204.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { cat: 'sports-outdoors', name: 'Fitness Mantra Leather Gym Gloves', brand: 'Fitness Mantra', price: 39900, mrp: 69900, badge: 'Sale', stock: 189, desc: 'Anti-slip gym gloves with wrist support and breathable mesh back. Available S-XL.', img: 'https://images.pexels.com/photos/841130/pexels-photo-841130.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { cat: 'sports-outdoors', name: 'Wildcraft Adult Trek Hiking Pole Pair', brand: 'Wildcraft', price: 199900, mrp: 299900, badge: null, stock: 56, desc: 'Aluminium anti-shock trekking poles with wrist straps and rubber tip protectors.', img: 'https://images.pexels.com/photos/417173/pexels-photo-417173.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { cat: 'sports-outdoors', name: 'ProFit Resistance Bands Set of 5', brand: 'ProFit', price: 59900, mrp: 99900, badge: 'Best Seller', stock: 312, desc: 'Latex resistance bands in 5 resistance levels (5-45 lbs), with door anchor and handles.', img: 'https://images.pexels.com/photos/4056723/pexels-photo-4056723.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { cat: 'sports-outdoors', name: 'Vector X 5 kg Rubber Dumbbell Pair', brand: 'Vector X', price: 149900, mrp: 199900, badge: null, stock: 123, desc: '5kg rubber-coated dumbbell pair with chrome handles. Colour-coded weight identification.', img: 'https://images.pexels.com/photos/841130/pexels-photo-841130.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { cat: 'sports-outdoors', name: 'Nivia Encounter Basketball Size 7', brand: 'Nivia', price: 89900, mrp: 149900, badge: null, stock: 97, desc: 'Rubber basketball for indoor/outdoor use, size 7 official. Deep channel design for grip.', img: 'https://images.pexels.com/photos/46798/the-ball-stadion-football-the-pitch-46798.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { cat: 'sports-outdoors', name: 'SG Blaze Cricket Batting Gloves Junior', brand: 'SG', price: 49900, mrp: 89900, badge: null, stock: 145, desc: 'Junior cricket batting gloves with PVC leather palm, junior size, right-hand.', img: 'https://images.pexels.com/photos/3660204/pexels-photo-3660204.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { cat: 'sports-outdoors', name: 'Strauss Speed Jump Rope Steel Bearing', brand: 'Strauss', price: 24900, mrp: 49900, badge: null, stock: 456, desc: 'Speed jump rope with steel ball bearings, anti-slip foam handles, adjustable cable length.', img: 'https://images.pexels.com/photos/4056723/pexels-photo-4056723.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { cat: 'sports-outdoors', name: 'RXN Whey Protein 2kg Chocolate', brand: 'RXN', price: 1299900, mrp: 1699900, badge: 'Sale', stock: 34, desc: '24g protein per serving, whey concentrate + isolate blend, 2kg chocolate flavour.', img: 'https://images.pexels.com/photos/841130/pexels-photo-841130.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { cat: 'sports-outdoors', name: 'Wildcraft Featherlight Rain Jacket Men', brand: 'Wildcraft', price: 299900, mrp: 499900, badge: null, stock: 54, desc: 'Packable rain jacket with DWR coating, storm hood, and 2 zipped hand pockets.', img: 'https://images.pexels.com/photos/417173/pexels-photo-417173.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { cat: 'sports-outdoors', name: 'Cosco 2.5kg Rubber Weight Plates Pair', brand: 'Cosco', price: 79900, mrp: 129900, badge: null, stock: 178, desc: '2.5kg rubber-coated 25mm standard weight plates pair for home gym use.', img: 'https://images.pexels.com/photos/841130/pexels-photo-841130.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { cat: 'sports-outdoors', name: 'Nivia Force 2 Cricket Bat English Willow', brand: 'Nivia', price: 999900, mrp: 1399900, badge: null, stock: 18, desc: 'Full-size English willow cricket bat with cane handle, traditional blade shape.', img: 'https://images.pexels.com/photos/3660204/pexels-photo-3660204.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { cat: 'sports-outdoors', name: 'FitTrend Acupressure Foot Roller', brand: 'FitTrend', price: 24900, mrp: 49900, badge: null, stock: 345, desc: 'Wooden acupressure foot massager roller for pain relief and relaxation. No electricity.', img: 'https://images.pexels.com/photos/4056723/pexels-photo-4056723.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { cat: 'sports-outdoors', name: 'Vector X Ankle Support Pair', brand: 'Vector X', price: 29900, mrp: 59900, badge: null, stock: 234, desc: 'Neoprene ankle braces with velcro straps for sprain prevention. Sizes S/M/L/XL.', img: 'https://images.pexels.com/photos/841130/pexels-photo-841130.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { cat: 'sports-outdoors', name: 'ProFit Foam Roller 15x45cm', brand: 'ProFit', price: 59900, mrp: 99900, badge: null, stock: 123, desc: 'High-density EVA foam roller for muscle recovery and deep tissue massage. 15x45cm.', img: 'https://images.pexels.com/photos/4056723/pexels-photo-4056723.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { cat: 'sports-outdoors', name: 'Spinway Table Tennis Bat Pre-Assembled', brand: 'Spinway', price: 199900, mrp: 299900, badge: null, stock: 89, desc: 'All-round pre-assembled TT bat with 1.8mm rubber on both sides, 85g weight.', img: 'https://images.pexels.com/photos/3660204/pexels-photo-3660204.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { cat: 'sports-outdoors', name: 'Sporto Swim Goggles Anti-Fog UV', brand: 'Sporto', price: 39900, mrp: 69900, badge: null, stock: 189, desc: 'Anti-fog silicone swimming goggles with adjustable strap, UV protection, case included.', img: 'https://images.pexels.com/photos/417173/pexels-photo-417173.jpeg?auto=compress&cs=tinysrgb&w=400' },

  // ── BOOKS & STATIONERY (17) ───────────────────────────────────────────
  { cat: 'books-stationery', name: 'Atomic Habits by James Clear', brand: 'Penguin Random House', price: 39900, mrp: 59900, badge: 'Best Seller', stock: 456, desc: 'An easy and proven way to build good habits and break bad ones. 320 pages, paperback.', img: 'https://images.pexels.com/photos/256450/pexels-photo-256450.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { cat: 'books-stationery', name: 'The Alchemist by Paulo Coelho', brand: 'HarperCollins', price: 29900, mrp: 49900, badge: null, stock: 312, desc: 'A fable about following your dream. Over 65 million copies sold worldwide. Paperback.', img: 'https://images.pexels.com/photos/256450/pexels-photo-256450.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { cat: 'books-stationery', name: 'Pilot V7 Hi-Tecpoint Pen Pack of 10', brand: 'Pilot', price: 24900, mrp: 35000, badge: null, stock: 678, desc: 'Liquid ink rollerball pens with fine 0.7mm tip. Smooth, consistent writing.', img: 'https://images.pexels.com/photos/159711/books-bookstore-book-reading-159711.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { cat: 'books-stationery', name: 'Classmate 6-Subject Spiral Notebook A4', brand: 'Classmate', price: 14900, mrp: 19900, badge: null, stock: 890, desc: 'A4 ruled notebook, 300 pages. Spiral-bound with soft cover and elastic closure.', img: 'https://images.pexels.com/photos/159711/books-bookstore-book-reading-159711.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { cat: 'books-stationery', name: 'Rich Dad Poor Dad by Robert Kiyosaki', brand: 'Plata Publishing', price: 29900, mrp: 49900, badge: 'Best Seller', stock: 345, desc: "The world's #1 personal finance book. 25th anniversary edition, paperback.", img: 'https://images.pexels.com/photos/256450/pexels-photo-256450.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { cat: 'books-stationery', name: 'The Psychology of Money by Morgan Housel', brand: 'Harriman House', price: 39900, mrp: 59900, badge: null, stock: 234, desc: 'Timeless lessons on wealth, greed, and happiness. 20 short stories, 256 pages, paperback.', img: 'https://images.pexels.com/photos/256450/pexels-photo-256450.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { cat: 'books-stationery', name: 'Sapiens by Yuval Noah Harari', brand: 'Vintage Books', price: 49900, mrp: 79900, badge: null, stock: 189, desc: 'A brief history of humankind. Paperback, 464 pages.', img: 'https://images.pexels.com/photos/256450/pexels-photo-256450.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { cat: 'books-stationery', name: 'Camlin Kokuyo Colouring Pencil Set 24', brand: 'Camlin', price: 19900, mrp: 29900, badge: null, stock: 456, desc: '24 round colouring pencils in assorted shades, smooth pigment, pre-sharpened.', img: 'https://images.pexels.com/photos/159711/books-bookstore-book-reading-159711.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { cat: 'books-stationery', name: 'Artline 200 Fine Liner Pen Set of 8', brand: 'Artline', price: 39900, mrp: 59900, badge: null, stock: 234, desc: '8 fine-line pens in assorted colours with 0.4mm tips for sketching and writing.', img: 'https://images.pexels.com/photos/159711/books-bookstore-book-reading-159711.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { cat: 'books-stationery', name: 'Faber-Castell A4 Sketchbook 100 Sheets', brand: 'Faber-Castell', price: 24900, mrp: 39900, badge: null, stock: 178, desc: 'A4 110 GSM acid-free spiral sketchbook, 100 sheets, suitable for pencil, pen, light wash.', img: 'https://images.pexels.com/photos/159711/books-bookstore-book-reading-159711.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { cat: 'books-stationery', name: 'Staedtler Mars Plastic Eraser Pack of 5', brand: 'Staedtler', price: 14900, mrp: 24900, badge: null, stock: 567, desc: 'Vinyl plastic erasers with clean erasing, no paper damage. Pack of 5.', img: 'https://images.pexels.com/photos/159711/books-bookstore-book-reading-159711.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { cat: 'books-stationery', name: 'The Subtle Art of Not Giving a F by Mark Manson', brand: 'HarperCollins', price: 34900, mrp: 54900, badge: null, stock: 234, desc: 'A counterintuitive approach to living a good life. Paperback, 224 pages.', img: 'https://images.pexels.com/photos/256450/pexels-photo-256450.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { cat: 'books-stationery', name: 'Apsara Platinum Extra Dark Pencils Pack 10', brand: 'Apsara', price: 4900, mrp: 9900, badge: null, stock: 890, desc: 'Extra dark graphite pencils for smooth writing and sketching. HB grade, pack of 10.', img: 'https://images.pexels.com/photos/159711/books-bookstore-book-reading-159711.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { cat: 'books-stationery', name: 'Nataraj 621 Fountain Pen Blue', brand: 'Nataraj', price: 9900, mrp: 19900, badge: null, stock: 345, desc: 'Entry-level fountain pen with iridium tip nib, cartridge included. Ergonomic grip.', img: 'https://images.pexels.com/photos/159711/books-bookstore-book-reading-159711.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { cat: 'books-stationery', name: 'Orient A4 80 GSM Copier Paper 500 Sheets', brand: 'Orient', price: 29900, mrp: 39900, badge: null, stock: 456, desc: 'A4 bright white 80 GSM copier paper, 500 sheets, suitable for all inkjet and laser printers.', img: 'https://images.pexels.com/photos/159711/books-bookstore-book-reading-159711.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { cat: 'books-stationery', name: 'Rotomac Gripper Ball Pen Pack of 20 Blue', brand: 'Rotomac', price: 14900, mrp: 24900, badge: null, stock: 678, desc: 'Comfortable rubber-grip ballpoint pens in blue ink. 1mm tip, smooth flow, refillable.', img: 'https://images.pexels.com/photos/159711/books-bookstore-book-reading-159711.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { cat: 'books-stationery', name: 'Kokuyo Campus Loose Leaf A4 100 Sheets', brand: 'Classmate', price: 19900, mrp: 29900, badge: null, stock: 456, desc: 'A4 ruled loose-leaf refill paper for ring binders. 70 GSM, 100 sheets.', img: 'https://images.pexels.com/photos/159711/books-bookstore-book-reading-159711.jpeg?auto=compress&cs=tinysrgb&w=400' },

  // ── TOYS & GAMES (10) ────────────────────────────────────────────────
  { cat: 'toys-games', name: 'LEGO Classic Creative Bricks Box 484pcs', brand: 'LEGO', price: 399900, mrp: 499900, badge: null, stock: 67, desc: 'Classic LEGO building set with 484 bricks in 33 different colors. Suitable for ages 4+.', img: 'https://images.pexels.com/photos/298825/pexels-photo-298825.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { cat: 'toys-games', name: 'Funskool Monopoly India Board Game', brand: 'Funskool', price: 99900, mrp: 149900, badge: 'Best Seller', stock: 145, desc: 'Classic Monopoly board game with Indian edition streets and properties. 2-6 players.', img: 'https://images.pexels.com/photos/278918/pexels-photo-278918.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { cat: 'toys-games', name: 'Hot Wheels 20-Car Collector Gift Pack', brand: 'Hot Wheels', price: 119900, mrp: 179900, badge: null, stock: 234, desc: '20 collectible die-cast metal cars in 1:64 scale. Suitable for ages 3 and above.', img: 'https://images.pexels.com/photos/298825/pexels-photo-298825.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { cat: 'toys-games', name: "Rubik's Cube 3x3 Original Speed Cube", brand: "Rubik's", price: 59900, mrp: 89900, badge: null, stock: 345, desc: "Original 3x3 speed cube with smooth rotation mechanism. Multiple color schemes available.", img: 'https://images.pexels.com/photos/278918/pexels-photo-278918.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { cat: 'toys-games', name: 'Hasbro Scrabble Classic Board Game', brand: 'Hasbro', price: 149900, mrp: 199900, badge: null, stock: 112, desc: 'Classic Scrabble word game with 100 premium letter tiles, board, racks, and drawstring bag.', img: 'https://images.pexels.com/photos/278918/pexels-photo-278918.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { cat: 'toys-games', name: 'Funskool Ludo and Snakes Ladders Board Game', brand: 'Funskool', price: 29900, mrp: 59900, badge: null, stock: 456, desc: '2-in-1 classic board game set, Ludo + Snakes and Ladders. For 2-4 players, ages 4+.', img: 'https://images.pexels.com/photos/278918/pexels-photo-278918.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { cat: 'toys-games', name: 'Mattel UNO Card Game Classic', brand: 'Mattel', price: 29900, mrp: 59900, badge: 'Best Seller', stock: 567, desc: 'Classic UNO card game with 108 cards, action cards, and official rules. Ages 7+.', img: 'https://images.pexels.com/photos/278918/pexels-photo-278918.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { cat: 'toys-games', name: 'Skillmatics Spot It Card Game', brand: 'Skillmatics', price: 49900, mrp: 89900, badge: null, stock: 178, desc: 'Fast-paced observation card game, 55 cards, 6 mini-games. 2-8 players, ages 7+.', img: 'https://images.pexels.com/photos/278918/pexels-photo-278918.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { cat: 'toys-games', name: 'Toy Hub Wooden Jenga Tower 54 Blocks', brand: 'Toy Hub', price: 39900, mrp: 79900, badge: null, stock: 234, desc: '54-block wooden stacking tower game. Smooth finished blocks, travel bag included. Ages 6+.', img: 'https://images.pexels.com/photos/298825/pexels-photo-298825.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { cat: 'toys-games', name: 'Barbie Fashionista Doll Assorted', brand: 'Barbie', price: 59900, mrp: 99900, badge: null, stock: 189, desc: 'Barbie Fashionista doll with trendy outfit, accessories, and rooted hair. Ages 3+.', img: 'https://images.pexels.com/photos/298825/pexels-photo-298825.jpeg?auto=compress&cs=tinysrgb&w=400' },
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
      { name: 'Electronics',            slug: 'electronics',          icon: '💻' },
      { name: 'Fashion',                slug: 'fashion',              icon: '👗' },
      { name: 'Home & Living',          slug: 'home-living',          icon: '🏠' },
      { name: 'Beauty & Personal Care', slug: 'beauty-personal-care', icon: '💄' },
      { name: 'Sports & Outdoors',      slug: 'sports-outdoors',      icon: '⚽' },
      { name: 'Books & Stationery',     slug: 'books-stationery',     icon: '📚' },
      { name: 'Toys & Games',           slug: 'toys-games',           icon: '🧸' },
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

      // Real product image (Pexels CC-licensed)
      await client.query(
        'INSERT INTO product_images (id, product_id, url, alt_text, sort_order) VALUES ($1, $2, $3, $4, 0)',
        [uuidv4(), pid, p.img, p.name]
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
    console.log(`✅ ${productCount} products seeded with real images, variants, and inventory movements`);

    // ── COUPONS ──
    await client.query(
      `INSERT INTO coupons (id, code, type, value_paise, min_order_paise, max_discount_paise, usage_limit, per_user_limit, is_active)
       VALUES ($1, 'WELCOME10', 'percent', 1000, 50000, 50000, 1000, 1, true)`,
      [uuidv4()]
    );
    await client.query(
      `INSERT INTO coupons (id, code, type, value_paise, min_order_paise, max_discount_paise, usage_limit, per_user_limit, is_active)
       VALUES ($1, 'FLAT50', 'flat', 5000, 29900, 5000, 500, 2, true)`,
      [uuidv4()]
    );
    console.log('✅ Coupons WELCOME10 (10% off, max ₹500) and FLAT50 (₹50 flat) seeded');

    await client.query('COMMIT');
    console.log('\n🎉 Seed completed successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Demo credentials:');
    console.log('  Admin:    admin@shopnest.com   / Admin@123!');
    console.log('  Customer: customer1@shopnest.com / Customer@123!');
    console.log(`  Products: ${productCount} across 7 categories`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
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

