import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import crypto from 'crypto';
import app from '../../backend/src/app';
import { query } from '../../backend/src/db/query';

describe('Week 2: Cart, Checkout & Payment Workflow API Tests', () => {
  let customerCookie: string;
  let testUserId: string;
  let testProductId: string;
  let testVariantId: string;
  let testAddressId: string;
  let createdOrderId: string;
  let providerOrderId: string;

  beforeAll(async () => {
    // Login as seeded customer1
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'customer1@shopnest.com', password: 'Customer@123!' });

    expect(loginRes.status).toBe(200);
    customerCookie = loginRes.headers['set-cookie'][0];
    testUserId = loginRes.body.user.id;

    // Fetch an in-stock product from DB
    const prodRes = await query<{ id: string }>(
      'SELECT id FROM products WHERE is_active = true ORDER BY price_paise ASC LIMIT 1'
    );
    testProductId = prodRes.rows[0].id;

    const variantRes = await query<{ id: string; stock_qty: number }>(
      'SELECT id, stock_qty FROM product_variants WHERE product_id = $1 LIMIT 1',
      [testProductId]
    );
    testVariantId = variantRes.rows[0].id;

    // Create a delivery address for customer1
    const addrRes = await request(app)
      .post('/api/v1/addresses')
      .set('Cookie', customerCookie)
      .send({
        full_name: 'Rahul Sharma',
        line1: 'Flat 402, Skyline Towers',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560001',
        phone: '9876543210',
        is_default: true,
      });

    expect(addrRes.status).toBe(201);
    testAddressId = addrRes.body.address.id;
  });

  describe('1. DB-Backed Cart with Server-Side Stock Validation', () => {
    it('adds item to cart with quantity validation', async () => {
      const res = await request(app)
        .post('/api/v1/cart/items')
        .set('Cookie', customerCookie)
        .send({ productId: testProductId, variantId: testVariantId, quantity: 2 });

      expect(res.status).toBe(201);
      expect(res.body.pricing.items.length).toBeGreaterThan(0);
      expect(res.body.pricing.items[0].quantity).toBe(2);
      expect(res.body.pricing.subtotalPaise).toBeGreaterThan(0);
    });

    it('rejects adding quantity that exceeds available stock (400 INSUFFICIENT_STOCK)', async () => {
      const res = await request(app)
        .post('/api/v1/cart/items')
        .set('Cookie', customerCookie)
        .send({ productId: testProductId, variantId: testVariantId, quantity: 999999 });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('INSUFFICIENT_STOCK');
    });

    it('fetches cart with server-side calculated GST and shipping in paise', async () => {
      const res = await request(app)
        .get('/api/v1/cart')
        .set('Cookie', customerCookie);

      expect(res.status).toBe(200);
      expect(Number.isInteger(res.body.pricing.subtotalPaise)).toBe(true);
      expect(Number.isInteger(res.body.pricing.taxPaise)).toBe(true);
      expect(Number.isInteger(res.body.pricing.totalPaise)).toBe(true);
    });

    it('applies WELCOME10 coupon to reduce total', async () => {
      const res = await request(app)
        .get('/api/v1/cart?coupon=WELCOME10')
        .set('Cookie', customerCookie);

      expect(res.status).toBe(200);
      if (res.body.pricing.subtotalPaise >= 50000) {
        expect(res.body.pricing.couponCode).toBe('WELCOME10');
        expect(res.body.pricing.discountPaise).toBeGreaterThan(0);
      }
    });
  });

  describe('2. Checkout & Stock Reservation with Row Locking', () => {
    it('creates order in PENDING_PAYMENT state and locks stock (increments reserved_qty)', async () => {
      // Check stock before
      const stockBefore = await query<{ reserved_qty: number }>(
        'SELECT reserved_qty FROM product_variants WHERE id = $1',
        [testVariantId]
      );
      const reservedBefore = stockBefore.rows[0].reserved_qty;

      const res = await request(app)
        .post('/api/v1/orders/checkout')
        .set('Cookie', customerCookie)
        .send({
          addressId: testAddressId,
          couponCode: 'WELCOME10',
          items: [{ productId: testProductId, variantId: testVariantId, quantity: 1 }],
        });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('PENDING_PAYMENT');
      expect(res.body.orderId).toBeDefined();
      expect(res.body.payment.providerOrderId).toBeDefined();

      createdOrderId = res.body.orderId;
      providerOrderId = res.body.payment.providerOrderId;

      // Verify reserved_qty incremented in database
      const stockAfter = await query<{ reserved_qty: number }>(
        'SELECT reserved_qty FROM product_variants WHERE id = $1',
        [testVariantId]
      );
      expect(stockAfter.rows[0].reserved_qty).toBe(reservedBefore + 1);

      // Verify inventory_movement row was written
      const movRes = await query<{ type: string }>(
        "SELECT type FROM inventory_movements WHERE reference_id = $1 AND type = 'RESERVATION'",
        [createdOrderId]
      );
      expect(movRes.rows.length).toBeGreaterThan(0);
    });

    it('stores immutable price and name snapshots on order_items', async () => {
      const res = await request(app)
        .get(`/api/v1/orders/${createdOrderId}`)
        .set('Cookie', customerCookie);

      expect(res.status).toBe(200);
      expect(res.body.order.items.length).toBeGreaterThan(0);
      const item = res.body.order.items[0];
      expect(item.product_name).toBeDefined();
      expect(item.unit_price_paise).toBeGreaterThan(0);
      expect(item.total_price_paise).toBeGreaterThan(0);
      expect(Number.isInteger(item.unit_price_paise)).toBe(true);
    });

    it('strictly enforces server-side pricing and completely ignores client-tampered prices', async () => {
      // Query genuine product price from DB
      const genuineProd = await query<{ price_paise: number }>(
        'SELECT price_paise FROM products WHERE id = $1',
        [testProductId]
      );
      const genuinePrice = genuineProd.rows[0].price_paise;

      // Attacker attempts to inject fake low price (e.g. ₹1 = 100 paise)
      const res = await request(app)
        .post('/api/v1/orders/checkout')
        .set('Cookie', customerCookie)
        .send({
          addressId: testAddressId,
          items: [{
            productId: testProductId,
            variantId: testVariantId,
            quantity: 1,
            unit_price_paise: 100, // Attacker trying to pay 1 rupee
            total_price_paise: 100,
            price: 1,
          }],
        });

      expect(res.status).toBe(201);
      // Order item price must match server DB price, NOT the tampered 100 paise
      const orderCheck = await request(app)
        .get(`/api/v1/orders/${res.body.orderId}`)
        .set('Cookie', customerCookie);

      const chargedItem = orderCheck.body.order.items[0];
      expect(chargedItem.unit_price_paise).toBe(genuinePrice);
      expect(chargedItem.unit_price_paise).not.toBe(100);
    });
  });

  describe('3. Razorpay & Webhook Signature Verification and Idempotency', () => {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || 'test_webhook_secret';

    it('rejects webhook with invalid signature with 400 INVALID_SIGNATURE', async () => {
      const payload = {
        event: 'payment.captured',
        payload: {
          payment: {
            entity: {
              id: 'pay_bad_sig_123',
              order_id: providerOrderId,
              amount: 10000,
            },
          },
        },
      };

      const res = await request(app)
        .post('/api/v1/webhooks/razorpay')
        .set('x-razorpay-signature', 'invalid_bogus_hmac_signature')
        .send(payload);

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('INVALID_SIGNATURE');
    });

    it('accepts valid webhook signature, marks order PAID, and decrements stock permanently (SALE_OUT)', async () => {
      const paymentId = `pay_valid_${Date.now()}`;
      const payload = {
        event: 'payment.captured',
        payload: {
          payment: {
            entity: {
              id: paymentId,
              order_id: providerOrderId,
              amount: 10000,
            },
          },
        },
      };

      const payloadStr = JSON.stringify(payload);
      const validSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(payloadStr)
        .digest('hex');

      const res = await request(app)
        .post('/api/v1/webhooks/razorpay')
        .set('x-razorpay-signature', validSignature)
        .send(payload);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');

      // Check order status is now PAID
      const orderCheck = await query<{ status: string }>(
        'SELECT status FROM orders WHERE id = $1',
        [createdOrderId]
      );
      expect(orderCheck.rows[0].status).toBe('PAID');

      // Check SALE_OUT movement recorded
      const saleMov = await query<{ type: string }>(
        "SELECT type FROM inventory_movements WHERE reference_id = $1 AND type = 'SALE_OUT'",
        [createdOrderId]
      );
      expect(saleMov.rows.length).toBeGreaterThan(0);

      // Check shipment tracking event created
      const trackRes = await query<{ status: string }>(
        "SELECT status FROM shipment_tracking_events WHERE order_id = $1 AND status = 'ORDER_CONFIRMED'",
        [createdOrderId]
      );
      expect(trackRes.rows.length).toBeGreaterThan(0);
    });

    it('handles duplicate webhook event idempotently (returns 200 without duplicate adjustments)', async () => {
      // Re-send the exact same payment captured event
      const existingPayment = await query<{ provider_payment_id: string }>(
        "SELECT provider_payment_id FROM payment_attempts WHERE order_id = $1 AND status = 'SUCCESS'",
        [createdOrderId]
      );
      const paymentId = existingPayment.rows[0].provider_payment_id;

      const payload = {
        event: 'payment.captured',
        payload: {
          payment: {
            entity: {
              id: paymentId,
              order_id: providerOrderId,
              amount: 10000,
            },
          },
        },
      };

      const payloadStr = JSON.stringify(payload);
      const validSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(payloadStr)
        .digest('hex');

      const res = await request(app)
        .post('/api/v1/webhooks/razorpay')
        .set('x-razorpay-signature', validSignature)
        .send(payload);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');

      // Confirm only 1 SALE_OUT was recorded for this item
      const saleCount = await query<{ count: number }>(
        "SELECT count(*)::int as count FROM inventory_movements WHERE reference_id = $1 AND type = 'SALE_OUT'",
        [createdOrderId]
      );
      expect(saleCount.rows[0].count).toBe(1);
    });
  });

  describe('4. Failed Payment Releases Stock Reservation', () => {
    it('releases reservation (RESERVATION_RELEASE) and cancels order on payment failure', async () => {
      // Checkout another order
      const checkoutRes = await request(app)
        .post('/api/v1/orders/checkout')
        .set('Cookie', customerCookie)
        .send({
          addressId: testAddressId,
          items: [{ productId: testProductId, variantId: testVariantId, quantity: 1 }],
        });

      const failedOrderId = checkoutRes.body.orderId;
      const failedProviderOrderId = checkoutRes.body.payment.providerOrderId;

      const stockBefore = await query<{ reserved_qty: number }>(
        'SELECT reserved_qty FROM product_variants WHERE id = $1',
        [testVariantId]
      );
      const reservedBefore = stockBefore.rows[0].reserved_qty;

      // Simulate payment failure webhook
      const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || 'test_webhook_secret';
      const failPayload = {
        event: 'payment.failed',
        payload: {
          payment: {
            entity: {
              id: `pay_failed_${Date.now()}`,
              order_id: failedProviderOrderId,
              error_description: 'Card declined by issuing bank',
            },
          },
        },
      };

      const payloadStr = JSON.stringify(failPayload);
      const validSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(payloadStr)
        .digest('hex');

      const webhookRes = await request(app)
        .post('/api/v1/webhooks/razorpay')
        .set('x-razorpay-signature', validSignature)
        .send(failPayload);

      expect(webhookRes.status).toBe(200);

      // Verify order cancelled
      const orderRes = await query<{ status: string }>(
        'SELECT status FROM orders WHERE id = $1',
        [failedOrderId]
      );
      expect(orderRes.rows[0].status).toBe('CANCELLED');

      // Verify reservation was released (reserved_qty decremented)
      const stockAfter = await query<{ reserved_qty: number }>(
        'SELECT reserved_qty FROM product_variants WHERE id = $1',
        [testVariantId]
      );
      expect(stockAfter.rows[0].reserved_qty).toBe(reservedBefore - 1);

      // Verify RESERVATION_RELEASE recorded in inventory_movements
      const releaseMov = await query<{ type: string }>(
        "SELECT type FROM inventory_movements WHERE reference_id = $1 AND type = 'RESERVATION_RELEASE'",
        [failedOrderId]
      );
      expect(releaseMov.rows.length).toBeGreaterThan(0);
    });
  });
});
