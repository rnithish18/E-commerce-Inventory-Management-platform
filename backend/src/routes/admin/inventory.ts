import { Router } from 'express';
import { query, getClient } from '../../db/query';
import { requireAuth, requireAdmin } from '../../middleware/auth';
import { AppError } from '../../middleware/errorHandler';
import { v4 as uuidv4 } from 'uuid';

const router = Router();
router.use(requireAuth, requireAdmin);

// GET /api/v1/admin/inventory - SKU list with search and low-stock filter
router.get('/', async (req, res, next) => {
  try {
    const { search, low_stock, page = '1', limit = '50' } = req.query as any;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const conditions: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    if (search) {
      conditions.push(`(pv.sku ILIKE $${idx} OR p.name ILIKE $${idx})`);
      params.push(`%${search}%`);
      idx++;
    }
    if (low_stock === 'true') {
      conditions.push('pv.stock_qty <= pv.reorder_threshold');
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    params.push(parseInt(limit), offset);

    const result = await query(
      `SELECT pv.id, pv.sku, pv.name as variant_name, pv.stock_qty, pv.reserved_qty,
              pv.reorder_threshold, pv.price_adjustment_paise, pv.updated_at,
              p.id as product_id, p.name as product_name, p.price_paise,
              c.name as category_name,
              (pv.stock_qty <= pv.reorder_threshold) as is_low_stock
       FROM product_variants pv
       JOIN products p ON pv.product_id = p.id
       JOIN categories c ON p.category_id = c.id
       ${where}
       ORDER BY is_low_stock DESC, p.name ASC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      params
    );

    const countResult = await query(
      `SELECT COUNT(*)::int as total FROM product_variants pv JOIN products p ON pv.product_id = p.id ${where}`,
      params.slice(0, -2)
    );

    res.json({
      inventory: result.rows,
      total: countResult.rows[0].total,
    });
  } catch (err) { next(err); }
});

// GET /api/v1/admin/inventory/:variantId/movements - History for a SKU
router.get('/:variantId/movements', async (req, res, next) => {
  try {
    const { page = '1', limit = '50' } = req.query as any;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const result = await query(
      `SELECT im.*, u.email as actor_email
       FROM inventory_movements im
       LEFT JOIN users u ON im.actor_user_id = u.id
       WHERE im.variant_id = $1
       ORDER BY im.created_at DESC
       LIMIT $2 OFFSET $3`,
      [req.params.variantId, parseInt(limit), offset]
    );
    res.json({ movements: result.rows });
  } catch (err) { next(err); }
});

// POST /api/v1/admin/inventory/:variantId/adjust - Manual stock adjustment
router.post('/:variantId/adjust', async (req, res, next) => {
  try {
    const { type, quantity, reason } = req.body;

    if (!['PURCHASE_IN', 'ADJUSTMENT', 'RETURN_IN'].includes(type)) {
      throw new AppError(400, 'Invalid adjustment type. Must be PURCHASE_IN, ADJUSTMENT, or RETURN_IN', 'INVALID_TYPE');
    }
    if (!reason || reason.trim().length < 3) {
      throw new AppError(400, 'A mandatory reason (min 3 chars) is required for stock adjustments', 'REASON_REQUIRED');
    }
    const qty = parseInt(quantity);
    if (!Number.isInteger(qty) || qty === 0) {
      throw new AppError(400, 'Quantity must be a non-zero integer', 'INVALID_QUANTITY');
    }

    const client = await getClient();
    try {
      await client.query('BEGIN');

      const varRow = await client.query<{
        id: string; product_id: string; stock_qty: number; reserved_qty: number;
      }>(
        'SELECT id, product_id, stock_qty, reserved_qty FROM product_variants WHERE id = $1 FOR UPDATE',
        [req.params.variantId]
      );

      if (varRow.rows.length === 0) throw new AppError(404, 'Variant not found', 'NOT_FOUND');

      const variant = varRow.rows[0];
      const delta = (type === 'ADJUSTMENT') ? qty : Math.abs(qty);
      const newStock = type === 'ADJUSTMENT'
        ? Math.max(0, variant.stock_qty + qty)
        : variant.stock_qty + delta;

      if (newStock < 0) throw new AppError(400, 'Stock cannot go negative', 'STOCK_NEGATIVE');

      await client.query(
        'UPDATE product_variants SET stock_qty = $1, updated_at = NOW() WHERE id = $2',
        [newStock, variant.id]
      );

      await client.query(
        `INSERT INTO inventory_movements (
           id, product_id, variant_id, type, quantity_change,
           stock_before, stock_after, reason, actor_user_id
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          uuidv4(), variant.product_id, variant.id,
          type, type === 'ADJUSTMENT' ? qty : delta,
          variant.stock_qty, newStock,
          reason.trim(), req.user!.userId,
        ]
      );

      await client.query('COMMIT');
      res.json({ message: 'Stock adjusted successfully', newStock });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) { next(err); }
});

// PATCH /api/v1/admin/inventory/:variantId/threshold
router.patch('/:variantId/threshold', async (req, res, next) => {
  try {
    const { reorder_threshold } = req.body;
    const threshold = parseInt(reorder_threshold);
    if (!Number.isInteger(threshold) || threshold < 0) {
      throw new AppError(400, 'reorder_threshold must be a non-negative integer', 'INVALID_THRESHOLD');
    }
    await query(
      'UPDATE product_variants SET reorder_threshold = $1, updated_at = NOW() WHERE id = $2',
      [threshold, req.params.variantId]
    );
    res.json({ message: 'Reorder threshold updated' });
  } catch (err) { next(err); }
});

export default router;
