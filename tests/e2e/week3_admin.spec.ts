import { test, expect } from '@playwright/test';

test.describe('Week 3 Admin E2E: Stock Adjustment, State Machine & Order Tracking', () => {
  test('Admin adjusts stock, advances order from PAID to SHIPPED, and customer tracking stepper reflects updates', async ({ page }) => {
    // 1. Customer places an order
    await page.goto('/login');
    await page.fill('input[type="email"]', 'customer1@shopnest.com');
    await page.fill('input[type="password"]', 'Customer@123!');
    await page.click('button[type="submit"]');
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 });

    await page.goto('/shop');
    await page.waitForSelector('button:has-text("Add to Cart")', { timeout: 15000 });
    await page.locator('button:has-text("Add to Cart")').first().click();

    await page.goto('/checkout');
    await page.waitForSelector('text=Checkout & Order Confirmation', { timeout: 15000 });

    const radioAddr = page.locator('input[name="delivery_address"]');
    if (await radioAddr.first().isVisible({ timeout: 2000 }).catch(() => false)) {
      await radioAddr.first().check();
    }

    const payBtn = page.locator('button:has-text("Pay")').last();
    await expect(payBtn).toBeVisible({ timeout: 5000 });
    await payBtn.click();

    await page.waitForURL(/\/order-confirmation\//, { timeout: 20000 });
    const url = page.url();
    const orderIdMatch = url.match(/\/order-confirmation\/([a-zA-Z0-9-]+)/);
    const orderId = orderIdMatch ? orderIdMatch[1] : '';
    expect(orderId).toBeTruthy();

    // 2. Admin logs in
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@shopnest.com');
    await page.fill('input[type="password"]', 'Admin@123!');
    await page.click('button[type="submit"]');
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 });

    // 3. Admin goes to /admin/inventory and adjusts stock
    await page.goto('/admin/inventory');
    await page.waitForSelector('text=Inventory & Stock Management', { timeout: 15000 });

    const adjustBtn = page.locator('button:has-text("Adjust")').first();
    await expect(adjustBtn).toBeVisible({ timeout: 5000 });
    await adjustBtn.click();

    await page.waitForSelector('text=Adjust Inventory Stock', { timeout: 5000 });
    await page.fill('input[placeholder*="e.g. 10"]', '10');
    await page.fill('textarea[placeholder*="Inward PO"]', 'Received shipment batch from vendor');
    await page.click('button:has-text("Confirm & Write Movement")');

    // 4. Admin goes to /admin/orders
    await page.goto('/admin/orders');
    await page.waitForSelector('text=Order Management & Fulfillment', { timeout: 15000 });

    // Find the order row and click View
    const viewBtn = page.locator(`tr:has-text("#${orderId.slice(0, 8)}") button:has-text("View")`).first();
    if (await viewBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await viewBtn.click();
    } else {
      // Click first view button if search wasn't specific
      await page.locator('button:has-text("View")').first().click();
    }

    await page.waitForSelector('text=State Transition Actions', { timeout: 10000 });

    // Transition from PAID -> PROCESSING
    const procBtn = page.locator('button:has-text("Mark Processing")');
    if (await procBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await procBtn.click();
      await page.waitForTimeout(1000);
    }

    // Transition from PROCESSING -> SHIPPED
    const shipBtn = page.locator('button:has-text("Mark Shipped")');
    await expect(shipBtn).toBeVisible({ timeout: 5000 });
    await shipBtn.click();
    await page.waitForTimeout(1000);

    // Publish tracking event
    const publishTrackingBtn = page.locator('button:has-text("Publish Tracking Event")');
    if (await publishTrackingBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await publishTrackingBtn.click();
      await page.fill('input[placeholder="e.g. Bengaluru Central Hub"]', 'Mumbai Central Hub');
      await page.fill('input[placeholder="e.g. Package arrived at local distribution center"]', 'Dispatched via BlueDart Express');
      await page.click('button:has-text("Publish Event")');
      await page.waitForTimeout(1000);
    }

    // 5. Customer verifies tracking updates
    await page.goto('/login');
    await page.fill('input[type="email"]', 'customer1@shopnest.com');
    await page.fill('input[type="password"]', 'Customer@123!');
    await page.click('button[type="submit"]');
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 });

    await page.goto(`/order-confirmation/${orderId}`);
    await page.waitForSelector('text=Courier Tracking Timeline', { timeout: 15000 });

    // Verify status is SHIPPED
    await expect(page.locator('text=SHIPPED').first()).toBeVisible({ timeout: 10000 });
    // Verify published tracking note is present
    await expect(page.locator('text=Dispatched via BlueDart Express')).toBeVisible({ timeout: 10000 });
  });
});
