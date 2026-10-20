import { Router } from 'express';
import { query } from '../db/query';
import { requireAuth } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// POST /api/v1/reviews - submit a review (must have DELIVERED order_item for product)
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { product_id, order_item_id, rating, title, body } = req.body;
    const userId = req.user!.userId;

    // Validate rating
    const ratingNum = parseInt(rating);
    if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      throw new AppError(400, 'Rating must be an integer between 1 and 5', 'INVALID_RATING');
    }

    // Verify user purchased and received this product via a DELIVERED order
    const purchaseCheck = await query(
      `SELECT oi.id FROM order_items oi
       JOIN orders o ON oi.order_id = o.id
       WHERE oi.id = $1 AND oi.product_id = $2 AND o.user_id = $3 AND o.status = 'DELIVERED'`,
      [order_item_id, product_id, userId]
    );
    if (purchaseCheck.rows.length === 0) {
      throw new AppError(403, 'You must have received this product to leave a review', 'NOT_PURCHASED');
    }

    // Duplicate check: one review per user per product
    const dupCheck = await query(
      'SELECT id FROM reviews WHERE user_id = $1 AND product_id = $2',
      [userId, product_id]
    );
    if (dupCheck.rows.length > 0) {
      throw new AppError(409, 'You have already submitted a review for this product', 'DUPLICATE_REVIEW');
    }

    // Strip HTML from text fields
    const sanitize = (text: string) => text?.replace(/<[^>]*>/g, '').trim() || '';

    const result = await query(
      `INSERT INTO reviews (id, product_id, user_id, order_item_id, rating, title, body, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', NOW(), NOW()) RETURNING *`,
      [uuidv4(), product_id, userId, order_item_id, ratingNum, sanitize(title || ''), sanitize(body || '')]
    );

    res.status(201).json({ review: result.rows[0], message: 'Review submitted and pending moderation' });
  } catch (err) { next(err); }
});

export default router;
