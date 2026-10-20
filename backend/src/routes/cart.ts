import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../middleware/auth';
import {
  getUserCart,
  addItemToCart,
  updateCartItemQuantity,
  removeCartItem,
  mergeGuestCart,
} from '../services/cart';
import { calculateOrderPricing } from '../services/pricing';

const router = Router();
router.use(requireAuth);

// GET /api/v1/cart
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const coupon = typeof req.query.coupon === 'string' ? req.query.coupon : undefined;
    const cart = await getUserCart(req.user!.userId, coupon);
    res.json(cart);
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/cart/items
router.post('/items', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { productId, variantId, quantity } = req.body;
    const cart = await addItemToCart(
      req.user!.userId,
      productId,
      variantId,
      quantity ? parseInt(quantity, 10) : 1
    );
    res.status(201).json(cart);
  } catch (err) {
    next(err);
  }
});

// PUT /api/v1/cart/items/:id
router.put('/items/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { quantity } = req.body;
    const cart = await updateCartItemQuantity(
      req.user!.userId,
      req.params.id as string,
      parseInt(quantity, 10)
    );
    res.json(cart);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/cart/items/:id
router.delete('/items/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cart = await removeCartItem(req.user!.userId, req.params.id as string);
    res.json(cart);
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/cart/merge
router.post('/merge', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { items } = req.body as { items: Array<{ productId: string; variantId?: string; quantity: number }> };
    const cart = await mergeGuestCart(req.user!.userId, items || []);
    res.json(cart);
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/cart/preview-pricing (anonymous or authenticated)
router.post('/preview-pricing', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { items, couponCode } = req.body;
    const pricing = await calculateOrderPricing(items, couponCode, req.user?.userId);
    res.json({ pricing });
  } catch (err) {
    next(err);
  }
});

export default router;
