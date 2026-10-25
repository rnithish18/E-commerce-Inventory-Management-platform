const fs = require('fs');
const path = require('path');

const outDir = path.join(__dirname, '..', 'frontend', 'public', 'products');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// Helper to slugify
function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const products = [
  // Electronics
  { name: 'Noise ColorFit Pro 5 Smart Watch', cat: 'Electronics', color: '#0ea5e9', icon: 'smartwatch' },
  { name: 'Sony WH-1000XM5 Wireless Headphones', cat: 'Electronics', color: '#f97316', icon: 'headphones' },
  { name: 'Apple iPhone 15 128GB Blue', cat: 'Electronics', color: '#38bdf8', icon: 'smartphone' },
  { name: 'Samsung Galaxy S24 Ultra', cat: 'Electronics', color: '#6366f1', icon: 'smartphone' },
  { name: 'boAt Rockerz 550 Bluetooth Headphones', cat: 'Electronics', color: '#ef4444', icon: 'headphones' },
  { name: 'Realme Buds Air 5 Pro TWS Earbuds', cat: 'Electronics', color: '#eab308', icon: 'earbuds' },
  { name: 'HP 15 Laptop Intel Core i5 12th Gen', cat: 'Electronics', color: '#06b6d4', icon: 'laptop' },
  { name: 'Canon EOS R50 Mirrorless Camera', cat: 'Electronics', color: '#10b981', icon: 'camera' },
  { name: 'Logitech MX Master 3S Wireless Mouse', cat: 'Electronics', color: '#8b5cf6', icon: 'mouse' },
  { name: 'JBL Flip 6 Portable Bluetooth Speaker', cat: 'Electronics', color: '#f43f5e', icon: 'speaker' },

  // Fashion
  { name: 'Nike Air Force 1 Low White Sneakers', cat: 'Fashion', color: '#f8fafc', icon: 'sneakers' },
  { name: "Levi's 511 Slim Fit Stretch Jeans", cat: 'Fashion', color: '#2563eb', icon: 'jeans' },
  { name: 'Adidas Originals Classic Track Jacket', cat: 'Fashion', color: '#3b82f6', icon: 'jacket' },
  { name: 'Allen Solly Formal Shirt Regular Fit', cat: 'Fashion', color: '#60a5fa', icon: 'shirt' },
  { name: 'Fabindia Cotton Kurta for Men', cat: 'Fashion', color: '#d97706', icon: 'shirt' },
  { name: 'H&M Floral Midi Dress', cat: 'Fashion', color: '#ec4899', icon: 'dress' },
  { name: 'Woodland Waterproof Hiking Boots', cat: 'Fashion', color: '#b45309', icon: 'boots' },
  { name: 'Peter England Classic Laptop Backpack', cat: 'Fashion', color: '#475569', icon: 'backpack' },

  // Home & Living
  { name: 'Prestige Iris 750W Mixer Grinder', cat: 'Home & Living', color: '#dc2626', icon: 'appliance' },
  { name: 'Milton Thermosteel Flask 1 Litre', cat: 'Home & Living', color: '#94a3b8', icon: 'flask' },
  { name: 'Amazon Basics King Bedsheet Set 1000 TC', cat: 'Home & Living', color: '#a855f7', icon: 'home' },
  { name: 'Pigeon Healthifry Digital Air Fryer 4L', cat: 'Home & Living', color: '#ea580c', icon: 'appliance' },
  { name: 'Nilkamal Plastic Chair Set of 4', cat: 'Home & Living', color: '#0284c7', icon: 'furniture' },
  { name: 'Lifelong RO Water Purifier 10L', cat: 'Home & Living', color: '#0ea5e9', icon: 'appliance' },

  // Beauty & Personal Care
  { name: 'Lakme 9 to 5 Weightless Mousse Foundation', cat: 'Beauty', color: '#f472b6', icon: 'cosmetics' },
  { name: 'Mamaearth Vitamin C Face Serum 30ml', cat: 'Beauty', color: '#f59e0b', icon: 'bottle' },
  { name: 'Philips BT3231 Cordless Beard Trimmer', cat: 'Beauty', color: '#334155', icon: 'shaver' },
  { name: 'WOW Skin Science Apple Cider Vinegar Shampoo', cat: 'Beauty', color: '#84cc16', icon: 'bottle' },
  { name: 'Forest Essentials Light Day Moisturiser', cat: 'Beauty', color: '#fbbf24', icon: 'cosmetics' },

  // Sports & Outdoors
  { name: 'Nivia Storm Match Football Size 5', cat: 'Sports', color: '#ffffff', icon: 'football' },
  { name: 'Cosco Double Star Badminton Set', cat: 'Sports', color: '#10b981', icon: 'badminton' },
  { name: 'Strauss Anti-Slip Yoga Mat 6mm', cat: 'Sports', color: '#8b5cf6', icon: 'mat' },
  { name: 'Yonex Nanoray 7000I Badminton Racket', cat: 'Sports', color: '#ef4444', icon: 'badminton' },
  { name: 'Fitness Mantra Leather Gym Gloves', cat: 'Sports', color: '#1e293b', icon: 'gloves' },

  // Books & Stationery
  { name: 'Atomic Habits by James Clear', cat: 'Books', color: '#f59e0b', icon: 'book' },
  { name: 'The Alchemist by Paulo Coelho', cat: 'Books', color: '#3b82f6', icon: 'book' },
  { name: 'Pilot V7 Hi-Tecpoint Pen Pack of 10', cat: 'Stationery', color: '#2563eb', icon: 'pen' },
  { name: 'Classmate 6-Subject Spiral Notebook', cat: 'Stationery', color: '#10b981', icon: 'notebook' },

  // Toys & Games
  { name: 'LEGO Classic Creative Bricks Box 484pcs', cat: 'Toys', color: '#eab308', icon: 'lego' },
  { name: 'Funskool Monopoly India Board Game', cat: 'Toys', color: '#ef4444', icon: 'game' },
  { name: 'Hot Wheels 20-Car Collector Gift Pack', cat: 'Toys', color: '#f97316', icon: 'car' },
  { name: "Rubik's Cube 3x3 Original Speed Cube", cat: 'Toys', color: '#3b82f6', icon: 'cube' },
];

function getIconSvg(type, color) {
  switch (type) {
    case 'headphones':
      return `
        <path d="M120 230 C120 150 280 150 280 230" fill="none" stroke="${color}" stroke-width="16" stroke-linecap="round"/>
        <rect x="90" y="210" width="40" height="70" rx="20" fill="${color}" filter="url(#glow)"/>
        <rect x="270" y="210" width="40" height="70" rx="20" fill="${color}" filter="url(#glow)"/>
      `;
    case 'smartwatch':
      return `
        <rect x="170" y="80" width="60" height="240" rx="12" fill="#334155"/>
        <rect x="140" y="140" width="120" height="120" rx="28" fill="#1e293b" stroke="${color}" stroke-width="6"/>
        <circle cx="200" cy="200" r="40" fill="none" stroke="${color}" stroke-width="8" stroke-dasharray="180 60"/>
        <text x="200" y="206" fill="#ffffff" font-size="20" font-weight="bold" font-family="sans-serif" text-anchor="middle">10:45</text>
      `;
    case 'smartphone':
      return `
        <rect x="135" y="90" width="130" height="220" rx="24" fill="#0f172a" stroke="${color}" stroke-width="6"/>
        <rect x="145" y="105" width="110" height="190" rx="16" fill="#1e293b"/>
        <circle cx="200" cy="115" r="5" fill="#38bdf8"/>
        <rect x="160" y="170" width="80" height="60" rx="8" fill="${color}" opacity="0.3"/>
      `;
    case 'laptop':
      return `
        <rect x="110" y="130" width="180" height="120" rx="10" fill="#0f172a" stroke="${color}" stroke-width="5"/>
        <polygon points="80,260 320,260 300,275 100,275" fill="#334155"/>
        <circle cx="200" cy="190" r="24" fill="${color}" opacity="0.5"/>
      `;
    case 'sneakers':
      return `
        <path d="M100 230 C120 180 180 160 250 170 C280 175 300 210 290 240 C270 260 130 260 100 230 Z" fill="#ffffff" stroke="#94a3b8" stroke-width="5"/>
        <path d="M140 210 Q 200 170 260 210" fill="none" stroke="${color}" stroke-width="8" stroke-linecap="round"/>
        <rect x="90" y="245" width="210" height="15" rx="6" fill="#cbd5e1"/>
      `;
    case 'speaker':
      return `
        <rect x="130" y="160" width="140" height="80" rx="40" fill="#1e293b" stroke="${color}" stroke-width="6"/>
        <circle cx="160" cy="200" r="22" fill="${color}" opacity="0.8"/>
        <circle cx="240" cy="200" r="22" fill="${color}" opacity="0.8"/>
      `;
    case 'camera':
      return `
        <rect x="110" y="140" width="180" height="120" rx="16" fill="#1e293b" stroke="${color}" stroke-width="6"/>
        <circle cx="200" cy="200" r="45" fill="#0f172a" stroke="${color}" stroke-width="8"/>
        <circle cx="200" cy="200" r="20" fill="#38bdf8"/>
        <rect x="140" y="120" width="40" height="20" rx="4" fill="#334155"/>
      `;
    case 'book':
    case 'notebook':
      return `
        <rect x="130" y="100" width="140" height="200" rx="8" fill="#1e293b" stroke="${color}" stroke-width="6"/>
        <rect x="150" y="130" width="100" height="20" rx="4" fill="${color}"/>
        <line x1="150" y1="180" x2="230" y2="180" stroke="#94a3b8" stroke-width="4"/>
        <line x1="150" y1="205" x2="210" y2="205" stroke="#94a3b8" stroke-width="4"/>
      `;
    default:
      return `
        <circle cx="200" cy="200" r="70" fill="#1e293b" stroke="${color}" stroke-width="6"/>
        <path d="M170 200 L230 200 M200 170 L200 230" stroke="${color}" stroke-width="8" stroke-linecap="round"/>
      `;
  }
}

function generateSvg(p) {
  const iconMarkup = getIconSvg(p.icon, p.color);
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
  <defs>
    <radialGradient id="bgGrad" cx="50%" cy="50%" r="70%">
      <stop offset="0%" stop-color="#1e293b"/>
      <stop offset="100%" stop-color="#0b1120"/>
    </radialGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="4" stdDeviation="12" flood-color="${p.color}" flood-opacity="0.35"/>
    </filter>
  </defs>

  <!-- Background Card -->
  <rect width="400" height="400" rx="24" fill="url(#bgGrad)"/>
  <circle cx="200" cy="200" r="140" fill="${p.color}" opacity="0.06"/>
  <circle cx="200" cy="200" r="100" fill="${p.color}" opacity="0.08"/>

  <!-- Product Silhouette / Art -->
  <g filter="url(#glow)">
    ${iconMarkup}
  </g>

  <!-- Category & Label Ribbon -->
  <rect x="24" y="24" width="100" height="26" rx="13" fill="#0f172a" stroke="${p.color}" stroke-width="1.5"/>
  <text x="74" y="41" fill="#f8fafc" font-size="11" font-weight="bold" font-family="system-ui, sans-serif" text-anchor="middle" letter-spacing="0.5">${p.cat}</text>

  <!-- Product Name Preview at bottom -->
  <text x="200" y="360" fill="#f8fafc" font-size="13" font-weight="bold" font-family="system-ui, sans-serif" text-anchor="middle">
    ${p.name.length > 32 ? p.name.substring(0, 30) + '…' : p.name}
  </text>
</svg>`;
}

// Generate all products
let count = 0;
for (const p of products) {
  const slug = slugify(p.name);
  const filePath = path.join(outDir, `${slug}.svg`);
  fs.writeFileSync(filePath, generateSvg(p), 'utf8');
  count++;
}

// Generate hero headphones artwork
const heroSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400" width="600" height="400">
  <defs>
    <radialGradient id="heroGlow" cx="60%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#f97316" stop-opacity="0.4"/>
      <stop offset="100%" stop-color="#f97316" stop-opacity="0"/>
    </radialGradient>
    <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="12" stdDeviation="20" flood-color="#000000" flood-opacity="0.6"/>
    </filter>
  </defs>

  <!-- Background Atmosphere -->
  <rect width="600" height="400" fill="transparent"/>
  <circle cx="340" cy="200" r="180" fill="url(#heroGlow)"/>

  <!-- Sleek Wireless Headband -->
  <g filter="url(#softShadow)" transform="translate(40, -10)">
    <path d="M 200 240 C 200 110 400 110 400 240" fill="none" stroke="#1e293b" stroke-width="26" stroke-linecap="round"/>
    <path d="M 215 220 C 215 130 385 130 385 220" fill="none" stroke="#f97316" stroke-width="4" stroke-linecap="round" opacity="0.8"/>

    <!-- Ear Cups -->
    <ellipse cx="190" cy="245" rx="35" ry="55" fill="#0f172a" stroke="#334155" stroke-width="5"/>
    <ellipse cx="190" cy="245" rx="24" ry="40" fill="#1e293b"/>
    <circle cx="190" cy="245" r="10" fill="#f97316"/>

    <ellipse cx="410" cy="245" rx="35" ry="55" fill="#0f172a" stroke="#334155" stroke-width="5"/>
    <ellipse cx="410" cy="245" rx="24" ry="40" fill="#1e293b"/>
    <circle cx="410" cy="245" r="10" fill="#f97316"/>
  </g>

  <!-- Sound Waves Accent -->
  <path d="M 120 230 Q 100 245 120 260" fill="none" stroke="#f97316" stroke-width="4" stroke-linecap="round" opacity="0.6"/>
  <path d="M 100 215 Q 70 245 100 275" fill="none" stroke="#f97316" stroke-width="4" stroke-linecap="round" opacity="0.3"/>
  <path d="M 480 230 Q 500 245 480 260" fill="none" stroke="#f97316" stroke-width="4" stroke-linecap="round" opacity="0.6"/>
  <path d="M 500 215 Q 530 245 500 275" fill="none" stroke="#f97316" stroke-width="4" stroke-linecap="round" opacity="0.3"/>
</svg>`;

fs.writeFileSync(path.join(outDir, 'hero-headphones.svg'), heroSvg, 'utf8');

console.log(`Generated ${count} product SVG images and hero banner artwork in ${outDir}`);
