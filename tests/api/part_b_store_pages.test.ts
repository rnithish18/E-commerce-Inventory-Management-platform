import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../../backend/src/app';
import { query } from '../../backend/src/db/query';
import { v4 as uuidv4 } from 'uuid';

describe('Part B: Editorial Storefront Pages, Contact Form & Guest Order Tracking', () => {
  let existingOrderId: string;
  let existingCustomerEmail: string;

  beforeAll(async () => {
    // Fetch an existing order and its associated user email
    const orderRes = await query<{ id: string; email: string }>(
      `SELECT o.id, u.email 
       FROM orders o 
       JOIN users u ON o.user_id = u.id 
       ORDER BY o.created_at DESC 
       LIMIT 1`
    );

    if (orderRes.rows.length > 0) {
      existingOrderId = orderRes.rows[0].id;
      existingCustomerEmail = orderRes.rows[0].email;
    } else {
      // Create user and order for test if empty
      const userId = uuidv4();
      existingCustomerEmail = `guest_test_${Date.now()}@example.com`;
      await query(
        `INSERT INTO users (id, email, password_hash, full_name, role)
         VALUES ($1, $2, 'hashed', 'Test Guest', 'CUSTOMER')`,
        [userId, existingCustomerEmail]
      );
      existingOrderId = uuidv4();
      await query(
        `INSERT INTO orders (id, user_id, status, subtotal_paise, total_paise)
         VALUES ($1, $2, 'PAID', 10000, 10000)`,
        [existingOrderId, userId]
      );
    }
  });

  describe('1. Contact Us Inquiries API (POST /api/v1/contact)', () => {
    it('rejects contact inquiry with missing or empty full name', async () => {
      const res = await request(app)
        .post('/api/v1/contact')
        .send({
          name: '',
          email: 'valid@example.com',
          subject: 'Order question',
          message: 'Hello, need help with my shipment.',
        });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('VALIDATION_ERROR');
    });

    it('rejects contact inquiry with invalid email syntax', async () => {
      const res = await request(app)
        .post('/api/v1/contact')
        .send({
          name: 'Jane Doe',
          email: 'not-an-email',
          subject: 'Order question',
          message: 'Hello, need help with my shipment.',
        });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('VALIDATION_ERROR');
    });

    it('rejects contact inquiry with missing subject or message', async () => {
      const res = await request(app)
        .post('/api/v1/contact')
        .send({
          name: 'Jane Doe',
          email: 'jane@example.com',
          subject: '',
          message: '   ',
        });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('VALIDATION_ERROR');
    });

    it('accepts valid contact submission and stores in contact_messages table', async () => {
      const uniqueMsg = `Inquiry regarding delivery ${Date.now()}`;
      const res = await request(app)
        .post('/api/v1/contact')
        .send({
          name: 'Customer Support Test',
          email: 'support_test@example.com',
          subject: 'General Question',
          message: uniqueMsg,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('received');

      // Verify database record
      const dbRes = await query<{ name: string; email: string; subject: string; message: string; status: string }>(
        'SELECT name, email, subject, message, status FROM contact_messages WHERE message = $1',
        [uniqueMsg]
      );
      expect(dbRes.rows.length).toBe(1);
      expect(dbRes.rows[0].name).toBe('Customer Support Test');
      expect(dbRes.rows[0].email).toBe('support_test@example.com');
      expect(dbRes.rows[0].status).toBe('NEW');
    });
  });

  describe('2. Public Guest Order Tracking API (POST /api/v1/orders/track-guest)', () => {
    it('rejects tracking request with missing orderId or email', async () => {
      const res = await request(app)
        .post('/api/v1/orders/track-guest')
        .send({ orderId: existingOrderId });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('VALIDATION_ERROR');
    });

    it('rejects tracking request with mismatched orderId and email', async () => {
      const res = await request(app)
        .post('/api/v1/orders/track-guest')
        .send({
          orderId: existingOrderId,
          email: 'wrong_unrelated_email@example.com',
        });
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('ORDER_NOT_FOUND');
    });

    it('successfully retrieves order detail for valid matching orderId and account email', async () => {
      const res = await request(app)
        .post('/api/v1/orders/track-guest')
        .send({
          orderId: existingOrderId,
          email: existingCustomerEmail,
        });

      expect(res.status).toBe(200);
      expect(res.body.order).toBeDefined();
      expect(res.body.order.id).toBe(existingOrderId);
    });

    it('supports prefix match on Order ID (first 8 chars) with matching email', async () => {
      const prefix = existingOrderId.slice(0, 8);
      const res = await request(app)
        .post('/api/v1/orders/track-guest')
        .send({
          orderId: prefix,
          email: existingCustomerEmail,
        });

      expect(res.status).toBe(200);
      expect(res.body.order).toBeDefined();
      expect(res.body.order.id).toBe(existingOrderId);
    });
  });

  describe('3. Live Dynamic Sitemap (/sitemap.xml)', () => {
    it('returns dynamic XML sitemap containing all store and policy URLs', async () => {
      const res = await request(app).get('/sitemap.xml');
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('application/xml');

      const xml = res.text;
      expect(xml).toContain('<urlset');
      expect(xml).toContain('/about</loc>');
      expect(xml).toContain('/shipping-returns</loc>');
      expect(xml).toContain('/privacy</loc>');
      expect(xml).toContain('/terms</loc>');
      expect(xml).toContain('/faq</loc>');
      expect(xml).toContain('/contact</loc>');
      expect(xml).toContain('/track-order</loc>');
      expect(xml).toContain('/image-credits</loc>');
    });
  });
});
