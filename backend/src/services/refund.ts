import { pool } from '../db/pool';
import { AppError } from '../middleware/errorHandler';
import { v4 as uuidv4 } from 'uuid';
import { transitionOrderStatus } from './orderStateMachine';

export async function requestRefund(orderId: string, userId: string, reason: string): Promise<void> {
  const orderRes = await pool.query<{ status: string; user_id: string }>(
    'SELECT status, user_id FROM orders WHERE id = $1',
    [orderId]
  );
  if (orderRes.rows.length === 0) throw new AppError(404, 'Order not found', 'NOT_FOUND');
  const order = orderRes.rows[0];
  if (order.user_id !== userId) throw new AppError(403, 'Forbidden', 'FORBIDDEN');
  if (!['DELIVERED', 'PAID'].includes(order.status)) {
    throw new AppError(400, 'Only DELIVERED or PAID orders can be refunded', 'INVALID_REFUND');
  }
  await transitionOrderStatus(orderId, 'REFUND_REQUESTED', userId, reason);
}

export async function approveRefund(orderId: string, adminUserId: string): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const orderRow = await client.query<{ status: string; total_paise: number }>(
      'SELECT status, total_paise FROM orders WHERE id = $1 FOR UPDATE',
      [orderId]
    );
    if (orderRow.rows.length === 0) throw new AppError(404, 'Order not found', 'NOT_FOUND');
    const order = orderRow.rows[0];
    if (order.status !== 'REFUND_REQUESTED') {
      throw new AppError(409, `Order is not in REFUND_REQUESTED state (current: ${order.status})`, 'ILLEGAL_TRANSITION');
    }

    // Idempotency: check if refund already processed
    const existingRefund = await client.query<{ id: string }>(
      `SELECT id FROM refunds WHERE order_id = $1 AND status = 'PROCESSED'`,
      [orderId]
    );
    if (existingRefund.rows.length > 0) {
      throw new AppError(409, 'Refund already processed for this order', 'DUPLICATE_REFUND');
    }

    // Get payment attempt for reference
    const paymentRow = await client.query<{ id: string; amount_paise: number }>(
      `SELECT id, amount_paise FROM payment_attempts WHERE order_id = $1 AND status = 'SUCCESS' LIMIT 1`,
      [orderId]
    );

    const refundId = uuidv4();
    const isMock = process.env.MOCK_GATEWAY !== 'false';
    const providerRefundId = isMock ? `rfnd_mock_${uuidv4().replace(/-/g, '').slice(0, 14)}` : null;

    // Create refunds row
    await client.query(
      `INSERT INTO refunds (id, order_id, payment_attempt_id, amount_paise, reason, status, provider_refund_id, created_at, updated_at)
       VALUES ($1, $2, $3, $4, 'Admin approved refund', 'PROCESSED', $5, NOW(), NOW())`,
      [
        refundId,
        orderId,
        paymentRow.rows[0]?.id || null,
        order.total_paise,
        providerRefundId,
      ]
    );

    // Transition order to REFUNDED
    await client.query(
      'UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2',
      ['REFUNDED', orderId]
    );

    // Write audit_log
    await client.query(
      `INSERT INTO audit_log (id, entity_type, entity_id, action, old_values, new_values, actor_user_id, created_at)
       VALUES ($1, 'ORDER', $2, 'STATUS_CHANGE', $3, $4, $5, NOW())`,
      [
        uuidv4(), orderId,
        JSON.stringify({ status: 'REFUND_REQUESTED' }),
        JSON.stringify({ status: 'REFUNDED', refund_id: refundId }),
        adminUserId,
      ]
    );

    // Restock items via RETURN_IN
    const items = await client.query<{
      product_id: string; variant_id: string | null; quantity: number;
    }>('SELECT product_id, variant_id, quantity FROM order_items WHERE order_id = $1', [orderId]);

    for (const item of items.rows) {
      if (!item.variant_id) continue;

      const varRow = await client.query<{ stock_qty: number; reserved_qty: number }>(
        'SELECT stock_qty, reserved_qty FROM product_variants WHERE id = $1 FOR UPDATE',
        [item.variant_id]
      );
      if (varRow.rows.length === 0) continue;

      const { stock_qty } = varRow.rows[0];
      const newStock = stock_qty + item.quantity;

      await client.query(
        'UPDATE product_variants SET stock_qty = $1, updated_at = NOW() WHERE id = $2',
        [newStock, item.variant_id]
      );

      await client.query(
        `INSERT INTO inventory_movements (
           id, product_id, variant_id, type, quantity_change,
           stock_before, stock_after, reference_id, reference_type, reason, actor_user_id
         ) VALUES ($1, $2, $3, 'RETURN_IN', $4, $5, $6, $7, 'REFUND', $8, $9)`,
        [
          uuidv4(), item.product_id, item.variant_id,
          item.quantity, stock_qty, newStock, orderId,
          'Stock returned due to approved refund', adminUserId,
        ]
      );
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
