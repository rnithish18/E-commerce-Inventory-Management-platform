# ShopNest — Assumptions & Design Decisions

## Currency & Money
- Currency: **INR (Indian Rupee)**
- All monetary values stored as **integer paise** (₹1 = 100 paise) in `INTEGER` or `BIGINT` columns
- No floating-point arithmetic for money at any layer
- Prices and totals are **always calculated on the server** — client-submitted prices are ignored
- Display: divide by 100, format with `en-IN` locale (e.g., ₹2,499)
- Tax: **18% GST** flat rate, calculated server-side on subtotal (configurable via env)
- Shipping: **₹50 flat** (5000 paise) for orders under ₹500 (50000 paise); **free** above

## Timezone
- All `TIMESTAMPTZ` columns stored in **UTC**
- Displayed in **Asia/Kolkata (IST, UTC+5:30)** using `Intl.DateTimeFormat`
- Frontend uses `toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })`

## Authentication & Security
- JWT stored in **httpOnly, SameSite=Strict** cookie — not accessible to JS
- JWT expiry: 7 days
- Passwords hashed with **bcrypt** (12 rounds)
- Role-based access: `CUSTOMER` and `ADMIN`
- Authorization enforced at **API/data layer** — UI restrictions are UX only
- Zod validation on every endpoint request body and query

## Payments
- **Razorpay TEST mode** preferred (keys from `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` env)
- **MOCK gateway** (clearly labeled) used when Razorpay keys are unavailable (`MOCK_GATEWAY=true`)
- An order becomes `PAID` **only** after server-side webhook HMAC-SHA256 signature verification
- Client-side success redirect alone **never** marks an order paid
- Payment handling is **idempotent**: duplicate `provider_payment_id` events return 200 and are ignored
- Razorpay webhook secret stored in `RAZORPAY_WEBHOOK_SECRET` env only
- Raw card details are **never stored or logged** — Razorpay.js handles card input entirely client-side

## Inventory
- Stock is tracked at `product_variants` level (`stock_qty`, `reserved_qty`)
- Available stock = `stock_qty - reserved_qty`
- All stock changes happen inside **database transactions** with `SELECT ... FOR UPDATE` row locks
- Every stock change writes an `inventory_movements` row
- Stock is **reserved** when an order is created (PENDING_PAYMENT)
- Reservation is **released** if payment fails or after 30 minutes of no payment
- Stock is **permanently decremented** only when order becomes PAID

## Order Lifecycle
- Cancellation allowed only from `PAID` or `PROCESSING` status
- Admin can cancel; customers cannot self-cancel (future: allow with restrictions)
- Refunds require admin approval
- Refund restores stock via `RETURN_IN` movement
- All status transitions are validated server-side against an allowed-transitions map

## Product Images
- Stored in `uploads/` directory on disk (git-ignored)
- Served via `/uploads/` static route
- Max file size: **5 MB** (configurable via `MAX_FILE_SIZE_MB`)
- Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`
- Placeholder images from `placehold.co` used in seed data

## Reviews
- Only verified purchasers (order item in a `DELIVERED` order) can leave reviews
- One review per `(product_id, user_id)` enforced by DB UNIQUE constraint
- Reviews require admin moderation (`pending` → `approved`/`hidden`)
- Review body is HTML-stripped before storage (basic XSS prevention)
- Rating: integer 1–5 (DB CHECK constraint)

## Coupons
- Types: `percent` (percentage of subtotal) or `flat` (fixed paise discount)
- Per-user limit prevents abuse (default: 1 use per user)
- Usage count incremented atomically with order creation (race-safe)
- `WELCOME10`: 10% off, min order ₹500, max discount ₹500, 1 per user

## Data
- All seed data is **synthetic** — no real customer data
- Demo credentials: `admin@shopnest.com / Admin@123!`, `customer1@shopnest.com / Customer@123!`
- Product images use placeholder URLs in seed — replace with real uploads in production
- Payment transactions are sandbox/mock only

## Scale & Architecture
- Single-store, single-currency (INR)
- Monorepo: `frontend/` + `backend/` + `database/` + `tests/` + `docs/`
- Database: PostgreSQL 15 with `node-pg-migrate` for schema management
- No ORM — raw parameterized SQL for full control over locking and transactions
- Backend: Express 4 with TypeScript (strict mode)
- Frontend: React 18 + Vite + Tailwind CSS + TanStack Query

## Known Limitations (Week 1)
- Cart, checkout, payments not yet implemented (Week 2)
- Inventory admin not yet implemented (Week 3)
- Analytics dashboard not yet implemented (Week 4)
- Email notifications: stubbed (documented as future improvement)
- No guest cart persistence across sessions (future: localStorage merge)
- Search is case-insensitive ILIKE — no full-text search index yet (Week 4 improvement)

## Environment Variables
All secrets are in `.env` (git-ignored). See `.env.example` for the required keys.
Never commit real `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, or `JWT_SECRET` to the repository.
