# ShopNest Multi-Provider Authentication & Passwordless Guide

This document describes the unified multi-provider authentication subsystem in ShopNest, encompassing Google OAuth & Google One Tap (GIS), Facebook Meta Login, GitHub OAuth, Phone OTP (+91), and single-use Email Magic Links.

---

## 1. Architecture Overview

### Modular Provider Registry (`backend/src/auth/providers/`)
Authentication providers are managed through an extensible registry pattern:
- **Dynamic Feature Flags**: `GET /api/v1/auth/providers` inspects environment variables at runtime and exposes only providers that are actually configured. If no third-party providers are configured, the frontend gracefully hides the "Continue with" section and divider completely.
- **Provider Registry Structure**:
  - `registry.ts`: Provider status discovery, environment evaluation, and metadata generation.
  - `shared.ts`: Shared account linking rules, guest cart merge, CSRF/return URL sanitization, cookie security options, and structured `audit_log` recording.
  - `google.ts`: PKCE generation, Google OAuth 2.0 authorization URL builder, code exchange with Google token endpoint, and Google One Tap (`accounts.google.com/gsi/client`) credential verification via `google-auth-library`.
  - `facebook.ts`: Meta OAuth code exchange, profile query (`public_profile`, `email`), and fallback handling for accounts without email.
  - `github.ts`: GitHub OAuth code exchange and retrieval of verified primary email from `/user/emails`.
  - `phone-otp.ts`: E.164 normalization, cryptographically secure 6-digit random code generator, SHA-256 code hashing, 30-second resend cooldown, 5-minute expiry, 5-attempt limit, constant-time verification (`crypto.timingSafeEqual`), and Twilio/MSG91 dispatch (with `[DEV SMS]` console logger in development).
  - `magic-link.ts`: Single-use 15-minute token generator, browser cookie binding secret, SHA-256 verification, and transactional dispatch via ShopNest mailer.

### Database Schema (`user_identities`, `phone_otps`, `magic_links`)
- **`user_identities` table**:
  - Columns: `id`, `user_id`, `provider`, `provider_user_id`, `email`, `email_verified`, `created_at`, `updated_at`.
  - Unique constraint: `UNIQUE(provider, provider_user_id)`.
  - Preserves backwards compatibility by backfilling legacy `users.google_sub`.
- **`phone_otps` table**:
  - Columns: `id`, `phone`, `otp_hash`, `attempts`, `max_attempts`, `resend_available_at`, `expires_at`, `consumed_at`, `ip_address`.
- **`magic_links` table**:
  - Columns: `id`, `email`, `token_hash`, `cookie_binding_hash`, `expires_at`, `consumed_at`, `ip_address`.
- **`users` table extensions**:
  - `users.password_hash` is made nullable to support purely social/passwordless users.
  - `users.phone` and `users.phone_verified` with a partial unique index on verified phone numbers (`idx_users_phone_verified_unique`).

---

## 2. Core Security Invariants

1. **Email Verification Requirement**:
   - Accounts are linked ONLY when the external provider confirms the email address is verified (`email_verified = true`).
   - Unverified provider profiles are rejected with an explicit `email_not_verified` error code and never auto-linked.
2. **Strict Admin Protection (`ADMIN_SOCIAL_BLOCKED`)**:
   - Store Administrator accounts (`role = 'ADMIN'`) are **strictly barred** from authenticating through social or passwordless channels.
   - Any attempt to sign into or link an admin email via Google, Facebook, GitHub, Phone OTP, or Magic Link triggers immediate rejection and redirects with `error=admin_social_blocked` or `error=admin_google_blocked`.
   - Admin access requires explicit password verification with multi-layered credential checking.
3. **PKCE & State Validation**:
   - All OAuth flows (Google, Facebook, GitHub) enforce state validation and Google enforces PKCE (RFC 7636).
   - OAuth state cookies are stored with `HttpOnly`, `SameSite=Lax`, and 10-minute expiration.
4. **Browser Binding for Magic Links**:
   - When a magic link is requested, a cryptographically random secret is placed in a browser cookie (`magic_binding`) alongside the email token.
   - When the user opens the magic link, both the token and cookie secret hash must match. Opening the link in an unrelated browser or device is rejected with `BROWSER_BINDING_MISMATCH`.
5. **No Token Leakage in Logs**:
   - OTP codes, raw magic link tokens, and OAuth code verifiers are never logged to production application logs.
   - In development mode only, OTPs are labeled `[DEV SMS]` on the terminal console for developer convenience.

---

## 3. Environment Configuration

Add the following keys to `backend/.env`:

```env
# Google OAuth 2.0 & Google One Tap (GIS)
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:4000/api/v1/auth/google/callback

# Facebook / Meta Login
FACEBOOK_APP_ID=your-meta-app-id
FACEBOOK_APP_SECRET=your-meta-app-secret
FACEBOOK_REDIRECT_URI=http://localhost:4000/api/v1/auth/facebook/callback

# GitHub OAuth App
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GITHUB_REDIRECT_URI=http://localhost:4000/api/v1/auth/github/callback

# Phone OTP (+91)
ENABLE_PHONE_OTP=true
# Twilio (Optional - if omitted in dev, codes are printed to server console)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
# Or MSG91 (Optional)
MSG91_AUTH_KEY=
MSG91_SENDER_ID=

# Email Magic Link
ENABLE_MAGIC_LINK=true
```

---

## 4. Provider Console Setup Instructions

### Google Identity Services (OAuth 2.0 & One Tap)
1. Navigate to [Google Cloud Console > Credentials](https://console.cloud.google.com/apis/credentials).
2. Create an **OAuth 2.0 Client ID** (Web application).
3. Set **Authorized JavaScript origins**:
   - `http://localhost:5173`
   - `http://localhost:4000`
4. Set **Authorized redirect URIs**:
   - `http://localhost:4000/api/v1/auth/google/callback`
5. Copy Client ID and Secret to `.env`.

### Facebook (Meta) Login
1. Navigate to [Meta for Developers](https://developers.facebook.com/apps/).
2. Create an App > Select "Authenticate and request data from users with Facebook Login".
3. Under **Facebook Login > Settings**:
   - **Valid OAuth Redirect URIs**: `http://localhost:4000/api/v1/auth/facebook/callback`
4. Request permissions: `email`, `public_profile`.
5. Copy App ID and App Secret to `.env`.

### GitHub OAuth App
1. Navigate to [GitHub Settings > Developer Settings > OAuth Apps](https://github.com/settings/developers).
2. Register a new OAuth application:
   - **Homepage URL**: `http://localhost:5173`
   - **Authorization callback URL**: `http://localhost:4000/api/v1/auth/github/callback`
3. Copy Client ID and Client Secret to `.env`.

---

## 5. Manual & Automated Test Checklist

| Scenario | Expected Result | Verified By |
|---|---|---|
| Providers disabled | "Continue with" section and divider completely hidden | `providers_auth.test.ts` & Playwright |
| Google PKCE redirect | Valid code challenge and state cookie generated | `google_oauth.test.ts` |
| Google unverified email | Rejected with `email_not_verified` query param | `google_oauth.test.ts` |
| Google Admin attempt | Blocked with `admin_google_blocked`, no cookie issued | `google_oauth.test.ts` |
| Facebook OAuth callback | Links or creates customer account | `providers_auth.test.ts` |
| Facebook Admin attempt | Blocked with `ADMIN_SOCIAL_BLOCKED` | `providers_auth.test.ts` |
| GitHub unverified email | Rejected when primary email is unverified | `providers_auth.test.ts` |
| Phone OTP cooldown | Second request within 30s rejected with 429 | `providers_auth.test.ts` |
| Phone OTP max attempts | 5 invalid attempts locks out code | `providers_auth.test.ts` |
| Magic Link mismatched cookie | Rejected with `BROWSER_BINDING_MISMATCH` | `providers_auth.test.ts` |
| Magic Link single-use | Second verify request rejected with `TOKEN_ALREADY_USED` | `providers_auth.test.ts` |
| Disconnect last method | Blocked with `CANNOT_DISCONNECT_LAST_METHOD` if no password | `providers_auth.test.ts` |
