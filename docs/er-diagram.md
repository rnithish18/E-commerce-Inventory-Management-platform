# ShopNest — Entity Relationship Diagram

> All monetary values stored as **integer paise** (₹1 = 100 paise). Never floats.
> All timestamps stored as `TIMESTAMPTZ` (UTC). Displayed in `Asia/Kolkata`.

```mermaid
erDiagram
    users {
        uuid id PK
        varchar email UK
        varchar password_hash
        varchar full_name
        varchar phone
        user_role role
        boolean is_active
        timestamptz created_at
        timestamptz updated_at
    }

    addresses {
        uuid id PK
        uuid user_id FK
        varchar full_name
        varchar line1
        varchar line2
        varchar city
        varchar state
        varchar pincode
        varchar phone
        boolean is_default
        timestamptz created_at
    }

    categories {
        uuid id PK
        varchar name
        varchar slug UK
        varchar icon
        uuid parent_id FK
        timestamptz created_at
    }

    products {
        uuid id PK
        uuid category_id FK
        varchar name
        varchar slug UK
        text description
        varchar brand
        integer price_paise
        integer mrp_paise
        product_badge badge
        numeric average_rating
        integer rating_count
        boolean is_active
        timestamptz created_at
        timestamptz updated_at
    }

    product_images {
        uuid id PK
        uuid product_id FK
        varchar url
        varchar alt_text
        integer sort_order
        timestamptz created_at
    }

    product_variants {
        uuid id PK
        uuid product_id FK
        varchar name
        varchar sku UK
        integer stock_qty
        integer reserved_qty
        integer reorder_threshold
        integer price_adjustment_paise
        timestamptz created_at
        timestamptz updated_at
    }

    inventory_movements {
        uuid id PK
        uuid product_id FK
        uuid variant_id FK
        inventory_movement_type type
        integer quantity_change
        integer stock_before
        integer stock_after
        uuid reference_id
        varchar reference_type
        text reason
        uuid actor_user_id FK
        timestamptz created_at
    }

    carts {
        uuid id PK
        uuid user_id FK UK
        timestamptz created_at
        timestamptz updated_at
    }

    cart_items {
        uuid id PK
        uuid cart_id FK
        uuid product_id FK
        uuid variant_id FK
        integer quantity
        timestamptz added_at
    }

    coupons {
        uuid id PK
        varchar code UK
        varchar type
        integer value_paise
        integer min_order_paise
        integer max_discount_paise
        integer usage_limit
        integer per_user_limit
        timestamptz valid_from
        timestamptz valid_until
        boolean is_active
        timestamptz created_at
    }

    orders {
        uuid id PK
        uuid user_id FK
        uuid address_id FK
        order_status status
        integer subtotal_paise
        integer discount_paise
        integer tax_paise
        integer shipping_paise
        integer total_paise
        uuid coupon_id FK
        varchar coupon_code
        text notes
        timestamptz created_at
        timestamptz updated_at
    }

    order_items {
        uuid id PK
        uuid order_id FK
        uuid product_id FK
        uuid variant_id FK
        varchar product_name
        varchar sku
        text description
        integer quantity
        integer unit_price_paise
        integer total_price_paise
    }

    payment_attempts {
        uuid id PK
        uuid order_id FK
        varchar provider
        varchar provider_order_id
        varchar provider_payment_id UK
        payment_status status
        integer amount_paise
        varchar currency
        jsonb provider_response
        timestamptz created_at
        timestamptz updated_at
    }

    refunds {
        uuid id PK
        uuid order_id FK
        uuid payment_attempt_id FK
        integer amount_paise
        text reason
        refund_status status
        varchar provider_refund_id
        timestamptz created_at
        timestamptz updated_at
    }

    coupon_redemptions {
        uuid id PK
        uuid coupon_id FK
        uuid user_id FK
        uuid order_id FK UK
        integer discount_applied_paise
        timestamptz redeemed_at
    }

    reviews {
        uuid id PK
        uuid product_id FK
        uuid user_id FK
        uuid order_item_id FK UK
        smallint rating
        varchar title
        text body
        review_status status
        timestamptz created_at
        timestamptz updated_at
    }

    shipment_tracking_events {
        uuid id PK
        uuid order_id FK
        varchar status
        varchar location
        text description
        uuid created_by FK
        timestamptz created_at
    }

    audit_log {
        uuid id PK
        varchar entity_type
        uuid entity_id
        varchar action
        jsonb old_values
        jsonb new_values
        uuid actor_user_id FK
        varchar ip_address
        timestamptz created_at
    }

    wishlists {
        uuid id PK
        uuid user_id FK
        uuid product_id FK
        timestamptz created_at
    }

    users ||--o{ addresses : "has"
    users ||--o{ orders : "places"
    users ||--o{ carts : "owns"
    users ||--o{ reviews : "writes"
    users ||--o{ wishlists : "saves"
    users ||--o{ coupon_redemptions : "redeems"
    users ||--o{ inventory_movements : "causes"
    users ||--o{ audit_log : "actions"
    users ||--o{ shipment_tracking_events : "adds"

    categories ||--o{ products : "contains"
    categories ||--o{ categories : "parent_of"

    products ||--o{ product_images : "has"
    products ||--o{ product_variants : "has"
    products ||--o{ inventory_movements : "tracks"
    products ||--o{ cart_items : "in"
    products ||--o{ order_items : "in"
    products ||--o{ reviews : "receives"
    products ||--o{ wishlists : "saved_in"

    product_variants ||--o{ inventory_movements : "tracks"
    product_variants ||--o{ cart_items : "variant_in"
    product_variants ||--o{ order_items : "variant_in"

    carts ||--o{ cart_items : "contains"

    orders ||--o{ order_items : "contains"
    orders ||--o{ payment_attempts : "has"
    orders ||--o{ shipment_tracking_events : "tracks"
    orders ||--o{ refunds : "may_have"
    orders }o--|| coupons : "uses"
    orders }o--|| addresses : "ships_to"

    coupons ||--o{ coupon_redemptions : "redeemed_via"

    payment_attempts ||--o{ refunds : "refunded_via"
    order_items ||--o| reviews : "reviewed_as"
```

---

## Enum Types

### `user_role`
- `CUSTOMER` — standard shopper
- `ADMIN` — full backend access

### `product_badge`
- `Best Seller`, `Hot`, `Trending`, `Sale`, `New`

### `inventory_movement_type`
- `PURCHASE_IN` — stock added by admin or receiving
- `SALE_OUT` — stock removed on order payment confirmed
- `RETURN_IN` — stock restored on cancellation or refund
- `ADJUSTMENT` — manual admin stock correction
- `RESERVATION` — stock reserved on order creation
- `RESERVATION_RELEASE` — reservation released on payment failure/expiry

### `order_status`
- `PENDING_PAYMENT` → `PAID` → `PROCESSING` → `SHIPPED` → `OUT_FOR_DELIVERY` → `DELIVERED`
- `PAID|PROCESSING` → `CANCELLED`
- `CANCELLED|DELIVERED` → `REFUND_REQUESTED` → `REFUNDED`

### `payment_status`
- `INITIATED` → `SUCCESS` | `FAILED` | `EXPIRED`

### `refund_status`
- `PENDING` → `APPROVED` → `PROCESSED`
- `PENDING` → `REJECTED`

### `review_status`
- `pending` → `approved` | `hidden`

---

## Key Constraints & Indexes

| Table | Constraint | Purpose |
|-------|-----------|---------|
| `products` | `price_paise > 0`, `mrp_paise > 0`, `price_paise <= mrp_paise` | Money integrity |
| `product_variants` | `stock_qty >= 0`, `reserved_qty >= 0` | No negative stock |
| `cart_items` | `UNIQUE(cart_id, product_id, variant_id)`, `quantity > 0` | Cart integrity |
| `payment_attempts` | `UNIQUE(provider_payment_id)` | Idempotent payment events |
| `coupon_redemptions` | `UNIQUE(order_id)` | One coupon per order |
| `reviews` | `UNIQUE(product_id, user_id)`, `rating BETWEEN 1 AND 5` | One review per user per product |
| `orders` | `total_paise >= 0` | No negative totals |
