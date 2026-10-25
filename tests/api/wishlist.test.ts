import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../../backend/src/app';
import { query } from '../../backend/src/db/query';

describe('Wishlist API Integration Tests', () => {
  let customerCookie: string;
  let testProductId: string;

  beforeAll(async () => {
    // Register unique customer
    const email = `test_wishlist_${Date.now()}@shopnest.com`;
    const regRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email,
        password: 'Password@123!',
        full_name: 'Wishlist Tester',
      });
    expect(regRes.status).toBe(201);
    customerCookie = regRes.headers['set-cookie'][0];

    // Get an in-stock product
    const prodRes = await query<{ id: string }>(
      'SELECT id FROM products WHERE is_active = true LIMIT 1'
    );
    testProductId = prodRes.rows[0].id;
  });

  it('rejects unauthenticated requests to /api/v1/wishlists with 401', async () => {
    const res = await request(app).get('/api/v1/wishlists');
    expect(res.status).toBe(401);
  });

  it('starts with an empty wishlist for a new user', async () => {
    const res = await request(app)
      .get('/api/v1/wishlists')
      .set('Cookie', customerCookie);

    expect(res.status).toBe(200);
    expect(res.body.items).toEqual([]);
  });

  it('adds a valid product to wishlist with 201', async () => {
    const res = await request(app)
      .post(`/api/v1/wishlists/${testProductId}`)
      .set('Cookie', customerCookie);

    expect(res.status).toBe(201);
    expect(res.body.wishlisted).toBe(true);
  });

  it('handles duplicate addition idempotently', async () => {
    const res = await request(app)
      .post(`/api/v1/wishlists/${testProductId}`)
      .set('Cookie', customerCookie);

    expect(res.status).toBe(201);
  });

  it('returns the wishlisted product in GET /api/v1/wishlists', async () => {
    const res = await request(app)
      .get('/api/v1/wishlists')
      .set('Cookie', customerCookie);

    expect(res.status).toBe(200);
    expect(res.body.items.length).toBe(1);
    expect(res.body.items[0].id).toBe(testProductId);
    expect(typeof res.body.items[0].price_paise).toBe('number');
  });

  it('returns wishlisted product IDs in GET /api/v1/wishlists/ids', async () => {
    const res = await request(app)
      .get('/api/v1/wishlists/ids')
      .set('Cookie', customerCookie);

    expect(res.status).toBe(200);
    expect(res.body.productIds).toContain(testProductId);
  });

  it('rejects adding nonexistent product with 404', async () => {
    const res = await request(app)
      .post('/api/v1/wishlists/00000000-0000-0000-0000-000000000000')
      .set('Cookie', customerCookie);

    expect(res.status).toBe(404);
  });

  it('removes product from wishlist with DELETE /api/v1/wishlists/:productId', async () => {
    const res = await request(app)
      .delete(`/api/v1/wishlists/${testProductId}`)
      .set('Cookie', customerCookie);

    expect(res.status).toBe(200);
    expect(res.body.wishlisted).toBe(false);

    // Verify list is empty again
    const checkRes = await request(app)
      .get('/api/v1/wishlists')
      .set('Cookie', customerCookie);
    expect(checkRes.body.items.length).toBe(0);
  });
});
