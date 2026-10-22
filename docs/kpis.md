# ShopNest — Business Analytics & KPI Specification

## 1. Executive Metrics & Formula Definitions

### A. Total Gross Sales
- **Definition**: The gross aggregate revenue generated from customer orders that have been successfully verified and paid for by the payment provider (Razorpay test mode or MOCK sandbox).
- **Inclusion Criteria**: `orders.status IN ('PAID', 'PROCESSING', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED')`.
- **Exclusion Criteria**: `PENDING_PAYMENT` (unpaid / in-flight checkout attempts) and `CANCELLED` orders.
- **Precision & Storage**: Integer paise (`1 INR = 100 paise`). Floats are strictly prohibited. Displayed as `₹X,XXX` by dividing paise by 100.
- **SQL Formula**:
  ```sql
  SELECT COALESCE(SUM(total_paise), 0)::bigint
  FROM orders
  WHERE status IN ('PAID', 'PROCESSING', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED')
    AND created_at >= $startDate AND created_at <= $endDate;
  ```

### B. Total Completed Orders
- **Definition**: Total volume of customer orders created within the specified period that reached a definitive, non-abandoned checkout status.
- **Inclusion Criteria**: `orders.status != 'PENDING_PAYMENT'`.
- **SQL Formula**:
  ```sql
  SELECT COUNT(id)::int
  FROM orders
  WHERE status != 'PENDING_PAYMENT'
    AND created_at >= $startDate AND created_at <= $endDate;
  ```

### C. Active Registered Customers
- **Definition**: Total unique registered shoppers in the ShopNest user ledger.
- **Inclusion Criteria**: `users.role = 'CUSTOMER' AND users.is_active = true`.
- **SQL Formula**:
  ```sql
  SELECT COUNT(id)::int FROM users WHERE role = 'CUSTOMER' AND is_active = true;
  ```

### D. Low Stock SKU Exposure
- **Definition**: The count of product variant SKUs whose available on-hand physical stock is at or below their configured safety reorder threshold.
- **Trigger Condition**: `product_variants.stock_qty <= product_variants.reorder_threshold`.
- **SQL Formula**:
  ```sql
  SELECT COUNT(*)::int
  FROM product_variants
  WHERE stock_qty <= reorder_threshold AND stock_qty >= 0;
  ```

---

## 2. Temporal Aggregation & Timezone Conventions

### Asia/Kolkata (UTC+5:30) Standard
- All order events and database records store timestamps in UTC (`timestamptz`).
- Daily time series reporting converts UTC timestamps into Indian Standard Time (`Asia/Kolkata`) prior to day-bucketing:
  ```sql
  DATE(created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata')
  ```
- This ensures that midnight cutoffs and daily revenue buckets align precisely with Indian e-commerce operational hours.

---

## 3. Period Comparisons & Trend Calculations

### Percentage Change Formula
$$\Delta\% = \begin{cases}
0\% & \text{if } V_{\text{prior}} = 0 \text{ and } V_{\text{current}} = 0 \\
+100\% & \text{if } V_{\text{prior}} = 0 \text{ and } V_{\text{current}} > 0 \\
\operatorname{round}\left(\frac{V_{\text{current}} - V_{\text{prior}}}{V_{\text{prior}}} \times 100\right) & \text{if } V_{\text{prior}} > 0
\end{cases}$$

- **Today**: Compared against the identical duration yesterday.
- **Last 7 Days**: Compared against the prior 7-day period (days 8–14).
- **Last 30 Days**: Compared against the prior 30-day period (days 31–60).
- **Custom Range**: Compared against the equal duration period immediately preceding the start date.
