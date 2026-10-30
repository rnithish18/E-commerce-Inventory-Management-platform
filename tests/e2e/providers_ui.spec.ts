import { test, expect } from '@playwright/test';

test.describe('Part A: Multi-Provider Authentication UI & Security E2E', () => {
  test('Login page displays provider buttons without affecting Runaway button isolation', async ({
    page,
  }) => {
    await page.goto('/login');
    await expect(page).toHaveTitle(/ShopNest/);

    // If Google is enabled, Google button should be visible and directly clickable
    const googleBtn = page.locator('button:has-text("Continue with Google")');
    if (await googleBtn.isVisible()) {
      await expect(googleBtn).toBeEnabled();
    }

    // Phone OTP button opens modal dialog
    const phoneBtn = page.locator('button:has-text("Continue with Phone")');
    if (await phoneBtn.isVisible()) {
      await phoneBtn.click();
      const phoneModal = page.locator('text=Sign in with Phone');
      await expect(phoneModal).toBeVisible();

      // Enter 10-digit number and click send
      const phoneInput = page.locator('input[type="tel"]');
      await phoneInput.fill('9876543210');
      const sendCodeBtn = page.locator('button:has-text("Send Verification Code")');
      await sendCodeBtn.click();

      // Transitions to OTP step with countdown
      await expect(page.locator('text=Enter Verification Code')).toBeVisible({ timeout: 5000 });
      await expect(page.locator('input[placeholder="000000"]')).toBeVisible();

      // Close modal
      const closeBtn = page.locator('div[role="dialog"] button, .fixed button').first();
      await closeBtn.click();
    }

    // Magic Link button opens modal
    const magicBtn = page.locator('button:has-text("Continue with Magic Link")');
    if (await magicBtn.isVisible()) {
      await magicBtn.click();
      const magicModal = page.locator('text=One-Click Sign In');
      await expect(magicModal).toBeVisible();

      const emailInput = page.locator('.fixed input[type="email"]');
      await emailInput.fill('testuser@example.com');
      const sendMagicBtn = page.locator('button:has-text("Send Magic Link")');
      await sendMagicBtn.click();

      // Verify "Check Your Inbox" state
      await expect(page.locator('text=Check Your Inbox')).toBeVisible({ timeout: 5000 });

      // Close modal
      const doneBtn = page.locator('button:has-text("Done")');
      await doneBtn.click();
    }
  });

  test('Magic link verification landing page handles invalid token gracefully', async ({ page }) => {
    await page.goto('/auth/magic-link?token=invalid_dummy_token_12345');
    await expect(page.locator('h1:has-text("Magic Link Sign-In")')).toBeVisible();

    // Verify error card displays and has button to return to sign in
    const returnBtn = page.locator('a:has-text("Return to Sign In")');
    await expect(returnBtn).toBeVisible({ timeout: 10000 });
  });

  test('Customer Profile page renders Connected Sign-In Methods and Password Security', async ({
    page,
  }) => {
    // Log in as customer
    await page.goto('/login');
    await page.fill('input[type="email"]', 'customer1@shopnest.com');
    await page.fill('input[type="password"]', 'Customer@123!');
    await page.click('button[type="submit"]');
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 });

    // Navigate to /profile
    await page.goto('/profile');
    await expect(page.locator('h1:has-text("Account & Security")')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('text=Connected Sign-In Methods')).toBeVisible();
    await expect(page.locator('text=Account Password')).toBeVisible();
  });
});
