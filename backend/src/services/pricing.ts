import { query } from '../db/query';
import { AppError } from '../middleware/errorHandler';

export interface CartItemInput {
  productId: string;
  variantId?: string;
  quantity: number;
}

export interface PricingResult {
  items: Array<{
    productId: string;
    variantId: string;
    productName: string;
    sku: string;
    description: string;
    imageUrl: string | null;
    unitPricePaise: number;
    mrpPaise: number;
    quantity: number;
    totalPricePaise: number;
    stockAvailable: number;
  }>;
  subtotalPaise: number;
  discountPaise: number;
  couponCode: string | null;
  taxPaise: number;
  shippingPaise: number;
  totalPaise: number;
}

/**
 * Server-side Pricing Service
 * All amounts are strictly in integer paise (₹1 = 100 paise)
 * Never uses floating-point arithmetic for totals.
 */
export async function calculateOrderPricing(
  itemsInput: CartItemInput[],
  couponCode?: string | null,
  userId?: string
): Promise<PricingResult> {
  if (!itemsInput || itemsInput.length === 0) {
    throw new AppError(400, 'Cannot calculate pricing for empty cart', 'EMPTY_CART');
  }

  const items: PricingResult['items'] = [];
  let subtotalPaise = 0;

  for (const input of itemsInput) {
    if (!Number.isInteger(input.quantity) || input.quantity <= 0) {
      throw new AppError(400, `Invalid quantity ${input.quantity} for item`, 'INVALID_QUANTITY');
    }

    // Always fetch fresh price and variant data from DB
    const variantRes = await query(
      `SELECT pv.id as variant_id, pv.name as variant_name, pv.sku, pv.stock_qty, pv.reserved_qty,
              pv.price_adjustment_paise,
              p.id as product_id, p.name as product_name, p.description, p.price_paise, p.mrp_paise,
              pi.url as image_url
       FROM products p
       LEFT JOIN product_variants pv ON pv.product_id = p.id
       LEFT JOIN (
         SELECT DISTINCT ON (product_id) product_id, url
         FROM product_images ORDER BY product_id, sort_order ASC
       ) pi ON p.id = pi.product_id
       WHERE p.id = $1 AND ($2::uuid IS NULL OR pv.id = $2::uuid)
       ORDER BY pv.created_at ASC
       LIMIT 1`,
      [input.productId, input.variantId || null]
    );

    if (variantRes.rows.length === 0) {
      throw new AppError(404, `Product or variant not found for ID ${input.productId}`, 'NOT_FOUND');
    }

    const row = variantRes.rows[0];
    const unitPricePaise = row.price_paise + (row.price_adjustment_paise || 0);
    const totalPricePaise = unitPricePaise * input.quantity;
    const stockAvailable = Math.max(0, row.stock_qty - (row.reserved_qty || 0));

    items.push({
      productId: row.product_id,
      variantId: row.variant_id,
      productName: row.product_name,
      sku: row.sku,
      description: row.description || '',
      imageUrl: row.image_url,
      unitPricePaise,
      mrpPaise: row.mrp_paise,
      quantity: input.quantity,
      totalPricePaise,
      stockAvailable,
    });

    subtotalPaise += totalPricePaise;
  }

  // ── Coupon discount calculation ──
  let discountPaise = 0;
  let validCouponCode: string | null = null;

  if (couponCode && couponCode.trim()) {
    const code = couponCode.trim().toUpperCase();
    const couponRes = await query(
      `SELECT id, code, type, value_paise, min_order_paise, max_discount_paise, per_user_limit, valid_until, is_active
       FROM coupons
       WHERE code = $1 AND is_active = true`,
      [code]
    );

    if (couponRes.rows.length > 0) {
      const coupon = couponRes.rows[0];

      // Check expiry
      const isExpired = coupon.valid_until && new Date(coupon.valid_until) < new Date();
      // Check minimum order
      const meetsMinOrder = subtotalPaise >= coupon.min_order_paise;

      // Check per-user redemption limit if userId is provided
      let userLimitReached = false;
      let firstOrderConditionFailed = false;
      if (userId) {
        const redemptionRes = await query(
          'SELECT COUNT(*)::int as count FROM coupon_redemptions WHERE coupon_id = $1 AND user_id = $2',
          [coupon.id, userId]
        );
        userLimitReached = redemptionRes.rows[0].count >= coupon.per_user_limit;

        if (code === 'WELCOME10') {
          const orderCountRes = await query<{ count: number }>(
            `SELECT COUNT(*)::int as count FROM orders WHERE user_id = $1 AND status != 'CANCELLED'`,
            [userId]
          );
          if (orderCountRes.rows[0].count > 0) {
            firstOrderConditionFailed = true;
          }
        }
      }

      if (!isExpired && meetsMinOrder && !userLimitReached && !firstOrderConditionFailed) {
        validCouponCode = coupon.code;
        if (coupon.type === 'percent') {
          // value_paise in basis points: 1000 = 10%
          const calculatedDiscount = Math.round((subtotalPaise * coupon.value_paise) / 10000);
          discountPaise = coupon.max_discount_paise
            ? Math.min(calculatedDiscount, coupon.max_discount_paise)
            : calculatedDiscount;
        } else {
          // flat discount in paise
          discountPaise = Math.min(coupon.value_paise, subtotalPaise);
        }
      }
    }
  }

  // Subtotal after coupon discount
  const taxableSubtotal = Math.max(0, subtotalPaise - discountPaise);

  // 18% GST in integer paise (strictly rounded, no floats)
  const taxPaise = Math.round((taxableSubtotal * 18) / 100);

  // Free shipping on orders >= ₹500 (50000 paise), else ₹50 (5000 paise)
  const shippingPaise = subtotalPaise >= 50000 ? 0 : 5000;

  // Final Total
  const totalPaise = taxableSubtotal + taxPaise + shippingPaise;

  return {
    items,
    subtotalPaise,
    discountPaise,
    couponCode: validCouponCode,
    taxPaise,
    shippingPaise,
    totalPaise,
  };
}
