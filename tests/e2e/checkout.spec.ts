import { test, expect } from '@playwright/test';

test.describe('End-to-End Customer Checkout & Payment Workflow', () => {
  test('Customer logs in, adds product to cart, completes sandbox checkout, and views confirmed order', async ({ page }) => {
    // 1. Visit Login page
    await page.goto('/login');

    // 2. Sign in as demo customer
    await page.fill('input[type="email"]', 'customer1@shopnest.com');
    await page.fill('input[type="password"]', 'Customer@123!');
    await page.click('button[type="submit"]');

    // Wait for redirect away from login
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 });

    // 3. Navigate to Shop Catalog
    await page.goto('/shop');
    await page.waitForSelector('button:has-text("Add to Cart")', { timeout: 15000 });

    // 4. Click first "Add to Cart" button
    const addToCartBtn = page.locator('button:has-text("Add to Cart")').first();
    await expect(addToCartBtn).toBeVisible();
    await addToCartBtn.click();

    // 5. Navigate to Checkout
    await page.goto('/checkout');
    await page.waitForSelector('text=Checkout & Order Confirmation', { timeout: 15000 });

    // 6. Ensure delivery address is present
    const radioAddr = page.locator('input[name="delivery_address"]');
    const hasAddress = await radioAddr.first().isVisible({ timeout: 2000 }).catch(() => false);
    if (!hasAddress) {
      const addAddrBtn = page.locator('button:has-text("Add New Address")');
      if (await addAddrBtn.isVisible()) {
        await addAddrBtn.click();
      }

      await page.fill('input[placeholder="e.g. Rahul Sharma"]', 'Rahul Sharma');
      await page.fill('input[placeholder="Flat, House no., Building, Apartment"]', 'Flat 402, Skyline Towers');
      await page.fill('input[placeholder="Bengaluru"]', 'Bengaluru');
      await page.fill('input[placeholder="Karnataka"]', 'Karnataka');
      await page.fill('input[placeholder="560001"]', '560001');
      await page.fill('input[placeholder="10-digit mobile number"]', '9876543210');
      await page.click('button:has-text("Save & Deliver Here")');
      await page.waitForTimeout(1000);
    } else {
      await radioAddr.first().check();
    }

    // 7. Click Place Order & Pay (Test Sandbox)
    const payBtn = page.locator('button:has-text("Pay")').last();
    await expect(payBtn).toBeVisible({ timeout: 5000 });
    await payBtn.click();

    // 8. Verify Order Confirmation Page
    await page.waitForURL(/\/order-confirmation\//, { timeout: 20000 });
    await expect(page.locator('text=Payment Verified & Confirmed')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Thank you for your order!')).toBeVisible();

    // 9. Navigate to My Orders page
    await page.goto('/orders');
    await page.waitForSelector('text=My Orders & Tracking', { timeout: 15000 });
    await expect(page.locator('span:has-text("PAID")').first()).toBeVisible({ timeout: 10000 });
  });
});
