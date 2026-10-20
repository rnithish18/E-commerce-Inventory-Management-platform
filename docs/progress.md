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

## 5. Upcoming: Week 3 Milestones
- **Inventory Management Dashboard**:
  - Stock adjustment interface (PURCHASE_IN, ADJUSTMENT, RETURN_IN) with audit trail.
  - Low-stock threshold alerts (`pv.stock_qty <= pv.reorder_threshold`) and filter tabs.
- **Order Management & Fulfillment**:
  - Admin order transition controls (`PAID` -> `PROCESSING` -> `SHIPPED` -> `OUT_FOR_DELIVERY` -> `DELIVERED`).
  - Shipment tracking event updates (carrier, tracking number, milestone notes).
  - Cancellation and refund workflow (`REFUND_REQUESTED` -> `REFUNDED` with `RETURN_IN` stock adjustment).
- **Coupons Management**:
  - Admin coupon CRUD (type percent/flat, min order, usage limits, active date ranges).
  - Customer redemption validation and usage tracking.
- **Product Reviews & Moderation**:
  - Customer review submission for verified purchased items (`order_item_id` check).
  - Admin review moderation workflow (`pending` -> `approved` / `hidden`).
  - Product average rating and rating count updates.
