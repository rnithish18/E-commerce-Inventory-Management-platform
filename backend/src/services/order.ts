import { getClient, query } from '../db/query';
import { AppError } from '../middleware/errorHandler';
import { calculateOrderPricing, CartItemInput } from './pricing';
import { clearUserCart } from './cart';
import { v4 as uuidv4 } from 'uuid';

export interface CheckoutInput {
  userId: string;
  addressId: string;
  items: CartItemInput[];
  couponCode?: string | null;
  notes?: string;
}

export interface CheckoutResult {
  orderId: string;
  orderNumber: string;
  status: string;
  subtotalPaise: number;
  discountPaise: number;
  taxPaise: number;
  shippingPaise: number;
  totalPaise: number;
  payment: {
    provider: 'razorpay' | 'mock';
    providerOrderId: string;
    amountPaise: number;
    currency: string;
    keyId: string;
    isMock: boolean;
  };
}

export async function processCheckout(input: CheckoutInput): Promise<CheckoutResult> {
  const { userId, addressId, items, couponCode, notes } = input;

  if (!items || items.length === 0) {
    throw new AppError(400, 'Checkout cart cannot be empty', 'EMPTY_CART');
  }

  // 1. Verify address exists
  const addressRes = await query('SELECT id FROM addresses WHERE id = $1 AND user_id = $2', [addressId, userId]);
  if (addressRes.rows.length === 0) {
    throw new AppError(400, 'Invalid or non-existent delivery address selected', 'INVALID_ADDRESS');
  }

  // 2. Compute final server-side verified pricing
  const pricing = await calculateOrderPricing(items, couponCode, userId);

  // 3. Begin Transaction with Row Locking
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const orderId = uuidv4();
    const orderNumber = `ORD-${Date.now().toString().slice(-6)}`;

    // A. Lock each variant row and check available stock
    for (const item of pricing.items) {
      const lockRes = await client.query<{
        id: string;
        stock_qty: number;
        reserved_qty: number;
      }>(
        'SELECT id, stock_qty, reserved_qty FROM product_variants WHERE id = $1 FOR UPDATE',
        [item.variantId]
      );

      if (lockRes.rows.length === 0) {
        throw new AppError(404, `Product variant ${item.sku} not found for ordering`, 'NOT_FOUND');
      }

      const variant = lockRes.rows[0];
      const available = variant.stock_qty - (variant.reserved_qty || 0);

      if (available < item.quantity) {
        throw new AppError(
          400,
          `Insufficient stock for "${item.productName}". Available: ${available}, Requested: ${item.quantity}`,
          'INSUFFICIENT_STOCK'
        );
      }

      // Increment reserved stock
      await client.query(
        'UPDATE product_variants SET reserved_qty = reserved_qty + $1, updated_at = NOW() WHERE id = $2',
        [item.quantity, item.variantId]
      );

      // Record inventory movement: RESERVATION
      await client.query(
        `INSERT INTO inventory_movements (
           id, product_id, variant_id, type, quantity_change, stock_before, stock_after,
           reference_id, reference_type, reason, actor_user_id
         ) VALUES ($1, $2, $3, 'RESERVATION', $4, $5, $5, $6, 'ORDER_RESERVATION', $7, $8)`,
        [
          uuidv4(),
          item.productId,
          item.variantId,
          item.quantity,
          variant.stock_qty,
          orderId,
          `Stock reserved for 30 minutes for order ${orderNumber}`,
          userId,
        ]
      );
    }

    // B. Insert Order
    let couponId: string | null = null;
    if (pricing.couponCode) {
      const cpRes = await client.query('SELECT id FROM coupons WHERE code = $1', [pricing.couponCode]);
      if (cpRes.rows.length > 0) {
        couponId = cpRes.rows[0].id;
      }
    }

    await client.query(
      `INSERT INTO orders (
         id, user_id, address_id, status, subtotal_paise, discount_paise, tax_paise, shipping_paise,
         total_paise, coupon_id, coupon_code, notes, created_at, updated_at
       ) VALUES ($1, $2, $3, 'PENDING_PAYMENT', $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())`,
      [
        orderId,
        userId,
        addressId,
        pricing.subtotalPaise,
        pricing.discountPaise,
        pricing.taxPaise,
        pricing.shippingPaise,
        pricing.totalPaise,
        couponId,
        pricing.couponCode,
        notes || null,
      ]
    );

    // C. Insert Order Items with permanent snapshot values
    for (const item of pricing.items) {
      await client.query(
        `INSERT INTO order_items (
           id, order_id, product_id, variant_id, product_name, sku, description,
           quantity, unit_price_paise, total_price_paise
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          uuidv4(),
          orderId,
          item.productId,
          item.variantId,
          item.productName,
          item.sku,
          item.description,
          item.quantity,
          item.unitPricePaise,
          item.totalPricePaise,
        ]
      );
    }

    // D. Record coupon redemption if coupon was applied
    if (couponId) {
      await client.query(
        `INSERT INTO coupon_redemptions (id, coupon_id, user_id, order_id, discount_applied_paise, redeemed_at)
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [uuidv4(), couponId, userId, orderId, pricing.discountPaise]
      );
    }

    // E. Clear user's active cart
    await client.query(
      `DELETE FROM cart_items WHERE cart_id = (SELECT id FROM carts WHERE user_id = $1)`,
      [userId]
    );

    // F. Create Initial Payment Attempt
    const isMock = process.env.MOCK_GATEWAY === 'true' || !process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID.includes('REPLACE');
    const providerOrderId = isMock
      ? `order_mock_${uuidv4().replace(/-/g, '').slice(0, 14)}`
      : `order_rzp_${uuidv4().replace(/-/g, '').slice(0, 14)}`;

    await client.query(
      `INSERT INTO payment_attempts (
         id, order_id, provider, provider_order_id, status, amount_paise, currency, created_at, updated_at
       ) VALUES ($1, $2, $3, $4, 'INITIATED', $5, 'INR', NOW(), NOW())`,
      [uuidv4(), orderId, isMock ? 'mock' : 'razorpay', providerOrderId, pricing.totalPaise]
    );

    await client.query('COMMIT');

    return {
      orderId,
      orderNumber,
      status: 'PENDING_PAYMENT',
      subtotalPaise: pricing.subtotalPaise,
      discountPaise: pricing.discountPaise,
      taxPaise: pricing.taxPaise,
      shippingPaise: pricing.shippingPaise,
      totalPaise: pricing.totalPaise,
      payment: {
        provider: isMock ? 'mock' : 'razorpay',
        providerOrderId,
        amountPaise: pricing.totalPaise,
        currency: 'INR',
        keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_MOCK_KEY_ID',
        isMock,
      },
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function getUserOrders(userId: string): Promise<any[]> {
  const result = await query(
    `SELECT o.id, o.status, o.subtotal_paise, o.discount_paise, o.tax_paise, o.shipping_paise,
            o.total_paise, o.coupon_code, o.created_at,
            COUNT(oi.id)::int as total_items,
            json_agg(json_build_object(
              'id', oi.id,
              'product_name', oi.product_name,
              'quantity', oi.quantity,
              'unit_price_paise', oi.unit_price_paise,
              'total_price_paise', oi.total_price_paise
            )) as items
     FROM orders o
     LEFT JOIN order_items oi ON oi.order_id = o.id
     WHERE o.user_id = $1
     GROUP BY o.id
     ORDER BY o.created_at DESC`,
    [userId]
  );
  return result.rows;
}

export async function getOrderDetail(orderId: string, userId?: string): Promise<any> {
  const conditions = ['o.id = $1'];
  const params: unknown[] = [orderId];

  if (userId) {
    conditions.push('o.user_id = $2');
    params.push(userId);
  }

  const orderRes = await query(
    `SELECT o.*,
            a.full_name as shipping_name, a.line1 as shipping_line1, a.line2 as shipping_line2,
            a.city as shipping_city, a.state as shipping_state, a.pincode as shipping_pincode,
            a.phone as shipping_phone
     FROM orders o
     LEFT JOIN addresses a ON o.address_id = a.id
     WHERE ${conditions.join(' AND ')}`,
    params
  );

  if (orderRes.rows.length === 0) {
    throw new AppError(404, 'Order not found', 'NOT_FOUND');
  }

  const order = orderRes.rows[0];

  const [itemsRes, paymentsRes, trackingRes] = await Promise.all([
    query('SELECT * FROM order_items WHERE order_id = $1 ORDER BY product_name ASC', [orderId]),
    query('SELECT id, provider, provider_order_id, provider_payment_id, status, amount_paise, created_at FROM payment_attempts WHERE order_id = $1 ORDER BY created_at DESC', [orderId]),
    query('SELECT * FROM shipment_tracking_events WHERE order_id = $1 ORDER BY created_at ASC', [orderId]),
  ]);

  return {
    ...order,
    items: itemsRes.rows,
    payments: paymentsRes.rows,
    tracking: trackingRes.rows,
  };
}
