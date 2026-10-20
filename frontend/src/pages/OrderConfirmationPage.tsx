import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  CheckCircle2, 
  Package, 
  MapPin, 
  CreditCard, 
  Truck, 
  ArrowRight, 
  Clock, 
  ShieldCheck 
} from 'lucide-react';
import api from '../lib/api';
import { formatPaise, formatDateTime } from '../lib/utils';
import { FullPageSpinner } from '../components/ui/Spinner';

export function OrderConfirmationPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      api.get(`/orders/${id}`)
        .then(r => setOrder(r.data.order))
        .catch(() => setOrder(null))
        .finally(() => setLoading(false));
    }
  }, [id]);

  if (loading) return <FullPageSpinner />;

  if (!order) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center">
        <h2 className="text-xl font-bold text-white mb-2">Order Not Found</h2>
        <p className="text-xs text-gray-400 mb-6">Unable to retrieve details for order #{id}.</p>
        <Link to="/orders" className="btn-primary text-xs">View My Orders</Link>
      </div>
    );
  }

  const items = order.items || [];
  const tracking = order.tracking || [];

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 flex flex-col gap-6">
      
      {/* Success Celebration Card */}
      <div className="card p-6 sm:p-8 text-center flex flex-col items-center bg-gradient-to-b from-navy-800 to-navy-800/60 border-green-500/30">
        <div className="w-16 h-16 rounded-3xl bg-green-500/20 text-green-400 border border-green-500/40 flex items-center justify-center mb-4 shadow-xl shadow-green-500/10">
          <CheckCircle2 className="w-9 h-9" />
        </div>

        <span className="text-xs font-bold font-mono text-green-400 bg-green-500/10 border border-green-500/30 px-3 py-0.5 rounded-full uppercase tracking-wider mb-2">
          Payment Verified & Confirmed
        </span>

        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Thank you for your order!
        </h1>
        <p className="text-xs text-gray-300 mt-1 max-w-md">
          Your payment was verified server-side. Stock has been adjusted and the warehouse is preparing your package.
        </p>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-4 text-xs font-mono bg-navy-900/60 px-5 py-2.5 rounded-2xl border border-navy-700">
          <div>
            <span className="text-gray-400">Order ID: </span>
            <span className="text-white font-bold">{order.id}</span>
          </div>
          <div className="text-gray-600">|</div>
          <div>
            <span className="text-gray-400">Date: </span>
            <span className="text-gray-200">{formatDateTime(order.created_at)}</span>
          </div>
          <div className="text-gray-600">|</div>
          <div>
            <span className="text-gray-400">Status: </span>
            <span className="text-orange-400 font-bold uppercase">{order.status}</span>
          </div>
        </div>
      </div>

      {/* Grid: Items Snapshot & Delivery / Payment Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left: Ordered Items Snapshot */}
        <div className="md:col-span-2 card p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between pb-3 border-b border-navy-600/60">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Package className="w-4 h-4 text-orange-400" />
              <span>Purchased Items Snapshot ({items.length})</span>
            </h3>
            <span className="text-[10px] text-gray-400 font-mono">Immutable Record</span>
          </div>

          <div className="flex flex-col gap-3 divide-y divide-navy-600/40">
            {items.map((item: any) => (
              <div key={item.id} className="pt-3 first:pt-0 flex items-center justify-between gap-4 text-xs">
                <div>
                  <p className="font-bold text-white">{item.product_name}</p>
                  <p className="text-[11px] text-gray-400">SKU: {item.sku || 'N/A'}</p>
                  <p className="text-[11px] text-orange-400 font-mono mt-0.5">
                    Qty: {item.quantity} × {formatPaise(item.unit_price_paise)}
                  </p>
                </div>
                <span className="font-bold font-mono text-white text-sm">
                  {formatPaise(item.total_price_paise)}
                </span>
              </div>
            ))}
          </div>

          {/* Pricing Totals */}
          <div className="border-t border-navy-600/60 pt-3 flex flex-col gap-1.5 text-xs">
            <div className="flex justify-between text-gray-400">
              <span>Subtotal</span>
              <span className="font-mono text-gray-200">{formatPaise(order.subtotal_paise)}</span>
            </div>
            {order.discount_paise > 0 && (
              <div className="flex justify-between text-green-400">
                <span>Coupon Discount ({order.coupon_code || 'WELCOME10'})</span>
                <span className="font-mono">-{formatPaise(order.discount_paise)}</span>
              </div>
            )}
            <div className="flex justify-between text-gray-400">
              <span>GST (18% Flat)</span>
              <span className="font-mono text-gray-200">{formatPaise(order.tax_paise)}</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Shipping</span>
              <span className="font-mono">
                {order.shipping_paise === 0 ? <span className="text-green-400 font-bold">FREE</span> : formatPaise(order.shipping_paise)}
              </span>
            </div>
            <div className="border-t border-navy-600/60 pt-2 flex justify-between font-black text-white text-base">
              <span>Total Paid</span>
              <span className="text-orange-400 font-mono">{formatPaise(order.total_paise)}</span>
            </div>
          </div>
        </div>

        {/* Right: Address & Dispatch Status */}
        <div className="flex flex-col gap-5">
          
          {/* Delivery Address */}
          <div className="card p-5">
            <h4 className="font-bold text-white text-xs flex items-center gap-2 mb-3">
              <MapPin className="w-4 h-4 text-orange-400" />
              <span>Shipping Destination</span>
            </h4>
            <div className="text-xs text-gray-300 flex flex-col gap-0.5">
              <p className="font-bold text-white">{order.shipping_name || 'Customer'}</p>
              <p>{order.shipping_line1}</p>
              {order.shipping_line2 && <p>{order.shipping_line2}</p>}
              <p>{order.shipping_city}, {order.shipping_state} - {order.shipping_pincode}</p>
              <p className="text-gray-400 text-[11px] mt-1 font-mono">Contact: {order.shipping_phone}</p>
            </div>
          </div>

          {/* Payment Attempt Record */}
          <div className="card p-5">
            <h4 className="font-bold text-white text-xs flex items-center gap-2 mb-2">
              <CreditCard className="w-4 h-4 text-green-400" />
              <span>Transaction Verified</span>
            </h4>
            <div className="text-[11px] text-gray-400 flex flex-col gap-1 font-mono">
              <div className="flex justify-between">
                <span>Method:</span>
                <span className="text-gray-200 uppercase">Sandbox / Mock</span>
              </div>
              <div className="flex justify-between">
                <span>Currency:</span>
                <span className="text-gray-200">INR</span>
              </div>
              <div className="flex justify-between">
                <span>Gateway Status:</span>
                <span className="text-green-400 font-bold">SUCCESS</span>
              </div>
            </div>
          </div>

          {/* Action links */}
          <div className="flex flex-col gap-2 pt-1">
            <Link
              to="/orders"
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-navy-700 hover:bg-navy-600 text-white font-bold text-xs rounded-xl border border-navy-600 transition-colors"
            >
              <Truck className="w-4 h-4 text-orange-400" />
              <span>Track in My Orders</span>
            </Link>

            <Link
              to="/shop"
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-md shadow-orange-500/20 transition-colors"
            >
              <span>Continue Shopping</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

        </div>

      </div>

    </div>
  );
}
