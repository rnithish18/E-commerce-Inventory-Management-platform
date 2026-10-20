import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../../backend/src/app';
import { query } from '../../backend/src/db/query';
import { v4 as uuidv4 } from 'uuid';

describe('Week 3: Order State Machine, Refunds, Coupons, Reviews, Admin Auth', () => {
  let adminCookie: string;
  let customerCookie: string;
  let customerId: string;
  let customer2Cookie: string;
  let customer2Id: string;
  let testProductId: string;
  let testVariantId: string;
  let testAddressId: string;

  beforeAll(async () => {
    // 1. Login Admin
    const adminLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@shopnest.com', password: 'Admin@123!' });
    adminCookie = adminLogin.headers['set-cookie'][0];

    // 2. Login Customer 3
    const custLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'customer3@shopnest.com', password: 'Customer@123!' });
    customerCookie = custLogin.headers['set-cookie'][0];
    customerId = custLogin.body.user.id;

    // 3. Login Customer 4
    const cust2Login = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'customer4@shopnest.com', password: 'Customer@123!' });
    customer2Cookie = cust2Login.headers['set-cookie'][0];
    customer2Id = cust2Login.body.user.id;

    // 4. In-stock Product
    const prodRes = await query<{ id: string }>('SELECT id FROM products WHERE is_active = true LIMIT 1');
    testProductId = prodRes.rows[0].id;
    const varRes = await query<{ id: string }>(
      'SELECT id FROM product_variants WHERE product_id = $1 LIMIT 1',
      [testProductId]
    );
    testVariantId = varRes.rows[0].id;

    // 5. Address for Customer 3
    const addrRes = await request(app)
      .post('/api/v1/addresses')
      .set('Cookie', customerCookie)
      .send({
        full_name: 'Amit Kumar',
        line1: '55 Park Street',
        city: 'Kolkata',
        state: 'West Bengal',
        pincode: '700016',
        phone: '9830098300',
      });
    testAddressId = addrRes.body.address?.id;
    if (!testAddressId) {
      const listRes = await request(app).get('/api/v1/addresses').set('Cookie', customerCookie);
      testAddressId = listRes.body.addresses[0].id;
    }
  });

  describe('1. Order State Machine & Transitions', () => {
    it('rejects illegal transition from PENDING_PAYMENT to SHIPPED with 409 ILLEGAL_TRANSITION', async () => {
      const checkoutRes = await request(app)
        .post('/api/v1/orders/checkout')
        .set('Cookie', customerCookie)
        .send({
          addressId: testAddressId,
          items: [{ productId: testProductId, variantId: testVariantId, quantity: 1 }],
        });

      const orderId = checkoutRes.body.orderId;

      const res = await request(app)
        .patch(`/api/v1/admin/orders/${orderId}/status`)
        .set('Cookie', adminCookie)
        .send({ status: 'SHIPPED' });

      expect(res.status).toBe(409);
      expect(res.body.error).toBe('ILLEGAL_TRANSITION');
    });

    it('rejects cancellation after order is SHIPPED with 409', async () => {
      const checkoutRes = await request(app)
        .post('/api/v1/orders/checkout')
        .set('Cookie', customerCookie)
        .send({
          addressId: testAddressId,
          items: [{ productId: testProductId, variantId: testVariantId, quantity: 1 }],
        });

      const orderId = checkoutRes.body.orderId;

      // Force to SHIPPED state
      await query(`UPDATE orders SET status = 'SHIPPED' WHERE id = $1`, [orderId]);

      const cancelRes = await request(app)
        .post(`/api/v1/admin/orders/${orderId}/cancel`)
        .set('Cookie', adminCookie)
        .send({ reason: 'Attempt cancel shipped order' });

      expect(cancelRes.status).toBe(409);
    });

    it('restocks on valid cancellation and writes RESERVATION_RELEASE movement', async () => {
      const checkoutRes = await request(app)
        .post('/api/v1/orders/checkout')
        .set('Cookie', customerCookie)
        .send({
          addressId: testAddressId,
          items: [{ productId: testProductId, variantId: testVariantId, quantity: 1 }],
        });

      const orderId = checkoutRes.body.orderId;

      const varBefore = await query<{ reserved_qty: number }>(
        'SELECT reserved_qty FROM product_variants WHERE id = $1',
        [testVariantId]
      );

      const cancelRes = await request(app)
        .post(`/api/v1/orders/${orderId}/cancel`)
        .set('Cookie', customerCookie);

      expect(cancelRes.status).toBe(200);

      const varAfter = await query<{ reserved_qty: number }>(
        'SELECT reserved_qty FROM product_variants WHERE id = $1',
        [testVariantId]
      );
      expect(varAfter.rows[0].reserved_qty).toBe(varBefore.rows[0].reserved_qty - 1);

      const movRes = await query<{ type: string }>(
        `SELECT type FROM inventory_movements WHERE reference_id = $1 AND type = 'RESERVATION_RELEASE'`,
        [orderId]
      );
      expect(movRes.rows.length).toBeGreaterThan(0);
    });
  });

  describe('2. Refund Workflow & Restocking', () => {
    let deliveredOrderId: string;

    beforeAll(async () => {
      const checkoutRes = await request(app)
        .post('/api/v1/orders/checkout')
        .set('Cookie', customerCookie)
        .send({
          addressId: testAddressId,
          items: [{ productId: testProductId, variantId: testVariantId, quantity: 1 }],
        });

      deliveredOrderId = checkoutRes.body.orderId;

      // Simulate order delivered with successful payment
      await query(`UPDATE orders SET status = 'DELIVERED' WHERE id = $1`, [deliveredOrderId]);
      await query(
        `INSERT INTO payment_attempts (id, order_id, provider, provider_order_id, provider_payment_id, status, amount_paise)
         VALUES ($1, $2, 'mock', 'ord_mock_123', $3, 'SUCCESS', 50000)`,
        [uuidv4(), deliveredOrderId, `pay_mock_${Date.now()}`]
      );
    });

    it('processes refund request and admin approval, restocking via RETURN_IN and setting REFUNDED', async () => {
      // Customer requests refund
      const reqRes = await request(app)
        .post(`/api/v1/orders/${deliveredOrderId}/refund-request`)
        .set('Cookie', customerCookie)
        .send({ reason: 'Item received had minor cosmetic flaw' });

      expect(reqRes.status).toBe(200);

      const stockBefore = await query<{ stock_qty: number }>(
        'SELECT stock_qty FROM product_variants WHERE id = $1',
        [testVariantId]
      );

      // Admin approves refund
      const approveRes = await request(app)
        .post(`/api/v1/admin/orders/${deliveredOrderId}/approve-refund`)
        .set('Cookie', adminCookie);

      expect(approveRes.status).toBe(200);

      // Check order status is REFUNDED
      const orderAfter = await query<{ status: string }>('SELECT status FROM orders WHERE id = $1', [deliveredOrderId]);
      expect(orderAfter.rows[0].status).toBe('REFUNDED');

      // Check stock restored
      const stockAfter = await query<{ stock_qty: number }>(
        'SELECT stock_qty FROM product_variants WHERE id = $1',
        [testVariantId]
      );
      expect(stockAfter.rows[0].stock_qty).toBe(stockBefore.rows[0].stock_qty + 1);

      // Check RETURN_IN movement
      const returnMov = await query<{ type: string }>(
        `SELECT type FROM inventory_movements WHERE reference_id = $1 AND type = 'RETURN_IN'`,
        [deliveredOrderId]
      );
      expect(returnMov.rows.length).toBeGreaterThan(0);
    });

    it('rejects double refund approval with 409 (idempotent protection)', async () => {
      const secondApproval = await request(app)
        .post(`/api/v1/admin/orders/${deliveredOrderId}/approve-refund`)
        .set('Cookie', adminCookie);

      expect(secondApproval.status).toBe(409);
    });
  });

  describe('3. Coupon Rules & Validation Cases', () => {
    it('rejects expired coupon (does not apply discount)', async () => {
      const expCode = `EXP_${Date.now()}`;
      await query(
        `INSERT INTO coupons (id, code, type, value_paise, min_order_paise, is_active, valid_until, created_at)
         VALUES ($1, $2, 'percent', 2000, 0, true, NOW() - INTERVAL '2 days', NOW())`,
        [uuidv4(), expCode]
      );

      const res = await request(app)
        .post('/api/v1/cart/preview-pricing')
        .set('Cookie', customerCookie)
        .send({
          couponCode: expCode,
          items: [{ productId: testProductId, variantId: testVariantId, quantity: 1 }],
        });

      expect(res.status).toBe(200);
      expect(res.body.pricing.discountPaise).toBe(0);
      expect(res.body.pricing.couponCode).toBeNull();
    });

    it('rejects coupon when subtotal is below min_order_paise', async () => {
      const minCode = `MIN_${Date.now()}`;
      await query(
        `INSERT INTO coupons (id, code, type, value_paise, min_order_paise, is_active, created_at)
         VALUES ($1, $2, 'flat', 5000, 99999999, true, NOW())`,
        [uuidv4(), minCode]
      );

      const res = await request(app)
        .post('/api/v1/cart/preview-pricing')
        .set('Cookie', customerCookie)
        .send({
          couponCode: minCode,
          items: [{ productId: testProductId, variantId: testVariantId, quantity: 1 }],
        });

      expect(res.status).toBe(200);
      expect(res.body.pricing.discountPaise).toBe(0);
      expect(res.body.pricing.couponCode).toBeNull();
    });

    it('rejects coupon when per_user_limit is reached (e.g. WELCOME10 second use)', async () => {
      const limitCode = `LIMIT_${Date.now()}`;
      const cpId = uuidv4();
      await query(
        `INSERT INTO coupons (id, code, type, value_paise, min_order_paise, per_user_limit, is_active, created_at)
         VALUES ($1, $2, 'flat', 1000, 0, 1, true, NOW())`,
        [cpId, limitCode]
      );

      // Record first redemption for customer3
      const fakeOrderId = uuidv4();
      await query(
        `INSERT INTO orders (id, user_id, status, subtotal_paise, discount_paise, tax_paise, shipping_paise, total_paise)
         VALUES ($1, $2, 'PAID', 10000, 1000, 1620, 0, 10620)`,
        [fakeOrderId, customerId]
      );
      await query(
        `INSERT INTO coupon_redemptions (id, coupon_id, user_id, order_id, discount_applied_paise, redeemed_at)
         VALUES ($1, $2, $3, $4, 1000, NOW())`,
        [uuidv4(), cpId, customerId, fakeOrderId]
      );

      // Customer 3 attempts checkout with the same coupon
      const res = await request(app)
        .post('/api/v1/orders/checkout')
        .set('Cookie', customerCookie)
        .send({
          addressId: testAddressId,
          couponCode: limitCode,
          items: [{ productId: testProductId, variantId: testVariantId, quantity: 1 }],
        });

      // Checkout rejects per-user limit exceeded
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('COUPON_USER_LIMIT');
    });

    it('rejects coupon when global usage_limit is reached', async () => {
      const globalCode = `GLOBAL_${Date.now()}`;
      const cpId = uuidv4();
      await query(
        `INSERT INTO coupons (id, code, type, value_paise, min_order_paise, usage_limit, per_user_limit, is_active, created_at)
         VALUES ($1, $2, 'flat', 1000, 0, 1, 10, true, NOW())`,
        [cpId, globalCode]
      );

      // Consume the 1 allowed global use
      const fakeOrd = uuidv4();
      await query(
        `INSERT INTO orders (id, user_id, status, subtotal_paise, discount_paise, tax_paise, shipping_paise, total_paise)
         VALUES ($1, $2, 'PAID', 10000, 1000, 1620, 0, 10620)`,
        [fakeOrd, customer2Id]
      );
      await query(
        `INSERT INTO coupon_redemptions (id, coupon_id, user_id, order_id, discount_applied_paise, redeemed_at)
         VALUES ($1, $2, $3, $4, 1000, NOW())`,
        [uuidv4(), cpId, customer2Id, fakeOrd]
      );

      // Another customer tries to check out
      const res = await request(app)
        .post('/api/v1/orders/checkout')
        .set('Cookie', customerCookie)
        .send({
          addressId: testAddressId,
          couponCode: globalCode,
          items: [{ productId: testProductId, variantId: testVariantId, quantity: 1 }],
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('COUPON_EXHAUSTED');
    });
  });

  describe('4. Review Eligibility, Validation & Moderation', () => {
    let deliveredOrderItemId: string;

    beforeAll(async () => {
      // Create a delivered order item for customer 3
      const ordId = uuidv4();
      const itemId = uuidv4();
      deliveredOrderItemId = itemId;

      await query(
        `INSERT INTO orders (id, user_id, status, subtotal_paise, discount_paise, tax_paise, shipping_paise, total_paise)
         VALUES ($1, $2, 'DELIVERED', 50000, 0, 9000, 0, 59000)`,
        [ordId, customerId]
      );

      await query(
        `INSERT INTO order_items (id, order_id, product_id, variant_id, product_name, sku, quantity, unit_price_paise, total_price_paise)
         VALUES ($1, $2, $3, $4, 'Test Product', 'SKU-REV-1', 1, 50000, 50000)`,
        [itemId, ordId, testProductId, testVariantId]
      );

      // Clean any existing reviews for this product/user
      await query('DELETE FROM reviews WHERE user_id = $1 AND product_id = $2', [customerId, testProductId]);
    });

    it('rejects review for non-purchased / non-delivered product with 403 NOT_PURCHASED', async () => {
      const res = await request(app)
        .post('/api/v1/reviews')
        .set('Cookie', customerCookie)
        .send({
          product_id: testProductId,
          order_item_id: uuidv4(), // Bogus order_item_id
          rating: 5,
          title: 'Fake review',
          body: 'I never bought this',
        });

      expect(res.status).toBe(403);
      expect(res.body.error).toBe('NOT_PURCHASED');
    });

    it('rejects invalid ratings (<1 or >5) with 400', async () => {
      const resLow = await request(app)
        .post('/api/v1/reviews')
        .set('Cookie', customerCookie)
        .send({
          product_id: testProductId,
          order_item_id: deliveredOrderItemId,
          rating: 0,
          title: 'Zero stars',
          body: 'Not allowed',
        });
      expect(resLow.status).toBe(400);

      const resHigh = await request(app)
        .post('/api/v1/reviews')
        .set('Cookie', customerCookie)
        .send({
          product_id: testProductId,
          order_item_id: deliveredOrderItemId,
          rating: 6,
          title: 'Six stars',
          body: 'Not allowed',
        });
      expect(resHigh.status).toBe(400);
    });

    it('submits valid review with stripped HTML tags in pending status', async () => {
      const res = await request(app)
        .post('/api/v1/reviews')
        .set('Cookie', customerCookie)
        .send({
          product_id: testProductId,
          order_item_id: deliveredOrderItemId,
          rating: 5,
          title: '<b>Awesome!</b><script>alert("hack")</script>',
          body: '<p>Great build quality and sound!</p>',
        });

      expect(res.status).toBe(201);
      expect(res.body.review.status).toBe('pending');
      expect(res.body.review.title).not.toContain('<b>');
      expect(res.body.review.title).not.toContain('<script>');
      expect(res.body.review.body).not.toContain('<p>');
    });

    it('rejects duplicate review for the same product and user with 409 DUPLICATE_REVIEW', async () => {
      const res = await request(app)
        .post('/api/v1/reviews')
        .set('Cookie', customerCookie)
        .send({
          product_id: testProductId,
          order_item_id: deliveredOrderItemId,
          rating: 4,
          title: 'Second review',
          body: 'Duplicate attempt',
        });

      expect(res.status).toBe(409);
      expect(res.body.error).toBe('DUPLICATE_REVIEW');
    });
  });

  describe('5. Admin Route Authorization Matrix', () => {
    const adminRoutes = [
      { method: 'get', path: '/api/v1/admin/dashboard' },
      { method: 'get', path: '/api/v1/admin/products' },
      { method: 'get', path: '/api/v1/admin/orders' },
      { method: 'get', path: '/api/v1/admin/inventory' },
      { method: 'get', path: '/api/v1/admin/coupons' },
      { method: 'get', path: '/api/v1/admin/reviews' },
    ];

    for (const route of adminRoutes) {
      it(`blocks anonymous ${route.method.toUpperCase()} ${route.path} with 401 UNAUTHORIZED`, async () => {
        const res = await (request(app) as any)[route.method](route.path);
        expect(res.status).toBe(401);
      });

      it(`blocks customer role on ${route.method.toUpperCase()} ${route.path} with 403 FORBIDDEN`, async () => {
        const res = await (request(app) as any)[route.method](route.path).set('Cookie', customerCookie);
        expect(res.status).toBe(403);
      });

      it(`authorizes admin role on ${route.method.toUpperCase()} ${route.path} with 200 OK`, async () => {
        const res = await (request(app) as any)[route.method](route.path).set('Cookie', adminCookie);
        expect(res.status).toBe(200);
      });
    }
  });
});
