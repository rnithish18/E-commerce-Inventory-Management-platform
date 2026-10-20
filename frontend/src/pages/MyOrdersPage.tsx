import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Package, 
  Truck, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ChevronRight, 
  XCircle, 
  ArrowRight 
} from 'lucide-react';
import api from '../lib/api';
import { formatPaise, formatDateTime } from '../lib/utils';
import { FullPageSpinner } from '../components/ui/Spinner';
import toast from 'react-hot-toast';

export function MyOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await api.get('/orders');
      setOrders(res.data.orders);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to cancel this order? Stock reservations will be released.')) return;
    try {
      await api.post(`/orders/${orderId}/cancel`);
      toast.success('Order cancelled and stock reservation released');
      fetchOrders();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to cancel order');
    }
  };

  if (loading) return <FullPageSpinner />;

  const statusColors: Record<string, string> = {
    'PENDING_PAYMENT': 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    'PAID': 'bg-green-500/10 text-green-400 border-green-500/30',
    'PROCESSING': 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    'SHIPPED': 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    'OUT_FOR_DELIVERY': 'bg-orange-500/10 text-orange-400 border-orange-500/30',
    'DELIVERED': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    'CANCELLED': 'bg-red-500/10 text-red-400 border-red-500/30',
    'REFUNDED': 'bg-gray-500/10 text-gray-400 border-gray-500/30',
  };

  return (
    <div className="max-w-5xl mx-auto pb-16 flex flex-col gap-6">
      
      {/* Page Header */}
      <div className="flex items-center justify-between pb-4 border-b border-navy-700">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            My Orders & Tracking
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            View order progress, live courier tracking events, and item snapshots
          </p>
        </div>
        <Link to="/shop" className="btn-primary text-xs flex items-center gap-1.5">
          <span>Shop More</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {orders.length === 0 ? (
        <div className="card p-12 text-center flex flex-col items-center">
          <Package className="w-12 h-12 text-gray-500 mb-3" />
          <h3 className="text-base font-bold text-white mb-1">No orders placed yet</h3>
          <p className="text-xs text-gray-400 mb-6 max-w-sm">
            You haven't made any purchases yet. Explore our curated collections with express delivery!
          </p>
          <Link to="/shop" className="btn-primary text-xs">Explore Catalog</Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {orders.map((order) => {
            const items = order.items || [];
            const canCancel = ['PENDING_PAYMENT', 'PAID', 'PROCESSING'].includes(order.status);

            return (
              <div key={order.id} className="card p-5 flex flex-col gap-4">
                
                {/* Header row */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-navy-600/60 text-xs">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-white text-sm">
                      #{order.id.slice(0, 13)}
                    </span>
                    <span className="text-gray-400 font-mono">
                      {formatDateTime(order.created_at)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border uppercase ${statusColors[order.status] || 'bg-navy-700 text-gray-300'}`}>
                      {order.status}
                    </span>

                    {canCancel && (
                      <button
                        onClick={() => handleCancelOrder(order.id)}
                        className="text-[11px] text-red-400 hover:text-red-300 font-semibold px-2 py-0.5 rounded hover:bg-red-500/10 transition-colors"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>

                {/* Items list */}
                <div className="flex flex-col gap-2 divide-y divide-navy-600/40">
                  {items.map((item: any, idx: number) => (
                    <div key={idx} className="pt-2 first:pt-0 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-semibold text-white">{item.product_name}</p>
                        <p className="text-[11px] text-gray-400">Qty: {item.quantity} × {formatPaise(item.unit_price_paise)}</p>
                      </div>
                      <span className="font-mono text-gray-200 font-bold">
                        {formatPaise(item.total_price_paise)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Total and actions */}
                <div className="flex items-center justify-between pt-3 border-t border-navy-600/60 text-xs">
                  <div>
                    <span className="text-gray-400">Total Paid: </span>
                    <span className="font-mono font-black text-white text-sm">
                      {formatPaise(order.total_paise)}
                    </span>
                  </div>

                  <Link
                    to={`/order-confirmation/${order.id}`}
                    className="flex items-center gap-1 text-orange-400 hover:text-orange-300 font-semibold"
                  >
                    <span>View Confirmation & Tracking Details</span>
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
