# ShopNest — Business Analytics & KPI Specification

## 1. Executive Metrics & Formula Definitions

### A. Total Gross Sales
- **Definition**: The gross aggregate turnover from customer orders that have been successfully verified and paid for by the payment provider (Razorpay test mode or MOCK sandbox).
- **Inclusion Criteria**: `orders.status IN ('PAID', 'PROCESSING', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED')`.
- **Exclusion Criteria**: `PENDING_PAYMENT` (unpaid / in-flight checkout attempts) and `CANCELLED` orders.
- **Precision & Storage**: Integer paise (`1 INR = 100 paise`). Floats are strictly prohibited. Displayed as `₹X,XXX` by dividing paise by 100.
- **SQL Formula**:
  ```sql
  SELECT COALESCE(SUM(total_paise), 0)::bigint AS gross_sales_paise
  FROM orders
  WHERE status IN ('PAID', 'PROCESSING', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED')
    AND created_at >= $startDate AND created_at <= $endDate;
  ```

### B. Net Revenue (Post-Refunds)
- **Definition**: Gross verified sales minus all processed and approved refunds issued to customers.
- **Formula**: $\text{Net Revenue} = \text{Gross Sales} - \sum \text{Refunds}$
- **SQL Formula**:
  ```sql
  WITH gross AS (
    SELECT COALESCE(SUM(total_paise), 0)::bigint AS gross_paise
    FROM orders
    WHERE status IN ('PAID', 'PROCESSING', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED')
      AND created_at >= $startDate AND created_at <= $endDate
  ),
  refunded AS (
    SELECT COALESCE(SUM(amount_paise), 0)::bigint AS refund_paise
    FROM refunds
    WHERE status IN ('APPROVED', 'PROCESSED')
      AND created_at >= $startDate AND created_at <= $endDate
  )
  SELECT GREATEST(0, gross.gross_paise - refunded.refund_paise) AS net_revenue_paise
  FROM gross, refunded;
  ```

### C. Average Order Value (AOV)
- **Definition**: Average gross value per verified paid transaction during the selected period.
- **Formula**: $\text{AOV} = \frac{\text{Gross Sales}}{\text{Paid Orders Count}}$
- **SQL Formula**:
  ```sql
  SELECT 
    CASE 
      WHEN COUNT(CASE WHEN status IN ('PAID', 'PROCESSING', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED') THEN 1 END) > 0
      THEN ROUND(
        SUM(CASE WHEN status IN ('PAID', 'PROCESSING', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED') THEN total_paise ELSE 0 END)::numeric / 
        COUNT(CASE WHEN status IN ('PAID', 'PROCESSING', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED') THEN 1 END)
      )::bigint
      ELSE 0
    END AS aov_paise
  FROM orders
  WHERE created_at >= $startDate AND created_at <= $endDate;
  ```

### D. Inventory Availability Rate
- **Definition**: The percentage of catalog variant SKUs currently in stock and immediately purchasable.
- **Formula**: $\text{Inventory Availability} = \left(\frac{\text{In-Stock SKUs}}{\text{Total Catalog SKUs}}\right) \times 100\%$
- **SQL Formula**:
  ```sql
  SELECT 
    CASE 
      WHEN COUNT(*) > 0 
      THEN ROUND((COUNT(CASE WHEN stock_qty > 0 THEN 1 END)::numeric / COUNT(*)) * 100)::int
      ELSE 100
    END AS inventory_availability_percent
  FROM product_variants;
  ```

### E. Low-Stock SKU Exposure
- **Definition**: Count of SKU variants whose physical on-hand quantity has dropped to or below their safety reorder threshold.
- **SQL Formula**:
  ```sql
  SELECT COUNT(*)::int AS low_stock_items
  FROM product_variants
  WHERE stock_qty <= reorder_threshold AND stock_qty >= 0;
  ```

### F. Order Fulfilment Rate
- **Definition**: Proportion of paid customer orders that have been successfully delivered to shoppers.
- **Formula**: $\text{Fulfilment Rate} = \left(\frac{\text{Delivered Orders}}{\text{Paid Orders}}\right) \times 100\%$
- **SQL Formula**:
  ```sql
  SELECT 
    CASE 
      WHEN COUNT(CASE WHEN status IN ('PAID', 'PROCESSING', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED') THEN 1 END) > 0
      THEN ROUND(
        (COUNT(CASE WHEN status = 'DELIVERED' THEN 1 END)::numeric / 
         COUNT(CASE WHEN status IN ('PAID', 'PROCESSING', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED') THEN 1 END)) * 100
      )::int
      ELSE 0
    END AS fulfilment_rate_percent
  FROM orders
  WHERE created_at >= $startDate AND created_at <= $endDate;
  ```

### G. Order Cancellation Rate
- **Definition**: Percentage of customer orders that were cancelled prior to shipping.
- **Formula**: $\text{Cancellation Rate} = \left(\frac{\text{Cancelled Orders}}{\text{Total Placed Orders}}\right) \times 100\%$
- **SQL Formula**:
  ```sql
  SELECT 
    CASE 
      WHEN COUNT(*) > 0 
      THEN ROUND((COUNT(CASE WHEN status = 'CANCELLED' THEN 1 END)::numeric / COUNT(*)) * 100)::int
      ELSE 0
    END AS cancellation_rate_percent
  FROM orders
  WHERE created_at >= $startDate AND created_at <= $endDate;
  ```

---

## 2. Temporal Aggregation & Timezone Conventions

### Asia/Kolkata (UTC+5:30) Standard
- All order events and audit rows record timestamps in UTC (`timestamptz`).
- Daily time series reporting converts UTC timestamps into Indian Standard Time (`Asia/Kolkata`) prior to day-bucketing:
  ```sql
  SELECT 
    to_char(created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD') AS day,
    to_char(created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata', 'DD Mon') AS label,
    COALESCE(SUM(CASE WHEN status IN ('PAID', 'PROCESSING', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED') THEN total_paise ELSE 0 END), 0)::bigint AS revenue_paise,
    COUNT(CASE WHEN status != 'PENDING_PAYMENT' THEN 1 END)::int AS orders_count
  FROM orders
  WHERE created_at >= $startDate AND created_at <= $endDate
  GROUP BY day, label
  ORDER BY day ASC;
  ```
- This guarantees midnight cutoffs and chart day buckets reflect real-world Indian business hours.

---

## 3. Period Comparisons & Trend Calculations

### Percentage Change Formula
$$\Delta\% = \begin{cases}
0\% & \text{if } V_{\text{prior}} = 0 \text{ and } V_{\text{current}} = 0 \\
+100\% & \text{if } V_{\text{prior}} = 0 \text{ and } V_{\text{current}} > 0 \\
\operatorname{round}\left(\frac{V_{\text{current}} - V_{\text{prior}}}{V_{\text{prior}}} \times 100\right) & \text{if } V_{\text{prior}} > 0
\end{cases}$$

- **Today**: Current calendar day vs yesterday's elapsed duration.
- **Last 7 Days**: Previous 7-day window vs days 8–14.
- **Last 30 Days**: Previous 30-day window vs days 31–60.
- **Custom Range**: Custom dates $[T_1, T_2]$ compared to an identical pre-duration interval $[T_1 - (T_2 - T_1), T_1 - 1]$.
