import 'dotenv/config';
import { query } from '../db/query';

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  Electronics:    ['laptop', 'phone', 'camera', 'tv', 'electronics', 'computer', 'gadget', 'keyboard', 'monitor'],
  Fashion:        ['fashion', 'clothes', 'dress', 'shirt', 'shoe', 'bag', 'jacket', 'jeans', 'apparel'],
  Books:          ['book', 'library', 'reading', 'textbook', 'bookshelf'],
  'Home & Kitchen': ['kitchen', 'home', 'furniture', 'sofa', 'chair', 'table', 'lamp', 'appliance'],
  Beauty:         ['beauty', 'makeup', 'cosmetic', 'skincare', 'perfume', 'lipstick'],
  'Sports & Outdoors': ['sport', 'outdoor', 'fitness', 'gym', 'yoga', 'bicycle', 'badminton', 'cricket'],
  'Toys & Games': ['toy', 'game', 'lego', 'puzzle', 'children'],
};

function detectMismatch(categoryName: string, imageUrl: string): string | null {
  const url = imageUrl.toLowerCase();
  const catName = categoryName.toLowerCase();

  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    const catNorm = cat.toLowerCase();
    if (catName.includes(catNorm) || catNorm.includes(catName.split(' ')[0])) {
      // Check if URL contains keywords from a DIFFERENT category
      for (const [otherCat, otherKws] of Object.entries(CATEGORY_KEYWORDS)) {
        if (otherCat === cat) continue;
        for (const kw of otherKws) {
          if (url.includes(kw)) {
            return `Image contains "${kw}" (${otherCat} keyword) but product is in ${categoryName}`;
          }
        }
      }
    }
  }
  return null;
}

async function main() {
  const res = await query<{
    product_id: string;
    product_name: string;
    category_name: string;
    image_url: string;
  }>(
    `SELECT p.id AS product_id,
            p.name AS product_name,
            COALESCE(c.name, 'Uncategorized') AS category_name,
            pi.url AS image_url
     FROM products p
     LEFT JOIN categories c ON p.category_id = c.id
     JOIN product_images pi ON pi.product_id = p.id
     WHERE pi.sort_order = 0
       AND p.is_active = true
     ORDER BY c.name, p.name`
  );

  const mismatches = res.rows
    .map((row) => ({ ...row, reason: detectMismatch(row.category_name, row.image_url) }))
    .filter((row) => row.reason !== null);

  if (mismatches.length === 0) {
    console.log('\u2705  No obvious category-image mismatches detected.');
  } else {
    console.log(`\n\u26A0\uFE0F  ${mismatches.length} possible image mismatch(es):\n`);
    console.table(
      mismatches.map((m) => ({
        id: m.product_id,
        name: m.product_name,
        category: m.category_name,
        reason: m.reason,
        url: m.image_url.substring(0, 60) + '...',
      }))
    );
  }
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
