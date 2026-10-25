import { Router, Request, Response, NextFunction } from 'express';
import { query } from '../db/query';
import { AppError } from '../middleware/errorHandler';

const router = Router();

// POST /api/v1/coupons/validate
router.post('/validate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code, subtotalPaise = 0 } = req.body;
    if (!code || typeof code !== 'string') {
      throw new AppError(400, 'Coupon code is required', 'INVALID_COUPON');
    }

    const trimmed = code.trim().toUpperCase();
    const couponRes = await query<{
      id: string;
      code: string;
      type: string;
      value_paise: number;
      min_order_paise: number;
      max_discount_paise: number | null;
      per_user_limit: number;
      valid_until: string | null;
      is_active: boolean;
    }>(
      `SELECT id, code, type, value_paise, min_order_paise, max_discount_paise, per_user_limit, valid_until, is_active
       FROM coupons
       WHERE code = $1 AND is_active = true`,
      [trimmed]
    );

    if (couponRes.rows.length === 0) {
      throw new AppError(404, 'Invalid coupon code', 'COUPON_NOT_FOUND');
    }

    const coupon = couponRes.rows[0];

    // Check expiration
    if (coupon.valid_until && new Date(coupon.valid_until) < new Date()) {
      throw new AppError(400, 'Coupon has expired', 'COUPON_EXPIRED');
    }

    // Check minimum order
    if (subtotalPaise < coupon.min_order_paise) {
      throw new AppError(
        400,
        `Order amount does not meet minimum requirement of ₹${(coupon.min_order_paise / 100).toFixed(0)}`,
        'MIN_ORDER_NOT_MET'
      );
    }

    // Calculate preview discount
    let discountPaise = 0;
    if (coupon.type === 'percent') {
      const calculated = Math.round((subtotalPaise * coupon.value_paise) / 10000);
      discountPaise = coupon.max_discount_paise ? Math.min(calculated, coupon.max_discount_paise) : calculated;
    } else {
      discountPaise = Math.min(coupon.value_paise, subtotalPaise);
    }

    res.json({
      valid: true,
      coupon: {
        code: coupon.code,
        type: coupon.type,
        value_paise: coupon.value_paise,
        discount_paise: discountPaise,
        min_order_paise: coupon.min_order_paise,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
