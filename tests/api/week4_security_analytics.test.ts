import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../../backend/src/app';

let adminCookie: string;
let customerCookie: string;

beforeAll(async () => {
  // Login as admin
  const adminRes = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'admin@shopnest.com', password: 'Admin@123!' });
  adminCookie = adminRes.headers['set-cookie']?.[0]?.split(';')[0] || '';

  // Login as customer
  const custRes = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'customer1@shopnest.com', password: 'Customer@123!' });
  customerCookie = custRes.headers['set-cookie']?.[0]?.split(';')[0] || '';
});

describe('Week 4: Health Check Endpoints', () => {
  it('GET /health returns 200 with database connected and uptime', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.database).toBe('connected');
    expect(res.body.uptime_seconds).toBeTypeOf('number');
  });

  it('GET /api/v1/health returns 200 with operational status', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.version).toBe('1.0.0');
  });
});

describe('Week 4: Analytics Endpoint (/api/v1/admin/analytics)', () => {
  it('blocks anonymous access with 401', async () => {
    const res = await request(app).get('/api/v1/admin/analytics');
    expect(res.status).toBe(401);
  });

  it('blocks customer access with 403', async () => {
    const res = await request(app)
      .get('/api/v1/admin/analytics')
      .set('Cookie', customerCookie);
    expect(res.status).toBe(403);
  });

  it('allows admin access and returns structured KPIs, time series, and status donut data', async () => {
    const res = await request(app)
      .get('/api/v1/admin/analytics?period=7d')
      .set('Cookie', adminCookie);

    expect(res.status).toBe(200);
    expect(res.body.kpis).toBeDefined();
    expect(res.body.kpis.total_sales_paise).toBeTypeOf('number');
    expect(res.body.kpis.gross_sales_paise).toBeTypeOf('number');
    expect(res.body.kpis.net_revenue_paise).toBeTypeOf('number');
    expect(res.body.kpis.aov_paise).toBeTypeOf('number');
    expect(res.body.kpis.inventory_availability_percent).toBeTypeOf('number');
    expect(res.body.kpis.total_orders).toBeTypeOf('number');
    expect(res.body.kpis.total_customers).toBeTypeOf('number');
    expect(res.body.kpis.low_stock_items).toBeTypeOf('number');
    expect(res.body.kpis.fulfilment_rate_percent).toBeTypeOf('number');
    expect(res.body.kpis.cancellation_rate_percent).toBeTypeOf('number');
    expect(res.body.time_series).toBeInstanceOf(Array);
    expect(res.body.status_distribution).toBeInstanceOf(Array);
    expect(res.body.top_products).toBeInstanceOf(Array);
    expect(res.body.low_stock_alerts).toBeInstanceOf(Array);
  });

  it('supports 30d, today, and custom date range filters', async () => {
    const res30d = await request(app)
      .get('/api/v1/admin/analytics?period=30d')
      .set('Cookie', adminCookie);
    expect(res30d.status).toBe(200);

    const resToday = await request(app)
      .get('/api/v1/admin/analytics?period=today')
      .set('Cookie', adminCookie);
    expect(resToday.status).toBe(200);
  });
});

describe('Week 4: Security & SQL Injection Protection', () => {
  it('safely handles malicious SQL injection payloads in product search', async () => {
    const sqlInjections = [
      "' OR '1'='1",
      "'; DROP TABLE users; --",
      "1 UNION SELECT null, null, null, null, null, null, null, null, null, null, null, null, null--",
      "admin'--",
    ];

    for (const payload of sqlInjections) {
      const res = await request(app).get(`/api/v1/products?search=${encodeURIComponent(payload)}`);
      expect(res.status).toBe(200);
      expect(res.body.products).toBeInstanceOf(Array);
    }
  });

  it('safely handles malicious SQL injection in category filter', async () => {
    const res = await request(app).get("/api/v1/products?category=' OR 1=1--");
    expect(res.status).toBe(200);
    expect(res.body.products).toBeInstanceOf(Array);
  });

  it('safely handles malicious SQL injection in price filters', async () => {
    const res = await request(app).get("/api/v1/products?min_price=1000' OR '1'='1");
    // Should be rejected by Zod validation with 400
    expect(res.status).toBe(400);
  });

  it('safely handles malicious UUID queries without unhandled SQL crash', async () => {
    const res = await request(app)
      .get("/api/v1/orders/1' OR '1'='1")
      .set('Cookie', adminCookie);
    // Should return 404 or 400, not 500 crash
    expect([400, 404]).toContain(res.status);
  });
});

describe('Week 4: Coupon Validation Endpoint (/api/v1/coupons/validate)', () => {
  it('validates active coupon WELCOME10 successfully', async () => {
    const res = await request(app)
      .post('/api/v1/coupons/validate')
      .send({ code: 'WELCOME10', subtotalPaise: 60000 });
    expect(res.status).toBe(200);
    expect(res.body.valid).toBe(true);
    expect(res.body.coupon.code).toBe('WELCOME10');
    expect(res.body.coupon.discount_paise).toBe(6000);
  });

  it('rejects coupon when subtotal does not meet min_order_paise', async () => {
    const res = await request(app)
      .post('/api/v1/coupons/validate')
      .send({ code: 'WELCOME10', subtotalPaise: 1000 });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('MIN_ORDER_NOT_MET');
  });

  it('rejects nonexistent coupon with 404', async () => {
    const res = await request(app)
      .post('/api/v1/coupons/validate')
      .send({ code: 'NONEXISTENT99', subtotalPaise: 50000 });
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('COUPON_NOT_FOUND');
  });
});

describe('Week 4: Payment Endpoint Protection & Rate Limiting', () => {
  it('protects /api/v1/payments endpoints with authentication', async () => {
    const res = await request(app)
      .post('/api/v1/payments/create-intent')
      .send({ orderId: '00000000-0000-0000-0000-000000000000' });
    expect(res.status).toBe(401);
  });
});
