# ShopNest — E-commerce & Inventory Management Platform

> A production-grade, full-stack online retail and warehouse management platform featuring pessimistic database concurrency control, server-side monetary precision (integer paise), idempotent payment gateway integration, and real-time business analytics.

---

## 🏗️ Architecture & Technology Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, TanStack Query (v5), React Hook Form, Zod, Recharts, Lucide Icons.
- **Backend**: Node.js, Express, TypeScript, node-postgres (`pg` connection pool with parameterized SQL), node-pg-migrate.
- **Database**: PostgreSQL 15+ with strict schema constraints, foreign keys, triggers, and indices.
- **Authentication**: Bcrypt password hashing (`rounds = 12`), JWT session tokens stored in secure `httpOnly` `sameSite` cookies, role-based access control (`CUSTOMER`, `ADMIN`).
- **Payments**: Razorpay Test Mode with server-side HMAC SHA-256 signature verification and a transparent, zero-dependency Mock Gateway (`MOCK_GATEWAY=true`).
- **File Uploads**: Controlled Multer storage to private `uploads/` directory with MIME type and size limit validation.
- **Testing**: Vitest (Unit & Integration with Supertest), Concurrency Stress Suite (`race_condition.test.ts`), Playwright (Browser E2E).

---

## ✨ Key Platform Features

### 🛍️ Customer Storefront
- **Visual Design**: Replicates the reference storefront design featuring a dark navy topbar (`#0f172a`), vibrant orange accents (`#f97316`), sticky navigation, and rounded aesthetic cards.
- **Dynamic Catalog**: Instant search, category filters, price range sliders, sorting (price, rating, discount), pagination, and skeleton loaders.
- **Product Details**: Multi-variant SKU selector, stock status indicators, customer reviews, strike-through MRP pricing, and computed discount percentage tags.
- **Persistent Cart & Sticky Drawer**: Quantity steppers with real-time stock validation, `WELCOME10` 10% first-order coupon redemption, 18% GST calculation, shipping computation (free above ₹500, else flat ₹50).
- **Order Tracking Stepper**: Visual stepper tracking order states: `Ordered` $\to$ `Shipped` $\to$ `Out for Delivery` $\to$ `Delivered`.

### 📊 Merchant & Admin Dashboard
- **Dark Theme Console**: Dark navy dashboard with responsive sidebar navigation (`/admin/*`).
- **Executive KPI Cards**: Real-time Gross Sales, Net Revenue (post-refunds), Total Orders, Active Customers, Low-Stock Item count.
- **Interactive Visualizations**: Daily turnover vs order volume combo chart (bucketed in `Asia/Kolkata` time) and order status donut breakdown.
- **Inventory Control (`/admin/inventory`)**: SKU stock list with "Low Stock Only" filter, safety reorder thresholds, manual adjustments (`PURCHASE_IN`, `ADJUSTMENT`, `RETURN_IN`) with mandatory reason logging, and movement audit history.
- **Order Management (`/admin/orders`)**: State machine transition actions (`PAID` $\to$ `PROCESSING` $\to$ `SHIPPED` $\to$ `OUT_FOR_DELIVERY` $\to$ `DELIVERED`), refund approval with automated stock replenishment, and tracking event logger.
- **Analytics Engine (`/admin/analytics`)**: Date range filter (`Today`, `7 Days`, `30 Days`, `Custom`) and one-click CSV export.

---

## 🔒 Non-Negotiable Engineering Rules

1. **Monetary Precision (Integer Paise)**: Never uses floating-point arithmetic for currency. All database columns and calculation services use integer paise (`1 INR = 100 paise`). The frontend divides by 100 solely for UI display (`formatPaise`).
2. **Pessimistic Row Locking**: Checkout order creation and stock modifications use `SELECT ... FOR UPDATE` inside atomic transactions. Stock never goes negative under concurrent load.
3. **Server-Side Pricing**: Prices and totals sent by clients in HTTP requests are strictly ignored. The server computes all line items, tax, shipping, and discounts.
4. **Idempotent Webhooks**: All webhook events are checked against existing `provider_payment_id` values. Duplicate events return HTTP 200 without duplicate stock decrement.
5. **Centralized State Machine**: All order transitions are governed by `orderStateMachine.ts`. Illegal transitions return `409 Conflict`. Cancellation is prohibited after `SHIPPED`.

---

## 👤 Demo Credentials

| Role | Email | Password | Access Level |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@shopnest.com` | `Admin@123!` | Complete Admin Portal (`/admin/*`) & Storefront |
| **Customer 1** | `customer1@shopnest.com` | `Customer@123!` | Storefront, Cart, Checkout, My Orders |
| **Customer 2** | `customer2@shopnest.com` | `Customer@123!` | Storefront, Cart, Checkout, My Orders |

---

## 🚀 Quickstart & Local Setup

### 1. Prerequisites
- Node.js 18+ and npm
- PostgreSQL 15+ (Native or via Docker)

### 2. Environment Configuration
Copy `.env.example` to both the project root and `backend/.env`:
```bash
cp .env.example .env
cp .env.example backend/.env
```

Ensure `backend/.env` has your database credentials:
```env
DATABASE_URL=postgresql://shopnest:shopnest123@localhost:5432/shopnest_db
JWT_SECRET=super_secure_and_very_long_secret_key_shopnest_2026_production_grade_tokens
PORT=4000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
MOCK_GATEWAY=true
```

### 3. Database Initialization (Migrations & Seed)
```bash
# Run database migrations
npm run migrate:up

# Seed categories, 40+ products, admin, customers, and coupons
npm run seed
```

### 4. Start the Application
Run both servers together from the root:
```bash
# Option A: Start both via root concurrently
npm run dev

# Option B: Run backend and frontend in separate terminals
# Terminal 1: Backend API (Port 4000)
cd backend && npm run dev

# Terminal 2: Frontend Client (Port 5173)
cd frontend && npm run dev
```

- **Customer Storefront**: [http://localhost:5173](http://localhost:5173)
- **Admin Dashboard**: [http://localhost:5173/admin](http://localhost:5173/admin)
- **Backend API**: [http://localhost:4000](http://localhost:4000)
- **API Health Check**: [http://localhost:4000/api/v1/health](http://localhost:4000/api/v1/health)

---

## 💳 Payment Gateway: Razorpay vs Mock Gateway

The platform employs a unified gateway adapter interface (`backend/src/services/payment.ts`):

```typescript
export interface PaymentGateway {
  createOrder(amountPaise: number, orderId: string): Promise<GatewayOrder>;
  verifyPayment(params: VerifyParams): Promise<boolean>;
  issueRefund(params: RefundParams): Promise<GatewayRefund>;
}
```

### Switching Modes
1. **Mock Gateway (Default for Testing / Demo)**:
   - In `.env`, set `MOCK_GATEWAY=true`.
   - The UI displays a clear label: **"Sandbox / Mock Payment Gateway Active"**.
   - Simulates checkout verification and refunds without requiring external internet or API credentials.
2. **Razorpay Test Mode**:
   - In `.env`, set `MOCK_GATEWAY=false`.
   - Provide your Razorpay Test Key ID and Secret:
     ```env
     RAZORPAY_KEY_ID=rzp_test_YOUR_KEY_ID
     RAZORPAY_KEY_SECRET=YOUR_KEY_SECRET
     RAZORPAY_WEBHOOK_SECRET=YOUR_WEBHOOK_SECRET
     ```
   - All server-side calls utilize the official Razorpay Node SDK. Webhook payloads verify the raw body HMAC SHA-256 signature using `crypto.createHmac('sha256', secret)`.

---

## 🧪 Testing & Quality Assurance

### Vitest Unit & Integration Suite
```bash
# Run the complete test suite (150 tests across 11 test suites)
npm --prefix backend run test

# Run tests with code coverage report
npm --prefix backend run test:coverage
```

### Concurrency Stress Test
Verifies that 10 concurrent requests for an SKU with stock = 1 result in exactly 1 success and 9 rejections:
```bash
npx vitest run tests/api/race_condition.test.ts
```

### Playwright Browser E2E Suite
```bash
# Run all end-to-end tests
npx playwright test

# Run with interactive UI
npx playwright test --ui
```

---

## 📁 Repository Structure

```
.
├── backend/
│   ├── src/
│   │   ├── db/            # PostgreSQL connection pool and query helpers
│   │   ├── middleware/    # Auth, error handling, rate limiters, anti-CSRF
│   │   ├── routes/        # Storefront and admin API endpoints
│   │   ├── schemas/       # Zod validation schemas
│   │   ├── services/      # Pricing, order state machine, payment, cart
│   │   └── workers/       # 30-min reservation expiry scheduler
│   └── vitest.config.ts   # Vitest testing configuration
├── frontend/
│   ├── src/
│   │   ├── components/    # Layout, storefront topbar/sidebar, product cards
│   │   ├── contexts/      # AuthContext, CartContext
│   │   └── pages/         # Storefront shop, cart, checkout, admin portal
│   └── vite.config.ts     # Vite configuration
├── database/
│   ├── migrations/        # node-pg-migrate SQL migrations
│   └── seed/              # Deterministic database seeding script
├── docs/                  # Architecture, ERD, user journeys, KPIs, reports
├── tests/
│   ├── api/               # Supertest API integration tests & race test
│   ├── e2e/               # Playwright browser end-to-end tests
│   └── unit/              # Isolated unit tests (money, pricing, jwt, slug)
└── playwright.config.ts   # Playwright configuration
```

---

## 📜 License
MIT License. Built for the Retail Tech E-commerce Engineering Internship.
