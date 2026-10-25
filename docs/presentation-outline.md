# ShopNest — Presentation Outline & Demo Walkthrough

---

## Slide 1: Title & Executive Summary
- **Project**: ShopNest — E-commerce & Inventory Management Platform
- **Presenter**: Full-Stack Senior Engineering Pair
- **Core Value Proposition**: A production-grade retail tech engine synchronizing real-time catalog discovery, pessimistic inventory reservation, server-side pricing, and complete order lifecycle fulfillment.

---

## Slide 2: Problem Statement & Industry Context
- **The E-commerce Trilemma**:
  1. *Overselling*: High-concurrency checkouts causing negative inventory and angry shoppers.
  2. *Payment Inconsistency*: Relying on client-side redirects causing phantom orders or lost revenue.
  3. *Unreliable Metrics*: Hardcoded figures or incomplete refund tracking causing deceptive revenue metrics.
- **The ShopNest Solution**: Pessimistic database row locks, server-side pricing snapshots, idempotent HMAC webhook processing, and SQL-backed live analytics.

---

## Slide 3: System Architecture & Tech Stack
- **Frontend**:
  - React 18 with Vite + TypeScript
  - Tailwind CSS with bespoke dark navy & vibrant orange design system
  - TanStack Query (React Query) for smart caching and background refreshes
  - React Hook Form + Zod for type-safe validation
  - Recharts for executive sales combo charts & status donuts
- **Backend & Persistence**:
  - Node.js + Express (TypeScript)
  - PostgreSQL with node-pg-migrate migrations & deterministic seeds
  - Connection pooling with parameterized SQL
- **Testing & Quality Assurance**:
  - Vitest + Supertest for unit, integration, and concurrency tests
  - Playwright for full customer and administrator browser E2E flows

---

## Slide 4: Core Engineering Pillars (Non-Negotiable Rules)
1. **Integer Money Only**: Zero floats. All calculations in integer paise (`₹1 = 100 paise`).
2. **Pessimistic Concurrency**: `SELECT ... FOR UPDATE` row locks during checkout ensure zero overselling.
3. **Strict Server Pricing**: Line items, GST (18%), shipping rules, and coupon discounts calculated strictly server-side.
4. **Idempotent Webhooks**: Raw-body cryptographic HMAC SHA-256 verification with `provider_payment_id` deduplication.
5. **Centralized Order State Machine**: Explicit status transitions (`PENDING_PAYMENT` $\to$ `PAID` $\to$ `PROCESSING` $\to$ `SHIPPED` $\to$ `OUT_FOR_DELIVERY` $\to$ `DELIVERED`).

---

## Slide 5: Storefront Demo (Customer Journey)
- **Catalog & Discovery**: Instant search, category filters, price sliders, and sorting options.
- **Product Card**: Visual badges (`Best Seller`, `Hot`), rating, MRP strike-through, and discount calculations.
- **Persistent Cart & Sticky Drawer**: Real-time quantity steppers, `WELCOME10` 10% coupon redemption, GST & shipping display.
- **Order Tracking Stepper**: Visual stepper tracking order progress from creation through final delivery.

---

## Slide 6: Admin Dashboard Demo (Merchant & Warehouse Journey)
- **Executive KPI Cards**: Real-time Gross Sales, Net Revenue, Total Orders, Active Customers, and Low-Stock Exposure.
- **Data Visualizations**: Daily turnover vs order volume combo chart and order status fulfillment donut.
- **Inventory Control**: SKU stock table with low-stock filter, manual stock adjustments (`PURCHASE_IN`, `ADJUSTMENT`, `RETURN_IN`), and full movement audit trail.
- **Order Management & Tracking**: Status filters, detail view with price snapshots, and shipment tracking event updates.

---

## Slide 7: Security Hardening & Concurrency Verification
- **Stress Test Proof**: 10 simultaneous checkout requests for SKU with stock = 1 $\to$ Exactly 1 order created, 9 rejected with `INSUFFICIENT_STOCK`.
- **Security Defenses**: Anti-CSRF origin verification, rate limiting on auth, coupons, and payments, Helmet security headers, httpOnly JWT cookies, and SQL injection immunization.

---

## Slide 8: Summary & Key Metrics
- **Automated Tests**: 150 Vitest tests + 6 Playwright E2E browser scenarios passing.
- **Coverage**: > 90% test coverage across core business logic modules.
- **Zero Secrets in Repo**: Verified clean git tracking (`.env` and `uploads/` git-ignored).
- **GitHub Repository**: Ready for production deployment and demonstration.
