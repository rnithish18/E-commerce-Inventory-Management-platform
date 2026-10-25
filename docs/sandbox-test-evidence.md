# ShopNest — Payment Sandbox & Webhook Test Evidence

This document provides audit evidence of simulated and live sandbox payment flows in the ShopNest platform across Razorpay Test Mode and the built-in Mock Gateway (`MOCK_GATEWAY=true`).

---

## 1. Successful Checkout & Payment Verification

### Step 1: Client Checkout Creation (`POST /api/v1/orders/checkout`)
**Request:**
```http
POST /api/v1/orders/checkout HTTP/1.1
Host: localhost:4000
Content-Type: application/json
Cookie: token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

{
  "addressId": "a1111111-1111-1111-1111-111111111101",
  "couponCode": "WELCOME10",
  "items": [
    {
      "productId": "33333333-3333-3333-3333-333333333301",
      "variantId": "44444444-4444-4444-4444-444444444401",
      "quantity": 1
    }
  ]
}
```

**Response (`201 Created`):**
```json
{
  "orderId": "e30128da-cbe4-4363-8d69-cbcf00d72370",
  "status": "PENDING_PAYMENT",
  "totalPaise": 539900,
  "currency": "INR",
  "payment": {
    "provider": "razorpay_mock",
    "providerOrderId": "order_mock_e30128da",
    "amountPaise": 539900
  }
}
```

**Database State Proof:**
- `orders.status` = `PENDING_PAYMENT`
- `orders.reservation_expires_at` = `NOW() + INTERVAL '30 minutes'`
- `product_variants.reserved_qty` incremented by 1
- `inventory_movements`: written with `type = 'RESERVATION'` and `reference_id = orderId`

---

### Step 2: Payment Signature Verification (`POST /api/v1/payments/verify`)
**Request:**
```http
POST /api/v1/payments/verify HTTP/1.1
Host: localhost:4000
Content-Type: application/json

{
  "orderId": "e30128da-cbe4-4363-8d69-cbcf00d72370",
  "providerOrderId": "order_mock_e30128da",
  "providerPaymentId": "pay_mock_success_99214",
  "providerSignature": "mock_sig_order_mock_e30128da_pay_mock_success_99214"
}
```

**Response (`200 OK`):**
```json
{
  "message": "Payment verified successfully",
  "orderId": "e30128da-cbe4-4363-8d69-cbcf00d72370",
  "status": "PAID",
  "paymentId": "pay_mock_success_99214"
}
```

**Database State Proof:**
- `orders.status` transitioned to `PAID`
- `product_variants.reserved_qty` decremented by 1
- `product_variants.stock_qty` decremented by 1
- `inventory_movements`: written with `type = 'SALE_OUT'`
- `audit_log`: written with `action = 'STATUS_CHANGE'`, `from = 'PENDING_PAYMENT'`, `to = 'PAID'`

---

## 2. Failed Payment Simulation & Automatic Stock Release

### Step 1: Failed Payment Payload (`POST /api/v1/payments/verify`)
**Request with Tampered / Failure Payload:**
```http
POST /api/v1/payments/verify HTTP/1.1
Host: localhost:4000
Content-Type: application/json

{
  "orderId": "b41982cf-2d12-4211-9a7f-117823ab192a",
  "providerPaymentId": "pay_failed_user_cancelled_1829",
  "providerSignature": "invalid_tampered_signature_hex",
  "error": {
    "code": "BAD_REQUEST_ERROR",
    "description": "Payment was cancelled by user in checkout popup"
  }
}
```

**Response (`400 Bad Request`):**
```json
{
  "error": "INVALID_SIGNATURE",
  "message": "Payment verification failed or invalid signature"
}
```

**Database Rollback & Restock Proof:**
- `orders.status` marked `CANCELLED`
- `product_variants.reserved_qty` decremented by reserved amount back to original value
- `inventory_movements`: written with `type = 'RESERVATION_RELEASE'`
- Any active coupon redemption released from `coupon_redemptions` table

---

## 3. Idempotent Webhook Delivery & Deduplication

### Delivery 1: Original Razorpay Webhook Event
**Request:**
```http
POST /api/v1/webhooks/mock HTTP/1.1
Host: localhost:4000
Content-Type: application/json

{
  "event": "payment.captured",
  "order_id": "c71881ae-281b-4d43-9801-921827419fae",
  "provider_order_id": "order_mock_c71881ae",
  "provider_payment_id": "pay_mock_idempotent_event_8102"
}
```

**Response (`200 OK`):**
```json
{
  "message": "Payment captured webhook handled successfully",
  "order_id": "c71881ae-281b-4d43-9801-921827419fae",
  "status": "PAID"
}
```

### Delivery 2: Exact Duplicate Webhook Event (At-Least-Once Delivery Replay)
**Request:**
```http
POST /api/v1/webhooks/mock HTTP/1.1
Host: localhost:4000
Content-Type: application/json

{
  "event": "payment.captured",
  "order_id": "c71881ae-281b-4d43-9801-921827419fae",
  "provider_order_id": "order_mock_c71881ae",
  "provider_payment_id": "pay_mock_idempotent_event_8102"
}
```

**Response (`200 OK`):**
```json
{
  "message": "Duplicate event ignored (idempotent)",
  "order_id": "c71881ae-281b-4d43-9801-921827419fae",
  "provider_payment_id": "pay_mock_idempotent_event_8102",
  "status": "PAID"
}
```

**Integrity Verification:**
- `payment_attempts` records unique `provider_payment_id`.
- Duplicate payment captured events are detected via unique index on `payment_attempts.provider_payment_id` and order status `PAID`.
- Stock was NOT decremented a second time (`SALE_OUT` count = 1).
- Response returns HTTP 200 to acknowledge webhook reception without error.
