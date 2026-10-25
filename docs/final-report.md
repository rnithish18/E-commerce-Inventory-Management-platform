# ShopNest — E-commerce & Inventory Management Platform
## Final Project Implementation & QA Audit Report

---

## 1. Executive Summary
ShopNest is a production-grade full-stack e-commerce and inventory management platform designed to solve common retail tech challenges: overselling, inventory race conditions, tampered client-side pricing, duplicate payment processing, and untracked fulfillment lifecycles.

The system was engineered across a 4-week structured milestone schedule with strict adherence to architectural constraints:
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, TanStack Query, React Hook Form, Zod, Recharts, Lucide Icons.
- **Backend**: Node.js, Express, TypeScript, pg connection pool, node-pg-migrate.
- **Database**: PostgreSQL 15+ with strict constraints, foreign keys, and indexes.
- **Auth**: Bcrypt password hashing (rounds = 12), JWT stored in httpOnly sameSite cookies, role-based access control (`CUSTOMER`, `ADMIN`).
- **Payment & Webhook Engine**: Dual-mode gateway architecture supporting Razorpay Test Mode and a zero-credential MOCK gateway with raw body cryptographic HMAC SHA256 signature verification.

---

## 2. Core Technical Architecture & Non-Negotiable Rules

### A. Strict Monetary Integrity (Integer Minor Units)
- Floats are strictly prohibited in all financial paths. All prices, fees, taxes, discounts, and refunds are calculated and persisted as **integer paise** (`₹1.00 = 100 paise`).
- The frontend only divides by 100 at the final presentation layer (`formatPaise(paise)`).

### B. Pessimistic Row Locking & Race-Condition Defense
- Order checkout and manual stock adjustments execute inside atomic PostgreSQL transactions utilizing `SELECT ... FOR UPDATE` row locks on the `product_variants` table.
- A stress test firing 10 simultaneous concurrent checkout requests for an SKU with `stock_qty = 1` confirmed that exactly 1 checkout succeeded (`201 Created`) while 9 were rejected with `INSUFFICIENT_STOCK` (`400 Bad Request`), with zero negative inventory anomalies.

### C. Server-Side Pricing Engine
- All line items, subtotal, 18% GST, shipping logic (free above ₹500, else flat ₹50), and coupon discounts are calculated exclusively on the server.
- Client-supplied prices or altered subtotals in HTTP payloads are completely disregarded.

### D. Central Order State Machine (`orderStateMachine.ts`)
- Explicit state transition graph:
  - `PENDING_PAYMENT` $\to$ `PAID` $\to$ `PROCESSING` $\to$ `SHIPPED` $\to$ `OUT_FOR_DELIVERY` $\to$ `DELIVERED`
  - Cancellation is restricted to pre-shipment states (`PENDING_PAYMENT`, `PAID`, `PROCESSING`).
  - Cancellation triggers automatic reservation release or inventory restock via `RESERVATION_RELEASE` / `RETURN_IN` and appends an entry to the immutable `audit_log`.

### E. Idempotent Payment & Webhook Processing
- Razorpay webhook and callback events verify raw-body signatures and look up existing records by `payment_attempts.provider_payment_id`.
- Duplicate webhook submissions (replay attacks or at-least-once deliveries) are acknowledged with HTTP 200 without executing duplicate inventory reductions or ledger mutations.

---

## 3. Security Hardening & Defenses

1. **Anti-CSRF Origin Validation**: Custom origin/referer verification guarding all state-mutating requests (`POST`, `PUT`, `PATCH`, `DELETE`).
2. **Defensive Rate Limiting**:
   - Authentication limiter: 15 attempts / 15 minutes.
   - Coupon brute-force limiter: 20 validations / 10 minutes.
   - Payment intent limiter: 30 attempts / 10 minutes.
3. **HTTP Header Hardening**: Helmet with strict Content Security Policy, X-Content-Type-Options `nosniff`, and Frameguard `sameorigin`.
4. **Credential Safety**: `.env` and `uploads/` directories git-ignored; `.env.example` verified to contain zero secrets.
5. **SQL Injection Immunity**: 100% parameterized queries via node-postgres (`$1, $2, ...`) and Zod schema coercions.

---

## 4. Test Suite Execution & Verification Evidence

| Test Suite Category | Framework | Scope / Coverage | Result |
| :--- | :--- | :--- | :--- |
| **Unit Tests** | Vitest | Money paise formatting, slug generation, JWT sign/verify, server pricing formulas | **34 / 34 PASS** |
| **API Integration Tests** | Vitest + Supertest | Auth routes, catalog filters, admin authorization matrix, coupon validation, health checks | **116 / 116 PASS** |
| **Concurrency Stress Test** | Vitest | 10 concurrent requests for 1 stock SKU with row locking | **PASS** |
| **Browser E2E Tests** | Playwright | Full checkout journey, admin inventory & orders, failed payment restock, duplicate webhook | **6 / 6 PASS** |
| **Code Coverage** | Vitest v8 | Core domain logic (`orderStateMachine`, `pricing`, `refunds`, `auth`) | **> 90% in core modules** |

---

## 5. Known Limitations & Future Roadmap

1. **Distributed Locks**: Currently relies on PostgreSQL row-level locks (`FOR UPDATE`). For multi-region multi-master setups, Redis Redlock would be incorporated.
2. **Payment Gateway Provider Selection**: Currently toggles via `MOCK_GATEWAY=true/false` environment flag. A future multi-gateway router could dynamically choose Razorpay, Stripe, or Cashfree based on currency and customer location.
3. **Automated Reordering**: Low-stock SKU notifications alert administrators via dashboard indicators and bell dropdowns. Future iterations can auto-generate purchase orders and email suppliers.
