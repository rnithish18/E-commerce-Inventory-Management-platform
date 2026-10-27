import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../backend/src/app';
import { setGoogleExchangeMock } from '../../backend/src/services/googleAuth';
import { query } from '../../backend/src/db/query';

describe('Google OAuth 2.0 PKCE Flow API Tests', () => {
  beforeAll(async () => {
    // Ensure test environment variables
    process.env.GOOGLE_CLIENT_ID = 'test-google-client-id.apps.googleusercontent.com';
    process.env.GOOGLE_CLIENT_SECRET = 'test-google-client-secret';
  });

  afterAll(() => {
    setGoogleExchangeMock(null);
  });

  it('GET /api/v1/auth/providers reports Google availability accurately', async () => {
    const res = await request(app).get('/api/v1/auth/providers');
    expect(res.status).toBe(200);
    expect(res.body.google).toBe(true);
    expect(res.body.providers.google).toBe(true);
  });

  it('GET /api/v1/auth/google initiates PKCE flow and sets httpOnly state cookie', async () => {
    const res = await request(app)
      .get('/api/v1/auth/google?returnUrl=/cart')
      .expect(302);

    expect(res.headers.location).toContain('https://accounts.google.com/o/oauth2/v2/auth');
    expect(res.headers.location).toContain('code_challenge=');
    expect(res.headers.location).toContain('code_challenge_method=S256');
    expect(res.headers.location).toContain('state=');

    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    const stateCookie = cookies.find((c: string) => c.startsWith('oauth_state='));
    expect(stateCookie).toBeDefined();
    expect(stateCookie).toContain('HttpOnly');
    expect(stateCookie).toContain('SameSite=Lax');
  });

  it('GET /api/v1/auth/google sanitizes malicious open-redirect returnUrl to "/"', async () => {
    const res = await request(app)
      .get('/api/v1/auth/google?returnUrl=https://evil-phishing.com')
      .expect(302);

    const cookies = res.headers['set-cookie'];
    const stateCookie = cookies.find((c: string) => c.startsWith('oauth_state='));
    const cookieVal = decodeURIComponent(stateCookie.split(';')[0].replace('oauth_state=', ''));
    const parsed = JSON.parse(cookieVal);
    expect(parsed.returnUrl).toBe('/');
  });

  it('GET /api/v1/auth/google/callback fails with invalid_state when cookie is missing', async () => {
    const res = await request(app)
      .get('/api/v1/auth/google/callback?state=fake_state&code=test_code')
      .expect(302);

    expect(res.headers.location).toContain('/login?error=invalid_state');
  });

  it('GET /api/v1/auth/google/callback redirects with access_denied if Google reports user cancelled', async () => {
    const mockStateCookie = encodeURIComponent(
      JSON.stringify({ state: 'valid_state_123', codeVerifier: 'verifier_abc', returnUrl: '/shop' })
    );

    const res = await request(app)
      .get('/api/v1/auth/google/callback?state=valid_state_123&error=access_denied')
      .set('Cookie', [`oauth_state=${mockStateCookie}`])
      .expect(302);

    expect(res.headers.location).toContain('/login?error=access_denied');
  });

  it('GET /api/v1/auth/google/callback rejects unverified Google emails with email_not_verified', async () => {
    setGoogleExchangeMock(async () => ({
      sub: 'google_sub_unverified',
      email: 'unverified@example.com',
      email_verified: false,
      name: 'Unverified User',
    }));

    const mockStateCookie = encodeURIComponent(
      JSON.stringify({ state: 'state_unverified', codeVerifier: 'verifier_xyz', returnUrl: '/cart' })
    );

    const res = await request(app)
      .get('/api/v1/auth/google/callback?state=state_unverified&code=mock_code')
      .set('Cookie', [`oauth_state=${mockStateCookie}`])
      .expect(302);

    expect(res.headers.location).toContain('/login?error=email_not_verified');
  });

  it('SECURITY: Google sign-in strictly rejects ADMIN accounts with admin_google_blocked', async () => {
    setGoogleExchangeMock(async () => ({
      sub: 'google_sub_admin_attempt',
      email: 'admin@shopnest.com',
      email_verified: true,
      name: 'ShopNest Admin',
    }));

    const mockStateCookie = encodeURIComponent(
      JSON.stringify({ state: 'state_admin_attempt', codeVerifier: 'verifier_admin', returnUrl: '/admin/dashboard' })
    );

    const res = await request(app)
      .get('/api/v1/auth/google/callback?state=state_admin_attempt&code=mock_code')
      .set('Cookie', [`oauth_state=${mockStateCookie}`])
      .expect(302);

    expect(res.headers.location).toContain('/login?error=admin_google_blocked');
    // Ensure no auth cookie was issued
    const cookies = res.headers['set-cookie'] || [];
    const authCookie = cookies.find((c: string) => c.startsWith('token=') && !c.includes('Expires=Thu, 01 Jan 1970'));
    expect(authCookie).toBeUndefined();
  });

  it('GET /api/v1/auth/google/callback successfully creates a new CUSTOMER and sets JWT cookie', async () => {
    const testGoogleEmail = `new-google-${Date.now()}@test.com`;
    setGoogleExchangeMock(async () => ({
      sub: `google_sub_${Date.now()}`,
      email: testGoogleEmail,
      email_verified: true,
      name: 'Google Customer One',
    }));

    const mockStateCookie = encodeURIComponent(
      JSON.stringify({ state: 'state_new_user', codeVerifier: 'verifier_new', returnUrl: '/shop' })
    );

    const res = await request(app)
      .get('/api/v1/auth/google/callback?state=state_new_user&code=mock_code')
      .set('Cookie', [`oauth_state=${mockStateCookie}`])
      .expect(302);

    expect(res.headers.location).toContain('/shop');

    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    const authCookie = cookies.find((c: string) => c.startsWith('token='));
    expect(authCookie).toBeDefined();
    expect(authCookie).toContain('HttpOnly');

    // Verify user row in database
    const dbUser = await query('SELECT * FROM users WHERE email = $1', [testGoogleEmail]);
    expect(dbUser.rows.length).toBe(1);
    expect(dbUser.rows[0].role).toBe('CUSTOMER');
    expect(dbUser.rows[0].auth_provider).toBe('google');
    expect(dbUser.rows[0].password_hash).toBeNull();
  });

  it('GET /api/v1/auth/google/callback links to existing verified local customer account', async () => {
    setGoogleExchangeMock(async () => ({
      sub: 'google_sub_linked_customer1',
      email: 'customer1@shopnest.com',
      email_verified: true,
      name: 'Customer One',
    }));

    const mockStateCookie = encodeURIComponent(
      JSON.stringify({ state: 'state_link_user', codeVerifier: 'verifier_link', returnUrl: '/orders' })
    );

    const res = await request(app)
      .get('/api/v1/auth/google/callback?state=state_link_user&code=mock_code')
      .set('Cookie', [`oauth_state=${mockStateCookie}`])
      .expect(302);

    expect(res.headers.location).toContain('/orders');

    const dbUser = await query('SELECT * FROM users WHERE email = $1', ['customer1@shopnest.com']);
    expect(dbUser.rows[0].google_sub).toBe('google_sub_linked_customer1');
    expect(dbUser.rows[0].auth_provider).toBe('google');
    // Password hash should still exist for dual password login
    expect(dbUser.rows[0].password_hash).not.toBeNull();
  });
});
