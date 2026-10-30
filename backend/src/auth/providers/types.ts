export type ProviderId = 'google' | 'facebook' | 'github' | 'phone-otp' | 'email-magic-link';

export interface ProviderMetadata {
  id: ProviderId;
  name: string;
  type: 'oauth' | 'otp' | 'magic-link';
  enabled: boolean;
  clientId?: string;
}

export interface NormalizedProfile {
  provider: ProviderId;
  providerUserId: string;
  email?: string | null;
  emailVerified: boolean;
  fullName?: string | null;
  phone?: string | null;
  phoneVerified?: boolean;
}

export interface AuthSessionResult {
  user: {
    id: string;
    email: string;
    full_name: string;
    role: 'CUSTOMER' | 'ADMIN';
    phone?: string | null;
  };
  token: string;
  returnUrl?: string;
  isNewUser?: boolean;
}
