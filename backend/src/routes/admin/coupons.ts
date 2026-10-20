import { Router } from 'express';
import { query } from '../../db/query';
import { requireAuth, requireAdmin } from '../../middleware/auth';
import { AppError } from '../../middleware/errorHandler';
import { v4 as uuidv4 } from 'uuid';

const router = Router();
router.use(requireAuth, requireAdmin);

router.get('/', async (req, res, next) => {
  try {
    const result = await query(
      `SELECT c.*, COUNT(cr.id)::int as redemption_count
       FROM coupons c LEFT JOIN coupon_redemptions cr ON cr.coupon_id = c.id
       GROUP BY c.id ORDER BY c.created_at DESC`
    );
    res.json({ coupons: result.rows });
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const {
      code, type, value_paise, min_order_paise = 0, max_discount_paise,
      usage_limit, per_user_limit = 1, valid_from, valid_until, is_active = true,
    } = req.body;
    if (!code || !type || !value_paise) throw new AppError(400, 'code, type, value_paise required', 'VALIDATION_ERROR');
    if (!['percent', 'flat'].includes(type)) throw new AppError(400, 'type must be percent or flat', 'VALIDATION_ERROR');

    const result = await query(
      `INSERT INTO coupons (id, code, type, value_paise, min_order_paise, max_discount_paise, usage_limit, per_user_limit, valid_from, valid_until, is_active, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW()) RETURNING *`,
      [
        uuidv4(), code.toUpperCase(), type, value_paise, min_order_paise,
        max_discount_paise || null, usage_limit || null, per_user_limit,
        valid_from || new Date().toISOString(), valid_until || null, is_active,
      ]
    );
    res.status(201).json({ coupon: result.rows[0] });
  } catch (err) { next(err); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const {
      code, type, value_paise, min_order_paise, max_discount_paise,
      usage_limit, per_user_limit, valid_from, valid_until, is_active,
    } = req.body;
    const result = await query(
      `UPDATE coupons SET
         code = COALESCE($1, code), type = COALESCE($2, type),
         value_paise = COALESCE($3, value_paise),
         min_order_paise = COALESCE($4, min_order_paise),
         max_discount_paise = COALESCE($5, max_discount_paise),
         usage_limit = COALESCE($6, usage_limit),
         per_user_limit = COALESCE($7, per_user_limit),
         valid_from = COALESCE($8, valid_from),
         valid_until = COALESCE($9, valid_until),
         is_active = COALESCE($10, is_active)
       WHERE id = $11 RETURNING *`,
      [code, type, value_paise, min_order_paise, max_discount_paise, usage_limit, per_user_limit, valid_from, valid_until, is_active, req.params.id]
    );
    if (result.rows.length === 0) throw new AppError(404, 'Coupon not found', 'NOT_FOUND');
    res.json({ coupon: result.rows[0] });
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await query('UPDATE coupons SET is_active = false WHERE id = $1', [req.params.id]);
    res.json({ message: 'Coupon deactivated' });
  } catch (err) { next(err); }
});

export default router;
