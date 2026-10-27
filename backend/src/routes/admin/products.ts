import { Router, Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../../db/query';
import { pool } from '../../db/pool';
import { requireAuth, requireAdmin } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { CreateProductSchema } from '../../schemas/product';
import { AppError } from '../../middleware/errorHandler';
import { slugify } from '../../utils/slug';

const router = Router();

// All admin product routes require ADMIN role
router.use(requireAuth, requireAdmin);

// GET /api/v1/admin/products
router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await query(
      `SELECT p.id, p.name, p.slug, p.brand, p.price_paise, p.mrp_paise, p.badge,
              p.average_rating, p.needs_image, p.is_active, p.created_at,
              c.name as category_name,
              COALESCE(pv.total_stock, 0)::int as total_stock,
              pi.url as image_url
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN (
         SELECT product_id, SUM(stock_qty) as total_stock FROM product_variants GROUP BY product_id
       ) pv ON p.id = pv.product_id
       LEFT JOIN (
         SELECT DISTINCT ON (product_id) product_id, url
         FROM product_images ORDER BY product_id, sort_order ASC
       ) pi ON p.id = pi.product_id
       ORDER BY p.created_at DESC`
    );
    res.json({ products: result.rows });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/admin/products
router.post('/', validate(CreateProductSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = req.body;
    const id = uuidv4();
    const slug = slugify(data.name) + '-' + id.slice(0, 8);

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const productResult = await client.query(
        `INSERT INTO products (id, category_id, name, slug, description, brand, price_paise, mrp_paise, badge, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *`,
        [id, data.category_id, data.name, slug, data.description || null, data.brand || null,
         data.price_paise, data.mrp_paise, data.badge || null, data.is_active]
      );

      const variantId = uuidv4();
      const sku = slug + '-default';
      await client.query(
        `INSERT INTO product_variants (id, product_id, name, sku, stock_qty, reorder_threshold, price_adjustment_paise)
         VALUES ($1, $2, 'Default', $3, $4, $5, 0)`,
        [variantId, id, sku, data.stock_qty, data.reorder_threshold]
      );

      if (data.stock_qty > 0) {
        await client.query(
          `INSERT INTO inventory_movements (id, product_id, variant_id, type, quantity_change, stock_before, stock_after, reason, actor_user_id)
           VALUES ($1, $2, $3, 'PURCHASE_IN', $4, 0, $4, 'Initial stock on product creation', $5)`,
          [uuidv4(), id, variantId, data.stock_qty, req.user!.userId]
        );
      }

      // Associate uploaded images
      const imagesToInsert: string[] = data.images && data.images.length > 0
        ? data.images
        : data.image_url ? [data.image_url] : [];

      for (let i = 0; i < imagesToInsert.length; i++) {
        await client.query(
          `INSERT INTO product_images (id, product_id, url, alt_text, sort_order)
           VALUES ($1, $2, $3, $4, $5)`,
          [uuidv4(), id, imagesToInsert[i], data.name, i]
        );
      }

      await client.query('COMMIT');
      res.status(201).json({ product: productResult.rows[0] });
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/admin/products/:id/quick-image
router.post('/:id/quick-image', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { url } = req.body;
    if (!url) throw new AppError(400, 'Image URL required', 'BAD_REQUEST');

    // Remove placeholder images
    await query("DELETE FROM product_images WHERE product_id = $1 AND url LIKE '%photo-coming-soon%'", [id]);

    // Insert new product image
    const imgId = uuidv4();
    await query(
      `INSERT INTO product_images (id, product_id, url, alt_text, sort_order, is_primary, source_url, license, verified)
       VALUES ($1, $2, $3, 'Product photo', 0, true, 'admin-uploaded', 'Store Owner Asset', true)`,
      [imgId, id, url]
    );

    // Set needs_image = false
    const result = await query(
      'UPDATE products SET needs_image = false, updated_at = NOW() WHERE id = $1 RETURNING *',
      [id]
    );
    if (!result.rows[0]) throw new AppError(404, 'Product not found', 'NOT_FOUND');

    res.json({ message: 'Image linked successfully', product: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

// PUT /api/v1/admin/products/:id
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name, description, brand, price_paise, mrp_paise, badge, is_active, category_id } = req.body;

    const result = await query(
      `UPDATE products SET
         name = COALESCE($1, name),
         description = COALESCE($2, description),
         brand = COALESCE($3, brand),
         price_paise = COALESCE($4, price_paise),
         mrp_paise = COALESCE($5, mrp_paise),
         badge = COALESCE($6, badge),
         is_active = COALESCE($7, is_active),
         category_id = COALESCE($8, category_id),
         updated_at = NOW()
       WHERE id = $9
       RETURNING *`,
      [name, description, brand, price_paise, mrp_paise, badge, is_active, category_id, id]
    );

    if (!result.rows[0]) throw new AppError(404, 'Product not found', 'NOT_FOUND');
    res.json({ product: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/admin/products/:id (soft delete)
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await query('UPDATE products SET is_active = false, updated_at = NOW() WHERE id = $1', [id]);
    res.json({ message: 'Product deactivated' });
  } catch (err) {
    next(err);
  }
});

export default router;
