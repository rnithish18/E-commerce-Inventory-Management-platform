import { test, expect } from '@playwright/test';

test.describe('Part B: Store Pages, DPDP Compliance, Editorial Footers & Guest Tracking', () => {
  test('About page renders company story and inventory pillars', async ({ page }) => {
    await page.goto('/about');
    await expect(page.locator('h1:has-text("Bespoke Commerce Built on Inventory Transparency")')).toBeVisible();
    await expect(page.locator('text=Verified Inventory Only')).toBeVisible();
    await expect(page.locator('text=Pan-India Express Logistics')).toBeVisible();
  });

  test('Shipping & Returns page renders delivery timelines and return terms', async ({ page }) => {
    await page.goto('/shipping-returns');
    await expect(page.locator('h1:has-text("Shipping & Return Guidelines")')).toBeVisible();
    await expect(page.locator('text=24 to 48 Hours')).toBeVisible();
    await expect(page.locator('text=7-Day Easy Returns')).toBeVisible();
  });

  test('Privacy Policy page renders DPDP Act 2023 compliance specifications', async ({ page }) => {
    await page.goto('/privacy');
    await expect(page.locator('h1:has-text("Privacy Policy")')).toBeVisible();
    await expect(page.locator('text=Digital Personal Data Protection (DPDP) Act, 2023')).toBeVisible();
  });

  test('Terms of Service page renders contractual commerce terms', async ({ page }) => {
    await page.goto('/terms');
    await expect(page.locator('h1:has-text("Terms of Service")')).toBeVisible();
    await expect(page.locator('text=Acceptance of Terms')).toBeVisible();
  });

  test('FAQ page renders categories, search filter, and expandable accordions', async ({ page }) => {
    await page.goto('/faq');
    await expect(page.locator('h1:has-text("Frequently Asked Questions")')).toBeVisible();

    // Click on an FAQ accordion to expand
    const firstAccordion = page.locator('button:has-text("How do stock reservations work")');
    await expect(firstAccordion).toBeVisible();
    await firstAccordion.click();
    await expect(page.locator('text=30 minutes')).toBeVisible();

    // Filter via search
    const searchInput = page.locator('input[placeholder*="Search questions"]');
    await searchInput.fill('warranty');
    await expect(page.locator('text=Are all products genuine with manufacturer warranty?')).toBeVisible();
  });

  test('Contact page submits inquiry form to contact_messages table', async ({ page }) => {
    await page.goto('/contact');
    await expect(page.locator('h1:has-text("Contact Customer Care")')).toBeVisible();

    await page.fill('input[placeholder*="Priya Sharma"]', 'Test Customer');
    await page.fill('input[placeholder*="priya@example.com"]', 'testcontact@example.com');
    await page.fill('input[placeholder*="Order #8A34F9"]', 'Tracking Inquiry #12345');
    await page.fill('textarea', 'Can you provide the courier tracking number for my order?');

    await page.click('button:has-text("Transmit Message")');

    await expect(page.locator('h3:has-text("Message Dispatched Successfully")')).toBeVisible({ timeout: 8000 });
  });

  test('Guest Track Order page handles invalid lookup and informs user', async ({ page }) => {
    await page.goto('/track-order');
    await expect(page.locator('h1:has-text("Track Your Shipment")')).toBeVisible();

    await page.fill('input[placeholder*="34264d8a"]', 'invalid-order-uuid-999');
    await page.fill('input[type="email"]', 'unknown@example.com');
    await page.click('button:has-text("Search Shipment Status")');

    // Either the error card or a toast with the message is shown
    await expect(
      page.locator('text=No matching order found').or(page.locator('text=no matching order').or(page.locator('[role="alert"]')))
    ).toBeVisible({ timeout: 10000 });
  });

  test('Non-existent URL renders custom 404 page', async ({ page }) => {
    await page.goto('/department/non-existent-test-page-404');
    // Use first() — the path paragraph also contains '404' as part of the path text
    await expect(page.locator('p:has-text("404")').first()).toBeVisible();
    await expect(page.locator('h1:has-text("This page does not exist.")')).toBeVisible();
    await expect(page.locator('a:has-text("Go to Home")')).toBeVisible();
    await expect(page.locator('a:has-text("Browse Catalog")')).toBeVisible();
  });
});
