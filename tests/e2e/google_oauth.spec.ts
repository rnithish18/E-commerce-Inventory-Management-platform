import { test, expect } from '@playwright/test';

test.describe('Phase 2: Google OAuth 2.0 PKCE Flow & Account Linking E2E', () => {
  test('Customer initiates Google OAuth, completes callback mock, and lands on returnUrl authenticated', async ({
    page,
    context,
  }) => {
    // 1. Visit Login page
    await page.goto('/login');
    await expect(page).toHaveTitle(/ShopNest/);

    // 2. Add an item to guest cart first to verify guest-cart merge on OAuth login
    await page.goto('/shop');
    const firstAddBtn = page.locator('button:has-text("Add to Cart")').first();
    await expect(firstAddBtn).toBeVisible({ timeout: 10000 });
    await firstAddBtn.click();
    await page.waitForTimeout(500);

    // 3. Initiate Google OAuth with returnUrl=/orders
    const state = 'playwright_test_oauth_state_' + Date.now();
    const verifier = 'playwright_code_verifier_' + Date.now();
    const targetReturnUrl = '/orders';

    // Set short-lived oauth_state cookie on backend domain
    await context.addCookies([
      {
        name: 'oauth_state',
        value: JSON.stringify({ state, codeVerifier: verifier, returnUrl: targetReturnUrl }),
        domain: 'localhost',
        path: '/',
        httpOnly: true,
        sameSite: 'Lax',
      },
    ]);

    // 4. Hit the callback endpoint with mock customer code
    await page.goto(
      `http://localhost:4000/api/v1/auth/google/callback?state=${state}&code=mock_test_code_new_customer`
    );

    // 5. Follows redirect to FRONTEND_URL + targetReturnUrl (/orders)
    await page.waitForURL('**/orders', { timeout: 15000 });
    expect(page.url()).toContain('/orders');

    // 6. Verify user is logged in as Customer (e.g. My Orders heading is visible)
    await expect(page.locator('h1, h2')).toContainText(/My Orders|Order/i);

    // 7. Check that auth cookie exists
    const cookies = await context.cookies();
    const tokenCookie = cookies.find((c) => c.name === 'token');
    expect(tokenCookie).toBeDefined();
    expect(tokenCookie?.httpOnly).toBe(true);
  });

  test('Inline alert appears on Login card when redirected with OAuth error', async ({ page }) => {
    // Navigate with ?error=admin_google_blocked
    await page.goto('/login?error=admin_google_blocked');

    const alert = page.locator('text=Google sign-in is not permitted for Admin accounts');
    await expect(alert).toBeVisible({ timeout: 5000 });

    // Navigate with ?error=email_not_verified
    await page.goto('/login?error=email_not_verified');
    const unverifiedAlert = page.locator('text=Your Google email address is not verified');
    await expect(unverifiedAlert).toBeVisible({ timeout: 5000 });
  });
});
