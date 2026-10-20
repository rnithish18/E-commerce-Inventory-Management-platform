import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../lib/api';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

export interface CartItem {
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
}

export interface CartPricing {
  items: CartItem[];
  subtotalPaise: number;
  discountPaise: number;
  couponCode: string | null;
  taxPaise: number;
  shippingPaise: number;
  totalPaise: number;
}

interface CartContextType {
  cart: CartPricing;
  loading: boolean;
  itemCount: number;
  addToCart: (productId: string, variantId?: string, quantity?: number) => Promise<void>;
  updateQuantity: (cartItemIdOrProductId: string, quantity: number) => Promise<void>;
  removeFromCart: (cartItemIdOrProductId: string) => Promise<void>;
  applyCoupon: (code: string) => Promise<void>;
  clearCart: () => void;
  refreshCart: () => Promise<void>;
}

const defaultPricing: CartPricing = {
  items: [],
  subtotalPaise: 0,
  discountPaise: 0,
  couponCode: null,
  taxPaise: 0,
  shippingPaise: 0,
  totalPaise: 0,
};

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [cart, setCart] = useState<CartPricing>(defaultPricing);
  const [loading, setLoading] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);

  const fetchCart = async (coupon?: string) => {
    if (!user) {
      // Guest local storage fallback
      const local = localStorage.getItem('shopnest_guest_cart');
      if (local) {
        try {
          const guestItems = JSON.parse(local);
          if (guestItems.length > 0) {
            const res = await api.post('/cart/preview-pricing', {
              items: guestItems,
              couponCode: coupon || appliedCoupon,
            });
            setCart(res.data.pricing);
            return;
          }
        } catch {
          // ignore parsing error
        }
      }
      setCart(defaultPricing);
      return;
    }

    try {
      setLoading(true);
      const queryParam = coupon || appliedCoupon ? `?coupon=${encodeURIComponent(coupon || appliedCoupon || '')}` : '';
      const res = await api.get(`/cart${queryParam}`);
      setCart(res.data.pricing);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, [user]);

  const addToCart = async (productId: string, variantId?: string, quantity = 1) => {
    if (user) {
      try {
        const res = await api.post('/cart/items', { productId, variantId, quantity });
        setCart(res.data.pricing);
        toast.success('Added item to cart!');
      } catch (err: any) {
        toast.error(err.response?.data?.message || 'Failed to add item to cart');
      }
    } else {
      // Save in guest localStorage
      const local = localStorage.getItem('shopnest_guest_cart');
      const items: Array<{ productId: string; variantId?: string; quantity: number }> = local ? JSON.parse(local) : [];
      const idx = items.findIndex(i => i.productId === productId);
      if (idx > -1) {
        items[idx].quantity += quantity;
      } else {
        items.push({ productId, variantId, quantity });
      }
      localStorage.setItem('shopnest_guest_cart', JSON.stringify(items));
      toast.success('Added item to cart!');
      fetchCart();
    }
  };

  const updateQuantity = async (cartItemId: string, quantity: number) => {
    if (user) {
      try {
        const res = await api.put(`/cart/items/${cartItemId}`, { quantity });
        setCart(res.data.pricing);
      } catch (err: any) {
        toast.error(err.response?.data?.message || 'Failed to update quantity');
      }
    } else {
      const local = localStorage.getItem('shopnest_guest_cart');
      if (local) {
        let items: Array<{ productId: string; variantId?: string; quantity: number }> = JSON.parse(local);
        if (quantity <= 0) {
          items = items.filter(i => i.productId !== cartItemId);
        } else {
          const item = items.find(i => i.productId === cartItemId);
          if (item) item.quantity = quantity;
        }
        localStorage.setItem('shopnest_guest_cart', JSON.stringify(items));
        fetchCart();
      }
    }
  };

  const removeFromCart = async (cartItemId: string) => {
    if (user) {
      try {
        const res = await api.delete(`/cart/items/${cartItemId}`);
        setCart(res.data.pricing);
        toast.success('Item removed from cart');
      } catch (err: any) {
        toast.error('Failed to remove item');
      }
    } else {
      const local = localStorage.getItem('shopnest_guest_cart');
      if (local) {
        const items = JSON.parse(local).filter((i: any) => i.productId !== cartItemId);
        localStorage.setItem('shopnest_guest_cart', JSON.stringify(items));
        fetchCart();
        toast.success('Item removed from cart');
      }
    }
  };

  const applyCoupon = async (code: string) => {
    const trimmed = code.trim().toUpperCase();
    setAppliedCoupon(trimmed);
    await fetchCart(trimmed);
    toast.success(`Coupon ${trimmed} applied!`);
  };

  const clearCart = () => {
    setCart(defaultPricing);
    localStorage.removeItem('shopnest_guest_cart');
  };

  const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        itemCount,
        addToCart,
        updateQuantity,
        removeFromCart,
        applyCoupon,
        clearCart,
        refreshCart: fetchCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
