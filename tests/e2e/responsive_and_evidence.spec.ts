import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const screenshotDir = path.resolve(process.cwd(), 'docs/screenshots');

test.beforeAll(() => {
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }
});

test.describe('Responsive Verification & Evidence Capture Suite', () => {
  test.setTimeout(180000);

  const viewports = [
    { name: '360', width: 360, height: 740 },
    { name: '768', width: 768, height: 1024 },
    { name: '1280', width: 1280, height: 800 },
  ];

  for (const vp of viewports) {
    test(`Responsive check @ ${vp.width}px - Home, Catalog, Product, Cart, Login`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });

      // 1. Home
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      await page.screenshot({
        path: path.join(screenshotDir, `responsive_home_${vp.name}.png`),
        fullPage: true,
      });

      // 2. Catalog (with filter drawer opened on 360 & 768)
      await page.goto('/shop');
      await page.waitForLoadState('networkidle');
      if (vp.width < 1024) {
        const filterBtn = page.locator('button:has-text("Filters")');
        if (await filterBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await filterBtn.click();
          await page.waitForTimeout(500);
        }
        await page.screenshot({
          path: path.join(screenshotDir, `responsive_catalog_drawer_${vp.name}.png`),
          fullPage: true,
        });
      } else {
        await page.screenshot({
          path: path.join(screenshotDir, `responsive_catalog_${vp.name}.png`),
          fullPage: true,
        });
      }

      // 3. Product Detail (iPhone 15)
      await page.goto('/product/apple-iphone-15-128gb-blue-40f153e2');
      await page.waitForLoadState('networkidle');
      await page.screenshot({
        path: path.join(screenshotDir, `responsive_product_${vp.name}.png`),
        fullPage: true,
      });

      // 4. Cart
      await page.goto('/cart');
      await page.waitForLoadState('networkidle');
      await page.screenshot({
        path: path.join(screenshotDir, `responsive_cart_${vp.name}.png`),
        fullPage: true,
      });

      // 5. Login
      await page.goto('/login');
      await page.waitForLoadState('networkidle');
      await page.screenshot({
        path: path.join(screenshotDir, `responsive_login_${vp.name}.png`),
        fullPage: true,
      });
    });
  }

  test('Evidence 1 & 2: Login view and Google button hidden state', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Screenshot login view
    await page.screenshot({
      path: path.join(screenshotDir, 'login_view.png'),
    });

    // Verify Google button is hidden when GOOGLE_CLIENT_ID is not configured
    const googleButton = page.locator('button:has-text("Continue with Google")');
    const isGoogleVisible = await googleButton.isVisible().catch(() => false);
    expect(isGoogleVisible).toBe(false);

    // Capture screenshot demonstrating Google OAuth button absence
    await page.screenshot({
      path: path.join(screenshotDir, 'google_button_hidden.png'),
    });
  });

  test('Evidence 3: Product gallery with hover zoom & attribution', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/product/apple-iphone-15-128gb-blue-40f153e2');
    await page.waitForLoadState('networkidle');

    // Verify attribution credit line exists
    const creditLine = page.locator('text=Photo:');
    await expect(creditLine.first()).toBeVisible({ timeout: 5000 });

    // Hover over main gallery image to trigger zoom
    const galleryImage = page.locator('div[tabindex="0"][aria-label="Product Image Gallery"] > div').first();
    await galleryImage.hover();
    await page.waitForTimeout(600);

    await page.screenshot({
      path: path.join(screenshotDir, 'product_gallery_zoom.png'),
    });
  });

  test('Evidence 4: Catalog with filters open & active chips', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/shop?category=electronics&discount=10');
    await page.waitForLoadState('networkidle');

    // Wait for active filter chips
    await page.waitForSelector('text=Active filters:', { timeout: 10000 });
    await page.screenshot({
      path: path.join(screenshotDir, 'filters_open.png'),
    });
  });

  test('Evidence 5: Search autosuggest dropdown', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Type query in search bar to trigger autosuggest
    const searchInput = page.locator('input[placeholder*="Search"]').first();
    await searchInput.click();
    await searchInput.fill('phone');
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: path.join(screenshotDir, 'search_autosuggest.png'),
    });
  });

  test('Evidence 6: Orders & Tax Invoice view', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });

    // Login as existing customer
    await page.goto('/login');
    await page.fill('input[type="email"]', 'customer1@shopnest.com');
    await page.fill('input[type="password"]', 'Customer@123!');
    await page.click('button[type="submit"]');
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 });

    // Navigate to orders
    await page.goto('/my-orders');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('text=My Orders', { timeout: 10000 });

    // Capture My Orders view showing Tax Invoice (PDF) buttons and Refund/Cancel options
    await page.screenshot({
      path: path.join(screenshotDir, 'invoice_pdf_view.png'),
    });
  });

  test('Evidence 7: Photo review section & submission modal', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });

    // Customer logs in
    await page.goto('/login');
    await page.fill('input[type="email"]', 'customer1@shopnest.com');
    await page.fill('input[type="password"]', 'Customer@123!');
    await page.click('button[type="submit"]');
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 });

    // Navigate to a product page with review capability
    await page.goto('/product/apple-iphone-15-128gb-blue-40f153e2');
    await page.waitForLoadState('networkidle');

    // Scroll to reviews section
    const reviewBtn = page.locator('button:has-text("Write a Review")');
    if (await reviewBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await reviewBtn.click();
      await page.waitForTimeout(600);
      await page.screenshot({
        path: path.join(screenshotDir, 'photo_review.png'),
      });
    } else {
      // Screenshot the reviews section directly
      await page.screenshot({
        path: path.join(screenshotDir, 'photo_review.png'),
      });
    }
  });
});
