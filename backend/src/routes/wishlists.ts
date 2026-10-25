import { Router, Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { requireAuth } from '../middleware/auth';
import { query } from '../db/query';
import { AppError } from '../middleware/errorHandler';

const router = Router();
router.use(requireAuth);

// GET /api/v1/wishlists/ids — Fast ID lookup for storefront heart states
router.get('/ids', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await query<{ product_id: string }>(
      'SELECT product_id FROM wishlists WHERE user_id = $1',
      [req.user!.userId]
    );
    res.json({ productIds: result.rows.map(r => r.product_id) });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/wishlists — Full wishlisted products list with prices and stock
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await query(
      `SELECT w.id as wishlist_id, w.created_at as wishlisted_at,
              p.id, p.name, p.slug, p.brand, p.price_paise, p.mrp_paise, p.badge,
              c.name as category_name, c.slug as category_slug,
              COALESCE(AVG(r.rating), 0)::numeric(2,1) as average_rating,
              COUNT(DISTINCT r.id)::int as rating_count,
              COALESCE(SUM(pv.stock_qty - pv.reserved_qty), 0)::int as total_stock,
              (SELECT url FROM product_images WHERE product_id = p.id ORDER BY sort_order ASC LIMIT 1) as image_url
       FROM wishlists w
       JOIN products p ON w.product_id = p.id
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN reviews r ON r.product_id = p.id AND r.status = 'approved'
       LEFT JOIN product_variants pv ON pv.product_id = p.id
       WHERE w.user_id = $1
       GROUP BY w.id, w.created_at, p.id, c.name, c.slug
       ORDER BY w.created_at DESC`,
      [req.user!.userId]
    );

    res.json({
      items: result.rows.map(r => ({
        id: r.id,
        wishlistId: r.wishlist_id,
        name: r.name,
        slug: r.slug,
        brand: r.brand,
        price_paise: Number(r.price_paise),
        mrp_paise: Number(r.mrp_paise),
        badge: r.badge,
        category_name: r.category_name,
        category_slug: r.category_slug,
        average_rating: r.rating_count > 0 ? Number(r.average_rating) : null,
        rating_count: Number(r.rating_count),
        total_stock: Number(r.total_stock),
        image_url: r.image_url,
        wishlisted_at: r.wishlisted_at,
      })),
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/wishlists/:productId — Add product to wishlist
router.post('/:productId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { productId } = req.params;

    // Verify product exists
    const prodRes = await query<{ id: string }>(
      'SELECT id FROM products WHERE id = $1',
      [productId]
    );
    if (prodRes.rows.length === 0) {
      throw new AppError(404, 'Product not found', 'PRODUCT_NOT_FOUND');
    }

    await query(
      `INSERT INTO wishlists (id, user_id, product_id, created_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (user_id, product_id) DO NOTHING`,
      [uuidv4(), req.user!.userId, productId]
    );

    res.status(201).json({ message: 'Added to wishlist', wishlisted: true });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/wishlists/:productId — Remove product from wishlist
router.delete('/:productId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { productId } = req.params;

    await query(
      'DELETE FROM wishlists WHERE user_id = $1 AND product_id = $2',
      [req.user!.userId, productId]
    );

    res.json({ message: 'Removed from wishlist', wishlisted: false });
  } catch (err) {
    next(err);
  }
});

export default router;
