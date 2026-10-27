const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:4173';
const OUT_DIR = path.join(__dirname, '../docs/lighthouse');

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

const TARGETS = [
  { name: 'home-desktop', url: `${BASE_URL}/`, preset: 'desktop' },
  { name: 'home-mobile', url: `${BASE_URL}/`, preset: 'mobile' },
  { name: 'catalog-desktop', url: `${BASE_URL}/shop`, preset: 'desktop' },
  { name: 'catalog-mobile', url: `${BASE_URL}/shop`, preset: 'mobile' },
  { name: 'product-desktop', url: `${BASE_URL}/product/apple-iphone-15-128gb-blue`, preset: 'desktop' },
  { name: 'product-mobile', url: `${BASE_URL}/product/apple-iphone-15-128gb-blue`, preset: 'mobile' }
];

const results = [];

for (const target of TARGETS) {
  console.log(`Running Lighthouse for ${target.name} (${target.preset}) on ${target.url}...`);
  const outPath = path.join(OUT_DIR, `${target.name}.json`);
  const presetFlag = target.preset === 'desktop' ? '--preset=desktop' : '';
  const cmd = `npx lighthouse ${target.url} --chrome-flags="--headless=new --no-sandbox" --output=json --output-path="${outPath}" ${presetFlag} --only-categories=performance,accessibility --quiet`;

  try {
    execSync(cmd, { stdio: 'inherit', env: process.env });
    const data = JSON.parse(fs.readFileSync(outPath, 'utf8'));
    const perf = Math.round(data.categories.performance.score * 100);
    const a11y = Math.round(data.categories.accessibility.score * 100);
    results.push({
      target: target.name,
      url: target.url,
      preset: target.preset,
      performance: perf,
      accessibility: a11y,
      file: `docs/lighthouse/${target.name}.json`
    });
    console.log(`[DONE] ${target.name}: Performance = ${perf}, Accessibility = ${a11y}`);
  } catch (err) {
    console.error(`[FAIL] ${target.name}:`, err.message);
  }
}

fs.writeFileSync(path.join(OUT_DIR, 'summary.json'), JSON.stringify(results, null, 2));
console.log('Lighthouse Audit Complete! Results:');
console.table(results);
