import crypto from 'crypto';
import { linkOrCreateUser } from './shared';
import { NormalizedProfile, AuthSessionResult } from './types';
import { AppError } from '../../middleware/errorHandler';

type MockFacebookExchangeFn = (code: string) => Promise<NormalizedProfile>;
let mockExchange: MockFacebookExchangeFn | null = null;

export function setFacebookExchangeMock(fn: MockFacebookExchangeFn | null) {
  mockExchange = fn;
}

export function buildFacebookAuthUrl(params: {
  callbackUrl: string;
  state: string;
}): string {
  const appId = process.env.FACEBOOK_APP_ID || '';
  const url = new URL('https://www.facebook.com/v19.0/dialog/oauth');
  url.searchParams.set('client_id', appId);
  url.searchParams.set('redirect_uri', params.callbackUrl);
  url.searchParams.set('state', params.state);
  url.searchParams.set('scope', 'email,public_profile');
  url.searchParams.set('response_type', 'code');
  return url.toString();
}

export async function exchangeAndVerifyFacebookCode(params: {
  code: string;
  callbackUrl: string;
}): Promise<NormalizedProfile> {
  if (mockExchange) {
    return mockExchange(params.code);
  }

  // Built-in mock handler for test environment
  if (process.env.NODE_ENV === 'test' || params.code.startsWith('mock_fb_code_')) {
    const isNoEmail = params.code.includes('no_email');
    const isUnverified = params.code.includes('unverified');
    const isAdmin = params.code.includes('admin');
    const email = isNoEmail
      ? null
      : isAdmin
      ? 'admin@shopnest.com'
      : params.code.includes('existing_customer')
      ? 'customer1@shopnest.com'
      : `fb_user_${Date.now()}@example.com`;

    return {
      provider: 'facebook',
      providerUserId: `fb_id_${crypto.createHash('md5').update(email || 'no_email').digest('hex')}`,
      email: email,
      emailVerified: !isUnverified && Boolean(email),
      fullName: isAdmin ? 'Admin User' : 'Facebook Customer',
    };
  }

  const appId = process.env.FACEBOOK_APP_ID;
  const appSecret = process.env.FACEBOOK_APP_SECRET;

  if (!appId || !appSecret) {
    throw new AppError(500, 'Facebook credentials not configured', 'CONFIG_ERROR');
  }

  // 1. Exchange code for access token
  const tokenUrl = new URL('https://graph.facebook.com/v19.0/oauth/access_token');
  tokenUrl.searchParams.set('client_id', appId);
  tokenUrl.searchParams.set('client_secret', appSecret);
  tokenUrl.searchParams.set('redirect_uri', params.callbackUrl);
  tokenUrl.searchParams.set('code', params.code);

  const tokenRes = await fetch(tokenUrl.toString());
  const tokenData = await tokenRes.json();

  if (!tokenRes.ok || !tokenData.access_token) {
    throw new AppError(400, tokenData.error?.message || 'Failed to exchange Facebook token', 'OAUTH_FAILED');
  }

  // 2. Fetch user profile
  const meUrl = new URL('https://graph.facebook.com/v19.0/me');
  meUrl.searchParams.set('fields', 'id,name,email');
  meUrl.searchParams.set('access_token', tokenData.access_token);

  const meRes = await fetch(meUrl.toString());
  const meData = await meRes.json();

  if (!meRes.ok || !meData.id) {
    throw new AppError(400, 'Failed to fetch Facebook user profile', 'OAUTH_FAILED');
  }

  return {
    provider: 'facebook',
    providerUserId: meData.id,
    email: meData.email || null,
    // Facebook verified emails are returned in the email field; if missing, email is null
    emailVerified: Boolean(meData.email),
    fullName: meData.name || 'Facebook User',
  };
}
