import { Router } from 'express';
import { query } from '../../db/query';
import { requireAuth, requireAdmin } from '../../middleware/auth';

const router = Router();
router.use(requireAuth, requireAdmin);

router.get('/', async (req, res, next) => {
  try {
    const { status } = req.query as any;
    const conditions = status ? [`r.status = $1`] : [];
    const params = status ? [status] : [];

    const result = await query(
      `SELECT r.*, p.name as product_name, u.email as reviewer_email, u.full_name as reviewer_name
       FROM reviews r
       JOIN products p ON r.product_id = p.id
       JOIN users u ON r.user_id = u.id
       ${conditions.length ? 'WHERE ' + conditions.join(' AND ') : ''}
       ORDER BY r.created_at DESC`,
      params
    );
    res.json({ reviews: result.rows });
  } catch (err) { next(err); }
});

router.patch('/:id/moderate', async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['approved', 'hidden', 'pending'].includes(status)) {
      return next(new Error('Invalid review status'));
    }

    const result = await query(
      `UPDATE reviews SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [status, req.params.id]
    );
    if (result.rows.length === 0) return next(new Error('Review not found'));

    // If approving, update product average rating
    if (status === 'approved') {
      await query(
        `UPDATE products SET
           average_rating = (
             SELECT ROUND(AVG(rating)::numeric, 2) FROM reviews WHERE product_id = $1 AND status = 'approved'
           ),
           rating_count = (
             SELECT COUNT(*)::int FROM reviews WHERE product_id = $1 AND status = 'approved'
           ),
           updated_at = NOW()
         WHERE id = $1`,
        [result.rows[0].product_id]
      );
    }

    res.json({ review: result.rows[0] });
  } catch (err) { next(err); }
});

export default router;
