import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../../backend/src/app';
import { query } from '../../backend/src/db/query';
import { v4 as uuidv4 } from 'uuid';

describe('Stock Race Condition: 10 Concurrent Checkouts for Stock=1 Product', () => {
  let testVariantId: string;
  let testProductId: string;
  const customerCookies: string[] = [];
  const addressIds: string[] = [];

  beforeAll(async () => {
    // Create a fresh product with stock=1 just for this test
    const catRes = await query<{ id: string }>('SELECT id FROM categories LIMIT 1');
    const catId = catRes.rows[0].id;
    const prodId = uuidv4();
    const varId = uuidv4();

    await query(
      `INSERT INTO products (id, category_id, name, slug, price_paise, mrp_paise, is_active)
       VALUES ($1, $2, 'Race Test Product', $3, 99900, 99900, true)`,
      [prodId, catId, `race-test-product-${Date.now()}`]
    );
    await query(
      `INSERT INTO product_variants (id, product_id, name, sku, stock_qty, reserved_qty, reorder_threshold)
       VALUES ($1, $2, 'Default', $3, 1, 0, 1)`,
      [varId, prodId, `RACE-SKU-${Date.now()}`]
    );

    testProductId = prodId;
    testVariantId = varId;

    // Login 10 customers and create an address for each
    for (let i = 1; i <= 10; i++) {
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: `customer${i}@shopnest.com`, password: 'Customer@123!' });
      const cookie = loginRes.headers['set-cookie']?.[0] || '';
      customerCookies.push(cookie);

      // Create address for this customer
      const addrRes = await request(app)
        .post('/api/v1/addresses')
        .set('Cookie', cookie)
        .send({ full_name: 'Race Tester', line1: '1 Race St', city: 'Delhi', state: 'Delhi', pincode: '110001', phone: '9888888888' });

      let addressId = addrRes.body.address?.id;
      if (!addressId) {
        // Address may already exist — fetch it
        const listRes = await request(app)
          .get('/api/v1/addresses')
          .set('Cookie', cookie);
        addressId = listRes.body.addresses?.[0]?.id;
      }
      addressIds.push(addressId);
    }
  });

  it('exactly 1 succeeds and 9 fail with INSUFFICIENT_STOCK, stock never negative', async () => {
    // Fire 10 concurrent checkouts
    const promises = customerCookies.map(async (cookie, idx) => {
      return request(app)
        .post('/api/v1/orders/checkout')
        .set('Cookie', cookie)
        .send({
          addressId: addressIds[idx],
          items: [{ productId: testProductId, variantId: testVariantId, quantity: 1 }],
        });
    });

    const results = await Promise.all(promises);
    const successes = results.filter(r => r.status === 201);
    const failures = results.filter(r => r.status === 400 && r.body.error === 'INSUFFICIENT_STOCK');

    expect(successes.length).toBe(1);
    expect(failures.length).toBe(9);

    // Confirm stock is not negative
    const variantRow = await query<{ stock_qty: number; reserved_qty: number }>(
      'SELECT stock_qty, reserved_qty FROM product_variants WHERE id = $1',
      [testVariantId]
    );
    expect(variantRow.rows[0].stock_qty).toBeGreaterThanOrEqual(0);
    expect(variantRow.rows[0].reserved_qty).toBeGreaterThanOrEqual(0);
    expect(variantRow.rows[0].reserved_qty).toBeLessThanOrEqual(variantRow.rows[0].stock_qty);
  });
});
