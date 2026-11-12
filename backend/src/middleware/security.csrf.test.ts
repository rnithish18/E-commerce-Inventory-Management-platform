/**
 * Tests for the CSRF / Origin Guard middleware.
 *
 * We test the pure helper functions (normaliseOrigin, buildAllowedOrigins) and
 * the middleware itself via a lightweight Express app mounted in-process — no
 * real database connection needed.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import express, { Request, Response } from 'express';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import { csrfProtection, normaliseOrigin, buildAllowedOrigins } from './security';
import { errorHandler } from './errorHandler';

// ---------------------------------------------------------------------------
// Helper: build a minimal Express app that uses the guard
// ---------------------------------------------------------------------------
function makeApp(extraEnv: Record<string, string | undefined> = {}) {
  // Stash original env values and apply overrides
  const original: Record<string, string | undefined> = {};
  for (const [k, v] of Object.entries(extraEnv)) {
    original[k] = process.env[k];
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }

  const app = express();
  app.set('trust proxy', 1);
  app.use(cookieParser());
  app.use(express.json());
  app.use(csrfProtection);

  // Generic echo route — returns 200 OK if the guard passes
  app.post('/api/v1/test', (_req: Request, res: Response) => res.json({ ok: true }));
  app.post('/api/v1/webhooks/razorpay', (_req: Request, res: Response) => res.json({ ok: true }));
  app.use(errorHandler);

  // Restore env after the test
  afterEach(() => {
    for (const [k, v] of Object.entries(original)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  });

  return app;
}

// ---------------------------------------------------------------------------
// normaliseOrigin — unit tests
// ---------------------------------------------------------------------------
describe('normaliseOrigin', () => {
  it('lowercases the host', () => {
    expect(normaliseOrigin('https://SHOP.EXAMPLE.COM')).toBe('https://shop.example.com');
  });

  it('strips trailing slash', () => {
    expect(normaliseOrigin('https://shop.example.com/')).toBe('https://shop.example.com');
  });

  it('strips path and query', () => {
    expect(normaliseOrigin('https://shop.example.com/path?foo=bar')).toBe('https://shop.example.com');
  });

  it('returns null for a non-URL string', () => {
    expect(normaliseOrigin('not-a-url')).toBeNull();
  });

  it('handles http', () => {
    expect(normaliseOrigin('http://localhost:5173')).toBe('http://localhost:5173');
  });
});

// ---------------------------------------------------------------------------
// buildAllowedOrigins — unit tests
// ---------------------------------------------------------------------------
describe('buildAllowedOrigins', () => {
  beforeEach(() => {
    // Start from a clean slate for each test
    delete process.env.ALLOWED_ORIGINS;
    delete process.env.PUBLIC_URL;
    delete process.env.RENDER_EXTERNAL_URL;
    delete process.env.FRONTEND_URL;
    process.env.NODE_ENV = 'production';
  });

  afterEach(() => {
    process.env.NODE_ENV = 'test';
  });

  it('includes PUBLIC_URL when set', () => {
    process.env.PUBLIC_URL = 'https://shopnest.onrender.com';
    const set = buildAllowedOrigins();
    expect(set.has('https://shopnest.onrender.com')).toBe(true);
  });

  it('includes RENDER_EXTERNAL_URL when set', () => {
    process.env.RENDER_EXTERNAL_URL = 'https://shopnest.onrender.com';
    const set = buildAllowedOrigins();
    expect(set.has('https://shopnest.onrender.com')).toBe(true);
  });

  it('parses comma-separated ALLOWED_ORIGINS', () => {
    process.env.ALLOWED_ORIGINS = 'https://app.example.com, https://admin.example.com';
    const set = buildAllowedOrigins();
    expect(set.has('https://app.example.com')).toBe(true);
    expect(set.has('https://admin.example.com')).toBe(true);
  });

  it('normalises trailing slash in ALLOWED_ORIGINS', () => {
    process.env.ALLOWED_ORIGINS = 'https://app.example.com/';
    const set = buildAllowedOrigins();
    expect(set.has('https://app.example.com')).toBe(true);
  });

  it('does NOT include localhost in production', () => {
    const set = buildAllowedOrigins();
    expect(set.has('http://localhost:5173')).toBe(false);
  });

  it('includes localhost in non-production', () => {
    process.env.NODE_ENV = 'development';
    const set = buildAllowedOrigins();
    expect(set.has('http://localhost:5173')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// csrfProtection middleware — integration tests via supertest
// ---------------------------------------------------------------------------
describe('csrfProtection middleware', () => {
  // Reset NODE_ENV to 'test' before each case (guard is active in all envs now)
  beforeEach(() => {
    process.env.NODE_ENV = 'production';
    delete process.env.ALLOWED_ORIGINS;
    delete process.env.PUBLIC_URL;
    delete process.env.RENDER_EXTERNAL_URL;
    delete process.env.FRONTEND_URL;
  });

  afterEach(() => {
    process.env.NODE_ENV = 'test';
  });

  // ---- Safe methods --------------------------------------------------------

  it('GET passes without any Origin header', async () => {
    const app = makeApp();
    // We only have a POST route, so just check the guard doesn't interfere on GET
    const res = await request(app).get('/api/v1/test');
    // 404 from router is fine — the guard didn't fire a 403
    expect(res.status).not.toBe(403);
  });

  // ---- Same-origin ---------------------------------------------------------

  it('accepts same-origin request (Origin == Host)', async () => {
    const app = makeApp();
    const res = await request(app)
      .post('/api/v1/test')
      .set('Host', 'shopnest.onrender.com')
      .set('X-Forwarded-Proto', 'https')
      .set('Origin', 'https://shopnest.onrender.com');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it('accepts same-origin with trailing slash in Origin', async () => {
    const app = makeApp();
    const res = await request(app)
      .post('/api/v1/test')
      .set('Host', 'shopnest.onrender.com')
      .set('X-Forwarded-Proto', 'https')
      .set('Origin', 'https://shopnest.onrender.com/');
    expect(res.status).toBe(200);
  });

  it('accepts same-origin using X-Forwarded-Host', async () => {
    const app = makeApp();
    const res = await request(app)
      .post('/api/v1/test')
      .set('X-Forwarded-Host', 'shopnest.onrender.com')
      .set('X-Forwarded-Proto', 'https')
      .set('Origin', 'https://shopnest.onrender.com');
    expect(res.status).toBe(200);
  });

  // ---- Listed origin -------------------------------------------------------

  it('accepts origin listed in ALLOWED_ORIGINS', async () => {
    process.env.ALLOWED_ORIGINS = 'https://my-frontend.vercel.app';
    const app = makeApp();
    const res = await request(app)
      .post('/api/v1/test')
      .set('Host', 'api.example.com')
      .set('Origin', 'https://my-frontend.vercel.app');
    expect(res.status).toBe(200);
  });

  it('accepts origin listed in PUBLIC_URL', async () => {
    process.env.PUBLIC_URL = 'https://shopnest.onrender.com';
    const app = makeApp();
    const res = await request(app)
      .post('/api/v1/test')
      .set('Host', 'api.internal.example.com')
      .set('Origin', 'https://shopnest.onrender.com');
    expect(res.status).toBe(200);
  });

  it('accepts origin listed in RENDER_EXTERNAL_URL', async () => {
    process.env.RENDER_EXTERNAL_URL = 'https://shopnest.onrender.com';
    const app = makeApp();
    const res = await request(app)
      .post('/api/v1/test')
      .set('Host', 'api.internal')
      .set('Origin', 'https://shopnest.onrender.com');
    expect(res.status).toBe(200);
  });

  // ---- Trailing-slash normalisation ----------------------------------------

  it('accepts ALLOWED_ORIGINS entry with trailing slash when Origin has none', async () => {
    process.env.ALLOWED_ORIGINS = 'https://app.example.com/';
    const app = makeApp();
    const res = await request(app)
      .post('/api/v1/test')
      .set('Host', 'api.example.com')
      .set('Origin', 'https://app.example.com');
    expect(res.status).toBe(200);
  });

  it('accepts Origin with trailing slash when ALLOWED_ORIGINS has none', async () => {
    process.env.ALLOWED_ORIGINS = 'https://app.example.com';
    const app = makeApp();
    const res = await request(app)
      .post('/api/v1/test')
      .set('Host', 'api.example.com')
      .set('Origin', 'https://app.example.com/');
    expect(res.status).toBe(200);
  });

  // ---- Unknown origin rejected ---------------------------------------------

  it('rejects an unknown origin with 403', async () => {
    process.env.ALLOWED_ORIGINS = 'https://known.example.com';
    const app = makeApp();
    const res = await request(app)
      .post('/api/v1/test')
      .set('Host', 'api.example.com')
      .set('Origin', 'https://evil.attacker.com');
    expect(res.status).toBe(403);
    expect(res.body.error).toBe('FORBIDDEN_ORIGIN');
  });

  it('rejects a subdomain that is not explicitly listed', async () => {
    process.env.ALLOWED_ORIGINS = 'https://app.example.com';
    const app = makeApp();
    const res = await request(app)
      .post('/api/v1/test')
      .set('Host', 'api.example.com')
      .set('Origin', 'https://evil.app.example.com');
    expect(res.status).toBe(403);
  });

  // ---- Missing Origin ------------------------------------------------------

  it('allows request with no Origin and no cookie (non-browser client)', async () => {
    const app = makeApp();
    const res = await request(app)
      .post('/api/v1/test')
      .set('Host', 'api.example.com');
    // No origin, no cookie → allowed
    expect(res.status).toBe(200);
  });

  it('blocks request with no Origin but with a session cookie', async () => {
    const app = makeApp();
    const res = await request(app)
      .post('/api/v1/test')
      .set('Host', 'api.example.com')
      .set('Cookie', 'token=some-jwt-value');
    expect(res.status).toBe(403);
    expect(res.body.error).toBe('CSRF_BLOCKED');
  });

  // ---- Webhooks always exempt ----------------------------------------------

  it('webhook route is always allowed regardless of Origin', async () => {
    // No ALLOWED_ORIGINS at all — webhook must still pass
    const app = makeApp();
    const res = await request(app)
      .post('/api/v1/webhooks/razorpay')
      .set('Host', 'api.example.com')
      .set('Origin', 'https://totally-different.example.com')
      .send({ event: 'payment.captured' });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it('webhook route is allowed even without Origin header', async () => {
    const app = makeApp();
    const res = await request(app)
      .post('/api/v1/webhooks/razorpay')
      .set('Host', 'api.example.com')
      .send({ event: 'payment.captured' });
    expect(res.status).toBe(200);
  });
});
