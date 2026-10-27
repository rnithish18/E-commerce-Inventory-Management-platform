import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../../backend/src/app';
import { query } from '../../backend/src/db/query';
import { expireStaleReservations } from '../../backend/src/workers/reservationExpiry';

describe('Reservation Expiry Worker', () => {
  let customerCookie: string;
  let testProductId: string;
  let testVariantId: string;
  let testAddressId: string;

  beforeAll(async () => {
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'customer2@shopnest.com', password: 'Customer@123!' });
    customerCookie = loginRes.headers['set-cookie'][0];

    const varRes = await query<{ id: string; product_id: string; stock_qty: number }>(
      'SELECT id, product_id, stock_qty FROM product_variants WHERE (stock_qty - reserved_qty) >= 5 LIMIT 1'
    );
    testProductId = varRes.rows[0].product_id;
    testVariantId = varRes.rows[0].id;

    const addrRes = await request(app)
      .post('/api/v1/addresses')
      .set('Cookie', customerCookie)
      .send({ full_name: 'Test User', line1: '123 Test St', city: 'Mumbai', state: 'Maharashtra', pincode: '400001', phone: '9999999999' });
    testAddressId = addrRes.body.address?.id || addrRes.body.id;

    // If address creation failed (already exists), fetch it
    if (!testAddressId) {
      const listRes = await request(app)
        .get('/api/v1/addresses')
        .set('Cookie', customerCookie);
      testAddressId = listRes.body.addresses?.[0]?.id;
    }
  });

  it('expires PENDING_PAYMENT orders past reservation_expires_at and releases stock', async () => {
    // Create an order
    const checkoutRes = await request(app)
      .post('/api/v1/orders/checkout')
      .set('Cookie', customerCookie)
      .send({
        addressId: testAddressId,
        items: [{ productId: testProductId, variantId: testVariantId, quantity: 1 }],
      });

    expect(checkoutRes.status).toBe(201);
    const orderId = checkoutRes.body.orderId;

    // Backdate the expiry to the past
    await query(
      `UPDATE orders SET reservation_expires_at = NOW() - INTERVAL '1 hour' WHERE id = $1`,
      [orderId]
    );

    const reservedBefore = await query<{ reserved_qty: number }>(
      'SELECT reserved_qty FROM product_variants WHERE id = $1',
      [testVariantId]
    );

    // Run the expiry worker
    await expireStaleReservations();

    // Verify order is CANCELLED
    const orderAfter = await query<{ status: string }>('SELECT status FROM orders WHERE id = $1', [orderId]);
    expect(orderAfter.rows[0].status).toBe('CANCELLED');

    // Verify reserved_qty was released
    const reservedAfter = await query<{ reserved_qty: number }>(
      'SELECT reserved_qty FROM product_variants WHERE id = $1',
      [testVariantId]
    );
    expect(reservedAfter.rows[0].reserved_qty).toBe(reservedBefore.rows[0].reserved_qty - 1);

    // Verify RESERVATION_RELEASE movement written
    const movRes = await query<{ type: string }>(
      `SELECT type FROM inventory_movements WHERE reference_id = $1 AND type = 'RESERVATION_RELEASE'`,
      [orderId]
    );
    expect(movRes.rows.length).toBeGreaterThan(0);

    // Verify audit_log written
    const auditRes = await query<{ action: string }>(
      `SELECT action FROM audit_log WHERE entity_id = $1 AND action = 'EXPIRED'`,
      [orderId]
    );
    expect(auditRes.rows.length).toBeGreaterThan(0);
  });
});
