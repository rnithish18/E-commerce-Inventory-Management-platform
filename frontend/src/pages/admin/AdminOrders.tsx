import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, 
  Search, 
  Filter, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  Truck, 
  XCircle, 
  AlertCircle, 
  RotateCcw, 
  Eye, 
  X, 
  ShieldCheck, 
  User, 
  MapPin, 
  CreditCard 
} from 'lucide-react';
import api from '../../lib/api';
import { formatPaise, formatDateTime } from '../../lib/utils';
import { FullPageSpinner } from '../../components/ui/Spinner';
import toast from 'react-hot-toast';

interface AdminOrderSummary {
  id: string;
  status: string;
  total_paise: number;
  created_at: string;
  updated_at: string;
  email: string;
  full_name: string;
  item_count: number;
}

const STATUS_FILTERS = [
  'ALL',
  'PENDING_PAYMENT',
  'PAID',
  'PROCESSING',
  'SHIPPED',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'CANCELLED',
  'REFUND_REQUESTED',
  'REFUNDED',
];

const STATUS_COLORS: Record<string, string> = {
  'PENDING_PAYMENT': 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  'PAID': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  'PROCESSING': 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  'SHIPPED': 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  'OUT_FOR_DELIVERY': 'bg-orange-500/10 text-orange-400 border-orange-500/30',
  'DELIVERED': 'bg-green-500/10 text-green-400 border-green-500/30',
  'CANCELLED': 'bg-red-500/10 text-red-400 border-red-500/30',
  'REFUND_REQUESTED': 'bg-rose-500/10 text-rose-400 border-rose-500/30',
  'REFUNDED': 'bg-gray-500/10 text-gray-400 border-gray-500/30',
};

export function AdminOrders() {
  const [orders, setOrders] = useState<AdminOrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [search, setSearch] = useState('');

  // Order detail drawer state
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [orderDetail, setOrderDetail] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Tracking form state
  const [showTrackingForm, setShowTrackingForm] = useState(false);
  const [trackingStatus, setTrackingStatus] = useState('IN_TRANSIT');
  const [trackingLocation, setTrackingLocation] = useState('');
  const [trackingDescription, setTrackingDescription] = useState('');

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedStatus !== 'ALL') params.set('status', selectedStatus);
      if (search) params.set('search', search);

      const res = await api.get(`/admin/orders?${params.toString()}`);
      setOrders(res.data.orders);
    } catch {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [selectedStatus]);

  const fetchOrderDetail = async (id: string) => {
    try {
      setDetailLoading(true);
      const res = await api.get(`/admin/orders/${id}`);
      setOrderDetail(res.data.order);
    } catch {
      toast.error('Failed to load order details');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleOpenDetail = (id: string) => {
    setSelectedOrderId(id);
    fetchOrderDetail(id);
  };

  const handleStatusTransition = async (toStatus: string, note?: string) => {
    if (!selectedOrderId) return;
    try {
      await api.patch(`/admin/orders/${selectedOrderId}/status`, {
        status: toStatus,
        note: note || `Admin moved to ${toStatus}`,
      });
      toast.success(`Order state transitioned to ${toStatus}`);
      fetchOrderDetail(selectedOrderId);
      fetchOrders();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Transition rejected');
    }
  };

  const handleCancelOrder = async () => {
    if (!selectedOrderId) return;
    const reason = prompt('Enter reason for cancellation (stock will be released):');
    if (!reason) return;

    try {
      await api.post(`/admin/orders/${selectedOrderId}/cancel`, { reason });
      toast.success('Order cancelled and reserved stock released');
      fetchOrderDetail(selectedOrderId);
      fetchOrders();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Cancellation failed');
    }
  };

  const handleApproveRefund = async () => {
    if (!selectedOrderId) return;
    if (!confirm('Approve refund? This will restock items via RETURN_IN and mark order REFUNDED.')) return;

    try {
      await api.post(`/admin/orders/${selectedOrderId}/approve-refund`);
      toast.success('Refund approved and stock returned');
      fetchOrderDetail(selectedOrderId);
      fetchOrders();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to approve refund');
    }
  };

  const handleAddTracking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderId) return;

    try {
      await api.post(`/admin/orders/${selectedOrderId}/tracking`, {
        status: trackingStatus,
        location: trackingLocation,
        description: trackingDescription,
      });
      toast.success('Tracking event added to timeline');
      setShowTrackingForm(false);
      setTrackingLocation('');
      setTrackingDescription('');
      fetchOrderDetail(selectedOrderId);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add tracking');
    }
  };

  return (
    <div className="flex flex-col gap-6 pb-12">
      
      {/* Page Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
          <ShoppingCart className="w-6 h-6 text-orange-500" />
          <span>Order Management & Fulfillment</span>
        </h1>
        <p className="text-xs text-gray-400 mt-1">
          Strict state machine lifecycle, courier tracking publisher, and refund processing
        </p>
      </div>

      {/* Filters & Search */}
      <div className="card p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchOrders()}
            placeholder="Search by Order ID or customer email..."
            className="input-field pl-9 py-2 text-xs w-full"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs text-gray-400 shrink-0 font-semibold flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Status:
          </span>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="input-field text-xs py-1.5 px-3"
          >
            {STATUS_FILTERS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="py-20 flex justify-center">
            <FullPageSpinner />
          </div>
        ) : orders.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-xs">
            No orders found matching status filter "{selectedStatus}".
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-300">
              <thead className="bg-navy-900/80 text-gray-400 font-bold uppercase text-[10px] tracking-wider border-b border-navy-700">
                <tr>
                  <th className="py-3 px-4">Order ID</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4 text-center">Items</th>
                  <th className="py-3 px-4">Total</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-700/60">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-navy-700/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-white">
                      #{o.id.slice(0, 8)}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-white">{o.full_name}</div>
                      <div className="text-[11px] text-gray-400 font-mono">{o.email}</div>
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold">
                      {o.item_count}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-white">
                      {formatPaise(o.total_paise)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-block text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${STATUS_COLORS[o.status] || 'bg-gray-700 text-gray-300'}`}>
                        {o.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-gray-400 text-[11px]">
                      {formatDateTime(o.created_at)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleOpenDetail(o.id)}
                        className="btn-secondary py-1 px-3 text-[11px] inline-flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Detail Drawer */}
      {selectedOrderId && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-2xl bg-navy-800 border-l border-navy-700 h-full overflow-y-auto p-6 flex flex-col gap-6 shadow-2xl relative">
            <button
              onClick={() => setSelectedOrderId(null)}
              className="absolute right-5 top-5 text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            {detailLoading || !orderDetail ? (
              <div className="py-32 flex justify-center">
                <FullPageSpinner />
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="border-b border-navy-700 pb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-gray-400">Order</span>
                    <span className="text-sm font-black font-mono text-white">#{orderDetail.id}</span>
                    <span className={`ml-2 text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${STATUS_COLORS[orderDetail.status]}`}>
                      {orderDetail.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">
                    Placed on {formatDateTime(orderDetail.created_at)}
                  </p>
                </div>

                {/* State Machine Action Controls */}
                <div className="card p-4 bg-navy-900/90 border-orange-500/30 flex flex-col gap-3">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-orange-400" />
                    <span>State Transition Actions</span>
                  </h4>

                  <div className="flex flex-wrap items-center gap-2">
                    {orderDetail.status === 'PAID' && (
                      <>
                        <button
                          onClick={() => handleStatusTransition('PROCESSING')}
                          className="btn-primary text-xs py-1.5 px-3"
                        >
                          Mark Processing
                        </button>
                        <button
                          onClick={handleCancelOrder}
                          className="btn-secondary text-xs py-1.5 px-3 text-red-400 hover:text-red-300"
                        >
                          Cancel & Release Stock
                        </button>
                      </>
                    )}

                    {orderDetail.status === 'PROCESSING' && (
                      <>
                        <button
                          onClick={() => handleStatusTransition('SHIPPED')}
                          className="btn-primary text-xs py-1.5 px-3"
                        >
                          Mark Shipped
                        </button>
                        <button
                          onClick={handleCancelOrder}
                          className="btn-secondary text-xs py-1.5 px-3 text-red-400"
                        >
                          Cancel Order
                        </button>
                      </>
                    )}

                    {orderDetail.status === 'SHIPPED' && (
                      <button
                        onClick={() => handleStatusTransition('OUT_FOR_DELIVERY')}
                        className="btn-primary text-xs py-1.5 px-3"
                      >
                        Mark Out For Delivery
                      </button>
                    )}

                    {orderDetail.status === 'OUT_FOR_DELIVERY' && (
                      <button
                        onClick={() => handleStatusTransition('DELIVERED')}
                        className="btn-primary text-xs py-1.5 px-3 bg-green-600 hover:bg-green-700"
                      >
                        Mark Delivered
                      </button>
                    )}

                    {orderDetail.status === 'REFUND_REQUESTED' && (
                      <button
                        onClick={handleApproveRefund}
                        className="btn-primary text-xs py-1.5 px-3 bg-rose-600 hover:bg-rose-700"
                      >
                        Approve Refund & Restock Items
                      </button>
                    )}

                    {['SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(orderDetail.status) && (
                      <button
                        onClick={() => setShowTrackingForm(!showTrackingForm)}
                        className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1"
                      >
                        <Truck className="w-3.5 h-3.5" />
                        <span>{showTrackingForm ? 'Hide Tracking Form' : 'Publish Tracking Event'}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Add Tracking Form */}
                {showTrackingForm && (
                  <form onSubmit={handleAddTracking} className="card p-4 border-navy-600 flex flex-col gap-3">
                    <h5 className="text-xs font-bold text-white">Publish Courier Milestone</h5>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[11px] text-gray-400">Milestone Status</label>
                        <select
                          value={trackingStatus}
                          onChange={(e) => setTrackingStatus(e.target.value)}
                          className="input-field text-xs w-full mt-1"
                        >
                          <option value="IN_TRANSIT">IN_TRANSIT</option>
                          <option value="ARRIVED_AT_HUB">ARRIVED_AT_HUB</option>
                          <option value="OUT_FOR_DELIVERY">OUT_FOR_DELIVERY</option>
                          <option value="DELIVERED">DELIVERED</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[11px] text-gray-400">Current Location</label>
                        <input
                          type="text"
                          required
                          value={trackingLocation}
                          onChange={(e) => setTrackingLocation(e.target.value)}
                          placeholder="e.g. Bengaluru Central Hub"
                          className="input-field text-xs w-full mt-1"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[11px] text-gray-400">Notes / Milestone Description</label>
                      <input
                        type="text"
                        required
                        value={trackingDescription}
                        onChange={(e) => setTrackingDescription(e.target.value)}
                        placeholder="e.g. Package arrived at local distribution center"
                        className="input-field text-xs w-full mt-1"
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowTrackingForm(false)}
                        className="btn-secondary text-xs"
                      >
                        Cancel
                      </button>
                      <button type="submit" className="btn-primary text-xs">
                        Publish Event
                      </button>
                    </div>
                  </form>
                )}

                {/* Items Snapshot */}
                <div>
                  <h4 className="text-xs font-bold text-white mb-2 uppercase tracking-wider">
                    Purchased Item Snapshots
                  </h4>
                  <div className="card divide-y divide-navy-700/60 p-3">
                    {orderDetail.items?.map((item: any) => (
                      <div key={item.id} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between text-xs">
                        <div>
                          <p className="font-semibold text-white">{item.product_name}</p>
                          <p className="text-[11px] text-gray-400">SKU: {item.sku || 'N/A'} | Qty: {item.quantity}</p>
                        </div>
                        <span className="font-mono font-bold text-white">
                          {formatPaise(item.total_price_paise)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Shipping & Customer Info */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="card p-3">
                    <h5 className="font-bold text-gray-400 mb-1.5 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-orange-400" />
                      <span>Customer</span>
                    </h5>
                    <p className="font-semibold text-white">{orderDetail.full_name}</p>
                    <p className="text-gray-400 font-mono">{orderDetail.email}</p>
                  </div>

                  <div className="card p-3">
                    <h5 className="font-bold text-gray-400 mb-1.5 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-orange-400" />
                      <span>Shipping Address</span>
                    </h5>
                    <p className="text-gray-200">{orderDetail.shipping_name}</p>
                    <p className="text-gray-400 text-[11px]">{orderDetail.line1}, {orderDetail.city}</p>
                    <p className="text-gray-400 text-[11px]">{orderDetail.state} - {orderDetail.pincode}</p>
                  </div>
                </div>

                {/* Tracking Stepper Timeline */}
                <div>
                  <h4 className="text-xs font-bold text-white mb-2 uppercase tracking-wider flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-orange-400" />
                    <span>Courier Tracking Timeline</span>
                  </h4>
                  <div className="card p-4 flex flex-col gap-3">
                    {orderDetail.tracking?.length === 0 ? (
                      <p className="text-xs text-gray-400 text-center py-2">No tracking events recorded yet.</p>
                    ) : (
                      orderDetail.tracking?.map((ev: any, idx: number) => (
                        <div key={ev.id} className="flex items-start gap-3 text-xs">
                          <div className="w-2.5 h-2.5 rounded-full bg-orange-500 mt-1 shrink-0 ring-4 ring-orange-500/20" />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-white">{ev.status}</span>
                              <span className="text-[10px] text-gray-500 font-mono">{formatDateTime(ev.created_at)}</span>
                            </div>
                            <p className="text-gray-300 text-[11px] mt-0.5">{ev.description}</p>
                            {ev.location && <p className="text-gray-500 text-[10px]">📍 {ev.location}</p>}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Audit Log Trail */}
                <div>
                  <h4 className="text-xs font-bold text-white mb-2 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-blue-400" />
                    <span>Immutable Audit Log</span>
                  </h4>
                  <div className="card p-3 divide-y divide-navy-700/60 font-mono text-[11px] text-gray-400">
                    {orderDetail.audit?.map((a: any) => (
                      <div key={a.id} className="py-2 first:pt-0 last:pb-0 flex items-center justify-between">
                        <div>
                          <span className="font-bold text-white">{a.action}</span>
                          <span className="text-gray-500 ml-2">by {a.actor_email || 'System'}</span>
                        </div>
                        <span className="text-gray-500 text-[10px]">{formatDateTime(a.created_at)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
