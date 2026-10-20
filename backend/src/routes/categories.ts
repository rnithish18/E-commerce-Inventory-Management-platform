import { Router, Request, Response, NextFunction } from 'express';
import { query } from '../db/query';

const router = Router();

// GET /api/v1/categories
router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await query(
      `SELECT c.id, c.name, c.slug, c.icon,
              COUNT(p.id)::int as product_count
       FROM categories c
       LEFT JOIN products p ON p.category_id = c.id AND p.is_active = true
       WHERE c.parent_id IS NULL
       GROUP BY c.id
       ORDER BY c.name ASC`
    );
    res.json({ categories: result.rows });
  } catch (err) {
    next(err);
  }
});

export default router;
