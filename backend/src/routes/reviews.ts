import { Router } from 'express';
import { query } from '../db/query';
import { requireAuth } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// POST /api/v1/reviews - submit a review (must have DELIVERED order_item for product)
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { product_id, order_item_id, rating, title, body, images } = req.body;
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

    const reviewId = uuidv4();
    const result = await query(
      `INSERT INTO reviews (id, product_id, user_id, order_item_id, rating, title, body, status, helpful_count, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', 0, NOW(), NOW()) RETURNING *`,
      [reviewId, product_id, userId, order_item_id, ratingNum, sanitize(title || ''), sanitize(body || '')]
    );

    // Save attached review images if provided
    if (Array.isArray(images) && images.length > 0) {
      for (const imgUrl of images.slice(0, 3)) {
        if (typeof imgUrl === 'string' && imgUrl.trim()) {
          await query(
            'INSERT INTO review_images (id, review_id, url) VALUES ($1, $2, $3)',
            [uuidv4(), reviewId, imgUrl.trim()]
          );
        }
      }
    }

    res.status(201).json({ review: result.rows[0], message: 'Review submitted and pending moderation' });
  } catch (err) { next(err); }
});

// POST /api/v1/reviews/:id/helpful - toggle helpful vote
router.post('/:id/helpful', requireAuth, async (req, res, next) => {
  try {
    const reviewId = req.params.id as string;
    const userId = req.user!.userId;

    const existingVote = await query(
      'SELECT 1 FROM review_helpful_votes WHERE review_id = $1 AND user_id = $2',
      [reviewId, userId]
    );

    let isHelpful = false;
    if (existingVote.rows.length > 0) {
      // Remove vote
      await query('DELETE FROM review_helpful_votes WHERE review_id = $1 AND user_id = $2', [reviewId, userId]);
      await query('UPDATE reviews SET helpful_count = GREATEST(0, helpful_count - 1) WHERE id = $1', [reviewId]);
      isHelpful = false;
    } else {
      // Add vote
      await query(
        'INSERT INTO review_helpful_votes (review_id, user_id) VALUES ($1, $2)',
        [reviewId, userId]
      );
      await query('UPDATE reviews SET helpful_count = helpful_count + 1 WHERE id = $1', [reviewId]);
      isHelpful = true;
    }

    const updated = await query<{ helpful_count: number }>(
      'SELECT helpful_count FROM reviews WHERE id = $1',
      [reviewId]
    );

    res.json({
      helpful: isHelpful,
      helpful_count: updated.rows[0]?.helpful_count || 0,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
