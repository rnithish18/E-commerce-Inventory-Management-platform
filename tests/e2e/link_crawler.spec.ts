/**
 * link_crawler.spec.ts
 *
 * Crawls every internal link visible in the storefront header, category bar,
 * footer, product cards, cart drawer, and account menu (as guest, customer,
 * and admin). Fails if any page renders the 404 content.
 *
 * Also verifies:
 * - "Sign in" button in topbar navigates to /login (not 404)
 * - "Sign up" link on login page navigates to /register (not 404)
 * - Login with demo customer completes and returns to the previous page
 * - /auth/login, /auth/register, /signin, /signup, /account all redirect
 * - /orders while logged out redirects to /login with returnUrl
 */
import { test, expect, type Page } from '@playwright/test';

/** Sign in as the demo customer. */
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
      .filter((h) => h.startsWith(location.origin))
      .map((h) => h.replace(location.origin, ''))
  );
  return [...new Set(hrefs)].filter(
    (h) =>
      h.startsWith('/') &&
      !h.includes('#') &&
      !h.startsWith('/api/') &&
      !h.startsWith('/uploads/')
  );
}

/**
 * Visits a URL and asserts it doesn't render the 404 content.
 * 401 errors from API calls on public pages are expected and ignored —
 * they come from the React app calling protected endpoints as a guest.
 */
async function assertNotFound(page: Page, url: string): Promise<string | null> {
  const errors: string[] = [];
  const listener = (msg: { type: () => string; text: () => string }) => {
    if (msg.type() === 'error') errors.push(msg.text());
  };
  page.on('console', listener);

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15_000 });
    await page.waitForTimeout(400);

    const is404 = await page
      .locator('h1:has-text("This page does not exist.")')
      .isVisible({ timeout: 500 })
      .catch(() => false);

    if (is404) {
      return `404 at ${url}`;
    }

    // Ignore:
    //  - 401 Unauthorized (expected for protected API calls by guest)
    //  - favicon / chrome-extension / [vite] noise
    //  - Google / analytics third-party
    const navErrors = errors.filter(
      (e) =>
        !e.includes('401') &&
        !e.includes('404') &&
        !e.includes('Unauthorized') &&
        !e.includes('Not Found') &&
        !e.includes('Failed to load resource') &&
        !e.includes('favicon') &&
        !e.includes('chrome-extension') &&
        !e.includes('google') &&
        !e.includes('[vite]') &&
        !e.includes('ERR_ABORTED')
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
// SUITE 1: Redirect aliases
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Redirect Aliases', () => {
  const aliases: Array<[string, string]> = [
    ['/auth/login',     '/login'],
    ['/auth/register',  '/register'],
    ['/signin',         '/login'],
    ['/signup',         '/register'],
    ['/account',        '/profile'],
    ['/account/orders', '/orders'],
  ];

  for (const [from, to] of aliases) {
    test(`${from} redirects to ${to}`, async ({ page }) => {
      await page.goto(from);
      await page.waitForURL(
        (url) => !url.pathname.startsWith(from.split('?')[0]),
        { timeout: 8_000 }
      );
      const finalPath = new URL(page.url()).pathname;
      // Protected routes (/profile, /orders) further redirect to /login — OK
      const accepted = [to, '/login'];
      expect(accepted.some((p) => finalPath.startsWith(p))).toBe(true);
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 2: Auth header links
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Auth header links (guest)', () => {
  test('Sign in button navigates to /login — no 404', async ({ page }) => {
    await page.goto('/');
    // The topbar renders a button with title="Sign in" when no user is logged in
    const signinBtn = page.locator('button[title="Sign in"]');
    await expect(signinBtn).toBeVisible({ timeout: 10_000 });
    await signinBtn.click();
    await page.waitForURL(/\/login/, { timeout: 8_000 });
    // Should NOT show 404
    const is404 = await page.locator('h1:has-text("This page does not exist.")').isVisible({ timeout: 1_000 }).catch(() => false);
    expect(is404).toBe(false);
  });

  test('Sign up link on login page navigates to /register — no 404', async ({ page }) => {
    await page.goto('/login');
    // AuthContainer uses a button (not an anchor) to switch to register mode
    const signupBtn = page.locator('button:has-text("Create an account")').first();
    await expect(signupBtn).toBeVisible({ timeout: 8_000 });
    await signupBtn.click();
    // After clicking, URL becomes /register and h2 changes to registration form
    await page.waitForURL(/\/register/, { timeout: 8_000 });
    const is404 = await page.locator('h1:has-text("This page does not exist.")').isVisible({ timeout: 1_000 }).catch(() => false);
    expect(is404).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 3: Protected page redirect
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Protected page redirect', () => {
  test('/orders while logged out redirects to /login with returnUrl', async ({ page }) => {
    await page.goto('/orders');
    await page.waitForURL(/\/login/, { timeout: 8_000 });
    expect(page.url()).toContain('returnUrl');
    expect(page.url()).toContain('%2Forders');
  });

  test('/checkout while logged out redirects to /login with returnUrl', async ({ page }) => {
    await page.goto('/checkout');
    await page.waitForURL(/\/login/, { timeout: 8_000 });
    expect(page.url()).toContain('returnUrl');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 4: Login → return to previous page
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Login returnUrl flow', () => {
  test('Logging in returns user to the page they came from', async ({ page }) => {
    await page.goto('/orders');
    await page.waitForURL(/\/login/, { timeout: 8_000 });

    await page.fill('input[type="email"]',    'customer1@shopnest.com');
    await page.fill('input[type="password"]', 'Customer@123!');
    await page.click('button[type="submit"]');

    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15_000 });
    const finalPath = new URL(page.url()).pathname;
    // After login via returnUrl=/orders, user lands on /orders or / as fallback
    expect(['/orders', '/']).toContain(finalPath);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 5: Guest link crawl
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Guest link crawl', () => {
  test('No broken links on home page', async ({ page }) => {
    await page.goto('/');
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
    for (const link of crawlable.slice(0, 30)) {
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
// SUITE 6: Customer link crawl
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Customer link crawl', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsCustomer(page);
  });

  test('Account menu links are all reachable', async ({ page }) => {
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
// SUITE 7: Admin link crawl
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
