# Google OAuth 2.0 PKCE Manual Verification Guide

> [!NOTE]
> **CI / Automated Test Statement**
> In automated test environments (Vitest and Playwright), OAuth callbacks and account linking are thoroughly verified using cryptographically valid mock tokens and endpoint stubs.
>
> A real, live Google sign-in workflow cannot be automated in headless test runners because Google's OAuth consent screens require interactive user consent, CAPTCHA verification, and multi-factor authentication (2FA). This document provides the authoritative step-by-step procedure for manual end-to-end verification.

---

## 1. Prerequisites & Google Cloud Console Setup

1. Navigate to the [Google Cloud Console Credentials Dashboard](https://console.cloud.google.com/apis/credentials).
2. Select your Google Cloud project (or create one named `ShopNest-Dev`).
3. Configure the **OAuth Consent Screen**:
   - User Type: **External**
   - App Name: `ShopNest Store`
   - User Support Email: your developer email
   - Scopes: `.../auth/userinfo.email`, `.../auth/userinfo.profile`, `openid`
   - Test Users: Add the Gmail addresses you intend to test with.
4. Create Credentials -> **OAuth client ID**:
   - Application Type: **Web application**
   - Name: `ShopNest Local Dev`
   - Authorized JavaScript Origins:
     ```
     http://localhost:5173
     http://localhost:4000
     ```
   - Authorized Redirect URIs:
     ```
     http://localhost:4000/api/v1/auth/google/callback
     ```
5. Copy your **Client ID** and **Client Secret**.

---

## 2. Environment Configuration

Add the credentials to your local `backend/.env` file:

```env
# Google OAuth 2.0 PKCE
GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:4000/api/v1/auth/google/callback
```

Restart your backend server:
```bash
npm --prefix backend run dev
```

---

## 3. Manual Testing Checklist

### Test Scenario A: Button Visibility Toggle
1. **With Keys Configured:**
   - Navigate to `http://localhost:5173/login`.
   - Verify that the **"Continue with Google"** button is displayed below the login form.
2. **With Keys Unset (Clean Degradation):**
   - Comment out `GOOGLE_CLIENT_ID` in `backend/.env` and restart the backend.
   - Refresh `http://localhost:5173/login`.
   - Verify that `/api/v1/auth/config` reports `google: false`.
   - Verify that the Google button is cleanly hidden without leaving orphaned divider lines or blank spacing.
   - Restore the keys in `backend/.env`.

---

### Test Scenario B: Happy Path (New Customer Sign-in)
1. Open `http://localhost:5173/login` in an Incognito / Private browsing window.
2. Click **"Continue with Google"**.
3. Confirm that the browser redirects to Google's login domain (`accounts.google.com`) with PKCE parameters (`code_challenge`, `state`, and `response_type=code`).
4. Select your test Google account and grant permission.
5. Confirm that Google redirects back to `http://localhost:4000/api/v1/auth/google/callback`.
6. Confirm that the backend securely exchanges the authorization code for tokens, creates/links the customer record in PostgreSQL, sets the `token` httpOnly cookie, and redirects to the storefront.
7. Verify that your Google avatar initial, full name, and "CUSTOMER" role appear in the ShopNest Topbar.

---

### Test Scenario C: Admin Security Policy Enforcement
1. In ShopNest, admin accounts (`role = 'ADMIN'`) are strictly prohibited from authenticating via social OAuth to protect elevated privileges.
2. Register an admin account with an email matching your Google address, or change your user role to `ADMIN` in PostgreSQL:
   ```sql
   UPDATE users SET role = 'ADMIN' WHERE email = 'your.email@gmail.com';
   ```
3. Sign out of ShopNest.
4. Click **"Continue with Google"** and authenticate.
5. Confirm that the backend blocks the transition and redirects back to `/login?oauth_error=admin_google_blocked`.
6. Confirm that the ShopNest login card displays the prominent security warning:
   > *"Google sign-in is not permitted for Admin accounts. Please log in with your email and password."*

---

### Test Scenario D: Return URL Preservation
1. As an unauthenticated guest, add an item to your cart and proceed to `http://localhost:5173/checkout`.
2. Notice the URL includes `returnUrl=%2Fcheckout`.
3. Click **"Continue with Google"**.
4. Complete the Google authentication flow.
5. Verify that upon successful completion, you are redirected directly back to `http://localhost:5173/checkout` with your cart intact.
