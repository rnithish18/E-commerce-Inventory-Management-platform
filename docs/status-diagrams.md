# ShopNest — Status Diagrams

## 1. Order Status State Machine

```mermaid
stateDiagram-v2
    [*] --> PENDING_PAYMENT : order created, stock reserved

    PENDING_PAYMENT --> PAID : webhook verified server-side\n(Razorpay signature check)
    PENDING_PAYMENT --> CANCELLED : payment expired (30 min)\nor admin action

    PAID --> PROCESSING : admin confirms order
    PAID --> CANCELLED : admin cancels\n→ stock restored (RETURN_IN)

    PROCESSING --> SHIPPED : admin adds tracking
    PROCESSING --> CANCELLED : admin cancels\n→ stock restored (RETURN_IN)

    SHIPPED --> OUT_FOR_DELIVERY : courier update
    OUT_FOR_DELIVERY --> DELIVERED : delivery confirmed

    DELIVERED --> REFUND_REQUESTED : customer requests refund
    CANCELLED --> REFUND_REQUESTED : customer requests refund

    REFUND_REQUESTED --> REFUNDED : admin approves\n→ gateway refund initiated\n→ stock restored (RETURN_IN)
    REFUND_REQUESTED --> CANCELLED : admin rejects request

    REFUNDED --> [*]
    DELIVERED --> [*]
    CANCELLED --> [*]
```

### Transition Rules (enforced server-side)

| From | To | Actor | Stock Effect |
|------|----|-------|-------------|
| `PENDING_PAYMENT` | `PAID` | System (webhook) | `RESERVATION` → `SALE_OUT` |
| `PENDING_PAYMENT` | `CANCELLED` | System/Admin | `RESERVATION_RELEASE` |
| `PAID` | `PROCESSING` | Admin | None |
| `PAID` | `CANCELLED` | Admin | `RETURN_IN` |
| `PROCESSING` | `SHIPPED` | Admin | None |
| `PROCESSING` | `CANCELLED` | Admin | `RETURN_IN` |
| `SHIPPED` | `OUT_FOR_DELIVERY` | Admin | None |
| `OUT_FOR_DELIVERY` | `DELIVERED` | Admin | None |
| `DELIVERED` | `REFUND_REQUESTED` | Customer | None |
| `CANCELLED` | `REFUND_REQUESTED` | Customer | None |
| `REFUND_REQUESTED` | `REFUNDED` | Admin | `RETURN_IN` |
| `REFUND_REQUESTED` | `CANCELLED` | Admin | None |

---

## 2. Payment Status State Machine

```mermaid
stateDiagram-v2
    [*] --> INITIATED : Razorpay order created\nor mock initiated

    INITIATED --> SUCCESS : webhook payment.captured\n(HMAC verified server-side)
    INITIATED --> FAILED : webhook payment.failed\nor timeout
    INITIATED --> EXPIRED : no payment after 30 min

    SUCCESS --> [*]
    FAILED --> [*]
    EXPIRED --> [*]
```

### Payment Idempotency

- `provider_payment_id` has a `UNIQUE` constraint
- Duplicate webhook events are silently ignored (return 200)
- Only `SUCCESS` triggers order → `PAID` transition
- Client-side success redirect **never** marks an order paid
- HMAC-SHA256 signature verified using `RAZORPAY_WEBHOOK_SECRET`

---

## 3. Inventory Movement Types

```mermaid
stateDiagram-v2
    [*] --> PURCHASE_IN : admin adds stock\nor initial seed

    PURCHASE_IN --> RESERVATION : order created\n(reserves stock_qty)

    RESERVATION --> SALE_OUT : payment confirmed\n(permanent decrement)
    RESERVATION --> RESERVATION_RELEASE : payment failed/expired\nor order cancelled before payment

    SALE_OUT --> RETURN_IN : order cancelled/refunded
    PURCHASE_IN --> ADJUSTMENT : admin manual correction

    RETURN_IN --> [*]
    ADJUSTMENT --> [*]
```

### Stock Ledger Rules

Every stock change **must** write an `inventory_movements` row with:
- `stock_before` — snapshot before change
- `stock_after` — snapshot after change
- `quantity_change` — signed integer (negative for decrements)
- `reference_id` + `reference_type` — links to order, adjustment, etc.
- `actor_user_id` — who triggered it
- `created_at` — UTC timestamp

All stock changes happen inside **database transactions** with `SELECT ... FOR UPDATE` row locking to prevent race conditions.

---

## 4. Review Status

```mermaid
stateDiagram-v2
    [*] --> pending : customer submits review\n(must have DELIVERED order item)

    pending --> approved : admin approves
    pending --> hidden : admin hides

    approved --> hidden : admin re-hides
    hidden --> approved : admin re-approves

    approved --> [*]
    hidden --> [*]
```

### Review Eligibility Rules
- User must have an order item for the product in a `DELIVERED` order
- One review per `(product_id, user_id)` — enforced by UNIQUE constraint
- `order_item_id` is UNIQUE in reviews — prevents one item getting two reviews
- Review body is HTML-stripped before storage

---

## 5. Refund Status

```mermaid
stateDiagram-v2
    [*] --> PENDING : customer requests refund

    PENDING --> APPROVED : admin approves
    PENDING --> REJECTED : admin rejects

    APPROVED --> PROCESSED : gateway refund complete\n(mock or Razorpay)

    PROCESSED --> [*]
    REJECTED --> [*]
```
