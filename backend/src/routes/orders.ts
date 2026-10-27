import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../middleware/auth';
import { processCheckout, getUserOrders, getOrderDetail } from '../services/order';
import { cancelOrderWithRestock } from '../services/orderStateMachine';
import { requestRefund } from '../services/refund';
import { generateInvoicePdf } from '../services/invoice';
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

// GET /api/v1/orders/latest-tracking — Fetch real recent order and tracking events for the right panel
router.get('/latest-tracking', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const latestRes = await query<{ id: string }>(
      'SELECT id FROM orders WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
      [req.user!.userId]
    );

    if (latestRes.rows.length === 0) {
      return res.json({ order: null });
    }

    const order = await getOrderDetail(latestRes.rows[0].id, req.user!.userId);
    res.json({ order });
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

// GET /api/v1/orders/:id/invoice - Download GST compliant Tax Invoice PDF
router.get('/:id/invoice', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orderId = req.params.id as string;
    const userId = req.user!.role === 'ADMIN' ? undefined : req.user!.userId;

    const pdfDoc = await generateInvoicePdf(orderId, userId);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `inline; filename="ShopNest_Invoice_${orderId.slice(0, 8).toUpperCase()}.pdf"`
    );

    pdfDoc.pipe(res);
    pdfDoc.end();
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/orders/:id/cancel
router.post('/:id/cancel', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Verify order belongs to this user (unless admin)
    const orderRes = await query<{ user_id: string }>(
      'SELECT user_id FROM orders WHERE id = $1',
      [req.params.id]
    );
    if (orderRes.rows.length === 0) {
      throw new AppError(404, 'Order not found', 'NOT_FOUND');
    }
    if (orderRes.rows[0].user_id !== req.user!.userId && req.user!.role !== 'ADMIN') {
      throw new AppError(403, 'Permission denied', 'FORBIDDEN');
    }

    const orderId = req.params.id as string;
    await cancelOrderWithRestock(orderId, req.user!.userId, 'Customer requested cancellation');
    res.json({ message: 'Order cancelled successfully' });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/orders/:id/refund-request
router.post('/:id/refund-request', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { reason } = req.body;
    const orderId = req.params.id as string;
    await requestRefund(orderId, req.user!.userId, reason || 'Customer requested refund');
    res.json({ message: 'Refund request submitted successfully' });
  } catch (err) {
    next(err);
  }
});

export default router;
