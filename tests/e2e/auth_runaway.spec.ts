import { test, expect } from '@playwright/test';

test.describe('Phase A Auth Experience & Runaway Button E2E Tests', () => {
  test('Runaway button evades mouse pointer on hover when form is empty or invalid, with 3-dodge escape hatch', async ({ page }) => {
    await page.goto('/login');

    const submitBtn = page.locator('button[type="submit"]');
    await expect(submitBtn).toBeVisible();

    // 1. Initial position should have 0 translation
    const initialTransform = await submitBtn.evaluate((el) => window.getComputedStyle(el).transform);

    // 2. Hover over empty button - should trigger evasion
    await submitBtn.hover({ force: true });
    await page.waitForTimeout(400);

    const firstDodgeTransform = await submitBtn.evaluate((el) => window.getComputedStyle(el).transform);
    expect(firstDodgeTransform).not.toBe(initialTransform);

    // Hint should appear
    const hint = page.locator('text=Fill in your email first!').or(page.locator('text=Password is required!')).or(page.locator("text=I don't open for empty forms!"));
    await expect(hint.first()).toBeVisible({ timeout: 5000 });

    // 3. Dodge 2nd and 3rd time by moving pointer away and re-entering to trigger escape hatch
    await page.mouse.move(0, 0);
    await page.waitForTimeout(200);
    await submitBtn.hover({ force: true });
    await page.waitForTimeout(400);

    await page.mouse.move(0, 0);
    await page.waitForTimeout(200);
    await submitBtn.hover({ force: true });
    await page.waitForTimeout(400);

    // Escape hatch message should show
    const escapeHatch = page.locator('text=Okay, fine! Fill the fields below');
    await expect(escapeHatch).toBeVisible({ timeout: 5000 });
  });

  test('Runaway button resets to origin and enables normal submission when valid credentials are entered', async ({ page }) => {
    await page.goto('/login');

    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    const submitBtn = page.locator('button[type="submit"]');

    // Fill valid credentials
    await emailInput.fill('customer1@shopnest.com');
    await passwordInput.fill('Customer@123!');

    await page.waitForTimeout(300);

    // Transform should be reset to 0
    const validTransform = await submitBtn.evaluate((el) => window.getComputedStyle(el).transform);
    // In CSS matrix, translate3d(0, 0, 0) or none or matrix(1, 0, 0, 1, 0, 0)
    expect(validTransform).toMatch(/matrix\(1,\s*0,\s*0,\s*1,\s*0,\s*0\)|none/);

    // Clicking submits and redirects to home
    await submitBtn.click();
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 });
  });

  test('Keyboard Tab navigation disables evasion and allows direct keyboard submission', async ({ page }) => {
    await page.goto('/login');

    // Focus email then password then submit button using keyboard
    const emailInput = page.locator('input[type="email"]');
    await emailInput.focus();
    await emailInput.fill('customer1@shopnest.com');
    await page.keyboard.press('Tab'); // to password input

    const passwordInput = page.locator('input[type="password"]');
    await passwordInput.fill('Customer@123!');

    // Tab through remember me to submit button
    await page.keyboard.press('Tab'); // password toggle or checkbox
    const submitBtn = page.locator('button[type="submit"]');
    await submitBtn.focus();

    // Verify submit button is focused
    await expect(submitBtn).toBeFocused();

    // Press Enter to submit
    await page.keyboard.press('Enter');
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 });
  });

  test('Wrong credentials show error toast and do not redirect', async ({ page }) => {
    await page.goto('/login');

    await page.locator('input[type="email"]').fill('customer1@shopnest.com');
    await page.locator('input[type="password"]').fill('WrongPassword999!');
    await page.click('button[type="submit"]');

    // Toast error should appear
    await expect(page.locator('text=Invalid').first()).toBeVisible({ timeout: 10000 });
    expect(page.url()).toContain('/login');
  });

  test('Seamless animated toggle between Login and Sign Up updates URL and displays live Password Strength Meter', async ({ page }) => {
    await page.goto('/login');

    // Switch to Register
    const createAccountBtn = page.locator('button:has-text("Create an account")');
    await expect(createAccountBtn).toBeVisible();
    await createAccountBtn.click();

    // URL should change to /register
    await page.waitForURL(/\/register/, { timeout: 5000 });
    await expect(page.locator('text=Create an Account')).toBeVisible();

    // Type in registration password and check strength meter
    const regPasswordInput = page.locator('input[type="password"]');
    await regPasswordInput.fill('weak');
    await expect(page.locator('text=Password strength:')).toBeVisible();
    await expect(page.locator('text=Too Weak').or(page.locator('text=Weak'))).toBeVisible();

    // Make password strong
    await regPasswordInput.fill('SuperStrong@Pass123');
    await expect(page.locator('text=Strong')).toBeVisible();

    // Switch back to Login
    const signInBtn = page.locator('button:has-text("Sign In")').last();
    await signInBtn.click();
    await page.waitForURL(/\/login/, { timeout: 5000 });
    await expect(page.locator('text=Welcome Back')).toBeVisible();
  });

  test('Registration of new customer account completes successfully and redirects', async ({ page }) => {
    await page.goto('/register');

    const uniqueEmail = `test_phasea_${Date.now()}@shopnest.com`;
    await page.locator('input[placeholder="Rohit Sharma"]').fill('Priya Patel');
    await page.locator('input[placeholder="rohit@example.com"]').fill(uniqueEmail);
    await page.locator('input[placeholder="9876543210"]').fill('9123456789');
    await page.locator('input[type="password"]').fill('SecurePassword@2026');

    const agreeRegisterBtn = page.locator('button:has-text("Agree & Register")');
    await expect(agreeRegisterBtn).toBeEnabled();
    await agreeRegisterBtn.click();

    await page.waitForURL((url) => !url.pathname.includes('/register'), { timeout: 15000 });
  });

  test('Forgot password modal accepts email and displays confirmation', async ({ page }) => {
    await page.goto('/login');

    // Click "Forgot password?"
    await page.locator('button:has-text("Forgot password?")').click();

    await expect(page.locator('text=Reset Password')).toBeVisible();
    await page.locator('input[placeholder="name@example.com"]').last().fill('customer1@shopnest.com');
    await page.locator('button:has-text("Send Reset Link")').click();

    await expect(page.getByRole('heading', { name: 'Reset Link Dispatched' })).toBeVisible({ timeout: 10000 });
  });
});
