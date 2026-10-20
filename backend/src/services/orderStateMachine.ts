import { PoolClient } from 'pg';
import { AppError } from '../middleware/errorHandler';
import { v4 as uuidv4 } from 'uuid';

export type OrderStatus =
  | 'PENDING_PAYMENT'
  | 'PAID'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUND_REQUESTED'
  | 'REFUNDED';

// Legal transitions map: from -> set of allowed 'to' statuses
const LEGAL_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING_PAYMENT: ['PAID', 'CANCELLED'],
  PAID:            ['PROCESSING', 'CANCELLED', 'REFUND_REQUESTED'],
  PROCESSING:      ['SHIPPED', 'CANCELLED'],
  SHIPPED:         ['OUT_FOR_DELIVERY'],
  OUT_FOR_DELIVERY: ['DELIVERED'],
  DELIVERED:       ['REFUND_REQUESTED'],
  CANCELLED:       [],
  REFUND_REQUESTED: ['REFUNDED', 'PAID'], // PAID = rejected, stays paid
  REFUNDED:        [],
};

// States from which cancellation is allowed (not yet shipped)
const CANCELLABLE_STATES: OrderStatus[] = ['PENDING_PAYMENT', 'PAID', 'PROCESSING'];

export async function transitionOrderStatus(
  orderId: string,
  toStatus: OrderStatus,
  actorUserId: string,
  note?: string,
  client?: PoolClient
): Promise<void> {
  const ownedClient = !client;
  const dbClient = client || await (await import('../db/pool')).pool.connect();

  try {
    if (ownedClient) await dbClient.query('BEGIN');

    const orderRow = await dbClient.query<{ status: OrderStatus }>(
      'SELECT status FROM orders WHERE id = $1 FOR UPDATE',
      [orderId]
    );

    if (orderRow.rows.length === 0) {
      throw new AppError(404, 'Order not found', 'NOT_FOUND');
    }

    const fromStatus = orderRow.rows[0].status;

    // Validate transition
    if (!LEGAL_TRANSITIONS[fromStatus]?.includes(toStatus)) {
      throw new AppError(
        409,
        `Cannot transition order from ${fromStatus} to ${toStatus}`,
        'ILLEGAL_TRANSITION'
      );
    }

    // Special: Cancellation after SHIPPED is forbidden
    if (toStatus === 'CANCELLED' && !CANCELLABLE_STATES.includes(fromStatus)) {
      throw new AppError(
        409,
        `Order cannot be cancelled after it has been shipped (current status: ${fromStatus})`,
        'CANCELLATION_NOT_ALLOWED'
      );
    }

    // Update status
    await dbClient.query(
      'UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2',
      [toStatus, orderId]
    );

    // Write audit_log
    await dbClient.query(
      `INSERT INTO audit_log (id, entity_type, entity_id, action, old_values, new_values, actor_user_id, created_at)
       VALUES ($1, 'ORDER', $2, 'STATUS_CHANGE', $3, $4, $5, NOW())`,
      [
        uuidv4(),
        orderId,
        JSON.stringify({ status: fromStatus }),
        JSON.stringify({ status: toStatus, note: note || null }),
        actorUserId,
      ]
    );

    if (ownedClient) await dbClient.query('COMMIT');
  } catch (err) {
    if (ownedClient) await dbClient.query('ROLLBACK');
    throw err;
  } finally {
    if (ownedClient) dbClient.release();
  }
}

export async function cancelOrderWithRestock(
  orderId: string,
  actorUserId: string,
  reason: string = 'Customer requested cancellation'
): Promise<void> {
  const client = await (await import('../db/pool')).pool.connect();
  try {
    await client.query('BEGIN');

    // Validate transition first
    await transitionOrderStatus(orderId, 'CANCELLED', actorUserId, reason, client);

    // Release reservations and restock
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

      const { stock_qty, reserved_qty } = varRow.rows[0];
      const newReserved = Math.max(0, reserved_qty - item.quantity);

      await client.query(
        'UPDATE product_variants SET reserved_qty = $1, updated_at = NOW() WHERE id = $2',
        [newReserved, item.variant_id]
      );

      await client.query(
        `INSERT INTO inventory_movements (
           id, product_id, variant_id, type, quantity_change,
           stock_before, stock_after, reference_id, reference_type, reason, actor_user_id
         ) VALUES ($1, $2, $3, 'RESERVATION_RELEASE', $4, $5, $5, $6, 'ORDER_CANCEL', $7, $8)`,
        [
          uuidv4(), item.product_id, item.variant_id,
          -item.quantity, stock_qty, orderId, reason, actorUserId,
        ]
      );
    }

    // Release coupon redemption if present
    await client.query(
      `DELETE FROM coupon_redemptions WHERE order_id = $1`,
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
