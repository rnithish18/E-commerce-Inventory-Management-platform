import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../../backend/src/app';
import { query } from '../../backend/src/db/query';
import { v4 as uuidv4 } from 'uuid';

describe('Phase 4: Storefront Upgrades, Invoices, Search & Reviews', () => {
  let customerCookie: string;
  let customerId: string;
  let adminCookie: string;
  let paidOrderId: string;
  let pendingOrderId: string;
  let testReviewId: string;
  let testProductSlug: string;

  beforeAll(async () => {
    // 1. Customer login
    const custRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'customer1@shopnest.com', password: 'Customer@123!' });
    customerCookie = custRes.headers['set-cookie'][0];
    customerId = custRes.body.user.id;

    // 2. Admin login
    const adminRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@shopnest.com', password: 'Admin@123!' });
    adminCookie = adminRes.headers['set-cookie'][0];

    // 3. Find a paid order or create one
    const paidRes = await query<{ id: string }>(
      "SELECT id FROM orders WHERE status IN ('PAID', 'SHIPPED', 'DELIVERED') LIMIT 1"
    );
    if (paidRes.rows.length > 0) {
      paidOrderId = paidRes.rows[0].id;
    } else {
      paidOrderId = uuidv4();
      await query(
        `INSERT INTO orders (id, user_id, status, subtotal_paise, discount_paise, tax_paise, shipping_paise, total_paise)
         VALUES ($1, $2, 'PAID', 100000, 0, 18000, 0, 118000)`,
        [paidOrderId, customerId]
      );
    }

    // 4. Create a pending order to test invoice rejection
    pendingOrderId = uuidv4();
    await query(
      `INSERT INTO orders (id, user_id, status, subtotal_paise, discount_paise, tax_paise, shipping_paise, total_paise)
       VALUES ($1, $2, 'PENDING_PAYMENT', 50000, 0, 9000, 5000, 64000)`,
      [pendingOrderId, customerId]
    );

    // 5. Get a product slug
    const prodRes = await query<{ slug: string; id: string }>(
      'SELECT slug, id FROM products WHERE is_active = true LIMIT 1'
    );
    testProductSlug = prodRes.rows[0].slug;

    // 6. Find or create an approved review for helpful vote testing
    const revRes = await query<{ id: string }>('SELECT id FROM reviews LIMIT 1');
    if (revRes.rows.length > 0) {
      testReviewId = revRes.rows[0].id;
    } else {
      testReviewId = uuidv4();
      await query(
        `INSERT INTO reviews (id, product_id, user_id, rating, title, body, status, helpful_count, created_at, updated_at)
         VALUES ($1, $2, $3, 5, 'Great quality', 'Very satisfied with the item.', 'approved', 0, NOW(), NOW())`,
        [testReviewId, prodRes.rows[0].id, customerId]
      );
    }
  });

  describe('1. Smart Autosuggest Search (pg_trgm)', () => {
    it('returns empty suggestions array when query length is less than 2', async () => {
      const res = await request(app).get('/api/v1/products/suggest?q=a');
      expect(res.status).toBe(200);
      expect(res.body.suggestions).toEqual([]);
    });

    it('returns fuzzy matched product suggestions for query "ipho"', async () => {
      const res = await request(app).get('/api/v1/products/suggest?q=ipho');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.suggestions)).toBe(true);
      expect(res.body.suggestions.length).toBeGreaterThan(0);
      const match = res.body.suggestions[0];
      expect(match).toHaveProperty('name');
      expect(match).toHaveProperty('brand');
      expect(match).toHaveProperty('price_paise');
      expect(match).toHaveProperty('slug');
    });
  });

  describe('2. Catalog Filters API', () => {
    it('GET /api/v1/products/filters returns brand aggregation and price range', async () => {
      const res = await request(app).get('/api/v1/products/filters');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.brands)).toBe(true);
      expect(res.body.brands.length).toBeGreaterThan(0);
      expect(res.body.brands[0]).toHaveProperty('name');
      expect(res.body.brands[0]).toHaveProperty('count');
      expect(res.body.priceRange).toHaveProperty('min_paise');
      expect(res.body.priceRange).toHaveProperty('max_paise');
      expect(Array.isArray(res.body.categories)).toBe(true);
    });

    it('filters products by brand', async () => {
      const res = await request(app).get('/api/v1/products?brand=Apple');
      expect(res.status).toBe(200);
      expect(res.body.products.length).toBeGreaterThan(0);
      for (const p of res.body.products) {
        expect(p.brand.toLowerCase()).toBe('apple');
      }
    });

    it('filters products by price range', async () => {
      const res = await request(app).get('/api/v1/products?min_price=100000&max_price=8000000');
      expect(res.status).toBe(200);
      for (const p of res.body.products) {
        expect(p.price_paise).toBeGreaterThanOrEqual(100000);
        expect(p.price_paise).toBeLessThanOrEqual(8000000);
      }
    });
  });

  describe('3. Product Detail Upgrades', () => {
    it('returns rating distribution and related products in product detail response', async () => {
      const res = await request(app).get(`/api/v1/products/${testProductSlug}`);
      expect(res.status).toBe(200);
      expect(res.body.product).toHaveProperty('rating_distribution');
      expect(res.body.product.rating_distribution).toHaveProperty('5');
      expect(Array.isArray(res.body.product.related_products)).toBe(true);
      expect(Array.isArray(res.body.product.reviews)).toBe(true);
    });
  });

  describe('4. Review Helpful Votes', () => {
    it('toggles helpful vote on customer review', async () => {
      // First click: add vote
      const res1 = await request(app)
        .post(`/api/v1/reviews/${testReviewId}/helpful`)
        .set('Cookie', customerCookie);

      expect(res1.status).toBe(200);
      expect(res1.body).toHaveProperty('helpful');
      expect(res1.body).toHaveProperty('helpful_count');

      // Second click: toggle off vote
      const res2 = await request(app)
        .post(`/api/v1/reviews/${testReviewId}/helpful`)
        .set('Cookie', customerCookie);

      expect(res2.status).toBe(200);
      expect(res2.body.helpful).toBe(!res1.body.helpful);
    });
  });

  describe('5. GST Invoice PDF Generation', () => {
    it('generates downloadable PDF with valid binary headers for paid order', async () => {
      const res = await request(app)
        .get(`/api/v1/orders/${paidOrderId}/invoice`)
        .set('Cookie', adminCookie);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toBe('application/pdf');
      expect(res.headers['content-disposition']).toContain('ShopNest_Invoice_');
      // Verify valid PDF magic bytes '%PDF'
      expect(res.body.slice(0, 4).toString('ascii')).toBe('%PDF');
    });

    it('rejects invoice request for unpaid PENDING_PAYMENT order with 400', async () => {
      const res = await request(app)
        .get(`/api/v1/orders/${pendingOrderId}/invoice`)
        .set('Cookie', customerCookie);

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('INVOICE_NOT_AVAILABLE');
    });
  });
});
