import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const screenshotDir = path.resolve(process.cwd(), 'docs/screenshots');

test.beforeAll(() => {
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }
});

test.describe('Automated Visual Documentation & Evidence Capture', () => {
  test('Captures all 12 platform views across customer and admin journeys', async ({ page }) => {
    test.setTimeout(180000);
    await page.setViewportSize({ width: 1440, height: 900 });

    // 1. Customer Logs in
    await page.goto('/login');
    await page.fill('input[type="email"]', 'customer1@shopnest.com');
    await page.fill('input[type="password"]', 'Customer@123!');
    await page.click('button[type="submit"]');
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 });

    // 2. Storefront Home
    await page.goto('/');
    await page.waitForSelector('text=Better Products. Happier You.', { timeout: 15000 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(screenshotDir, '01_storefront_home.png'), fullPage: true });

    // 3. Catalog / Shop with search & filters
    await page.goto('/shop');
    await page.waitForSelector('button:has-text("Add to Cart")', { timeout: 15000 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(screenshotDir, '02_catalog_search_filter.png'), fullPage: true });

    // 4. Product Detail Page (In-stock popular item)
    const firstProduct = page.locator('a[href^="/product/"]').first();
    if (await firstProduct.count() > 0) {
      await firstProduct.click();
    } else {
      await page.goto('/shop');
      await page.locator('a[href^="/product/"]').first().click();
    }
    await page.waitForSelector('button:has-text("Add to Cart")', { timeout: 15000 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(screenshotDir, '03_product_detail.png'), fullPage: true });

    // Add to cart from product detail
    const addBtn = page.locator('button:has-text("Add to Cart")').first();
    await addBtn.click();
    await page.waitForTimeout(1500);

    // 5. Cart Page
    await page.goto('/cart');
    await page.waitForSelector('text=Price Details', { timeout: 15000 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(screenshotDir, '04_cart_summary.png'), fullPage: true });

    // 6. Checkout Form
    const proceedBtn = page.locator('a:has-text("Proceed to Checkout")').first();
    await proceedBtn.click();
    await page.waitForSelector('text=Checkout & Order Confirmation', { timeout: 15000 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(screenshotDir, '05_checkout_form.png'), fullPage: true });

    // Submit checkout
    const radioAddr = page.locator('input[name="delivery_address"]');
    if (await radioAddr.first().isVisible({ timeout: 2000 }).catch(() => false)) {
      await radioAddr.first().check();
    }
    const payBtn = page.locator('button:has-text("Pay")').last();
    if (await payBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await payBtn.click();
      await page.waitForURL(/\/order-confirmation\//, { timeout: 20000 });
      await page.waitForSelector('text=Courier Tracking Timeline', { timeout: 15000 });
      await page.waitForTimeout(1000);
      // 7. Order Confirmation & Tracking Stepper
      await page.screenshot({ path: path.join(screenshotDir, '06_order_tracking.png'), fullPage: true });
    }

    // Admin Login for Management Portal Views
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@shopnest.com');
    await page.fill('input[type="password"]', 'Admin@123!');
    await page.click('button[type="submit"]');
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 });

    // 8. Admin Dashboard
    await page.goto('/admin');
    await page.waitForSelector('text=Dashboard Overview', { timeout: 15000 });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(screenshotDir, '07_admin_dashboard.png'), fullPage: true });

    // 9. Admin Inventory Management
    await page.goto('/admin/inventory');
    await page.waitForSelector('text=Inventory & Stock Management', { timeout: 15000 });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(screenshotDir, '08_admin_inventory.png'), fullPage: true });

    // 10. Admin Orders & State Machine
    await page.goto('/admin/orders');
    await page.waitForSelector('text=Order Management & Fulfillment', { timeout: 15000 });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(screenshotDir, '09_admin_orders.png'), fullPage: true });

    // 11. Admin Analytics Engine
    await page.goto('/admin/analytics');
    await page.waitForSelector('text=Business Analytics & Sales Engine', { timeout: 15000 });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(screenshotDir, '10_admin_analytics.png'), fullPage: true });

    // 12. Admin Coupons Management
    await page.goto('/admin/coupons');
    await page.waitForSelector('text=Coupons & Promotion Engine', { timeout: 15000 });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(screenshotDir, '11_admin_coupons.png'), fullPage: true });

    // 13. Admin Reviews Moderation
    await page.goto('/admin/reviews');
    await page.waitForSelector('text=Product Reviews & Moderation', { timeout: 15000 });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(screenshotDir, '12_admin_reviews.png'), fullPage: true });
  });
});
