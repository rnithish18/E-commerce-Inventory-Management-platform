import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Phase B: AI Image Upload, Vision Analysis & Visual Catalog Search', () => {
  const headphoneFixture = path.resolve('tests/fixtures/test_headphone.jpg');
  const cameraFixture = path.resolve('tests/fixtures/test_camera.png');

  test('Admin uploads product image, analyzes with AI vision, applies suggestions, and creates product', async ({ page }) => {
    // 1. Log in as Admin
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@shopnest.com');
    await page.fill('input[type="password"]', 'Admin@123!');
    await page.click('button[type="submit"]');
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 });

    // 2. Go to Admin Products
    await page.goto('/admin/products');
    await page.waitForSelector('button:has-text("Add New Product")', { timeout: 15000 });
    await page.click('button:has-text("Add New Product")');

    // 3. Attach image via ImageUploader input
    const fileInput = page.locator('input[type="file"][accept*="image/jpeg"]').first();
    await fileInput.setInputFiles(headphoneFixture);

    // Wait for image upload toast or thumbnail preview
    await expect(page.locator('text=Cover').first()).toBeVisible({ timeout: 10000 });

    // 4. Click "Analyze with AI"
    const analyzeBtn = page.locator('button:has-text("Analyze with AI")');
    await expect(analyzeBtn).toBeVisible();
    await analyzeBtn.click();

    // 5. Verify AI suggestion card appears with quality gauge
    await expect(page.locator('text=AI Vision Analysis & Suggestions')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('text=Image Listing Quality:')).toBeVisible();

    // 6. Click "Apply All Suggestions"
    const applyAllBtn = page.locator('button:has-text("Apply All Suggestions")');
    await expect(applyAllBtn).toBeVisible();
    await applyAllBtn.click();

    // Verify title is pre-filled
    const titleInput = page.locator('input[placeholder="e.g. Sony WH-1000XM5 Headphones"]');
    const titleVal = await titleInput.inputValue();
    expect(titleVal.length).toBeGreaterThan(3);

    // 7. Submit product creation
    const createBtn = page.locator('button:has-text("Create Product")');
    await expect(createBtn).toBeEnabled();
    await createBtn.click();

    // Verify product was created and modal closed
    await expect(page.locator('text=Add New Product to Storefront')).toBeHidden({ timeout: 10000 });
  });

  test('Customer opens Visual Search modal from Topbar, uploads photo, sees AI matches, and views product', async ({ page }) => {
    // 1. Visit Storefront Home
    await page.goto('/');

    // 2. Click the camera icon in the search bar
    const cameraBtn = page.locator('button[aria-label="Search by image (AI Vision)"]');
    await expect(cameraBtn).toBeVisible();
    await cameraBtn.click();

    // 3. Verify Visual Search modal opened
    await expect(page.locator('text=Search by Image')).toBeVisible();
    await expect(page.locator('text=AI Vision Powered')).toBeVisible();

    // 4. Upload query image
    const modalFileInput = page.locator('input[type="file"][accept*="image/jpeg"]').last();
    await modalFileInput.setInputFiles(cameraFixture);

    // 5. Verify matching products are displayed with similarity scores
    await expect(page.locator('text=Matching Products')).toBeVisible({ timeout: 15000 });
    const matchBadges = page.locator('text=/% match/');
    await expect(matchBadges.first()).toBeVisible({ timeout: 10000 });

    // 6. Click on the first matching product to navigate
    const firstProduct = page.locator('h4.truncate').first();
    await firstProduct.click();

    // Verify navigation to product detail page
    await page.waitForURL(/\/product\//, { timeout: 15000 });
    await expect(page.locator('button:has-text("Add to Cart")').first()).toBeVisible({ timeout: 10000 });
  });

  test.afterAll(async () => {
    // Ensure test isolation: clean up test created product so catalog is never polluted
    try {
      const { Pool } = require('../../backend/node_modules/pg');
      const pool = new Pool({
        connectionString:
          process.env.DATABASE_URL || 'postgresql://shopnest:shopnest123@localhost:5432/shopnest_db',
      });
      const res = await pool.query("SELECT id FROM products WHERE name ILIKE '%Studio Wireless%'");
      for (const row of res.rows) {
        await pool.query('DELETE FROM cart_items WHERE product_id = $1', [row.id]);
        await pool.query('DELETE FROM wishlists WHERE product_id = $1', [row.id]);
        await pool.query('DELETE FROM product_images WHERE product_id = $1', [row.id]);
        await pool.query('DELETE FROM product_variants WHERE product_id = $1', [row.id]);
        await pool.query('DELETE FROM products WHERE id = $1', [row.id]);
      }
      await pool.end();
    } catch (err) {
      console.error('Failed to clean up test product:', err);
    }
  });
});
