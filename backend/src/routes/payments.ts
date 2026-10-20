import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../middleware/auth';
import {
  verifyRazorpaySignature,
  handlePaymentSuccess,
  handlePaymentFailure,
} from '../services/payment';
import { AppError } from '../middleware/errorHandler';
import { query } from '../db/query';
import { v4 as uuidv4 } from 'uuid';

const router = Router();
router.use(requireAuth);

// POST /api/v1/payments/verify
router.post('/verify', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret || secret.includes('REPLACE')) {
      throw new AppError(400, 'Razorpay secret key not configured on server', 'CONFIG_ERROR');
    }

    const isValid = verifyRazorpaySignature(
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      secret
    );

    if (!isValid) {
      throw new AppError(400, 'Invalid payment signature. Verification failed.', 'INVALID_SIGNATURE');
    }

    const result = await handlePaymentSuccess(orderId, razorpayPaymentId, {
      method: 'razorpay_checkout',
      verifiedServerSide: true,
    });

    res.json({ message: 'Payment verified and confirmed', ...result });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/payments/mock-complete (Sandbox simulation when MOCK_GATEWAY is true)
router.post('/mock-complete', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { orderId, success } = req.body;

    if (!orderId) {
      throw new AppError(400, 'Order ID is required', 'MISSING_PARAM');
    }

    // Verify order belongs to user or admin
    const orderRes = await query<{ id: string; user_id: string; status: string }>(
      'SELECT id, user_id, status FROM orders WHERE id = $1',
      [orderId]
    );

    if (orderRes.rows.length === 0) {
      throw new AppError(404, 'Order not found', 'NOT_FOUND');
    }

    if (orderRes.rows[0].user_id !== req.user!.userId && req.user!.role !== 'ADMIN') {
      throw new AppError(403, 'Permission denied', 'FORBIDDEN');
    }

    if (success === false) {
      await handlePaymentFailure(orderId, 'User simulated mock payment cancellation');
      res.json({ message: 'Payment failed, reservations released' });
      return;
    }

    const mockPaymentId = `pay_mock_${uuidv4().replace(/-/g, '').slice(0, 14)}`;
    const result = await handlePaymentSuccess(orderId, mockPaymentId, {
      method: 'MOCK_SANDBOX_GATEWAY',
      provider: 'mock',
      completedAt: new Date().toISOString(),
    });

    res.json({
      message: 'Mock payment verified successfully (SANDBOX MODE)',
      orderId,
      paymentId: mockPaymentId,
      ...result,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
