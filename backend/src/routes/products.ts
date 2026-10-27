import { Router, Request, Response, NextFunction } from 'express';
import { query } from '../db/query';
import { validateQuery } from '../middleware/validate';
import { ProductQuerySchema } from '../schemas/product';
import { AppError } from '../middleware/errorHandler';

const router = Router();

interface ProductRow {
  id: string;
  name: string;
  slug: string;
  brand: string;
  price_paise: number;
  mrp_paise: number;
  badge: string | null;
  average_rating: string | null;
  rating_count: number;
  category_name: string;
  category_slug: string;
  total_stock: number;
  image_url: string | null;
  secondary_image_url?: string | null;
  needs_image?: boolean;
}

// GET /api/v1/products/featured — must be declared BEFORE /:slug
router.get('/featured', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await query<ProductRow>(
      `SELECT
         p.id, p.name, p.slug, p.brand, p.price_paise, p.mrp_paise, p.badge,
         p.average_rating, p.rating_count, p.needs_image,
         c.name as category_name, c.slug as category_slug,
         COALESCE(pv.total_stock, 0) as total_stock,
         pi.url as image_url,
         (SELECT url FROM product_images WHERE product_id = p.id ORDER BY sort_order ASC OFFSET 1 LIMIT 1) as secondary_image_url
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN (
         SELECT product_id, SUM(GREATEST(0, stock_qty - reserved_qty)) as total_stock FROM product_variants GROUP BY product_id
       ) pv ON p.id = pv.product_id
       LEFT JOIN (
         SELECT DISTINCT ON (product_id) product_id, url
         FROM product_images ORDER BY product_id, sort_order ASC
       ) pi ON p.id = pi.product_id
       WHERE p.is_active = true AND p.badge IS NOT NULL
       ORDER BY p.average_rating DESC NULLS LAST
       LIMIT 8`
    );
    res.json({ products: result.rows });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/products
router.get('/', validateQuery(ProductQuerySchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit, search, category, min_price, max_price, sort, in_stock } = req.query as unknown as {
      page: number; limit: number; search?: string; category?: string;
      min_price?: number; max_price?: number; sort: string; in_stock?: string;
    };
    const offset = (page - 1) * limit;

    const conditions: string[] = ['p.is_active = true'];
    const params: unknown[] = [];
    let paramIdx = 1;

    if (search) {
      conditions.push(`(p.name ILIKE $${paramIdx} OR p.description ILIKE $${paramIdx} OR p.brand ILIKE $${paramIdx})`);
      params.push(`%${search}%`);
      paramIdx++;
    }
    if (category) {
      conditions.push(`c.slug = $${paramIdx}`);
      params.push(category);
      paramIdx++;
    }
    if (min_price !== undefined) {
      conditions.push(`p.price_paise >= $${paramIdx}`);
      params.push(min_price);
      paramIdx++;
    }
    if (max_price !== undefined) {
      conditions.push(`p.price_paise <= $${paramIdx}`);
      params.push(max_price);
      paramIdx++;
    }
    if (in_stock === 'true') {
      conditions.push(`COALESCE(pv.total_stock, 0) > 0`);
    }

    const sortMap: Record<string, string> = {
      price_asc: 'p.price_paise ASC',
      price_desc: 'p.price_paise DESC',
      rating_desc: 'p.average_rating DESC NULLS LAST',
      newest: 'p.created_at DESC',
      discount_desc: `(CASE WHEN p.mrp_paise > 0 THEN (p.mrp_paise - p.price_paise) * 100 / p.mrp_paise ELSE 0 END) DESC`,
    };
    const orderBy = sortMap[sort] || 'p.created_at DESC';
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await query<{ total: string }>(
      `SELECT COUNT(DISTINCT p.id) as total
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN (SELECT product_id, SUM(GREATEST(0, stock_qty - reserved_qty)) as total_stock FROM product_variants GROUP BY product_id) pv ON p.id = pv.product_id
       ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].total, 10);

    const listParams = [...params, limit, offset];
    const productsResult = await query<ProductRow>(
      `SELECT p.id, p.name, p.slug, p.brand, p.price_paise, p.mrp_paise, p.badge,
              p.average_rating, p.rating_count, p.needs_image, p.created_at,
              c.name as category_name, c.slug as category_slug,
              COALESCE(pv.total_stock, 0) as total_stock,
              pi.url as image_url,
              (SELECT url FROM product_images WHERE product_id = p.id ORDER BY sort_order ASC OFFSET 1 LIMIT 1) as secondary_image_url
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN (SELECT product_id, SUM(GREATEST(0, stock_qty - reserved_qty)) as total_stock FROM product_variants GROUP BY product_id) pv ON p.id = pv.product_id
       LEFT JOIN (SELECT DISTINCT ON (product_id) product_id, url FROM product_images ORDER BY product_id, sort_order ASC) pi ON p.id = pi.product_id
       ${whereClause}
       ORDER BY ${orderBy}
       LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
      listParams
    );

    res.json({
      products: productsResult.rows,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit), hasNext: page * limit < total, hasPrev: page > 1 },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/products/:slug
router.get('/:slug', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { slug } = req.params;
    const productResult = await query<ProductRow & { description: string; is_active: boolean; category_id: string; needs_image: boolean }>(
      `SELECT p.id, p.name, p.slug, p.description, p.brand, p.price_paise, p.mrp_paise, p.badge,
              p.average_rating, p.rating_count, p.needs_image, p.is_active, p.created_at,
              c.id as category_id, c.name as category_name, c.slug as category_slug
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.slug = $1 AND p.is_active = true`,
      [slug]
    );
    if (!productResult.rows[0]) throw new AppError(404, 'Product not found', 'NOT_FOUND');

    const product = productResult.rows[0];
    const [imagesResult, variantsResult, reviewsResult] = await Promise.all([
      query('SELECT id, url, alt_text, sort_order, is_primary, source_url, license, verified FROM product_images WHERE product_id = $1 ORDER BY sort_order ASC', [product.id]),
      query('SELECT id, name, sku, stock_qty, reserved_qty, reorder_threshold, price_adjustment_paise FROM product_variants WHERE product_id = $1', [product.id]),
      query(`SELECT r.id, r.rating, r.title, r.body, r.created_at, u.full_name as reviewer_name
             FROM reviews r JOIN users u ON r.user_id = u.id
             WHERE r.product_id = $1 AND r.status = 'approved'
             ORDER BY r.created_at DESC LIMIT 10`, [product.id]),
    ]);

    res.json({ product: { ...product, images: imagesResult.rows, variants: variantsResult.rows, reviews: reviewsResult.rows } });
  } catch (err) {
    next(err);
  }
});

export default router;
