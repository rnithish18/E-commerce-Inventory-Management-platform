import {
  setGoogleExchangeMock as setProviderExchangeMock,
  generatePkcePair,
  buildGoogleAuthUrl,
  exchangeAndVerifyGoogleCode,
} from '../auth/providers/google';
import { isGoogleConfigured } from '../auth/providers/registry';
import { sanitizeReturnUrl } from '../auth/providers/shared';

export {
  generatePkcePair,
  buildGoogleAuthUrl,
  exchangeAndVerifyGoogleCode,
  sanitizeReturnUrl,
};

export interface GoogleUserPayload {
  sub: string;
  email: string;
  email_verified: boolean;
  name?: string;
  picture?: string;
}

export function setGoogleExchangeMock(fn: any) {
  setProviderExchangeMock(fn);
}

export function isGoogleOAuthConfigured(): boolean {
  return isGoogleConfigured();
}
