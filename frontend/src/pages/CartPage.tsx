import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  ArrowRight, 
  Tag, 
  ArrowLeft, 
  ShieldCheck, 
  Truck 
} from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { formatPaise } from '../lib/utils';

export function CartPage() {
  const { cart, updateQuantity, removeFromCart, applyCoupon, itemCount } = useCart();
  const [couponCode, setCouponCode] = useState('');

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (couponCode.trim()) {
      applyCoupon(couponCode);
      setCouponCode('');
    }
  };

  if (cart.items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center">
        <div className="w-16 h-16 rounded-3xl bg-navy-800 border border-navy-700 flex items-center justify-center text-gray-500 mx-auto mb-4">
          <ShoppingCart className="w-8 h-8 text-orange-400" />
        </div>
        <h2 className="text-2xl font-black text-white mb-2">Your Shopping Cart is Empty</h2>
        <p className="text-xs text-gray-400 mb-6">
          Explore our featured collections with express 2-day delivery across India.
        </p>
        <Link to="/shop" className="btn-primary text-xs inline-flex items-center gap-2">
          <span>Explore Catalog</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto pb-16 flex flex-col gap-6">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-navy-700">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Your Shopping Cart
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Review item quantities, apply discount vouchers, and proceed to checkout
          </p>
        </div>
        <Link to="/shop" className="flex items-center gap-1.5 text-xs text-orange-400 font-semibold hover:underline">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Continue Shopping</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left: Cart Items List */}
        <div className="lg:col-span-2 flex flex-col gap-3">
          {cart.items.map((item) => (
            <div key={item.productId} className="card p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-16 h-16 rounded-xl bg-navy-800 border border-navy-600 overflow-hidden shrink-0">
                  <img
                    src={item.imageUrl || `https://placehold.co/200x200/0f172a/f97316?text=${encodeURIComponent(item.productName)}`}
                    alt={item.productName}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="truncate">
                  <h4 className="text-sm font-bold text-white truncate">{item.productName}</h4>
                  <p className="text-xs text-gray-400 font-mono mt-0.5">{formatPaise(item.unitPricePaise)} each</p>
                  <p className="text-[11px] text-green-400 mt-1 font-semibold">
                    In Stock ({item.stockAvailable} available)
                  </p>
                </div>
              </div>

              {/* Quantity Stepper & Subtotal */}
              <div className="flex items-center gap-4 shrink-0">
                <div className="flex items-center gap-2 bg-navy-800 px-2 py-1 rounded-xl border border-navy-600">
                  <button
                    onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                    className="text-gray-400 hover:text-white p-0.5"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-xs font-bold text-white w-5 text-center">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                    className="text-gray-400 hover:text-white p-0.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <span className="font-mono font-bold text-white text-sm w-20 text-right">
                  {formatPaise(item.totalPricePaise)}
                </span>

                <button
                  onClick={() => removeFromCart(item.productId)}
                  className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-navy-800 rounded-lg transition-colors"
                  title="Remove"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          <div className="p-4 rounded-2xl bg-navy-800/40 border border-navy-700/60 flex items-center justify-between text-xs text-gray-300">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-orange-400" />
              <span>Orders over ₹500 qualify for FREE Express Shipping</span>
            </div>
            <span className="font-bold text-green-400">Doorstep Delivery</span>
          </div>
        </div>

        {/* Right: Order Summary */}
        <div className="flex flex-col gap-4">
          <div className="card p-5">
            <h3 className="font-bold text-white text-sm mb-4">Price Details</h3>

            {/* Promo Code Form */}
            <form onSubmit={handleApplyCoupon} className="flex gap-2 mb-4">
              <div className="relative flex-1">
                <Tag className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={couponCode}
                  onChange={e => setCouponCode(e.target.value)}
                  placeholder="Coupon (e.g. WELCOME10)"
                  className="input pl-9 text-xs uppercase font-mono"
                />
              </div>
              <button type="submit" className="btn-secondary text-xs px-3">
                Apply
              </button>
            </form>

            <div className="flex flex-col gap-2.5 text-xs border-t border-navy-600/60 pt-3">
              <div className="flex justify-between text-gray-400">
                <span>Subtotal ({itemCount} items)</span>
                <span className="font-mono text-gray-200">{formatPaise(cart.subtotalPaise)}</span>
              </div>
              {cart.discountPaise > 0 && (
                <div className="flex justify-between text-green-400 font-semibold">
                  <span>Coupon Discount ({cart.couponCode})</span>
                  <span className="font-mono">-{formatPaise(cart.discountPaise)}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-400">
                <span>GST (18% Flat)</span>
                <span className="font-mono text-gray-200">{formatPaise(cart.taxPaise)}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Shipping Fee</span>
                <span className="font-mono">
                  {cart.shippingPaise === 0 ? <span className="text-green-400 font-bold">FREE</span> : formatPaise(cart.shippingPaise)}
                </span>
              </div>

              <div className="border-t border-navy-600/60 pt-3 flex justify-between font-black text-white text-base">
                <span>Total Amount</span>
                <span className="text-orange-400 font-mono">{formatPaise(cart.totalPaise)}</span>
              </div>
            </div>

            <Link
              to="/checkout"
              className="mt-6 w-full flex items-center justify-center gap-2 py-3.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-orange-500/25 transition-all"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-gray-400 px-2">
            <ShieldCheck className="w-4 h-4 text-green-400 shrink-0" />
            <span>Safe and secure 256-bit SSL encrypted checkout.</span>
          </div>
        </div>

      </div>

    </div>
  );
}
