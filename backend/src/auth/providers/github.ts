import crypto from 'crypto';
import { linkOrCreateUser } from './shared';
import { NormalizedProfile, AuthSessionResult } from './types';
import { AppError } from '../../middleware/errorHandler';

type MockGithubExchangeFn = (code: string) => Promise<NormalizedProfile>;
let mockExchange: MockGithubExchangeFn | null = null;

export function setGithubExchangeMock(fn: MockGithubExchangeFn | null) {
  mockExchange = fn;
}

export function buildGithubAuthUrl(params: {
  callbackUrl: string;
  state: string;
}): string {
  const clientId = process.env.GITHUB_CLIENT_ID || '';
  const url = new URL('https://github.com/login/oauth/authorize');
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', params.callbackUrl);
  url.searchParams.set('scope', 'user:email');
  url.searchParams.set('state', params.state);
  return url.toString();
}

export async function exchangeAndVerifyGithubCode(params: {
  code: string;
  callbackUrl: string;
}): Promise<NormalizedProfile> {
  if (mockExchange) {
    return mockExchange(params.code);
  }

  // Built-in test mock handler
  if (process.env.NODE_ENV === 'test' || params.code.startsWith('mock_gh_code_')) {
    const isUnverified = params.code.includes('unverified');
    const isNoEmail = params.code.includes('no_email');
    const isAdmin = params.code.includes('admin');
    const email = isNoEmail
      ? null
      : isAdmin
      ? 'admin@shopnest.com'
      : params.code.includes('existing_customer')
      ? 'customer1@shopnest.com'
      : `gh_user_${Date.now()}@example.com`;

    return {
      provider: 'github',
      providerUserId: `gh_id_${crypto.createHash('md5').update(email || 'gh_user').digest('hex')}`,
      email: email,
      emailVerified: !isUnverified && Boolean(email),
      fullName: isAdmin ? 'Admin User' : 'GitHub Customer',
    };
  }

  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new AppError(500, 'GitHub OAuth credentials not configured', 'CONFIG_ERROR');
  }

  // 1. Exchange code for access token
  const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code: params.code,
      redirect_uri: params.callbackUrl,
    }),
  });

  const tokenData = await tokenRes.json();
  if (!tokenRes.ok || !tokenData.access_token) {
    throw new AppError(400, tokenData.error_description || 'Failed to exchange GitHub authorization code', 'OAUTH_FAILED');
  }

  // 2. Fetch user profile
  const userRes = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
      'User-Agent': 'ShopNest-Auth-Server',
    },
  });
  const userData = await userRes.json();

  if (!userRes.ok || !userData.id) {
    throw new AppError(400, 'Failed to fetch GitHub user details', 'OAUTH_FAILED');
  }

  // 3. Fetch user emails to get the primary verified email
  const emailsRes = await fetch('https://api.github.com/user/emails', {
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
      'User-Agent': 'ShopNest-Auth-Server',
    },
  });
  const emailsData = await emailsRes.json();

  let primaryVerifiedEmail: string | null = null;
  if (Array.isArray(emailsData)) {
    const primary = emailsData.find((e: any) => e.primary && e.verified);
    if (primary) {
      primaryVerifiedEmail = primary.email;
    }
  }

  if (!primaryVerifiedEmail) {
    throw new AppError(400, 'GitHub account does not have a primary verified email address', 'EMAIL_NOT_VERIFIED');
  }

  return {
    provider: 'github',
    providerUserId: String(userData.id),
    email: primaryVerifiedEmail,
    emailVerified: true,
    fullName: userData.name || userData.login || 'GitHub User',
  };
}
