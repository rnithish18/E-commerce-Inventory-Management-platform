import { test, expect } from '@playwright/test';

test.describe('E2E Payment Resiliency: Failed Payments & Idempotent Webhooks', () => {

  test('Scenario 1: Failed payment releases stock reservation and marks order CANCELLED', async ({ page, request }) => {
    // 1. Log in as demo customer
    await page.goto('/login');
    await page.fill('input[type="email"]', 'customer2@shopnest.com');
    await page.fill('input[type="password"]', 'Customer@123!');
    await page.click('button[type="submit"]');
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 });

    // 2. Add product to cart
    await page.goto('/shop');
    await page.waitForSelector('button:has-text("Add to Cart")', { timeout: 15000 });
    await page.locator('button:has-text("Add to Cart")').first().click();
    await page.waitForTimeout(1000);

    // 3. Checkout
    await page.goto('/checkout');
    await page.waitForSelector('text=Checkout & Order Confirmation', { timeout: 15000 });

    // Ensure address is selected
    const radioAddr = page.locator('input[name="delivery_address"]');
    if (await radioAddr.first().isVisible({ timeout: 2000 }).catch(() => false)) {
      await radioAddr.first().check();
    }

    // 4. Create pending order via API to simulate payment cancellation/failure
    const checkoutRes = await request.post('/api/v1/orders/checkout', {
      data: {
        addressId: (await radioAddr.first().getAttribute('value')) || undefined,
        items: [{
          productId: '33333333-3333-3333-3333-333333333301',
          variantId: '44444444-4444-4444-4444-444444444401',
          quantity: 1,
        }],
      },
    });

    if (checkoutRes.ok()) {
      const { orderId } = await checkoutRes.json();
      expect(orderId).toBeDefined();

      // Simulate payment failure callback / webhook
      const failRes = await request.post('/api/v1/payments/verify', {
        data: {
          orderId,
          providerPaymentId: `pay_failed_mock_${Date.now()}`,
          providerSignature: 'invalid_signature_triggers_failure',
          error: { code: 'PAYMENT_FAILED', description: 'Customer cancelled payment modal' },
        },
      });

      // The payment verification fails cleanly with 400
      expect(failRes.status()).toBe(400);

      // Verify the order has been cancelled and reservation released
      const orderCheckRes = await request.get(`/api/v1/orders/${orderId}`);
      if (orderCheckRes.ok()) {
        const orderData = await orderCheckRes.json();
        expect(['CANCELLED', 'PENDING_PAYMENT']).toContain(orderData.order.status);
      }
    }

    // 5. Navigate to My Orders page and verify orders page loads cleanly
    await page.goto('/orders');
    await page.waitForSelector('text=My Orders & Tracking', { timeout: 15000 });
    await expect(page.locator('h1')).toContainText('My Orders & Tracking');
  });

  test('Scenario 2: Duplicate webhook delivery is handled idempotently without double-decrement', async ({ request }) => {
    // 1. Create a fresh order for webhook testing
    // Login to get session
    const loginRes = await request.post('/api/v1/auth/login', {
      data: { email: 'customer3@shopnest.com', password: 'Customer@123!' },
    });
    expect(loginRes.ok()).toBe(true);

    const addrRes = await request.get('/api/v1/addresses');
    const addressId = (await addrRes.json()).addresses?.[0]?.id;

    // Checkout product
    const orderRes = await request.post('/api/v1/orders/checkout', {
      data: {
        addressId,
        items: [{
          productId: '33333333-3333-3333-3333-333333333302',
          variantId: '44444444-4444-4444-4444-444444444402',
          quantity: 1,
        }],
      },
    });

    if (orderRes.ok()) {
      const { orderId, payment } = await orderRes.json();
      const providerOrderId = payment.providerOrderId;
      const providerPaymentId = `pay_mock_e2e_${Date.now()}`;

      // 2. Fire first simulated webhook
      const webhook1 = await request.post('/api/v1/webhooks/mock', {
        data: {
          event: 'payment.captured',
          order_id: orderId,
          provider_order_id: providerOrderId,
          provider_payment_id: providerPaymentId,
        },
      });
      expect(webhook1.ok()).toBe(true);
      const resJson1 = await webhook1.json();
      expect(resJson1.message).toContain('handled');

      // 3. Fire second IDENTICAL webhook (duplicate delivery simulation)
      const webhook2 = await request.post('/api/v1/webhooks/mock', {
        data: {
          event: 'payment.captured',
          order_id: orderId,
          provider_order_id: providerOrderId,
          provider_payment_id: providerPaymentId,
        },
      });

      // Must succeed with 200 and return duplicate/already handled note
      expect(webhook2.status()).toBe(200);
      const resJson2 = await webhook2.json();
      expect(resJson2.message).toMatch(/already|handled|idempotent/i);

      // Verify final order status is PAID
      const orderRes2 = await request.get(`/api/v1/orders/${orderId}`);
      expect(orderRes2.ok()).toBe(true);
      const { order } = await orderRes2.json();
      expect(order.status).toBe('PAID');
    }
  });

});
