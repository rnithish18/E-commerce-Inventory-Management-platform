import { query } from '../db/query';
import { AppError } from '../middleware/errorHandler';
import { calculateOrderPricing, PricingResult } from './pricing';
import { v4 as uuidv4 } from 'uuid';

export async function getOrCreateUserCartId(userId: string): Promise<string> {
  const existing = await query<{ id: string }>('SELECT id FROM carts WHERE user_id = $1', [userId]);
  if (existing.rows.length > 0) {
    return existing.rows[0].id;
  }

  const newId = uuidv4();
  const created = await query<{ id: string }>(
    `INSERT INTO carts (id, user_id) VALUES ($1, $2)
     ON CONFLICT (user_id) DO UPDATE SET updated_at = NOW()
     RETURNING id`,
    [newId, userId]
  );
  return created.rows[0].id;
}

export async function getUserCart(userId: string, couponCode?: string): Promise<{ cartId: string; pricing: PricingResult }> {
  const cartId = await getOrCreateUserCartId(userId);

  const itemsRes = await query<{
    id: string;
    product_id: string;
    variant_id: string;
    quantity: number;
  }>(
    `SELECT ci.id, ci.product_id, ci.variant_id, ci.quantity
     FROM cart_items ci
     WHERE ci.cart_id = $1
     ORDER BY ci.added_at ASC`,
    [cartId]
  );

  if (itemsRes.rows.length === 0) {
    return {
      cartId,
      pricing: {
        items: [],
        subtotalPaise: 0,
        discountPaise: 0,
        couponCode: null,
        taxPaise: 0,
        shippingPaise: 0,
        totalPaise: 0,
      },
    };
  }

  const itemsInput = itemsRes.rows.map(row => ({
    productId: row.product_id,
    variantId: row.variant_id,
    quantity: row.quantity,
  }));

  const pricing = await calculateOrderPricing(itemsInput, couponCode, userId);
  return { cartId, pricing };
}

export async function addItemToCart(
  userId: string,
  productId: string,
  variantId?: string,
  quantity = 1
): Promise<{ cartId: string; pricing: PricingResult }> {
  if (quantity <= 0) {
    throw new AppError(400, 'Quantity must be at least 1', 'INVALID_QUANTITY');
  }

  const cartId = await getOrCreateUserCartId(userId);

  // If no variantId provided, pick the default variant
  let targetVariantId = variantId;
  if (!targetVariantId) {
    const vRes = await query<{ id: string }>(
      'SELECT id FROM product_variants WHERE product_id = $1 ORDER BY created_at ASC LIMIT 1',
      [productId]
    );
    if (vRes.rows.length === 0) {
      throw new AppError(404, 'Product variant not found', 'NOT_FOUND');
    }
    targetVariantId = vRes.rows[0].id;
  }

  // Validate stock availability
  const stockRes = await query<{ stock_qty: number; reserved_qty: number }>(
    'SELECT stock_qty, reserved_qty FROM product_variants WHERE id = $1',
    [targetVariantId]
  );
  if (stockRes.rows.length === 0) {
    throw new AppError(404, 'Variant not found', 'NOT_FOUND');
  }
  const availableStock = Math.max(0, stockRes.rows[0].stock_qty - (stockRes.rows[0].reserved_qty || 0));

  // Check if item already in cart
  const existingItem = await query<{ id: string; quantity: number }>(
    'SELECT id, quantity FROM cart_items WHERE cart_id = $1 AND product_id = $2 AND variant_id = $3',
    [cartId, productId, targetVariantId]
  );

  const desiredQuantity = existingItem.rows.length > 0
    ? existingItem.rows[0].quantity + quantity
    : quantity;

  if (desiredQuantity > availableStock) {
    throw new AppError(
      400,
      `Only ${availableStock} units available in stock. Cannot add ${desiredQuantity} units to cart.`,
      'INSUFFICIENT_STOCK'
    );
  }

  if (existingItem.rows.length > 0) {
    await query(
      'UPDATE cart_items SET quantity = $1, added_at = NOW() WHERE id = $2',
      [desiredQuantity, existingItem.rows[0].id]
    );
  } else {
    await query(
      `INSERT INTO cart_items (id, cart_id, product_id, variant_id, quantity)
       VALUES ($1, $2, $3, $4, $5)`,
      [uuidv4(), cartId, productId, targetVariantId, quantity]
    );
  }

  return getUserCart(userId);
}

export async function updateCartItemQuantity(
  userId: string,
  cartItemId: string,
  quantity: number
): Promise<{ cartId: string; pricing: PricingResult }> {
  const cartId = await getOrCreateUserCartId(userId);

  if (quantity <= 0) {
    await query('DELETE FROM cart_items WHERE id = $1 AND cart_id = $2', [cartItemId, cartId]);
    return getUserCart(userId);
  }

  // Check available stock
  const itemRes = await query<{ variant_id: string }>(
    'SELECT variant_id FROM cart_items WHERE id = $1 AND cart_id = $2',
    [cartItemId, cartId]
  );
  if (itemRes.rows.length === 0) {
    throw new AppError(404, 'Cart item not found', 'NOT_FOUND');
  }

  const stockRes = await query<{ stock_qty: number; reserved_qty: number }>(
    'SELECT stock_qty, reserved_qty FROM product_variants WHERE id = $1',
    [itemRes.rows[0].variant_id]
  );
  const availableStock = Math.max(0, stockRes.rows[0].stock_qty - (stockRes.rows[0].reserved_qty || 0));

  if (quantity > availableStock) {
    throw new AppError(
      400,
      `Requested quantity (${quantity}) exceeds available stock (${availableStock})`,
      'INSUFFICIENT_STOCK'
    );
  }

  await query('UPDATE cart_items SET quantity = $1 WHERE id = $2 AND cart_id = $3', [quantity, cartItemId, cartId]);
  return getUserCart(userId);
}

export async function removeCartItem(
  userId: string,
  cartItemId: string
): Promise<{ cartId: string; pricing: PricingResult }> {
  const cartId = await getOrCreateUserCartId(userId);
  await query('DELETE FROM cart_items WHERE id = $1 AND cart_id = $2', [cartItemId, cartId]);
  return getUserCart(userId);
}

export async function clearUserCart(userId: string): Promise<void> {
  const cartId = await getOrCreateUserCartId(userId);
  await query('DELETE FROM cart_items WHERE cart_id = $1', [cartId]);
}

export async function mergeGuestCart(
  userId: string,
  guestItems: Array<{ productId: string; variantId?: string; quantity: number }>
): Promise<{ cartId: string; pricing: PricingResult }> {
  for (const item of guestItems) {
    try {
      await addItemToCart(userId, item.productId, item.variantId, item.quantity);
    } catch {
      // If stock is exceeded, skip or add max available
    }
  }
  return getUserCart(userId);
}
