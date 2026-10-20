import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ShoppingCart, 
  ArrowRight, 
  Truck, 
  CheckCircle2, 
  Clock, 
  Package, 
  Sparkles, 
  ChevronRight 
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export function RightPanel() {
  const { user } = useAuth();

  return (
    <aside className="w-80 shrink-0 hidden xl:flex flex-col gap-5 py-6 px-4 bg-navy-800/60 border-l border-navy-700/60 min-h-[calc(100vh-4rem)]">
      
      {/* 1. Mini Cart Summary */}
      <div className="bg-navy-700/60 rounded-2xl p-4 border border-navy-600/60">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <ShoppingCart className="w-4 h-4 text-orange-500" />
            <span>Your Cart</span>
          </div>
          <span className="text-xs bg-orange-500/10 text-orange-400 font-semibold px-2 py-0.5 rounded-full border border-orange-500/20">
            0 Items
          </span>
        </div>

        {/* Empty State / Cart list */}
        <div className="py-6 text-center flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-2xl bg-navy-800 flex items-center justify-center text-gray-500 mb-2 border border-navy-600">
            <ShoppingCart className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-xs text-gray-300 font-medium">Your cart is empty</p>
          <p className="text-[11px] text-gray-400 mt-0.5 max-w-[200px]">
            Explore catalog and add items with fast 2-day delivery
          </p>
        </div>

        {/* Cost summary */}
        <div className="border-t border-navy-600/60 pt-3 flex flex-col gap-1.5 text-xs">
          <div className="flex justify-between text-gray-400">
            <span>Subtotal</span>
            <span>₹0.00</span>
          </div>
          <div className="flex justify-between text-gray-400">
            <span>Shipping</span>
            <span className="text-green-400">FREE on ₹500+</span>
          </div>
          <div className="flex justify-between font-bold text-white text-sm pt-1 border-t border-navy-600/40">
            <span>Total</span>
            <span className="text-orange-400">₹0.00</span>
          </div>
        </div>

        <Link
          to="/shop"
          className="mt-3.5 w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs py-2.5 rounded-xl shadow-md shadow-orange-500/20 transition-colors"
        >
          <span>Start Shopping</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* 2. Order Tracking Stepper */}
      <div className="bg-navy-700/60 rounded-2xl p-4 border border-navy-600/60">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Truck className="w-4 h-4 text-orange-500" />
            <span>Track Order</span>
          </div>
          <span className="text-[10px] text-gray-400 font-mono">
            #ORD-9021
          </span>
        </div>

        <p className="text-xs font-semibold text-white mb-3">
          Sony WH-1000XM5 Wireless
        </p>

        {/* Stepper */}
        <div className="flex flex-col gap-3 relative pl-6 border-l-2 border-navy-600 ml-2">
          
          {/* Step 1 */}
          <div className="relative">
            <div className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-orange-500 ring-4 ring-navy-700 flex items-center justify-center">
              <CheckCircle2 className="w-3 h-3 text-white" />
            </div>
            <p className="text-xs font-semibold text-white leading-tight">Order Confirmed</p>
            <p className="text-[10px] text-gray-400">Oct 19, 02:40 PM</p>
          </div>

          {/* Step 2 */}
          <div className="relative">
            <div className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-orange-500 ring-4 ring-navy-700 flex items-center justify-center">
              <CheckCircle2 className="w-3 h-3 text-white" />
            </div>
            <p className="text-xs font-semibold text-white leading-tight">Shipped (Bluedart)</p>
            <p className="text-[10px] text-gray-400">In transit from Mumbai Hub</p>
          </div>

          {/* Step 3 */}
          <div className="relative">
            <div className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-orange-400 animate-pulse ring-4 ring-navy-700" />
            <p className="text-xs font-semibold text-orange-400 leading-tight">Out for Delivery</p>
            <p className="text-[10px] text-gray-300">Expected by 04:00 PM today</p>
          </div>

          {/* Step 4 */}
          <div className="relative">
            <div className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-navy-600 ring-4 ring-navy-700" />
            <p className="text-xs font-medium text-gray-400 leading-tight">Delivered</p>
            <p className="text-[10px] text-gray-500">Pending arrival</p>
          </div>
        </div>

        <Link
          to="/orders"
          className="mt-4 block text-center text-xs font-semibold text-orange-400 hover:text-orange-300 transition-colors"
        >
          View live tracking details →
        </Link>
      </div>

      {/* 3. Recent Activity / Orders preview */}
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
