import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../middleware/auth';
import { processCheckout, getUserOrders, getOrderDetail } from '../services/order';
import { handlePaymentFailure } from '../services/payment';
import { query } from '../db/query';
import { AppError } from '../middleware/errorHandler';

const router = Router();
router.use(requireAuth);

// POST /api/v1/orders/checkout
router.post('/checkout', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { addressId, items, couponCode, notes } = req.body;

    let checkoutItems = items;

    // If items are not passed explicitly, pull from user's active cart
    if (!checkoutItems || checkoutItems.length === 0) {
      const cartRes = await query<{
        product_id: string;
        variant_id: string;
        quantity: number;
      }>(
        `SELECT ci.product_id, ci.variant_id, ci.quantity
         FROM cart_items ci
         JOIN carts c ON ci.cart_id = c.id
         WHERE c.user_id = $1`,
        [req.user!.userId]
      );

      if (cartRes.rows.length === 0) {
        throw new AppError(400, 'Your cart is empty. Add items before checking out.', 'EMPTY_CART');
      }

      checkoutItems = cartRes.rows.map(row => ({
        productId: row.product_id,
        variantId: row.variant_id,
        quantity: row.quantity,
      }));
    }

    const result = await processCheckout({
      userId: req.user!.userId,
      addressId,
      items: checkoutItems,
      couponCode,
      notes,
    });

    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/orders
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orders = await getUserOrders(req.user!.userId);
    res.json({ orders });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/orders/:id
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const order = await getOrderDetail(req.params.id as string, req.user!.role === 'ADMIN' ? undefined : req.user!.userId);
    res.json({ order });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/orders/:id/cancel
router.post('/:id/cancel', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orderRes = await query<{ id: string; status: string; user_id: string }>(
      'SELECT id, status, user_id FROM orders WHERE id = $1',
      [req.params.id]
    );

    if (orderRes.rows.length === 0) {
      throw new AppError(404, 'Order not found', 'NOT_FOUND');
    }

    const order = orderRes.rows[0];
    if (order.user_id !== req.user!.userId && req.user!.role !== 'ADMIN') {
      throw new AppError(403, 'Permission denied', 'FORBIDDEN');
    }

    if (!['PENDING_PAYMENT', 'PAID', 'PROCESSING'].includes(order.status)) {
      throw new AppError(400, `Cannot cancel order in ${order.status} state`, 'INVALID_STATE');
    }

    await handlePaymentFailure(order.id, 'Order cancelled by customer');
    res.json({ message: 'Order cancelled and stock reservations released successfully' });
  } catch (err) {
    next(err);
  }
});

export default router;
