# ShopNest — Week 3 Walkthrough & Verification

## 1. Overview
In Week 3, ShopNest expanded from basic cart and checkout into a full enterprise operational platform featuring:
1. **Central Order State Machine**: Strict status transitions, illegal state rejections (`409 Conflict`), and automatic restocking on cancellation and refund approval.
2. **Refund Workflow**: Customer-initiated refund requests, idempotent administrative approval, payment gateway integration, and stock replenishment (`RETURN_IN`).
3. **SKU Inventory Management**: Real-time stock ledgers, atomic stock adjustments with mandatory reasons, dynamic reorder thresholds, and movement history.
4. **Shipment Tracking**: Carrier tracking event publisher, multi-stage customer stepper (**Ordered → Shipped → Out for Delivery → Delivered**), and courier tracking feed.
5. **Coupons Admin**: Percentage and flat discount CRUD, usage limits, and transactional row-locking against race conditions.
6. **Product Reviews Moderation**: Strict requirement of a `DELIVERED` order item, rating validation, XSS sanitization, and administrative moderation.

---

## 2. Order State Machine Transitions
Defined in `backend/src/services/orderStateMachine.ts`:

```
PENDING_PAYMENT ──► PAID ──► PROCESSING ──► SHIPPED ──► OUT_FOR_DELIVERY ──► DELIVERED
       │              │           │
       ▼              ▼           ▼
   CANCELLED      CANCELLED   CANCELLED
                                  │
                                  ▼ (Customer Requests)
                          REFUND_REQUESTED ──► REFUNDED (Admin Approves)
```

- Any attempt to cancel an order after it has reached `SHIPPED` status is blocked with `409 CANNOT_CANCEL_SHIPPED_ORDER`.
- Every transition automatically persists an audit record into `audit_log`.

---

## 3. Playwright E2E Verification
Executed via `npx playwright test tests/e2e/week3_admin.spec.ts`:
1. Customer logs into storefront and places order for a product.
2. Admin logs into management portal at `/admin/inventory` and adjusts stock for the SKU with mandatory reason.
3. Admin navigates to `/admin/orders`, opens the order drawer, and transitions state: `PAID` → `PROCESSING` → `SHIPPED`.
4. Admin publishes a live tracking event: `Mumbai Central Hub`, note `Dispatched via BlueDart Express`.
5. Customer opens `/order-confirmation/:id` and confirms the status reflects `SHIPPED`, the stepper marks the stage complete, and the courier dispatch note appears in the timeline.

Result: **Passed (15.2s)**.

---

## 4. Test Suite Summary
- **Vitest**: 121 / 121 tests passed across 10 files.
- **Playwright**: 2 / 2 browser tests passed.
- **TypeScript & Vite Build**: Passed with 0 errors.
