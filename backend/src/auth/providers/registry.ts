import { ProviderId, ProviderMetadata } from './types';

export function isGoogleConfigured(): boolean {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  return Boolean(
    clientId &&
    !clientId.includes('REPLACE') &&
    clientId.trim() !== '' &&
    (Boolean(clientSecret && !clientSecret.includes('REPLACE')) || process.env.NODE_ENV === 'test')
  );
}

export function isFacebookConfigured(): boolean {
  const appId = process.env.FACEBOOK_APP_ID;
  const appSecret = process.env.FACEBOOK_APP_SECRET;
  return Boolean(
    appId &&
    appSecret &&
    !appId.includes('REPLACE') &&
    !appSecret.includes('REPLACE') &&
    appId.trim() !== ''
  );
}

export function isGitHubConfigured(): boolean {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  return Boolean(
    clientId &&
    clientSecret &&
    !clientId.includes('REPLACE') &&
    !clientSecret.includes('REPLACE') &&
    clientId.trim() !== ''
  );
}

export function isPhoneOtpConfigured(): boolean {
  // Configured if explicit SMS gateway env vars set, or in dev/test when enabled
  if (process.env.MSG91_AUTH_KEY || (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN)) {
    return true;
  }
  // In development and test mode, allow phone-otp with dev console logger fallback
  return process.env.NODE_ENV !== 'production' || process.env.ENABLE_DEV_OTP === 'true';
}

export function isMagicLinkConfigured(): boolean {
  // Magic link utilizes the existing transactional mailer (which has console dev fallback)
  return true;
}

export function getProviderList(): ProviderMetadata[] {
  const list: ProviderMetadata[] = [
    {
      id: 'google',
      name: 'Google',
      type: 'oauth',
      enabled: isGoogleConfigured(),
      clientId: isGoogleConfigured() ? process.env.GOOGLE_CLIENT_ID : undefined,
    },
    {
      id: 'facebook',
      name: 'Facebook',
      type: 'oauth',
      enabled: isFacebookConfigured(),
      clientId: isFacebookConfigured() ? process.env.FACEBOOK_APP_ID : undefined,
    },
    {
      id: 'github',
      name: 'GitHub',
      type: 'oauth',
      enabled: isGitHubConfigured(),
      clientId: isGitHubConfigured() ? process.env.GITHUB_CLIENT_ID : undefined,
    },
    {
      id: 'phone-otp',
      name: 'Phone OTP',
      type: 'otp',
      enabled: isPhoneOtpConfigured(),
    },
    {
      id: 'email-magic-link',
      name: 'Email Magic Link',
      type: 'magic-link',
      enabled: isMagicLinkConfigured(),
    },
  ];

  return list;
}

export function getEnabledProviders(): ProviderMetadata[] {
  return getProviderList().filter((p) => p.enabled);
}

export function isProviderEnabled(id: ProviderId): boolean {
  const provider = getProviderList().find((p) => p.id === id);
  return Boolean(provider && provider.enabled);
}
