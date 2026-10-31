import React, { useState } from 'react';
import { Search, Package, Truck, CheckCircle2, AlertCircle, Clock, MapPin, Loader2, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { ordersApi } from '../../lib/api';
import { formatPaise } from '../../lib/utils';
import { ProductImage } from '../../components/ui/ProductImage';

export function TrackOrderPage() {
  const [orderId, setOrderId] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId || !email) {
      toast.error('Please enter both Order ID and associated email address');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await ordersApi.trackGuest(orderId.trim(), email.trim());
      setOrder(res.data.order);
      toast.success('Order found!');
    } catch (err: any) {
      setOrder(null);
      const msg = err.response?.data?.message || 'No matching order found. Please check the Order ID and email address.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'SHIPPED':
        return 'text-teal-400 bg-teal-500/10 border-teal-500/20';
      case 'PROCESSING':
      case 'PAID':
        return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
      case 'CANCELLED':
        return 'text-red-400 bg-red-500/10 border-red-500/20';
      default:
        return 'text-gray-400 bg-navy-700 border-navy-600';
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <span className="px-3 py-1 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20 text-xs font-bold uppercase tracking-wider">
          Public Tracking
        </span>
        <h1 className="text-3xl sm:text-4xl font-black font-display text-white tracking-tight mt-4">
          Track Your Shipment
        </h1>
        <p className="mt-2 text-sm text-gray-400">
          Enter your ShopNest Order ID and the email address used during checkout to inspect live delivery status.
        </p>
      </div>

      {/* Lookup Form */}
      <div className="p-6 sm:p-8 rounded-3xl bg-navy-800/90 border border-navy-700 max-w-2xl mx-auto mb-8 shadow-xl">
        <form onSubmit={handleTrack} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
              Order ID / Tracking Number *
            </label>
            <input
              type="text"
              required
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              placeholder="e.g. 34264d8a-9289... or first 8 digits"
              className="input font-mono text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
              Email Address on Order *
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="input text-xs"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3 text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>Search Shipment Status</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Error state */}
      {error && !loading && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 max-w-2xl mx-auto mb-8 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <p className="text-xs text-red-200 leading-relaxed">{error}</p>
        </div>
      )}

      {/* Order Result Card */}
      {order && !loading && (
        <div className="p-6 sm:p-8 rounded-3xl bg-navy-800/90 border border-navy-700 space-y-6 animate-fadeIn">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-navy-700">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-base">Order #{order.id.slice(0, 8).toUpperCase()}</span>
                <span
                  className={`px-2.5 py-0.5 rounded-full border text-xs font-bold ${getStatusColor(
                    order.status
                  )}`}
                >
                  {order.status}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Placed on {new Date(order.created_at).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>

            <div className="text-right">
              <p className="text-xs text-gray-400">Total Payable</p>
              <p className="text-xl font-bold font-display text-white">{formatPaise(order.total_paise)}</p>
            </div>
          </div>

          {/* Stepper tracking events if present */}
          {order.tracking_events && order.tracking_events.length > 0 && (
            <div>
              <h3 className="font-bold text-xs uppercase tracking-wider text-gray-400 mb-4">
                Milestone Tracking History
              </h3>
              <div className="space-y-4">
                {order.tracking_events.map((ev: any, i: number) => (
                  <div key={i} className="flex items-start gap-3 relative">
                    <div className="w-7 h-7 rounded-full bg-teal-500/20 text-teal-400 border border-teal-500/40 flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white capitalize">
                        {ev.event_type.replace(/_/g, ' ')}
                      </p>
                      <p className="text-[11px] text-gray-400 mt-0.5">{ev.notes || 'Status updated'}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">
                        {new Date(ev.created_at).toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Purchased Items snapshot */}
          <div>
            <h3 className="font-bold text-xs uppercase tracking-wider text-gray-400 mb-3">
              Included Items ({order.items?.length || 0})
            </h3>
            <div className="space-y-2">
              {order.items?.map((item: any) => (
                <div
                  key={item.id}
                  className="p-3 rounded-2xl bg-navy-900/70 border border-navy-700 flex items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <p className="font-bold text-white">{item.product_name}</p>
                    <p className="text-[11px] text-gray-400">Qty: {item.quantity} × {formatPaise(item.unit_price_paise)}</p>
                  </div>
                  <p className="font-bold text-white">{formatPaise(item.total_price_paise)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
