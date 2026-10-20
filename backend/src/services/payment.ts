import crypto from 'crypto';
import { getClient, query } from '../db/query';
import { AppError } from '../middleware/errorHandler';
import { v4 as uuidv4 } from 'uuid';

export interface VerifyPaymentInput {
  orderId: string;
  providerOrderId: string;
  providerPaymentId: string;
  signature?: string;
  isMock?: boolean;
}

/**
 * Verify Razorpay Checkout Signature
 */
export function verifyRazorpaySignature(
  providerOrderId: string,
  providerPaymentId: string,
  signature: string,
  secret: string
): boolean {
  try {
    const text = `${providerOrderId}|${providerPaymentId}`;
    const generated = crypto.createHmac('sha256', secret).update(text).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(generated), Buffer.from(signature));
  } catch {
    return false;
  }
}

/**
 * Verify Webhook Signature against raw payload
 */
export function verifyWebhookSignature(
  rawBody: string | Buffer,
  signature: string,
  secret: string
): boolean {
  try {
    const generated = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(generated), Buffer.from(signature));
  } catch {
    return false;
  }
}

/**
 * Idempotently mark order as PAID and transition stock
 */
export async function handlePaymentSuccess(
  orderId: string,
  providerPaymentId: string,
  providerResponse?: any
): Promise<{ success: boolean; idempotent: boolean }> {
  // 1. Check for duplicate event (idempotency check)
  const existingPayment = await query<{ id: string; status: string }>(
    'SELECT id, status FROM payment_attempts WHERE provider_payment_id = $1',
    [providerPaymentId]
  );

  if (existingPayment.rows.length > 0 && existingPayment.rows[0].status === 'SUCCESS') {
    // Duplicate webhook or replay attack — safely ignore and return 200
    return { success: true, idempotent: true };
  }

  const client = await getClient();
  try {
    await client.query('BEGIN');

    // 2. Fetch order items to adjust stock
    const itemsRes = await client.query<{
      variant_id: string;
      product_id: string;
      quantity: number;
      product_name: string;
    }>(
      'SELECT variant_id, product_id, quantity, product_name FROM order_items WHERE order_id = $1',
      [orderId]
    );

    if (itemsRes.rows.length === 0) {
      throw new AppError(404, 'Order items not found', 'NOT_FOUND');
    }

    // 3. For each item: decrement real stock, decrement reserved stock, log SALE_OUT
    for (const item of itemsRes.rows) {
      const vLock = await client.query<{ stock_qty: number; reserved_qty: number }>(
        'SELECT stock_qty, reserved_qty FROM product_variants WHERE id = $1 FOR UPDATE',
        [item.variant_id]
      );

      const beforeStock = vLock.rows[0]?.stock_qty ?? 0;
      const afterStock = Math.max(0, beforeStock - item.quantity);

      await client.query(
        `UPDATE product_variants
         SET stock_qty = stock_qty - $1,
             reserved_qty = GREATEST(0, reserved_qty - $1),
             updated_at = NOW()
         WHERE id = $2`,
        [item.quantity, item.variant_id]
      );

      // Record SALE_OUT movement
      await client.query(
        `INSERT INTO inventory_movements (
           id, product_id, variant_id, type, quantity_change, stock_before, stock_after,
           reference_id, reference_type, reason
         ) VALUES ($1, $2, $3, 'SALE_OUT', $4, $5, $6, $7, 'ORDER_FULFILLMENT', $8)`,
        [
          uuidv4(),
          item.product_id,
          item.variant_id,
          -item.quantity,
          beforeStock,
          afterStock,
          orderId,
          `Stock permanently decremented on successful payment for ${item.product_name}`,
        ]
      );
    }

    // 4. Update order status to PAID
    await client.query(
      "UPDATE orders SET status = 'PAID', updated_at = NOW() WHERE id = $1",
      [orderId]
    );

    // 5. Update payment attempt to SUCCESS
    await client.query(
      `UPDATE payment_attempts
       SET status = 'SUCCESS',
           provider_payment_id = $1,
           provider_response = $2,
           updated_at = NOW()
       WHERE order_id = $3`,
      [providerPaymentId, JSON.stringify(providerResponse || {}), orderId]
    );

    // 6. Add shipment tracking event: ORDER_CONFIRMED
    await client.query(
      `INSERT INTO shipment_tracking_events (
         id, order_id, status, location, description, created_at
       ) VALUES ($1, $2, 'ORDER_CONFIRMED', 'ShopNest Central Fulfillment Center', 'Payment verified. Order confirmed and dispatched to warehouse.', NOW())`,
      [uuidv4(), orderId]
    );

    await client.query('COMMIT');
    return { success: true, idempotent: false };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Handle payment failure and release reserved stock
 */
export async function handlePaymentFailure(
  orderId: string,
  reason = 'Payment attempt failed or timed out'
): Promise<void> {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    // 1. Fetch items to release reservations
    const itemsRes = await client.query<{
      variant_id: string;
      product_id: string;
      quantity: number;
    }>(
      'SELECT variant_id, product_id, quantity FROM order_items WHERE order_id = $1',
      [orderId]
    );

    for (const item of itemsRes.rows) {
      const vLock = await client.query<{ stock_qty: number }>(
        'SELECT stock_qty FROM product_variants WHERE id = $1 FOR UPDATE',
        [item.variant_id]
      );
      const stock = vLock.rows[0]?.stock_qty ?? 0;

      await client.query(
        'UPDATE product_variants SET reserved_qty = GREATEST(0, reserved_qty - $1) WHERE id = $2',
        [item.quantity, item.variant_id]
      );

      // Record RESERVATION_RELEASE
      await client.query(
        `INSERT INTO inventory_movements (
           id, product_id, variant_id, type, quantity_change, stock_before, stock_after,
           reference_id, reference_type, reason
         ) VALUES ($1, $2, $3, 'RESERVATION_RELEASE', $4, $5, $5, $6, 'PAYMENT_FAILURE', $7)`,
        [
          uuidv4(),
          item.product_id,
          item.variant_id,
          item.quantity,
          stock,
          orderId,
          `Stock reservation released due to payment failure: ${reason}`,
        ]
      );
    }

    // 2. Mark order as CANCELLED
    await client.query(
      "UPDATE orders SET status = 'CANCELLED', updated_at = NOW() WHERE id = $1",
      [orderId]
    );

    // 3. Mark payment attempt as FAILED
    await client.query(
      "UPDATE payment_attempts SET status = 'FAILED', updated_at = NOW() WHERE order_id = $1",
      [orderId]
    );

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
