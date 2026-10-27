import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ShoppingCart, 
  ArrowRight, 
  Truck, 
  CheckCircle2, 
  Plus, 
  Minus, 
  Trash2, 
  Tag, 
  RotateCcw,
  Package,
  Clock
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../lib/api';
import { formatPaise } from '../../lib/utils';
import toast from 'react-hot-toast';

export function RightPanel() {
  const { cart, updateQuantity, removeFromCart, applyCoupon, itemCount } = useCart();
  const { user } = useAuth();
  const [couponInput, setCouponInput] = useState('');

  // Fetch real latest order and tracking events for the authenticated user
  const { data: latestOrder, isLoading: isOrderLoading } = useQuery({
    queryKey: ['latest-order-tracking', user?.id],
    queryFn: async () => {
      if (!user) return null;
      try {
        const res = await api.get('/orders/latest-tracking');
        return res.data.order;
      } catch {
        return null;
      }
    },
    enabled: !!user,
    staleTime: 30000,
  });

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (couponInput.trim()) {
      applyCoupon(couponInput);
      setCouponInput('');
    }
  };

  return (
    <aside className="w-80 shrink-0 hidden xl:flex flex-col gap-5 py-6 px-4 bg-navy-800/60 border-l border-navy-700/60 min-h-[calc(100vh-4rem)]">
      
      {/* 1. Interactive Mini Cart Summary */}
      <div className="bg-navy-700/60 rounded-2xl p-4 border border-navy-600/60 flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <ShoppingCart className="w-4 h-4 text-orange-500" />
            <span>Your Cart</span>
          </div>
          <span className="text-xs bg-orange-500/10 text-orange-400 font-semibold px-2 py-0.5 rounded-full border border-orange-500/20">
            {itemCount} {itemCount === 1 ? 'Item' : 'Items'}
          </span>
        </div>

        {/* Cart items list or empty state */}
        {cart.items.length === 0 ? (
          <div className="py-6 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-2xl bg-navy-800 flex items-center justify-center text-gray-500 mb-2 border border-navy-600">
              <ShoppingCart className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-xs text-gray-300 font-medium">Your cart is empty</p>
            <p className="text-[11px] text-gray-400 mt-0.5 max-w-[200px]">
              Explore catalog and add items with fast 2-day delivery
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5 max-h-60 overflow-y-auto pr-1 mb-3">
            {cart.items.map((item) => (
              <div
                key={item.productId}
                className="flex items-center justify-between gap-2 p-2 rounded-xl bg-navy-800/80 border border-navy-600/60 text-xs"
              >
                <div className="truncate flex-1">
                  <p className="font-semibold text-white truncate leading-tight">{item.productName}</p>
                  <p className="text-[10px] text-orange-400 font-mono mt-0.5">
                    {formatPaise(item.unitPricePaise)}
                  </p>
                </div>

                {/* Qty Steppers */}
                <div className="flex items-center gap-1.5 bg-navy-700 px-1.5 py-0.5 rounded-lg border border-navy-600 shrink-0">
                  <button
                    onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                    className="text-gray-400 hover:text-white"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="text-xs font-bold text-white w-4 text-center">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                    className="text-gray-400 hover:text-white"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                {/* Delete button */}
                <button
                  onClick={() => removeFromCart(item.productId)}
                  className="text-gray-400 hover:text-red-400 p-1"
                  title="Remove"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Coupon form */}
        {cart.items.length > 0 && (
          <form onSubmit={handleApplyCoupon} className="flex gap-1.5 mb-3">
            <div className="relative flex-1">
              <Tag className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value)}
                placeholder="Promo Code (WELCOME10)"
                className="w-full bg-navy-800 border border-navy-600 rounded-xl pl-8 pr-2 py-1.5 text-xs text-white uppercase placeholder-gray-400 focus:outline-none focus:border-orange-500 font-mono"
              />
            </div>
            <button
              type="submit"
              className="bg-navy-600 hover:bg-navy-500 text-white font-bold text-xs px-3 py-1.5 rounded-xl border border-navy-500"
            >
              Apply
            </button>
          </form>
        )}

        {/* Cost breakdown */}
        <div className="border-t border-navy-600/60 pt-2.5 flex flex-col gap-1 text-xs">
          <div className="flex justify-between text-gray-400">
            <span>Subtotal</span>
            <span className="font-mono text-gray-200">{formatPaise(cart.subtotalPaise)}</span>
          </div>
          {cart.discountPaise > 0 && (
            <div className="flex justify-between text-green-400 font-semibold">
              <span>Coupon Discount ({cart.couponCode})</span>
              <span className="font-mono">-{formatPaise(cart.discountPaise)}</span>
            </div>
          )}
          <div className="flex justify-between text-gray-400">
            <span>GST (18%)</span>
            <span className="font-mono text-gray-200">{formatPaise(cart.taxPaise)}</span>
          </div>
          <div className="flex justify-between text-gray-400">
            <span>Shipping</span>
            <span className="font-mono">
              {cart.shippingPaise === 0 ? (
                <span className="text-green-400 font-bold">FREE</span>
              ) : (
                formatPaise(cart.shippingPaise)
              )}
            </span>
          </div>
          <div className="flex justify-between font-bold text-white text-sm pt-2 border-t border-navy-600/40">
            <span>Total</span>
            <span className="text-orange-400 font-mono">{formatPaise(cart.totalPaise)}</span>
          </div>
        </div>

        {cart.items.length > 0 ? (
          <Link
            to="/checkout"
            className="mt-3.5 w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs py-2.5 rounded-xl shadow-md shadow-orange-500/20 transition-all hover:scale-[1.02]"
          >
            <span>Proceed to Checkout</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        ) : (
          <Link
            to="/shop"
            className="mt-3.5 w-full flex items-center justify-center gap-2 bg-navy-600 hover:bg-navy-500 text-white font-bold text-xs py-2 rounded-xl transition-colors"
          >
            <span>Explore Catalog</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>

      {/* 2. Order Tracking Stepper */}
      <div className="bg-navy-700/60 rounded-2xl p-4 border border-navy-600/60">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Truck className="w-4 h-4 text-orange-500" />
            <span>Track Order</span>
          </div>
          {latestOrder && (
            <span className="text-[10px] text-gray-400 font-mono">
              #{latestOrder.order_number || latestOrder.id.slice(0, 8).toUpperCase()}
            </span>
          )}
        </div>

        {isOrderLoading ? (
          <div className="py-6 text-center text-xs text-gray-400 animate-pulse">
            Loading order details...
          </div>
        ) : !latestOrder ? (
          <div className="py-5 text-center flex flex-col items-center justify-center">
            <div className="w-10 h-10 rounded-xl bg-navy-800 flex items-center justify-center text-gray-500 mb-2 border border-navy-600">
              <Package className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-xs font-semibold text-gray-300">No orders yet</p>
            <p className="text-[11px] text-gray-400 mt-0.5 max-w-[200px]">
              {user ? 'Place an order to track live delivery progress here.' : 'Sign in to view and track your orders.'}
            </p>
            <Link
              to={user ? '/shop' : '/login'}
              className="mt-3 text-xs font-bold text-orange-400 hover:text-orange-300 transition-colors"
            >
              {user ? 'Start Shopping →' : 'Sign In →'}
            </Link>
          </div>
        ) : latestOrder.status === 'CANCELLED' ? (
          <div className="py-4 text-center">
            <p className="text-xs font-semibold text-red-400">Order Cancelled</p>
            <p className="text-[11px] text-gray-400 mt-1">
              {latestOrder.items?.[0]?.product_name || 'Item'}
            </p>
            <Link
              to="/orders"
              className="mt-3 inline-block text-xs font-bold text-orange-400 hover:text-orange-300 transition-colors"
            >
              View Order History →
            </Link>
          </div>
        ) : (
          <div>
            <p className="text-xs font-semibold text-white mb-3 truncate" title={latestOrder.items?.[0]?.product_name}>
              {latestOrder.items?.[0]?.product_name || 'ShopNest Order'}
              {latestOrder.items?.length > 1 && ` (+${latestOrder.items.length - 1} more)`}
            </p>

            {/* Stepper */}
            <div className="flex flex-col gap-3 relative pl-6 border-l-2 border-navy-600 ml-2">
              {/* Step 1: Ordered */}
              <div className="relative">
                <div className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-orange-500 ring-4 ring-navy-700 flex items-center justify-center">
                  <CheckCircle2 className="w-3 h-3 text-white" />
                </div>
                <p className="text-xs font-semibold text-white leading-tight">Order Confirmed</p>
                <p className="text-[10px] text-gray-400">
                  {new Date(latestOrder.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </p>
              </div>

              {/* Step 2: Shipped */}
              <div className="relative">
                {['SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'REFUND_REQUESTED', 'REFUNDED'].includes(latestOrder.status) ? (
                  <div className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-orange-500 ring-4 ring-navy-700 flex items-center justify-center">
                    <CheckCircle2 className="w-3 h-3 text-white" />
                  </div>
                ) : (
                  <div className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-navy-600 ring-4 ring-navy-700" />
                )}
                <p className={`text-xs leading-tight ${['SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(latestOrder.status) ? 'font-semibold text-white' : 'font-medium text-gray-400'}`}>
                  Shipped
                </p>
                <p className="text-[10px] text-gray-400">
                  {latestOrder.status === 'PROCESSING' ? 'Processing at hub' : ['SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(latestOrder.status) ? 'Carrier in transit' : 'Pending dispatch'}
                </p>
              </div>

              {/* Step 3: Out for Delivery */}
              <div className="relative">
                {['OUT_FOR_DELIVERY', 'DELIVERED', 'REFUND_REQUESTED', 'REFUNDED'].includes(latestOrder.status) ? (
                  <div className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-orange-500 ring-4 ring-navy-700 flex items-center justify-center">
                    <CheckCircle2 className="w-3 h-3 text-white" />
                  </div>
                ) : latestOrder.status === 'SHIPPED' ? (
                  <div className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-orange-400 animate-pulse ring-4 ring-navy-700" />
                ) : (
                  <div className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-navy-600 ring-4 ring-navy-700" />
                )}
                <p className={`text-xs leading-tight ${['OUT_FOR_DELIVERY', 'DELIVERED'].includes(latestOrder.status) ? 'font-semibold text-orange-400' : 'font-medium text-gray-400'}`}>
                  Out for Delivery
                </p>
                <p className="text-[10px] text-gray-400">
                  {latestOrder.status === 'OUT_FOR_DELIVERY' ? 'Courier out on delivery route' : 'Pending dispatch'}
                </p>
              </div>

              {/* Step 4: Delivered */}
              <div className="relative">
                {['DELIVERED', 'REFUND_REQUESTED', 'REFUNDED'].includes(latestOrder.status) ? (
                  <div className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-green-500 ring-4 ring-navy-700 flex items-center justify-center">
                    <CheckCircle2 className="w-3 h-3 text-white" />
                  </div>
                ) : (
                  <div className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-navy-600 ring-4 ring-navy-700" />
                )}
                <p className={`text-xs leading-tight ${['DELIVERED', 'REFUND_REQUESTED', 'REFUNDED'].includes(latestOrder.status) ? 'font-bold text-green-400' : 'font-medium text-gray-400'}`}>
                  {latestOrder.status === 'DELIVERED' ? 'Delivered' : 'Delivery'}
                </p>
                <p className="text-[10px] text-gray-400">
                  {latestOrder.status === 'DELIVERED' ? 'Package received' : 'Pending arrival'}
                </p>
              </div>
            </div>

            <Link
              to="/orders"
              className="mt-4 block text-center text-xs font-semibold text-orange-400 hover:text-orange-300 transition-colors"
            >
              View live tracking details →
            </Link>
          </div>
        )}
      </div>

      {/* 3. Fast Assistance card */}
      <div className="bg-navy-700/60 rounded-2xl p-4 border border-navy-600/60 mt-auto">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-gray-300">Fast Assistance</span>
          <span className="text-[10px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded font-semibold">
            24/7 Live
          </span>
        </div>
        <p className="text-[11px] text-gray-400 leading-relaxed">
          Need help with your shipment, returns, or payment confirmation?
        </p>
        <div className="mt-3 flex items-center justify-between pt-2 border-t border-navy-600/40 text-[11px]">
          <span className="text-gray-400">Refund Guarantee</span>
          <span className="font-semibold text-white">7-Day Free Return</span>
        </div>
      </div>

    </aside>
  );
}
