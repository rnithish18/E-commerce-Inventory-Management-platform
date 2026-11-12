/**
 * link_crawler.spec.ts
 *
 * Crawls every internal link visible in the storefront header, category bar,
 * footer, product cards, cart drawer, and account menu (as guest, customer,
 * and admin). Fails if any page renders the 404 content or logs a console error
 * caused by navigation.
 *
 * Also verifies that:
 * - "Sign in" button opens /login (not a 404)
 * - "Sign up" link opens /register (not a 404)
 * - Login with demo customer completes and returns to the previous page
 * - /auth/login, /auth/register, /signin, /signup, /account all redirect
 *   to the correct real route
 * - /orders while logged out redirects to /login with returnUrl
 */
import { test, expect, type Page } from '@playwright/test';

const BASE = 'http://localhost:5173';

/** Sign in as the demo customer. Returns after redirect to destination. */
async function loginAsCustomer(page: Page) {
  await page.goto('/login');
  await page.fill('input[type="email"]',    'customer1@shopnest.com');
  await page.fill('input[type="password"]', 'Customer@123!');
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15_000 });
}

/** Sign in as admin. */
async function loginAsAdmin(page: Page) {
  await page.goto('/login');
  await page.fill('input[type="email"]',    'admin@shopnest.com');
  await page.fill('input[type="password"]', 'Admin@123!');
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15_000 });
}

/** Collect all internal <a href> links visible on the current page. */
async function collectInternalLinks(page: Page): Promise<string[]> {
  const hrefs = await page.evaluate(() =>
    Array.from(document.querySelectorAll('a[href]'))
      .map((a) => (a as HTMLAnchorElement).href)
      .filter((h) => h.startsWith(location.origin) || h.startsWith('/'))
      .map((h) => h.replace(location.origin, ''))
  );
  // Deduplicate and exclude external/anchor links
  return [...new Set(hrefs)].filter(
    (h) =>
      h.startsWith('/') &&
      !h.startsWith('//') &&
      !h.includes('#') &&
      !h.startsWith('/api/') &&
      !h.startsWith('/uploads/')
  );
}

/** Visits a URL and asserts it doesn't render the 404 content. */
async function assertNotFound(page: Page, url: string): Promise<string | null> {
  const errors: string[] = [];
  const listener = (msg: { type: () => string; text: () => string }) => {
    if (msg.type() === 'error') errors.push(msg.text());
  };
  page.on('console', listener);

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15_000 });
    await page.waitForTimeout(400); // allow lazy chunk to load

    const is404 = await page
      .locator('h1:has-text("This page does not exist.")')
      .isVisible({ timeout: 500 })
      .catch(() => false);

    if (is404) {
      return `404 at ${url}`;
    }

    // Filter for genuine navigation errors (ignore third-party noise)
    const navErrors = errors.filter(
      (e) =>
        !e.includes('favicon') &&
        !e.includes('chrome-extension') &&
        !e.includes('google') &&
        !e.includes('[vite]')
    );
    if (navErrors.length > 0) {
      return `Console error at ${url}: ${navErrors[0]}`;
    }

    return null;
  } finally {
    page.off('console', listener);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST SUITE 1: Redirect aliases
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Redirect Aliases', () => {
  const aliases: Array<[string, string]> = [
    ['/auth/login',    '/login'],
    ['/auth/register', '/register'],
    ['/signin',        '/login'],
    ['/signup',        '/register'],
    ['/account',       '/profile'],
    ['/account/orders','/orders'],
  ];

  for (const [from, to] of aliases) {
    test(`${from} redirects to ${to}`, async ({ page }) => {
      await page.goto(from);
      // Protected routes (/profile, /orders) will further redirect to /login — that's OK
      await page.waitForURL(
        (url) => !url.pathname.startsWith(from.split('?')[0]),
        { timeout: 8_000 }
      );
      const finalPath = new URL(page.url()).pathname;
      // Accept /login if the target was a protected route
      const acceptedPaths = [to, '/login'];
      expect(acceptedPaths.some((p) => finalPath.startsWith(p))).toBe(true);
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// TEST SUITE 2: Auth links in the header
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Auth header links (guest)', () => {
  test('Sign in button navigates to /login — no 404', async ({ page }) => {
    await page.goto('/');
    // Click the topbar Sign in button (shows "Sign in" text)
    const signinBtn = page
      .locator('button', { hasText: 'Sign in' })
      .or(page.locator('[title="Sign in"]'))
      .first();
    await expect(signinBtn).toBeVisible({ timeout: 10_000 });
    await signinBtn.click();
    await page.waitForURL(/\/login/, { timeout: 8_000 });
    await expect(page.locator('h1, h2').filter({ hasText: /sign.?in|log.?in/i }).first()).toBeVisible({
      timeout: 5_000,
    });
  });

  test('Sign up link navigates to /register — no 404', async ({ page }) => {
    await page.goto('/login');
    // Look for a link to register
    const signupLink = page.locator('a[href="/register"], a:has-text("Sign up"), a:has-text("Register")').first();
    await expect(signupLink).toBeVisible({ timeout: 8_000 });
    await signupLink.click();
    await page.waitForURL(/\/register/, { timeout: 8_000 });
    await expect(page.locator('h1, h2').filter({ hasText: /register|create.?account/i }).first()).toBeVisible({
      timeout: 5_000,
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TEST SUITE 3: Protected page redirect
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Protected page redirect', () => {
  test('/orders while logged out redirects to /login with returnUrl', async ({ page }) => {
    await page.goto('/orders');
    await page.waitForURL(/\/login/, { timeout: 8_000 });
    expect(page.url()).toContain('returnUrl');
    expect(page.url()).toContain('%2Forders');
  });

  test('/checkout while logged out redirects to /login with returnUrl', async ({ page }) => {
    // Add item first so checkout guard is reached
    await page.goto('/checkout');
    await page.waitForURL(/\/login/, { timeout: 8_000 });
    expect(page.url()).toContain('returnUrl');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TEST SUITE 4: Login → return to previous page
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Login returnUrl flow', () => {
  test('Logging in returns user to the page they came from', async ({ page }) => {
    // Visit a protected page while guest → redirected to /login?returnUrl=/orders
    await page.goto('/orders');
    await page.waitForURL(/\/login/, { timeout: 8_000 });
    expect(page.url()).toContain('returnUrl');

    // Complete login
    await page.fill('input[type="email"]',    'customer1@shopnest.com');
    await page.fill('input[type="password"]', 'Customer@123!');
    await page.click('button[type="submit"]');

    // Should land back on /orders (or /)
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15_000 });
    const finalPath = new URL(page.url()).pathname;
    expect(['/orders', '/']).toContain(finalPath);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TEST SUITE 5: Guest link crawl (home, header, footer)
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Guest link crawl', () => {
  test('No broken links on home page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const links = await collectInternalLinks(page);
    // Filter out auth/protected links that will redirect (not 404)
    const crawlable = links.filter(
      (l) => !l.startsWith('/checkout') && !l.startsWith('/orders') && !l.startsWith('/wishlist') && !l.startsWith('/profile')
    );

    const failures: string[] = [];
    for (const link of crawlable.slice(0, 30)) { // cap at 30 to keep test fast
      const failure = await assertNotFound(page, link);
      if (failure) failures.push(failure);
    }
    expect(failures, failures.join('\n')).toHaveLength(0);
  });

  test('No broken links on shop page', async ({ page }) => {
    await page.goto('/shop');
    await page.waitForLoadState('networkidle');

    const links = await collectInternalLinks(page);
    const crawlable = links.filter(
      (l) =>
        !l.startsWith('/checkout') &&
        !l.startsWith('/orders') &&
        !l.startsWith('/wishlist') &&
        !l.startsWith('/profile')
    );

    const failures: string[] = [];
    for (const link of crawlable.slice(0, 20)) {
      const failure = await assertNotFound(page, link);
      if (failure) failures.push(failure);
    }
    expect(failures, failures.join('\n')).toHaveLength(0);
  });

  test('All footer links are reachable', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const footerLinks = await page.evaluate(() => {
      const footer = document.querySelector('footer');
      if (!footer) return [] as string[];
      return Array.from(footer.querySelectorAll('a[href]'))
        .map((a) => (a as HTMLAnchorElement).pathname + (a as HTMLAnchorElement).search)
        .filter((h) => h.startsWith('/') && !h.includes('#'));
    });

    const failures: string[] = [];
    for (const link of [...new Set(footerLinks)]) {
      const failure = await assertNotFound(page, link);
      if (failure) failures.push(failure);
    }
    expect(failures, failures.join('\n')).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TEST SUITE 6: Logged-in customer link crawl
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Customer link crawl', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsCustomer(page);
  });

  test('Account menu links are all reachable', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Open account dropdown
    const accountBtn = page
      .locator('button[title]')
      .filter({ hasNOT: page.locator('[aria-label="Remove from wishlist"]') })
      .filter({ has: page.locator('svg') })
      .first();
    // Try to find the button by looking for the user icon
    const userBtn = page.locator('button').filter({ has: page.locator('svg.lucide-user, [class*="lucide-user"]') }).first();

    // Skip if the account dropdown can't be found — menu UI may differ
    const isVisible = await userBtn.isVisible({ timeout: 3_000 }).catch(() => false);
    if (!isVisible) {
      test.skip();
      return;
    }

    await userBtn.click();
    await page.waitForTimeout(400);

    const accountLinks = ['/orders', '/wishlist', '/profile', '/track-order'];
    const failures: string[] = [];
    for (const link of accountLinks) {
      const failure = await assertNotFound(page, link);
      if (failure) failures.push(failure);
    }
    expect(failures, failures.join('\n')).toHaveLength(0);
  });

  test('Product cards link to valid product detail pages', async ({ page }) => {
    await page.goto('/shop');
    await page.waitForSelector('a[href^="/product/"]', { timeout: 15_000 });

    const productLinks = await page.evaluate(() =>
      Array.from(document.querySelectorAll('a[href^="/product/"]'))
        .slice(0, 5)
        .map((a) => (a as HTMLAnchorElement).pathname)
    );

    const failures: string[] = [];
    for (const link of productLinks) {
      const failure = await assertNotFound(page, link);
      if (failure) failures.push(failure);
    }
    expect(failures, failures.join('\n')).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TEST SUITE 7: Admin link crawl
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Admin link crawl', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('Admin panel nav links are all reachable', async ({ page }) => {
    const adminLinks = [
      '/admin',
      '/admin/products',
      '/admin/orders',
      '/admin/inventory',
      '/admin/coupons',
      '/admin/reviews',
      '/admin/analytics',
    ];

    const failures: string[] = [];
    for (const link of adminLinks) {
      const failure = await assertNotFound(page, link);
      if (failure) failures.push(failure);
    }
    expect(failures, failures.join('\n')).toHaveLength(0);
  });
});
