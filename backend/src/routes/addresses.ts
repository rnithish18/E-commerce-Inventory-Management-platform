import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../middleware/auth';
import { query } from '../db/query';
import { AppError } from '../middleware/errorHandler';
import { v4 as uuidv4 } from 'uuid';

const router = Router();
router.use(requireAuth);

interface AddressRow {
  id: string;
  user_id: string;
  full_name: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  is_default: boolean;
  created_at: Date;
}

// GET /api/v1/addresses
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await query<AddressRow>(
      'SELECT * FROM addresses WHERE user_id = $1 ORDER BY is_default DESC, created_at DESC',
      [req.user!.userId]
    );
    res.json({ addresses: result.rows });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/addresses
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { full_name, line1, line2, city, state, pincode, phone, is_default } = req.body;

    if (!full_name || !line1 || !city || !state || !pincode || !phone) {
      throw new AppError(400, 'Missing required address fields', 'VALIDATION_ERROR');
    }

    if (is_default) {
      await query('UPDATE addresses SET is_default = false WHERE user_id = $1', [req.user!.userId]);
    }

    const id = uuidv4();
    const result = await query<AddressRow>(
      `INSERT INTO addresses (id, user_id, full_name, line1, line2, city, state, pincode, phone, is_default)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        id,
        req.user!.userId,
        full_name,
        line1,
        line2 || null,
        city,
        state,
        pincode,
        phone,
        Boolean(is_default),
      ]
    );

    res.status(201).json({ address: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

// PUT /api/v1/addresses/:id
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { full_name, line1, line2, city, state, pincode, phone, is_default } = req.body;

    if (is_default) {
      await query('UPDATE addresses SET is_default = false WHERE user_id = $1', [req.user!.userId]);
    }

    const result = await query<AddressRow>(
      `UPDATE addresses SET
         full_name = COALESCE($1, full_name),
         line1 = COALESCE($2, line1),
         line2 = COALESCE($3, line2),
         city = COALESCE($4, city),
         state = COALESCE($5, state),
         pincode = COALESCE($6, pincode),
         phone = COALESCE($7, phone),
         is_default = COALESCE($8, is_default)
       WHERE id = $9 AND user_id = $10
       RETURNING *`,
      [
        full_name,
        line1,
        line2,
        city,
        state,
        pincode,
        phone,
        is_default !== undefined ? Boolean(is_default) : null,
        id,
        req.user!.userId,
      ]
    );

    if (result.rows.length === 0) {
      throw new AppError(404, 'Address not found', 'NOT_FOUND');
    }

    res.json({ address: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/addresses/:id
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await query('DELETE FROM addresses WHERE id = $1 AND user_id = $2', [
      req.params.id,
      req.user!.userId,
    ]);

    if (result.rowCount === 0) {
      throw new AppError(404, 'Address not found', 'NOT_FOUND');
    }

    res.json({ message: 'Address deleted successfully' });
  } catch (err) {
    next(err);
  }
});

export default router;
