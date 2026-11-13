# ShopNest — Feature Status

> Last updated: 2026-11-13. Backend: Express + TypeScript. Frontend: React 19 + Vite. DB: PostgreSQL on Supabase.

## Legend
| Symbol | Meaning |
|--------|---------|
| works | Fully implemented and tested |
| key-required | Works with correct env vars (key required) |
| mock-ok | Mock/test mode available without keys |
| placeholder | UI placeholder only |

---

## Core Commerce

| Feature | Status | Notes |
|---------|--------|-------|
| Product catalog (browse, filter, search) | works | Full-text + category filter |
| Product detail page | works | Gallery, variants, stock, reviews |
| Shopping cart (add, update, remove) | works | Server-side cart, persistent |
| Checkout flow | works | Address, coupon, order creation |
| Payment - Razorpay | key-required | Requires RAZORPAY_KEY_ID + RAZORPAY_KEY_SECRET |
| Payment - Mock gateway | mock-ok | MOCK_GATEWAY=true or no Razorpay keys |
| Coupon codes | works | WELCOME10 (10% off), FLAT50 (50 flat) |
| Order management (customer view) | works | Orders list, detail, status |
| Order tracking (guest) | works | Track by Order ID + email |
| Wishlist | works | Add/remove, persists across sessions |
| Reviews and ratings | works | Submit, helpful vote, sort, distribution |

## Authentication

| Feature | Status | Notes |
|---------|--------|-------|
| Email + password register/login | works | JWT cookie, bcrypt |
| Forgot password / reset | works | Dev token shown in response (no email infra) |
| Google OAuth | key-required | Requires GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET |
| Facebook OAuth | key-required | Requires FACEBOOK_APP_ID + FACEBOOK_APP_SECRET |
| GitHub OAuth | key-required | Requires GITHUB_CLIENT_ID + GITHUB_CLIENT_SECRET |
| Phone OTP | key-required | Requires Twilio credentials (TWILIO_*) |
| Magic link (email) | key-required | Requires SMTP credentials (SMTP_*) |
| Remember me / persistent session | works | Long-lived JWT cookie |

## Admin Panel

| Feature | Status | Notes |
|---------|--------|-------|
| Dashboard (revenue, orders, users KPIs) | works | Live DB aggregates |
| Product CRUD + image upload | works | Multer file upload, Pexels fallback |
| Inventory management | works | Stock adjustments, movements log |
| Order management (status, cancel, refund) | works | Mock refund via MOCK_GATEWAY |
| Coupon management | works | Full CRUD |
| Review moderation | works | Approve / hide reviews |
| Analytics (revenue chart, top products) | works | 30/90/365-day chart data |

## Other Features

| Feature | Status | Notes |
|---------|--------|-------|
| AI visual search (Gemini) | key-required | Requires GOOGLE_AI_API_KEY |
| Razorpay webhook | mock-ok | Handled but requires RAZORPAY_WEBHOOK_SECRET |
| Contact form | works | Stored to contact_messages table |
| Health endpoint (/health) | works | Returns db ping, uptime, version |
| Guest order tracking | works | /track-order |
| Address book | works | CRUD with default address |
| Profile page | works | Update name, phone, password |

## Known Limitations (Demonstration Project)

- Email delivery: No SMTP configured by default. Password reset tokens shown in API response only.
- Phone OTP: No Twilio by default. Phone auth button hidden unless TWILIO_ACCOUNT_SID is set.
- Payments: Test mode only. No real money moves. Use Razorpay test card 4111 1111 1111 1111.
- Images: All product images are Pexels CC-licensed URLs. No proprietary assets.
- Shipping: Delivery tracking events are manually added by admin; no carrier API integration.
