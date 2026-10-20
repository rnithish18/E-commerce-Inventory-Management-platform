import { Router, Request, Response } from 'express';
import {
  verifyWebhookSignature,
  handlePaymentSuccess,
  handlePaymentFailure,
} from '../services/payment';
import { query } from '../db/query';

const router = Router();

// POST /api/v1/webhooks/razorpay
router.post('/razorpay', async (req: Request, res: Response) => {
  const signature = req.headers['x-razorpay-signature'] as string;
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET || 'test_webhook_secret';

  // 1. Signature Verification on raw or stringified payload
  const rawBody = (req as any).rawBody || JSON.stringify(req.body);

  if (!signature || !verifyWebhookSignature(rawBody, signature, secret)) {
    res.status(400).json({ error: 'INVALID_SIGNATURE', message: 'Webhook signature verification failed' });
    return;
  }

  const event = req.body;
  const eventType = event.event;

  try {
    if (eventType === 'payment.captured' || eventType === 'order.paid') {
      const paymentEntity = event.payload?.payment?.entity;
      const providerPaymentId = paymentEntity?.id || event.payload?.payment_id || `pay_${Date.now()}`;
      const providerOrderId = paymentEntity?.order_id || event.payload?.order_id;

      // Find associated internal order
      const orderRes = await query<{ id: string }>(
        'SELECT order_id as id FROM payment_attempts WHERE provider_order_id = $1 LIMIT 1',
        [providerOrderId]
      );

      if (orderRes.rows.length > 0) {
        await handlePaymentSuccess(orderRes.rows[0].id, providerPaymentId, paymentEntity);
      }
    } else if (eventType === 'payment.failed') {
      const paymentEntity = event.payload?.payment?.entity;
      const providerOrderId = paymentEntity?.order_id;

      const orderRes = await query<{ id: string }>(
        'SELECT order_id as id FROM payment_attempts WHERE provider_order_id = $1 LIMIT 1',
        [providerOrderId]
      );

      if (orderRes.rows.length > 0) {
        await handlePaymentFailure(
          orderRes.rows[0].id,
          paymentEntity?.error_description || 'Payment failed via Razorpay gateway'
        );
      }
    }

    res.status(200).json({ status: 'ok', received: true });
  } catch (err: any) {
    console.error('Webhook processing error:', err);
    res.status(500).json({ error: 'PROCESSING_ERROR', message: err.message });
  }
});

// POST /api/v1/webhooks/mock-simulate (clearly labeled simulation endpoint)
router.post('/mock-simulate', async (req: Request, res: Response) => {
  try {
    const { orderId, success, providerPaymentId } = req.body;

    if (success !== false) {
      const paymentId = providerPaymentId || `pay_mock_${Date.now()}`;
      const result = await handlePaymentSuccess(orderId, paymentId, { mock: true, simulatedAt: new Date() });
      res.json({ message: 'Mock payment success handled', ...result });
    } else {
      await handlePaymentFailure(orderId, 'Simulated mock payment failure');
      res.json({ message: 'Mock payment failure handled, stock reservation released' });
    }
  } catch (err: any) {
    res.status(500).json({ error: 'MOCK_ERROR', message: err.message });
  }
});

export default router;
