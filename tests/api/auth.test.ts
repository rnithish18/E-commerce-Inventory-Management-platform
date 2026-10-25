import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../backend/src/app';

/**
 * Auth API Integration Tests
 *
 * NOTE: These tests require a running PostgreSQL instance.
 * Run Docker first: docker compose up -d
 * Then: cd backend && npm run migrate:up && npm run seed
 */

describe('Auth API', () => {
  const testEmail = `test-${Date.now()}@shopnest.test`;
  let authCookie: string;

  describe('POST /api/v1/auth/register', () => {
    it('registers a new customer successfully', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ email: testEmail, password: 'Test@1234!', full_name: 'Test User' });

      expect(res.status).toBe(201);
      expect(res.body.user.email).toBe(testEmail);
      expect(res.body.user.role).toBe('CUSTOMER');
      expect(res.body.user).not.toHaveProperty('password_hash');
      expect(res.headers['set-cookie']).toBeDefined();
    });

    it('rejects duplicate email with 409', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ email: testEmail, password: 'Test@1234!', full_name: 'Duplicate User' });
      expect(res.status).toBe(409);
      expect(res.body.error).toBe('EMAIL_TAKEN');
    });

    it('rejects password shorter than 8 chars', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ email: 'short@test.com', password: '1234567', full_name: 'Test' });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('VALIDATION_ERROR');
    });

    it('rejects invalid email format', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ email: 'not-an-email', password: 'Test@1234!', full_name: 'Test' });
      expect(res.status).toBe(400);
    });

    it('rejects missing full_name', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ email: 'noname@test.com', password: 'Test@1234!' });
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('logs in successfully with correct credentials', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: testEmail, password: 'Test@1234!' });

      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe(testEmail);
      expect(res.body.user).not.toHaveProperty('password_hash');
      authCookie = res.headers['set-cookie'][0];
    });

    it('rejects wrong password with 401', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: testEmail, password: 'WrongPassword123' });
      expect(res.status).toBe(401);
      expect(res.body.error).toBe('INVALID_CREDENTIALS');
    });

    it('rejects unknown email with 401', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'nobody@test.com', password: 'Test@1234!' });
      expect(res.status).toBe(401);
    });

    it('rejects missing password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: testEmail });
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('returns user profile when authenticated', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Cookie', authCookie);
      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe(testEmail);
      expect(res.body.user).not.toHaveProperty('password_hash');
    });

    it('returns 401 when not authenticated', async () => {
      const res = await request(app).get('/api/v1/auth/me');
      expect(res.status).toBe(401);
      expect(res.body.error).toBe('UNAUTHORIZED');
    });

    it('returns 401 with tampered token', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Cookie', 'token=tampered.jwt.token');
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('clears the token cookie', async () => {
      const res = await request(app)
        .post('/api/v1/auth/logout')
        .set('Cookie', authCookie);
      expect(res.status).toBe(200);
      expect(res.body.message).toContain('Logged out');
    });
  });

  describe('Admin route protection across all admin endpoints', () => {
    const adminEndpoints = [
      '/api/v1/admin/dashboard',
      '/api/v1/admin/products',
      '/api/v1/admin/orders',
      '/api/v1/admin/inventory',
      '/api/v1/admin/coupons',
      '/api/v1/admin/reviews',
      '/api/v1/admin/analytics',
    ];

    it.each(adminEndpoints)('returns 401 for anonymous request on %s', async (endpoint) => {
      const res = await request(app).get(endpoint);
      expect(res.status).toBe(401);
      expect(res.body.error).toBe('UNAUTHORIZED');
    });

    it.each(adminEndpoints)('returns 403 for CUSTOMER role on %s', async (endpoint) => {
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: testEmail, password: 'Test@1234!' });
      const customerCookie = loginRes.headers['set-cookie'][0];

      const res = await request(app)
        .get(endpoint)
        .set('Cookie', customerCookie);
      expect(res.status).toBe(403);
      expect(res.body.error).toBe('FORBIDDEN');
    });

    it.each(adminEndpoints)('returns 200 for ADMIN role on %s', async (endpoint) => {
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'admin@shopnest.com', password: 'Admin@123!' });
      expect(loginRes.status).toBe(200);
      const adminCookie = loginRes.headers['set-cookie'][0];

      const res = await request(app)
        .get(endpoint)
        .set('Cookie', adminCookie);
      expect(res.status).toBe(200);
    });
  });
});
