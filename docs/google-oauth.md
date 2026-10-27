# Google OAuth 2.0 PKCE Setup Guide — ShopNest

ShopNest implements the production-grade OAuth 2.0 Authorization Code flow with cryptographic `state` and PKCE (`code_verifier` + `code_challenge` SHA-256).

---

## 1. Google Cloud Console Setup

1. Open the [Google Cloud Console](https://console.cloud.google.com/).
2. Create or select your Google Cloud project (e.g. `shopnest-ecommerce`).
3. Navigate to **APIs & Services** > **OAuth consent screen**:
   - User Type: **External**
   - App Name: `ShopNest`
   - User support email: `your-email@example.com`
   - Scopes:
     - `.../auth/userinfo.email`
     - `.../auth/userinfo.profile`
     - `openid`
4. Navigate to **APIs & Services** > **Credentials**:
   - Click **Create Credentials** > **OAuth client ID**.
   - Application type: **Web application**.
   - Name: `ShopNest Web Client`.
   - **Authorized JavaScript origins**:
     - `http://localhost:5173` (Vite dev server)
     - `http://localhost:4000` (Express API)
   - **Authorized redirect URIs**:
     - `http://localhost:4000/api/v1/auth/google/callback`
   - Click **Create**. Copy the generated **Client ID** and **Client Secret**.

---

## 2. Environment Variables Configuration

Copy these variables into `backend/.env`:

```env
# Google OAuth 2.0 Credentials
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret"
GOOGLE_CALLBACK_URL="http://localhost:4000/api/v1/auth/google/callback"
FRONTEND_URL="http://localhost:5173"
```

---

## 3. Security Rules & Account Linking

- **Role Guard**: Google sign-in is strictly restricted to `CUSTOMER` role. Any `ADMIN` email attempting Google sign-in is blocked immediately with `?error=admin_google_blocked`. Admin accounts must authenticate with email & password.
- **Account Linking**: If an existing local customer signs in with Google, their account is automatically linked (`google_sub`) once Google verifies `email_verified=true`. Their existing password remains intact for dual login capability.
- **PKCE & State**: Generates random cryptographically secure `state` and PKCE `code_verifier`. Parameters are verified on redirect back to prevent CSRF and code interception.
- **Open-Redirect Protection**: The `returnUrl` is strictly sanitized to relative paths (`/path`), dropping any protocol or host tampering.
- **Seamless Cart Merging**: Any items in the guest cart (`shopnest_guest_cart`) are automatically merged into the user's persistent PostgreSQL cart upon successful Google authentication.
