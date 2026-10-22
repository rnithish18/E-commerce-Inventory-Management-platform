# ShopNest — Enterprise Security & Compliance Audit Report

## 1. Executive Summary
ShopNest incorporates defense-in-depth security principles across its entire stack. The platform enforces zero-trust parameter validation, cryptographic integrity verification on webhooks, strict origin-checking to block Cross-Site Request Forgery (CSRF), and ACID row-locking to eliminate race conditions and overselling.

---

## 2. Authentication & Authorization Controls

### A. Password Storage & Hashing
- **Algorithm**: `bcryptjs` using 12 salt rounds (`bcrypt.hash(password, 12)`).
- **Protection**: Defends against brute-force, dictionary, and rainbow table attacks. Plaintext passwords are never logged, stored, or returned in API responses.

### B. Session & Token Management
- **Transport**: JSON Web Tokens (JWT) signed with SHA-256 HMAC (`JWT_SECRET`).
- **Cookie Security**:
  - `httpOnly: true` (prevents JavaScript and XSS token extraction)
  - `sameSite: 'strict'` (blocks cross-site cookie transmission)
  - `secure: true` in production environments
  - Expired tokens automatically invalidate access with `401 UNAUTHORIZED`.

### C. Role-Based Access Control (RBAC)
- Strict middleware enforcement via `requireAuth` and `requireRole('ADMIN')`.
- All administrative routes (`/api/v1/admin/*`) immediately block unauthenticated requests with `401` and unauthorized customer requests with `403 FORBIDDEN`.

---

## 3. Threat Mitigation & Defensive Architecture

### A. SQL Injection Immunity
- 100% of SQL database operations utilize parameterized queries with PostgreSQL parameter placeholders (`$1, $2, ...`) via `pg.Pool`.
- Incoming query parameters (pagination, price bounds, sorting keys) are strictly parsed and sanitized through Zod schema validation before reaching query builders.
- System error handler intercepts PostgreSQL error `22P02` (invalid UUID syntax) and returns a structured `400 BAD_REQUEST`, preventing internal stack leakage.

### B. Cross-Site Request Forgery (CSRF) Prevention
- Implemented in `backend/src/middleware/security.ts`.
- All mutating HTTP methods (`POST`, `PUT`, `DELETE`, `PATCH`) verify the `Origin` or `Referer` headers against an explicit whitelist of trusted application domains.
- Untrusted origins sending state-modifying payloads with authenticated cookies are immediately rejected with `403 CSRF_BLOCKED`.

### C. Brute-Force & Denial of Service (DoS) Mitigation
- **Auth Endpoint Rate Limiter**: Maximum 30 attempts per 15-minute window per IP on `/api/v1/auth/login` and `/api/v1/auth/register`. Exceeding limits returns `429 TOO_MANY_REQUESTS`.
- **Coupon Code Brute-Force Limiter**: Maximum 40 coupon validation requests per 10-minute window per IP, blocking automated promo code scraping.

### D. HTTP Security Headers (Helmet)
- `Content-Security-Policy`: Restricts scripts, styles, and image origins.
- `X-Content-Type-Options: nosniff`: Prevents MIME-sniffing.
- `X-Frame-Options: SAMEORIGIN`: Defends against Clickjacking attacks.
- `Cross-Origin-Resource-Policy: cross-origin`: Protects static assets.

### E. File Upload Sanitization
- Admin upload handler (`backend/src/routes/uploads.ts`) utilizes Multer configured with:
  - Private storage directory (`uploads/`), excluded from Git tracking via `.gitignore`.
  - MIME type filtering: Strictly accepts `image/jpeg`, `image/png`, and `image/webp`.
  - File size cap: Enforced at 5 megabytes.
  - Sanitized filenames generated using randomized UUIDs to prevent directory traversal (`../`) attacks.

---

## 4. Financial & Payment Integrity Safeguards

### A. Monetary Calculations
- 100% of prices, discounts, sub-totals, taxes, and final totals are calculated and stored in **integer minor units (paise)**. Floating-point currency math is banned.
- Injected client prices are ignored during checkout; pricing is recomputed server-side directly against the database ledger.

### B. Concurrency & Overselling Prevention
- Inventory reservation during checkout uses `SELECT ... FOR UPDATE` row-level locks on `product_variants`.
- Concurrent checkouts are serialized; if stock drops to 0, subsequent transactions fail cleanly with `400 INSUFFICIENT_STOCK`. Stock can never reach negative values.

### C. Webhook Signature Verification
- Inbound Razorpay webhook events verify the HMAC SHA-256 signature against the raw body buffer using constant-time buffer comparison (`crypto.timingSafeEqual`) to prevent timing attacks.
- Duplicate webhook notifications are handled idempotently via unique transaction IDs.
