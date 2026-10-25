import { pool } from '../db/pool';
import { v4 as uuidv4 } from 'uuid';

export async function expireStaleReservations(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Find expired PENDING_PAYMENT orders
    const expiredOrders = await client.query<{
      id: string; user_id: string;
    }>(
      `SELECT id, user_id FROM orders
       WHERE status = 'PENDING_PAYMENT'
         AND reservation_expires_at IS NOT NULL
         AND reservation_expires_at < NOW()
       FOR UPDATE SKIP LOCKED`
    );

    for (const order of expiredOrders.rows) {
      // Get order items
      const items = await client.query<{
        product_id: string; variant_id: string; quantity: number;
      }>(
        'SELECT product_id, variant_id, quantity FROM order_items WHERE order_id = $1',
        [order.id]
      );

      for (const item of items.rows) {
        if (!item.variant_id) continue;

        // Lock variant row
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
             stock_before, stock_after, reference_id, reference_type, reason
           ) VALUES ($1, $2, $3, 'RESERVATION_RELEASE', $4, $5, $5, $6, 'EXPIRY', $7)`,
          [uuidv4(), item.product_id, item.variant_id, -item.quantity, stock_qty, order.id, 'Reservation expired after 30 minutes']
        );
      }

      // Cancel order
      await client.query(
        `UPDATE orders SET status = 'CANCELLED', updated_at = NOW() WHERE id = $1`,
        [order.id]
      );

      // Release coupon redemption if present
      await client.query(
        `DELETE FROM coupon_redemptions WHERE order_id = $1`,
        [order.id]
      );

      // Write audit_log
      await client.query(
        `INSERT INTO audit_log (id, entity_type, entity_id, action, old_values, new_values, created_at)
         VALUES ($1, 'ORDER', $2, 'EXPIRED', $3, $4, NOW())`,
        [
          uuidv4(),
          order.id,
          JSON.stringify({ status: 'PENDING_PAYMENT' }),
          JSON.stringify({ status: 'CANCELLED', reason: 'reservation_expired' }),
        ]
      );
    }

    await client.query('COMMIT');
    if (expiredOrders.rows.length > 0) {
      console.log(`[ReservationExpiry] Expired ${expiredOrders.rows.length} stale order(s)`);
    }
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[ReservationExpiry] Error:', err);
  } finally {
    client.release();
  }
}

// Run every 2 minutes
export function startReservationExpiryWorker(): void {
  expireStaleReservations();
  setInterval(expireStaleReservations, 2 * 60 * 1000);
  console.log('✅ Reservation expiry worker started (runs every 2 minutes)');
}
