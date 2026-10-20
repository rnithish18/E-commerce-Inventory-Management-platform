# ShopNest Payment Gateway Integration

## Overview
ShopNest integrates a **payment gateway abstraction layer** that supports both Razorpay (test mode) and a clearly labeled MOCK sandbox gateway. Both gateways expose the **same interface**, so switching is purely configuration-driven.

## ⚠️ MOCK GATEWAY (Default)
When `MOCK_GATEWAY=true` (or when Razorpay keys are absent/placeholder), the system uses the **built-in Mock Sandbox**. This is the default for development and demonstrations.

**Behaviors:**
- Provider order IDs are prefixed `order_mock_*` — never `order_*` (Razorpay)
- `POST /api/v1/payments/mock-complete` simulates a success/failure
- `POST /api/v1/webhooks/mock-simulate` simulates a webhook delivery
- The UI clearly labels this as **"[MOCK] Sandbox Payment"**

## Razorpay Test Mode
Set `MOCK_GATEWAY=false` and provide real Razorpay TEST keys:

```env
MOCK_GATEWAY=false
RAZORPAY_KEY_ID=rzp_test_YOUR_KEY_HERE
RAZORPAY_KEY_SECRET=YOUR_SECRET_HERE
RAZORPAY_WEBHOOK_SECRET=YOUR_WEBHOOK_SECRET_HERE
```

**How to get test keys:**
1. Go to https://dashboard.razorpay.com
2. Switch to **Test Mode** (top-right toggle)
3. Go to Settings > API Keys > Generate Key

## Switching Between Gateways

| Setting | Gateway Used |
|---------|-------------|
| `MOCK_GATEWAY=true` | Mock Sandbox (safe for demos) |
| `MOCK_GATEWAY=false` + valid `RAZORPAY_KEY_ID` | Razorpay Test Mode |
| `MOCK_GATEWAY=false` + missing keys | Falls back to Mock Sandbox |

## Same Interface — Both Gateways
The internal `payment.ts` service exposes the same interface:
- `createPaymentOrder(orderId, amountPaise)` → returns `{ providerOrderId, keyId, isMock }`
- `verifyWebhookSignature(rawBody, signature)` → returns `boolean`
- `handlePaymentCapture(providerOrderId, paymentId)` → marks order PAID
- `handlePaymentFailure(providerOrderId)` → cancels order, releases stock

## Security
- Webhook signature always verified via HMAC SHA-256 on the raw body buffer
- Duplicate webhook events are handled idempotently (unique `provider_payment_id`)
- Client redirect alone **never** marks an order paid — only webhook/server verification does
- No card data is ever stored or logged
