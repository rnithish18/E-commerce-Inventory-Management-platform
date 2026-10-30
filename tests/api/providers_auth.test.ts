import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../../backend/src/app';
import { query } from '../../backend/src/db/query';
import { getTestLastOtp } from '../../backend/src/auth/providers/phone-otp';
import { getTestLastMagicLink } from '../../backend/src/auth/providers/magic-link';

describe('Multi-Provider Social & Passwordless Authentication API Suite', () => {
  beforeAll(async () => {
    process.env.GOOGLE_CLIENT_ID = 'test-google-client-id.apps.googleusercontent.com';
    process.env.GOOGLE_CLIENT_SECRET = 'test-google-secret';
    process.env.FACEBOOK_APP_ID = 'test-facebook-app-id';
    process.env.FACEBOOK_APP_SECRET = 'test-facebook-secret';
    process.env.GITHUB_CLIENT_ID = 'test-github-client-id';
    process.env.GITHUB_CLIENT_SECRET = 'test-github-secret';
  });

  describe('1. Provider Registry & Availability', () => {
    it('GET /api/v1/auth/providers returns enabled providers list with accurate metadata', async () => {
      const res = await request(app).get('/api/v1/auth/providers').expect(200);

      expect(res.body.google).toBe(true);
      expect(res.body.providers.google).toBe(true);
      expect(res.body.providers.facebook).toBe(true);
      expect(res.body.providers.github).toBe(true);
      expect(res.body.providers['phone-otp']).toBe(true);
      expect(res.body.providers['email-magic-link']).toBe(true);
      expect(Array.isArray(res.body.providersList)).toBe(true);
      expect(res.body.googleClientId).toBe('test-google-client-id.apps.googleusercontent.com');
    });
  });

  describe('2. Google One Tap / GIS Credential Verification', () => {
    it('authenticates or creates new customer via verified Google One Tap credential', async () => {
      const res = await request(app)
        .post('/api/v1/auth/google/credential')
        .send({ credential: 'mock_credential_new_customer' })
        .expect(200);

      expect(res.body.user).toBeDefined();
      expect(res.body.user.role).toBe('CUSTOMER');

      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      const tokenCookie = cookies.find((c: string) => c.startsWith('token='));
      expect(tokenCookie).toBeDefined();
      expect(tokenCookie).toContain('HttpOnly');
    });

    it('links Google One Tap to existing customer with verified email', async () => {
      const res = await request(app)
        .post('/api/v1/auth/google/credential')
        .send({ credential: 'mock_credential_existing_customer' })
        .expect(200);

      expect(res.body.user.email).toBe('customer1@shopnest.com');
      expect(res.body.user.role).toBe('CUSTOMER');
    });

    it('rejects Google One Tap credential with unverified email', async () => {
      const res = await request(app)
        .post('/api/v1/auth/google/credential')
        .send({ credential: 'mock_credential_unverified' })
        .expect(400);

      expect(res.body.error).toBe('EMAIL_NOT_VERIFIED');
    });

    it('blocks Google One Tap login for ADMIN accounts', async () => {
      const res = await request(app)
        .post('/api/v1/auth/google/credential')
        .send({ credential: 'mock_credential_admin' })
        .expect(403);

      expect(res.body.error).toBe('ADMIN_SOCIAL_BLOCKED');
    });
  });

  describe('3. Facebook OAuth Code Flow', () => {
    it('GET /api/v1/auth/facebook initiates OAuth and sets state cookie', async () => {
      const res = await request(app)
        .get('/api/v1/auth/facebook?returnUrl=/cart')
        .expect(302);

      expect(res.headers.location).toContain('https://www.facebook.com/v19.0/dialog/oauth');
      expect(res.headers.location).toContain('client_id=test-facebook-app-id');
      expect(res.headers.location).toContain('state=');

      const cookies = res.headers['set-cookie'];
      expect(cookies.some((c: string) => c.startsWith('oauth_fb_state='))).toBe(true);
    });

    it('GET /api/v1/auth/facebook/callback authenticates customer with valid state and code', async () => {
      const initRes = await request(app).get('/api/v1/auth/facebook?returnUrl=/shop').expect(302);
      const cookies = initRes.headers['set-cookie'];
      const fbCookie = cookies.find((c: string) => c.startsWith('oauth_fb_state='));
      const stateMatch = initRes.headers.location.match(/state=([^&]+)/);
      const state = stateMatch ? stateMatch[1] : '';

      const cbRes = await request(app)
        .get(`/api/v1/auth/facebook/callback?code=mock_fb_code_customer&state=${state}`)
        .set('Cookie', [fbCookie])
        .expect(302);

      expect(cbRes.headers.location).toBe('http://localhost:5173/shop');
      const authCookies = cbRes.headers['set-cookie'];
      expect(authCookies.some((c: string) => c.startsWith('token='))).toBe(true);
    });

    it('GET /api/v1/auth/facebook/callback blocks login for ADMIN accounts', async () => {
      const initRes = await request(app).get('/api/v1/auth/facebook').expect(302);
      const cookies = initRes.headers['set-cookie'];
      const fbCookie = cookies.find((c: string) => c.startsWith('oauth_fb_state='));
      const stateMatch = initRes.headers.location.match(/state=([^&]+)/);
      const state = stateMatch ? stateMatch[1] : '';

      const cbRes = await request(app)
        .get(`/api/v1/auth/facebook/callback?code=mock_fb_code_admin&state=${state}`)
        .set('Cookie', [fbCookie])
        .expect(302);

      expect(cbRes.headers.location).toContain('/login?error=admin_social_blocked');
    });
  });

  describe('4. GitHub OAuth Code Flow', () => {
    it('GET /api/v1/auth/github initiates OAuth and sets state cookie', async () => {
      const res = await request(app)
        .get('/api/v1/auth/github?returnUrl=/profile')
        .expect(302);

      expect(res.headers.location).toContain('https://github.com/login/oauth/authorize');
      expect(res.headers.location).toContain('client_id=test-github-client-id');
      expect(res.headers.location).toContain('scope=user%3Aemail');

      const cookies = res.headers['set-cookie'];
      expect(cookies.some((c: string) => c.startsWith('oauth_gh_state='))).toBe(true);
    });

    it('GET /api/v1/auth/github/callback authenticates customer with verified email', async () => {
      const initRes = await request(app).get('/api/v1/auth/github?returnUrl=/my-orders').expect(302);
      const cookies = initRes.headers['set-cookie'];
      const ghCookie = cookies.find((c: string) => c.startsWith('oauth_gh_state='));
      const stateMatch = initRes.headers.location.match(/state=([^&]+)/);
      const state = stateMatch ? stateMatch[1] : '';

      const cbRes = await request(app)
        .get(`/api/v1/auth/github/callback?code=mock_gh_code_customer&state=${state}`)
        .set('Cookie', [ghCookie])
        .expect(302);

      expect(cbRes.headers.location).toBe('http://localhost:5173/my-orders');
      const authCookies = cbRes.headers['set-cookie'];
      expect(authCookies.some((c: string) => c.startsWith('token='))).toBe(true);
    });

    it('GET /api/v1/auth/github/callback rejects GitHub user with unverified email', async () => {
      const initRes = await request(app).get('/api/v1/auth/github').expect(302);
      const cookies = initRes.headers['set-cookie'];
      const ghCookie = cookies.find((c: string) => c.startsWith('oauth_gh_state='));
      const stateMatch = initRes.headers.location.match(/state=([^&]+)/);
      const state = stateMatch ? stateMatch[1] : '';

      const cbRes = await request(app)
        .get(`/api/v1/auth/github/callback?code=mock_gh_code_unverified&state=${state}`)
        .set('Cookie', [ghCookie])
        .expect(302);

      expect(cbRes.headers.location).toContain('/login?error=email_not_verified');
    });
  });

  describe('5. Phone OTP Authentication Flow (+91)', () => {
    const testPhone = '9876543210';
    const normalizedPhone = '+919876543210';

    it('POST /api/v1/auth/phone/send-otp validates phone and sends 6-digit OTP', async () => {
      const res = await request(app)
        .post('/api/v1/auth/phone/send-otp')
        .send({ phone: testPhone })
        .expect(200);

      expect(res.body.message).toContain('successfully');
      expect(res.body.resendAfterSeconds).toBe(30);

      const otp = getTestLastOtp(normalizedPhone);
      expect(otp).toBeDefined();
      expect(otp).toHaveLength(6);
      expect(/^\d{6}$/.test(otp!)).toBe(true);
    });

    it('POST /api/v1/auth/phone/send-otp rejects subsequent request within 30-second cooldown', async () => {
      const res = await request(app)
        .post('/api/v1/auth/phone/send-otp')
        .send({ phone: testPhone })
        .expect(429);

      expect(res.body.error).toBe('OTP_COOLDOWN');
    });

    it('POST /api/v1/auth/phone/verify-otp rejects incorrect code and increments attempts', async () => {
      const res = await request(app)
        .post('/api/v1/auth/phone/verify-otp')
        .send({ phone: testPhone, otp: '000000' })
        .expect(400);

      expect(res.body.error).toBe('INVALID_OTP');
    });

    it('POST /api/v1/auth/phone/verify-otp logs in successfully with valid code', async () => {
      const validOtp = getTestLastOtp(normalizedPhone);
      expect(validOtp).toBeDefined();

      const res = await request(app)
        .post('/api/v1/auth/phone/verify-otp')
        .send({ phone: testPhone, otp: validOtp, returnUrl: '/shop' })
        .expect(200);

      expect(res.body.user).toBeDefined();
      expect(res.body.user.phone).toBe(normalizedPhone);
      expect(res.body.user.role).toBe('CUSTOMER');

      const cookies = res.headers['set-cookie'];
      expect(cookies.some((c: string) => c.startsWith('token='))).toBe(true);
    });

    it('POST /api/v1/auth/phone/verify-otp rejects re-use of consumed code', async () => {
      const consumedOtp = getTestLastOtp(normalizedPhone);
      const res = await request(app)
        .post('/api/v1/auth/phone/verify-otp')
        .send({ phone: testPhone, otp: consumedOtp })
        .expect(400);

      expect(res.body.error).toBe('OTP_ALREADY_USED');
    });
  });

  describe('6. Email Magic Link Authentication Flow', () => {
    const testEmail = `magic_user_${Date.now()}@example.com`;
    let bindingCookie = '';

    it('POST /api/v1/auth/magic-link/send sends link and sets browser binding cookie', async () => {
      const res = await request(app)
        .post('/api/v1/auth/magic-link/send')
        .send({ email: testEmail, returnUrl: '/cart' })
        .expect(200);

      expect(res.body.message).toContain('sent a sign-in link');

      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      const bind = cookies.find((c: string) => c.startsWith('magic_link_bind='));
      expect(bind).toBeDefined();
      expect(bind).toContain('HttpOnly');
      bindingCookie = bind!;

      const token = getTestLastMagicLink(testEmail);
      expect(token).toBeDefined();
      expect(token!.length).toBeGreaterThan(20);
    });

    it('POST /api/v1/auth/magic-link/verify rejects request with missing or mismatched browser binding', async () => {
      const token = getTestLastMagicLink(testEmail)!;
      const res = await request(app)
        .post('/api/v1/auth/magic-link/verify')
        .send({ token })
        .expect(403);

      expect(res.body.error).toBe('BROWSER_BINDING_MISMATCH');
    });

    it('POST /api/v1/auth/magic-link/verify authenticates user with token and matching browser binding', async () => {
      const token = getTestLastMagicLink(testEmail)!;
      const res = await request(app)
        .post('/api/v1/auth/magic-link/verify')
        .set('Cookie', [bindingCookie])
        .send({ token, returnUrl: '/cart' })
        .expect(200);

      expect(res.body.user).toBeDefined();
      expect(res.body.user.email).toBe(testEmail);
      expect(res.body.user.role).toBe('CUSTOMER');

      const cookies = res.headers['set-cookie'];
      expect(cookies.some((c: string) => c.startsWith('token='))).toBe(true);
    });

    it('POST /api/v1/auth/magic-link/verify rejects token reuse', async () => {
      const token = getTestLastMagicLink(testEmail)!;
      const res = await request(app)
        .post('/api/v1/auth/magic-link/verify')
        .set('Cookie', [bindingCookie])
        .send({ token })
        .expect(400);

      expect(res.body.error).toBe('MAGIC_LINK_ALREADY_USED');
    });
  });

  describe('7. Profile Connected Login Methods & Password Rules', () => {
    it('manages connected identities and blocks disconnecting last sign-in method', async () => {
      // 1. Sign up fresh phone-only user
      const uniqueSuffix = String(Date.now()).slice(-8);
      const phoneNum = '91' + uniqueSuffix;
      const normalized = '+91' + phoneNum;
      await request(app).post('/api/v1/auth/phone/send-otp').send({ phone: phoneNum }).expect(200);
      const otp = getTestLastOtp(normalized)!;
      const loginRes = await request(app)
        .post('/api/v1/auth/phone/verify-otp')
        .send({ phone: phoneNum, otp })
        .expect(200);

      const authCookie = loginRes.headers['set-cookie'].find((c: string) => c.startsWith('token='));

      // 2. Fetch connected identities
      const idRes = await request(app)
        .get('/api/v1/auth/identities')
        .set('Cookie', [authCookie])
        .expect(200);

      expect(idRes.body.hasPassword).toBe(false);
      expect(idRes.body.identities.length).toBe(1);
      expect(idRes.body.identities[0].provider).toBe('phone-otp');

      // 3. Attempt to disconnect the ONLY method without a password -> must be blocked
      const discRes = await request(app)
        .post('/api/v1/auth/identities/phone-otp/disconnect')
        .set('Cookie', [authCookie])
        .expect(400);

      expect(discRes.body.error).toBe('CANNOT_DISCONNECT_LAST_METHOD');

      // 4. Set a password
      await request(app)
        .post('/api/v1/auth/set-password')
        .set('Cookie', [authCookie])
        .send({ password: 'StrongPassword@123' })
        .expect(200);

      // 5. Now disconnect the phone-otp identity -> allowed because password is now set
      const allowedDisc = await request(app)
        .post('/api/v1/auth/identities/phone-otp/disconnect')
        .set('Cookie', [authCookie])
        .expect(200);

      expect(allowedDisc.body.message).toContain('disconnected successfully');
    });
  });
});
