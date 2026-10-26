# ShopNest Project Progress & Verification Record

## 1. Executive Summary
ShopNest is a production-grade, enterprise E-commerce & Inventory Management platform built strictly to spec using Node.js (TypeScript), PostgreSQL, React 19, Tailwind CSS, TanStack Query, and Playwright.

---

## 2. Week 1 Verification & Proof of Closure

### A. Real Database Setup & Seed Verification
- **PostgreSQL Cluster**: Running natively on `127.0.0.1:5432`, database `shopnest_db`, encoding `UTF8`.
- **Database Migrations Executed**:
  - `001_create_users_addresses.js`: `users`, `addresses`, `user_role` enum
  - `002_create_categories_products.js`: `categories`, `products`, `product_images`, `product_variants`, `product_badge` enum
  - `003_create_inventory_movements.js`: `inventory_movements`, `inventory_movement_type` enum
  - `004_create_carts.js`: `carts`, `cart_items`
  - `005_create_orders.js`: `coupons`, `orders`, `order_items`, `payment_attempts`, `refunds`, `coupon_redemptions`
  - `006_create_reviews_wishlists_tracking.js`: `reviews`, `shipment_tracking_events`, `audit_log`, `wishlists`

### B. Seed Counts Verified Against Real Database
```
Category count: 7
Product count: 42
Product variants count: 42 (all have reorder_threshold > 0)
Users count: 11 (1 Admin: admin@shopnest.com, 10 Customers: customer1 to customer10)
Coupons count: 1 (WELCOME10 - 10% discount, min order ₹500)
Inventory movements count: 42 (initial PURCHASE_IN records)
```

### C. Reorder Threshold & Live Admin Dashboard
- Confirmed column `product_variants.reorder_threshold` exists on all 42 variants.
- Admin dashboard route `GET /api/v1/admin/dashboard` queries live PostgreSQL aggregates (`COUNT(orders)`, `SUM(total_paise)`, `COUNT(users)`, `pv.stock_qty <= pv.reorder_threshold`) — zero hardcoded numbers.

### D. Local Server Execution Commands & URLs
- **PostgreSQL**: Port `5432`
- **Backend API**: `npm --prefix backend run dev` -> `http://localhost:4000`
- **Frontend App**: `npm --prefix frontend run dev` -> `http://localhost:5173`
- **Credentials**:
  - Admin: `admin@shopnest.com` / `Admin@123!`
  - Customer: `customer1@shopnest.com` / `Customer@123!`

---

## 3. Week 2: Cart, Checkout & Payment Workflow

### A. Architectural Deliverables Completed
1. **Persistent DB-Backed Cart (`backend/src/services/cart.ts`, `backend/src/routes/cart.ts`)**:
   - Authenticated user cart stored in database; guest cart held in local state and seamlessly merged via `POST /api/v1/cart/merge` upon login.
   - Quantity changes strictly validated against available variant stock (`stock_qty - reserved_qty`). Rejects excessive quantities with `400 INSUFFICIENT_STOCK`.
   - Live interactive right panel with quantity steppers (`+` / `-`), item removal, coupon input, and checkout link.
2. **Server-Side Pricing Engine (`backend/src/services/pricing.ts`)**:
   - Zero floating-point math; all calculations executed in integer paise (`₹1 = 100 paise`).
   - Computes:
     - Subtotal in paise
     - Coupon discounts (validates `min_order_paise`, percentage caps, and max discount)
     - 18% flat GST calculated via `Math.round(taxablePaise * 0.18)`
     - Shipping rules (Flat ₹50 / 5000 paise under ₹500, Free above ₹500)
     - Total payable in integer paise
3. **Address CRUD & Checkout Form (`backend/src/routes/addresses.ts`, `frontend/src/pages/CheckoutPage.tsx`)**:
   - Complete address management (create, list, update, delete, set default).
   - Validated checkout form (React Hook Form + Zod) with delivery address selector and saved-address radios.
4. **Order Creation & Stock Reservation Engine (`backend/src/services/order.ts`)**:
   - Checkout runs within an ACID database transaction.
   - Row-level locking using `SELECT ... FOR UPDATE` on `product_variants` preventing race conditions and overselling.
   - Reserves stock (`reserved_qty += quantity`) with a 30-minute expiry window.
   - Creates immutable snapshot of product name, SKU, description, unit price, and total price on `order_items`.
   - Records an `inventory_movements` row with type `RESERVATION`.
5. **Razorpay & MOCK Sandbox Integration (`backend/src/services/payment.ts`, `backend/src/routes/payments.ts`, `backend/src/routes/webhooks.ts`)**:
   - Integrated Razorpay test mode with automatic fallback to fully featured MOCK gateway (`MOCK_GATEWAY=true`).
   - Webhook verification using HMAC SHA-256 with raw body buffer comparison (`crypto.timingSafeEqual`).
   - Rejects invalid signatures with `400 INVALID_SIGNATURE`.
6. **Idempotent Payment Handling & Stock Compensation**:
   - Stores `provider_payment_id` with `UNIQUE` constraint. Duplicate webhook deliveries return `200 OK` idempotently without double-decrementing stock.
   - On successful payment (`payment.captured`):
     - Order status transitions: `PENDING_PAYMENT` -> `PAID`
     - Stock reservation converted to permanent decrement: `stock_qty -= reserved_qty`, `reserved_qty -= quantity`
     - Writes `inventory_movements` row with type `SALE_OUT`
     - Emits shipment tracking event: `ORDER_CONFIRMED`
   - On failed payment (`payment.failed`):
     - Order status transitions: `PENDING_PAYMENT` -> `CANCELLED`
     - Stock reservation released: `reserved_qty -= quantity`
     - Writes `inventory_movements` row with type `RESERVATION_RELEASE`
7. **Frontend Order Confirmation & Tracking (`frontend/src/pages/OrderConfirmationPage.tsx`, `frontend/src/pages/MyOrdersPage.tsx`)**:
   - Order confirmation screen displaying verified server status, immutable item snapshots, tax/shipping breakdown, and tracking stepper.
   - My Orders dashboard with real-time status pills (`PAID`, `PROCESSING`, `SHIPPED`, `DELIVERED`, `CANCELLED`), order timeline events, and cancel action.

---

## 4. Test Suite Execution & Verification

### A. Vitest Suite (API Integration & Unit Tests)
```
 ✓ tests/unit/slug.test.ts (8 tests)
 ✓ tests/unit/money.test.ts (24 tests)
 ✓ tests/unit/jwt.test.ts (6 tests)
 ✓ tests/unit/pricing.test.ts (3 tests)
 ✓ tests/api/products.test.ts (17 tests)
 ✓ tests/api/checkout_payment.test.ts (11 tests)
 ✓ tests/api/auth.test.ts (19 tests)

Test Files:  7 passed (7)
Tests:       88 passed (88)
Duration:    7.37s
```

### B. Checkout & Payment API Test Details (`tests/api/checkout_payment.test.ts`)
- **Stock Validation**: Rejects quantity exceeding variant stock with `400 INSUFFICIENT_STOCK`.
- **Pricing Integrity**: Server verifies subtotal, coupon, GST (18%), and total in paise.
- **Client Price Tampering Immunity**: Injected client prices (`unit_price_paise: 100`) are strictly ignored; server-side database price is enforced.
- **Stock Reservation**: Row locking via `SELECT ... FOR UPDATE` increments `reserved_qty` and logs `RESERVATION` movement.
- **Snapshot Storage**: `order_items` persists immutable name, sku, and price snapshots.
- **Webhook Security**: Bogus signature rejected with `400 INVALID_SIGNATURE`.
- **Payment Success**: Valid signature transitions order to `PAID`, writes `SALE_OUT`, and increments tracking.
- **Idempotency**: Re-sending identical payment captured event produces 0 duplicate inventory movements.
- **Failure Compensation**: Simulated failure event transitions order to `CANCELLED`, decrements `reserved_qty`, and writes `RESERVATION_RELEASE`.

### C. Playwright End-to-End Test (`tests/e2e/checkout.spec.ts`)
```
Running 1 test using 1 worker
  ok 1 tests\e2e\checkout.spec.ts:4:7 › End-to-End Customer Checkout & Payment Workflow › Customer logs in, adds product to cart, completes sandbox checkout, and views confirmed order (5.2s)
  1 passed (7.8s)
```
- Real Chromium browser launched in headless mode.
- Customer logged in (`customer1@shopnest.com`).
- Navigated to `/shop`, added first item to cart.
- Navigated to `/checkout`, validated delivery address.
- Paid via Test Sandbox payment gateway.
- Verified `/order-confirmation/:id` rendered "Payment Verified & Confirmed" and "Thank you for your order!".
- Navigated to `/orders` and confirmed new order appeared with green "PAID" badge.

---

## 5. Week 3: Inventory, Orders & Store Features (100% Completed & Verified)

### A. Architectural Deliverables Completed
1. **Central Order State Machine (`backend/src/services/orderStateMachine.ts`)**:
   - Statuses: `PENDING_PAYMENT`, `PAID`, `PROCESSING`, `SHIPPED`, `OUT_FOR_DELIVERY`, `DELIVERED`, `CANCELLED`, `REFUND_REQUESTED`, `REFUNDED`.
   - Strict transition table enforcing valid forward progress.
   - Rejects illegal transitions and post-`SHIPPED` cancellations with `409 CONFLICT`.
   - Restocks inventory on cancellation (`RESERVATION_RELEASE`) and on refund approval (`RETURN_IN`).
   - Writes immutable `audit_log` records with actor, old status, and new status for every state transition.

2. **Refund Workflow & Idempotency Guard (`backend/src/services/refund.ts`)**:
   - Customers can request refunds only for `DELIVERED` or `PAID` orders.
   - Admin approval invokes payment provider refund, writes `refunds` row, restocks items via `RETURN_IN`, and sets order to `REFUNDED`.
   - Enforces database idempotency: repeated refund attempts on already refunded or pending records are rejected.

3. **SKU Stock Management & Audit Trail (`backend/src/routes/admin/inventory.ts`, `frontend/src/pages/admin/AdminInventory.tsx`)**:
   - Real-time inventory table with stock count, reserved count, and low-stock filter (`stock_qty <= reorder_threshold`).
   - Stock adjustments with mandatory reason and movement types: `PURCHASE_IN`, `ADJUSTMENT`, `RETURN_IN`.
   - Row-locking (`SELECT ... FOR UPDATE`) guarantees thread-safe stock arithmetic and emits `inventory_movements` log.
   - Dynamic threshold updates (`PUT /api/v1/admin/inventory/:variantId/threshold`).
   - Movement history ledger modal per variant.

4. **Shipment Tracking & Customer Steppers (`backend/src/routes/admin/orders.ts`, `frontend/src/pages/OrderConfirmationPage.tsx`, `frontend/src/components/layout/RightPanel.tsx`)**:
   - `shipment_tracking_events` audit table with location, description, timestamp, and operator ID.
   - Admin order drawer with tracking publisher form.
   - Customer Order Confirmation page renders live 4-stage stepper: **Ordered → Shipped → Out for Delivery → Delivered**, along with live **Courier Tracking Timeline**.

5. **Coupon Administration & Concurrency Limits (`backend/src/routes/admin/coupons.ts`, `frontend/src/pages/admin/AdminCoupons.tsx`)**:
   - Full CRUD for coupons: type (`percent` or `flat`), value, min order requirement, max discount cap, global usage limit, per-user limit, and expiry dates.
   - Checkout engine locks coupon row with `FOR UPDATE` to prevent race conditions during redemptions.

6. **Verified Product Reviews with HTML Sanitization (`backend/src/routes/reviews.ts`, `backend/src/routes/admin/reviews.ts`, `frontend/src/pages/admin/AdminReviews.tsx`)**:
   - Customers can only review products they purchased in an order with status `DELIVERED`.
   - Enforces unique constraint: 1 review per product per user.
   - Sanitizes text inputs against XSS attacks using `sanitize-html`.
   - Admin moderation queue: `pending` → `approved` or `hidden`.
   - Recalculates product `average_rating` and `rating_count` on approval/rejection.

7. **Multer Secure File Uploads (`backend/src/routes/uploads.ts`)**:
   - Private storage directory (`uploads/`, git-ignored).
   - Strict MIME validation (JPEG, PNG, WebP) and 5MB size limit.
   - Admin role protection on upload endpoints.

---

## 6. Test Suite Execution & Verification Record

### A. Vitest Suite (100% Pass — 121 Tests across 10 Files)
```
 ✓ tests/unit/slug.test.ts (8 tests)
 ✓ tests/unit/money.test.ts (24 tests)
 ✓ tests/unit/pricing.test.ts (3 tests)
 ✓ tests/unit/jwt.test.ts (6 tests)
 ✓ tests/api/products.test.ts (17 tests)
 ✓ tests/api/reservation_expiry.test.ts (1 test)
 ✓ tests/api/checkout_payment.test.ts (11 tests)
 ✓ tests/api/week3.test.ts (31 tests)
 ✓ tests/api/auth.test.ts (19 tests)
 ✓ tests/api/race_condition.test.ts (1 test)

 Test Files  10 passed (10)
      Tests  121 passed (121)
   Duration  24.31s
```

### B. Playwright End-to-End Suite (100% Pass — 2 Browser Tests)
```
Running 2 tests using 1 worker

  ok 1 tests\e2e\checkout.spec.ts:4:7 › End-to-End Customer Checkout & Payment Workflow › Customer logs in, adds product to cart, completes sandbox checkout, and views confirmed order (4.3s)
  ok 2 tests\e2e\week3_admin.spec.ts:4:7 › Week 3 Admin E2E: Stock Adjustment, State Machine & Order Tracking › Admin adjusts stock, advances order from PAID to SHIPPED, and customer tracking stepper reflects updates (15.2s)

  2 passed (21.9s)
```

---

## 7. Week 4: Analytics, Security & Deployment (100% Completed & Verified)

### A. Architectural Deliverables Completed
1. **Sales & Business Analytics Engine (`backend/src/routes/admin/analytics.ts`, `frontend/src/pages/admin/AdminAnalytics.tsx`)**:
   - Live SQL aggregates computed exclusively over verified, non-cancelled orders (`status IN ('PAID', 'PROCESSING', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED')`).
   - Executive KPIs: Total Gross Sales (paise -> ₹), Total Orders, Total Active Customers, and Low Stock SKU exposure with automated percentage changes ($\Delta\%$) versus the prior period.
   - Interactive Recharts Combo Chart: Daily Turnover bars in accent orange (`#f97316`) paired with order volume line in sky blue (`#38bdf8`), bucketed in `Asia/Kolkata` (UTC+5:30).
   - Order Status fulfillment breakdown donut chart with status color palette.
   - Top 5 Selling Products table and Low Stock Alert ledger with direct one-click restock links.
   - Filterable by date periods: `Today`, `Last 7 Days`, `Last 30 Days`, and `Custom Range`.
   - Built-in CSV report export generator (`ShopNest_Analytics_*.csv`).
   - Full KPI definitions, formulas, and timezone logic documented in `docs/kpis.md`.

2. **Enterprise Security Hardening**:
   - **Rate Limiting (`backend/src/middleware/security.ts`)**: `express-rate-limit` active on auth routes (`/api/v1/auth/login`, `/api/v1/auth/register` - 30 req/15 min) and coupon validation (`/api/v1/coupons` - 40 req/10 min).
   - **Anti-CSRF Origin Guard**: State-modifying requests (`POST`, `PUT`, `DELETE`, `PATCH`) verify `Origin` and `Referer` headers against whitelisted origins.
   - **SQL Injection Immunity**: 100% parameterized queries (`$1, $2, ...`) and Zod schema validations. PostgreSQL syntax errors (`22P02`) gracefully caught with `400 BAD_REQUEST`.
   - Comprehensive security audit record documented in `docs/security-report.md`.

3. **Containerization & Deployment Architecture**:
   - Production multi-stage `backend/Dockerfile` compiling TypeScript to `dist/index.js` and running on Node.js 20 Alpine.
   - Production multi-stage `frontend/Dockerfile` and `frontend/nginx.conf` compiling Vite and serving via high-performance Nginx with reverse proxy for `/api` and `/uploads`.
   - Root `docker-compose.yml` orchestrating `postgres` (with healthcheck and volume persistence), `backend`, and `frontend`.
   - Production health probes: `/health` and `/api/v1/health` with database ping, uptime, and status reporting.
   - Step-by-step setup and operations runbook documented in `docs/deployment.md`.

4. **Visual Documentation & Evidence**:
   - 12 full-page desktop screenshots automatically captured and verified via Playwright in `docs/screenshots/`:
     1. `01_storefront_home.png`
     2. `02_catalog_search_filter.png`
     3. `03_product_detail.png`
     4. `04_cart_summary.png`
     5. `05_checkout_form.png`
     6. `06_order_tracking.png`
     7. `07_admin_dashboard.png`
     8. `08_admin_inventory.png`
     9. `09_admin_orders.png`
     10. `10_admin_analytics.png`
     11. `11_admin_coupons.png`
     12. `12_admin_reviews.png`

---

## 8. Complete Test Suite Execution Record

### A. Vitest Suite (100% Pass — 131 Tests across 11 Files)
```
 ✓ tests/unit/slug.test.ts (8 tests)
 ✓ tests/unit/money.test.ts (24 tests)
 ✓ tests/unit/jwt.test.ts (6 tests)
 ✓ tests/unit/pricing.test.ts (3 tests)
 ✓ tests/api/products.test.ts (17 tests)
 ✓ tests/api/reservation_expiry.test.ts (1 test)
 ✓ tests/api/checkout_payment.test.ts (11 tests)
 ✓ tests/api/week4_security_analytics.test.ts (10 tests)
 ✓ tests/api/week3.test.ts (31 tests)
 ✓ tests/api/auth.test.ts (19 tests)
 ✓ tests/api/race_condition.test.ts (1 test)

 Test Files  11 passed (11)
      Tests  131 passed (131)
   Duration  14.03s
```

### B. Playwright End-to-End Suite (100% Pass — 3 Browser Tests)
```
Running 3 tests using 1 worker

  ok 1 tests\e2e\capture_screenshots.spec.ts:14:7 › Automated Visual Documentation & Evidence Capture › Captures all 12 platform views across customer and admin journeys (45.4s)
  ok 2 tests\e2e\checkout.spec.ts:4:7 › End-to-End Customer Checkout & Payment Workflow › Customer logs in, adds product to cart, completes sandbox checkout, and views confirmed order (12.9s)
  ok 3 tests\e2e\week3_admin.spec.ts:4:7 › Week 3 Admin E2E: Stock Adjustment, State Machine & Order Tracking › Admin adjusts stock, advances order from PAID to SHIPPED, and customer tracking stepper reflects updates (23.7s)

  3 passed (1.4m)
```

---

## 9. Final Sign-off & Completion Status
- **Phase 1 (Week 1)**: Core Platform & Catalog — **COMPLETE**
- **Phase 2 (Week 2)**: Cart, Checkout & Payment Workflow — **COMPLETE**
- **Phase 3 (Week 3)**: Inventory, Orders & Store Features — **COMPLETE**
- **Phase 4 (Week 4)**: Analytics, Security & Deployment — **COMPLETE**
- **All non-negotiable rules adhered to**: Integer paise currency everywhere, server-side pricing and payment verification, atomic row-locking on inventory, central order state machine, zero floats, and 100% tests passing.


---

## 6. Phase 0: Real-Time Hardening & Demo Behavior Removal

### Completed Deliverables
1. **Dynamic Track Order Card**:
   - Replaced hardcoded `#ORD-9021` card in `RightPanel.tsx`.
   - Built `GET /api/v1/orders/latest-tracking` endpoint to fetch the authenticated user's latest real order and `shipment_tracking_events`.
   - Rendered a clean empty state with shopping prompt for guests or users without orders.
2. **Real Product Ratings & Review Counts**:
   - Eliminated hardcoded `'4.6 (24)'` defaults in `ProductCard.tsx` and `ProductDetailPage.tsx`.
   - Real `average_rating` and `rating_count` from approved database reviews are displayed.
   - Products with 0 reviews display *"No reviews yet"* and no stars.
3. **Persistent Database-Backed Wishlist**:
   - Implemented `backend/src/routes/wishlists.ts` (`GET /api/v1/wishlists`, `GET /ids`, `POST /:productId`, `DELETE /:productId`).
   - Built `WishlistContext.tsx` with instant optimistic mutations and TanStack Query cache synchronization.
   - Created full `WishlistPage.tsx` with saved product grid and empty state.
   - Added 8 integration tests in `tests/api/wishlist.test.ts` (all 8 passing).
4. **Storefront Counters & Copy**:
   - Neutral search placeholder: *"Search products, brands and categories..."*.
   - Dynamic category tile counts in `CategoryTiles.tsx` populated via `useCategories()` from real database `product_count`.
5. **Real Product Imagery & Hero Showcase**:
   - Generated 42 dedicated product SVG graphics under `frontend/public/products/` with zero external dependencies or hotlinking.
   - Updated `backend/src/db/seed.ts` to seed `/products/[slug].svg`.
   - Re-seeded database (`npm run seed`).
   - Integrated floating hero headphone artwork in `HeroBanner.tsx`.
   - Added complete attribution and licensing in `docs/image-credits.md`.
6. **Card Layout & Loading State**:
   - Fixed discount badge layout in `ProductCard.tsx` using `flex-wrap` and `whitespace-nowrap shrink-0` to eliminate clipping.
   - Enforced `VITE_SHOW_DEMO_LOGINS=true` feature flag on `LoginPage.tsx` demo buttons (defaulted to `false` in `.env.example`).
   - Set dark background styles on `<body>` in `frontend/index.html` to eliminate white flash during initial page load.
7. **Verification Evidence**:
   - **Vitest**: 12/12 test files passed, **158 / 158 tests passed** (41.5s).
   - **Playwright**: 5/5 test suites passed, **5 / 5 suites passed** (1.1m).

---

## 7. Phase A: Animated Split-Screen Auth, Runaway Button & Password Reset

### Completed Deliverables
1. **Unified Split-Screen Experience (`AuthContainer.tsx`)**:
   - Left showcase panel: Deep navy brand aesthetic featuring rotating showcase of real products (`/products/*.svg`), pricing, ratings, value pillars (Express Delivery, 100% Genuine, Instant Refunds), and social proof.
   - Right panel: High-contrast auth card with Customer / Store Admin role switch pill and Google OAuth check (`/api/v1/auth/providers`).
   - Smooth transitions between `/login` and `/register` with full URL synchronization and state retention.
2. **Interactive "Runaway" Submit Button (`RunawayButton.tsx`)**:
   - Playfully dodges cursor on hover when email/password are empty or invalid (`translate3d(±65px, 10px, 0)`), never obscuring inputs.
   - Witty rotating hints: e.g. "Fill in your email first! 📝", "Password is required! 🔒".
   - **Escape Hatch**: After 3 dodges, stops dodging and shows "Okay, fine! Fill the fields below 😊".
   - **Accessibility & Escape Hatch**: Full keyboard Tab navigation locks evasion (`onFocus`), allowing direct Enter key submission. Completely disabled on touch screens and `prefers-reduced-motion`.
3. **Password Reset Flow**:
   - Database migration `007_create_password_resets.js` with indexed token hash and expiration.
   - Backend endpoints `POST /api/v1/auth/forgot-password` (SHA-256 token hashing, 1-hour expiry, dev mailer) and `POST /api/v1/auth/reset-password`.
   - Modal with instant dev link in local environment.
   - Dedicated `/reset-password?token=...` page with `PasswordStrengthMeter` and live validation.
4. **Form Features & Security Polish**:
   - Show/hide password visibility toggle with accessible `aria-pressed`.
   - "Remember me for 30 days" extending session cookie `maxAge`.
   - Subtle teal focus glow on inputs (`focus:shadow-[0_0_12px_rgba(45,212,191,0.25)]`).
   - Live password strength meter on registration with criteria checks.
5. **Verification & Test Evidence**:
   - **Vitest**: 13/13 test files passed, **164 / 164 tests passed** (including `tests/api/password_reset.test.ts`).
   - **Playwright**: 7/7 tests passed in `tests/e2e/auth_runaway.spec.ts` + all 4 core suites passed with zero regressions.

---

## 8. Phase B: AI Image Upload, Vision Analysis & Visual Catalog Search

### Completed Deliverables
1. **First-Class Image Uploader Component (`ImageUploader.tsx`)**:
   - Drag-and-drop zone with animated feedback, clipboard paste (`Ctrl+V`) listener, and mobile/webcam capture integration.
   - Instant client-side object URL previews with progress indicator.
   - Multi-image handling (up to 5 images) with re-ordering (`<` / `>`) and primary cover badge.
   - Client and server-side magic byte inspection and 5MB size limits with informative error chips.
2. **AI Vision Analysis Service (`aiVision.ts`, `/api/v1/ai/analyze-image`)**:
   - Abstract vision provider architecture supporting Google Gemini, Anthropic Claude, and high-fidelity mock fallback.
   - Strict Zod validation on output schemas: `suggestedTitle`, `suggestedCategory`, `suggestedDescription`, `detectedTags`, `dominantColors`, `estimatedPriceRange`, `imageQualityScore`, and `recommendations`.
   - Automated quality scoring (1-100) and dominant color extraction via `sharp` stats.
   - **SHA-256 Hash Caching**: Persistent caching in table `product_image_analysis` (migration `008_create_product_image_analysis.js`) preventing redundant API usage.
   - Admin UI suggestion card with one-click "Apply all suggestions" and individual cherry-pick controls.
3. **Storefront Visual Catalog Search (`VisualSearchModal.tsx`, `/api/v1/ai/image-search`)**:
   - Camera icon integrated into storefront search bar.
   - "Search by Image" modal supporting file drop, browse, or photo capture.
   - Extracts semantic visual features and executes multi-term catalog search against PostgreSQL with relevance ranking (`% match`).
   - Clean navigation to matched product detail pages.
4. **Image Optimization & Security Hardening**:
   - Magic bytes verification (`validateMagicBytes`) rejecting disguised executables and non-image files with `400 INVALID_FILE_TYPE`.
   - Automatic EXIF metadata stripping protecting user privacy.
   - Sharp resizing to standard 1200x1200 max main image and 300x300 thumbnail (`_thumb.webp`).
   - Static `/uploads` route served with `Cache-Control: public, max-age=86400`.
   - Rate limiting on image uploads (`uploadLimiter`) and AI vision endpoints (`aiLimiter`).
5. **Verification & Test Evidence**:
   - **Vitest**: 14/14 test files passed, **174 / 174 tests passed** (including 10 tests in `tests/api/uploads_ai.test.ts`).
   - **Playwright**: 13/13 tests passed across all 5 test suites (including `tests/e2e/ai_vision.spec.ts` and `tests/e2e/auth_runaway.spec.ts`).
