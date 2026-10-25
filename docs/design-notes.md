# ShopNest — Design Notes & UI Architecture

## 1. Design System & Visual Palette

### Color Palette
- **Primary Navy**:
  - `navy-900`: `#020617` (Deep backdrop / footer)
  - `navy-800`: `#0f172a` (Topbar header, admin sidebar, card surface)
  - `navy-700`: `#1e293b` (Secondary borders, hover states, sub-cards)
  - `navy-600`: `#334155` (Subtle dividers, input borders)
- **Brand Accent (Orange)**:
  - `orange-400`: `#fb923c` (Light accent highlights, badges)
  - `orange-500`: `#f97316` (Primary action button, active tab indicator, promo badges)
  - `orange-600`: `#ea580c` (Button active/hover states, deep gradients)
- **Status Indicators**:
  - Success / In-Stock: `#22c55e` (Delivered status, high stock badge)
  - Warning / Reorder Alert: `#f59e0b` / `#fbbf24` (Low stock warning, pending status)
  - Danger / Cancelled: `#ef4444` (Out of stock, cancelled orders, delete)
- **Typography**: Inter (`font-sans`), monospace for currency figures, order IDs, and SKUs.

---

## 2. Customer Storefront Architecture

```
+-----------------------------------------------------------------------------------------+
| [ShopNest Logo]    [ Global Search: Products, Brands... ]      (🔔)  [User Menu] [Cart] |
+------------------+-----------------------------------------------+----------------------+
| [Sidebar]        | [Hero Banner Carousel (3-slide rotation)]     | [Right Panel]        |
| - Home           +-----------------------------------------------+ - Your Cart Summary  |
| - Shop           | [Category Tiles: Electronics, Fashion, Home]  |   * Qty Steppers     |
| - My Orders      +-----------------------------------------------+   * Coupon Input     |
| - Wishlist       | [Featured Product Grid (4 columns)]           |   * "WELCOME10"      |
| - Cart           |  +-------------+  +-------------+             |   * GST + Shipping   |
| - Profile        |  | [Badge] (❤️)|  | [Badge] (❤️)|             |   * [Checkout Btn]   |
|                  |  |  Image      |  |  Image      |             +----------------------+
| Categories:      |  |  Title      |  |  Title      |             | - Track Your Order   |
| 💻 Electronics   |  |  ⭐ 4.8(2k) |  |  ⭐ 4.5(1k) |             |   (Ordered → Shipped |
| 👗 Fashion       |  |  ₹2,999     |  |  ₹5,499     |             |    → Out → Delivered)|
| 🏠 Home & Living |  |  [Add Cart] |  |  [Add Cart] |             +----------------------+
| 💄 Beauty        |  +-------------+  +-------------+             | - Recent Orders List |
| 🎁 WELCOME10 Card|                                               |                      |
+------------------+-----------------------------------------------+----------------------+
```

### Component Details
1. **Topbar**: Fixed dark navy navigation (`bg-navy-800`), global instant debounced search bar, interactive notification bell with live promo discounts, user dropdown with role badges, and sticky cart preview pill.
2. **Left Navigation Sidebar**: Persistent navigation items, dynamically seeded category catalog with icons and counts, and promo card featuring `WELCOME10` 10% first-order discount with one-click copy.
3. **Hero Banner**: High-impact auto-advancing carousel with gradient card backgrounds, seasonal badges, call-to-action redirecting to `/shop`, and responsive emoji/artwork illustrations.
4. **Product Card**:
   - Status badge top-left (`Best Seller`, `Hot`, `Trending`, `Sale`, `New`).
   - Wishlist toggle heart button top-right.
   - High-resolution placeholder image with subtle zoom hover transition.
   - Dual-pricing display: prominent selling price in INR, strike-through MRP, and computed `% OFF` green badge.
   - Direct orange "Add to Cart" button with stock availability check.
5. **Right Drawer Panel**:
   - Instant cart summary with integer paise subtotal, coupon input box with error handling, computed 18% GST, flat shipping calculator (₹50 or free over ₹500), and checkout CTA.
   - "Track Your Order" live stepper reflecting 4-stage progression (`Ordered`, `Shipped`, `Out for Delivery`, `Delivered`).
   - Recent orders quick list.

---

## 3. Administrator Dashboard Architecture

```
+-----------------------------------------------------------------------------------------+
| [ShopNest Admin] [ Search Admin Console ]      [🟢 DB Connected]   (🔔 Alerts)  [Logout] |
+------------------+----------------------------------------------------------------------+
| [Admin Sidebar]  | [Executive KPI Cards (4)]                                            |
| - Dashboard      |  +---------------+ +---------------+ +---------------+ +----------+  |
| - Products       |  | Total Sales   | | Total Orders  | | Total Shoppers| | Low Stock|  |
| - Orders         |  | ₹2,45,000     | | 128           | | 54            | | 4 SKUs   |  |
| - Inventory      |  | +18% vs prior | | +12% vs prior | | +8% vs prior  | | Reorder! |  |
| - Customers      |  +---------------+ +---------------+ +---------------+ +----------+  |
| - Coupons        +---------------------------------------------+------------------------+
| - Reviews        | [Sales Revenue & Order Volume Combo Chart]  | [Status Donut Chart]   |
| - Analytics      |  - Bar: Daily Revenue in ₹ (Asia/Kolkata)   |  - PAID: Green         |
| - Settings       |  - Line: Order volume                       |  - SHIPPED: Purple     |
|                  |                                             |  - DELIVERED: Emerald  |
| [Back to Store]  +---------------------------------------------+------------------------+
| [Super Admin]    | [Top Selling Products Table]                | [Low Stock SKU Alerts] |
+------------------+---------------------------------------------+------------------------+
```

### Key Administrative Workflows
1. **Inventory Management (`/admin/inventory`)**:
   - Real-time SKU stock table with stock quantity, reserved allocation, safety reorder threshold, and status badge.
   - Quick Filter: "Low Stock Only" to immediately isolate SKUs requiring purchase orders.
   - Adjustment Modal: Supports `PURCHASE_IN`, `ADJUSTMENT`, and `RETURN_IN` with mandatory audit reason logging.
   - SKU History Modal: Displays immutable `inventory_movements` ledger including before/after balances, actor, reference type, and timestamps.
2. **Order Management & Fulfillment (`/admin/orders`)**:
   - Status filtering tabs (`All`, `PAID`, `PROCESSING`, `SHIPPED`, `DELIVERED`, `CANCELLED`).
   - Order detail drawer displaying customer snapshots, ordered items snapshot prices, and legal state machine transitions only.
   - Shipment tracking updater: records carrier, location, description, and status into `shipment_tracking_events`.
   - Admin refund approval workflow with automated stock replenishment.
3. **Analytics Engine (`/admin/analytics`)**:
   - Date range selector (`Today`, `7 Days`, `30 Days`, `Custom From/To`).
   - Metric cards: Gross Sales, Net Revenue (post-refunds), AOV, Low-Stock Exposure, Inventory Availability, Fulfilment Rate, and Cancellation Rate.
   - One-click CSV export generating downloadable transaction spreadsheets.

---

## 4. Responsive Layout Breakpoints

- **Mobile (< 640px)**: Sidebar folds into mobile drawer; storefront cards display 1–2 columns; right cart panel collapses into slide-over modal; admin tables enable horizontal scrolling with fixed column headers.
- **Tablet (640px – 1024px)**: Storefront cards display in 3 columns; topbar compacts search bar; admin dashboard renders KPI cards in 2x2 grid.
- **Desktop (>= 1024px)**: Full 3-panel storefront (Left Nav: 224px, Content: flex-1, Right Panel: 320px); admin dashboard displays 4 KPI cards and 2-column analytics visualization.
