import React, { useState, useEffect, useRef } from 'react';
import {
  ShoppingCart,
  Search,
  CheckCircle2,
  Clock,
  Truck,
  XCircle,
  AlertCircle,
  RotateCcw,
  Eye,
  X,
  User,
  MapPin,
  MoreVertical,
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

const STATUS_LABEL: Record<string, string> = {
  PENDING_PAYMENT: 'Pending payment',
  PAID: 'Paid',
  PROCESSING: 'Processing',
  SHIPPED: 'Shipped',
  OUT_FOR_DELIVERY: 'Out for delivery',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
  REFUND_REQUESTED: 'Refund requested',
  REFUNDED: 'Refunded',
};

function statusBadgeClass(status: string): string {
  const map: Record<string, string> = {
    PENDING_PAYMENT:  'adm-badge adm-badge-warning',
    PAID:             'adm-badge adm-badge-info',
    PROCESSING:       'adm-badge adm-badge-info',
    SHIPPED:          'adm-badge adm-badge-neutral',
    OUT_FOR_DELIVERY: 'adm-badge adm-badge-accent',
    DELIVERED:        'adm-badge adm-badge-success',
    CANCELLED:        'adm-badge adm-badge-danger',
    REFUND_REQUESTED: 'adm-badge adm-badge-danger',
    REFUNDED:         'adm-badge adm-badge-neutral',
  };
  return map[status] || 'adm-badge adm-badge-neutral';
}

function KebabMenu({ order, onView, onCancel }: { order: AdminOrderSummary; onView: () => void; onCancel: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="p-1.5 rounded-lg transition-colors"
        style={{ color: 'var(--adm-text-2)' }}
        aria-label="Order actions"
        aria-haspopup="true"
        aria-expanded={open}
      >
        <MoreVertical className="w-4 h-4" />
      </button>
      {open && (
        <div
          className="absolute right-0 top-full mt-1 w-40 rounded-lg shadow-xl z-20 py-1"
          style={{ background: 'var(--adm-raised)', border: '1px solid var(--adm-border)' }}
          role="menu"
        >
          <button
            onClick={() => { onView(); setOpen(false); }}
            className="w-full px-3 py-2 text-left text-xs font-medium flex items-center gap-2 hover:bg-[var(--adm-surface)] transition-colors"
            style={{ color: 'var(--adm-text-1)' }}
            role="menuitem"
          >
            <Eye className="w-3.5 h-3.5" style={{ color: 'var(--adm-accent)' }} />
            View details
          </button>
          {['PAID', 'PROCESSING'].includes(order.status) && (
            <button
              onClick={() => { onCancel(); setOpen(false); }}
              className="w-full px-3 py-2 text-left text-xs font-medium flex items-center gap-2 hover:bg-[var(--adm-surface)] transition-colors"
              style={{ color: 'var(--adm-danger)' }}
              role="menuitem"
            >
              <XCircle className="w-3.5 h-3.5" />
              Cancel order
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function AdminOrders() {
  const [orders, setOrders] = useState<AdminOrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [search, setSearch] = useState('');

  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [orderDetail, setOrderDetail] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);

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

  useEffect(() => { fetchOrders(); }, [selectedStatus]);

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
      toast.success(`Order updated to ${STATUS_LABEL[toStatus] || toStatus}`);
      fetchOrderDetail(selectedOrderId);
      fetchOrders();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Update rejected');
    }
  };

  const handleCancelOrder = async (id?: string) => {
    const oid = id || selectedOrderId;
    if (!oid) return;
    const reason = prompt('Reason for cancellation (stock will be released):');
    if (!reason) return;
    try {
      await api.post(`/admin/orders/${oid}/cancel`, { reason });
      toast.success('Order cancelled and stock released');
      if (selectedOrderId === oid) fetchOrderDetail(oid);
      fetchOrders();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Cancellation failed');
    }
  };

  const handleApproveRefund = async () => {
    if (!selectedOrderId) return;
    if (!confirm('Approve refund? This will return stock and mark the order as refunded.')) return;
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
      toast.success('Tracking event added');
      setShowTrackingForm(false);
      setTrackingLocation('');
      setTrackingDescription('');
      fetchOrderDetail(selectedOrderId);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add tracking');
    }
  };

  // Close drawer on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setSelectedOrderId(null); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const statusCounts = orders.reduce((acc: Record<string, number>, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="flex flex-col gap-5 pb-10">

      {/* Page header */}
      <div>
        <h1 className="text-xl font-bold" style={{ color: 'var(--adm-text-1)' }}>Orders</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--adm-text-2)' }}>
          Manage and fulfil customer orders
        </p>
      </div>

      {/* Filters */}
      <div
        className="adm-card p-4 flex flex-col sm:flex-row items-center gap-3"
      >
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--adm-text-3)' }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchOrders()}
            placeholder="Order ID or customer email..."
            className="adm-input pl-8 py-2 text-xs"
            aria-label="Search orders"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="adm-select text-xs py-2 px-3 rounded-lg"
            aria-label="Filter by status"
          >
            {STATUS_FILTERS.map((s) => (
              <option key={s} value={s}>
                {s === 'ALL' ? 'All statuses' : (STATUS_LABEL[s] || s)}
                {s !== 'ALL' && statusCounts[s] ? ` (${statusCounts[s]})` : ''}
              </option>
            ))}
          </select>
          <button
            onClick={fetchOrders}
            className="px-3 py-2 rounded-lg text-xs font-semibold transition-colors"
            style={{ background: 'var(--adm-accent)', color: '#fff' }}
          >
            Search
          </button>
        </div>
      </div>

      {/* Orders table */}
      <div className="adm-card overflow-hidden">
        {loading ? (
          <div className="py-20 flex justify-center"><FullPageSpinner /></div>
        ) : orders.length === 0 ? (
          <div className="py-16 text-center">
            <ShoppingCart className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--adm-text-3)' }} />
            <p className="text-sm" style={{ color: 'var(--adm-text-2)' }}>No orders found</p>
            <p className="text-xs mt-1" style={{ color: 'var(--adm-text-3)' }}>
              {selectedStatus !== 'ALL' ? `No "${STATUS_LABEL[selectedStatus] || selectedStatus}" orders` : 'No orders placed yet'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th className="num">Items</th>
                  <th className="num">Total</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th style={{ width: 48 }} />
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td>
                      <span className="adm-mono font-semibold" style={{ color: 'var(--adm-text-1)' }}>
                        #{o.id.slice(0, 8)}
                      </span>
                    </td>
                    <td>
                      <div className="font-medium text-xs" style={{ color: 'var(--adm-text-1)' }}>{o.full_name}</div>
                      <div className="text-[11px]" style={{ color: 'var(--adm-text-3)' }}>{o.email}</div>
                    </td>
                    <td className="num">
                      {o.item_count > 0 ? (
                        <span className="font-semibold">{o.item_count}</span>
                      ) : (
                        <span
                          title="No items recorded for this order"
                          style={{ color: 'var(--adm-text-3)' }}
                        >
                          &mdash;
                        </span>
                      )}
                    </td>
                    <td className="num font-semibold">{formatPaise(o.total_paise)}</td>
                    <td>
                      <span className={statusBadgeClass(o.status)}>
                        {STATUS_LABEL[o.status] || o.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td style={{ color: 'var(--adm-text-3)' }} className="text-xs">
                      {formatDateTime(o.created_at)}
                    </td>
                    <td>
                      <KebabMenu
                        order={o}
                        onView={() => handleOpenDetail(o.id)}
                        onCancel={() => handleCancelOrder(o.id)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order detail drawer */}
      {selectedOrderId && (
        <div
          className="fixed inset-0 z-50 flex justify-end"
          style={{ background: 'rgba(0,0,0,0.6)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setSelectedOrderId(null); }}
          role="dialog"
          aria-modal="true"
          aria-label="Order details"
        >
          <div
            className="w-full max-w-2xl h-full overflow-y-auto flex flex-col gap-5 p-6 relative"
            style={{ background: 'var(--adm-surface)', borderLeft: '1px solid var(--adm-border)' }}
          >
            <button
              onClick={() => setSelectedOrderId(null)}
              aria-label="Close order details"
              className="absolute right-5 top-5 p-1.5 rounded-lg transition-colors"
              style={{ color: 'var(--adm-text-2)' }}
            >
              <X className="w-5 h-5" />
            </button>

            {detailLoading || !orderDetail ? (
              <div className="py-32 flex justify-center"><FullPageSpinner /></div>
            ) : (
              <>
                {/* Header */}
                <div style={{ borderBottom: '1px solid var(--adm-border)' }} className="pb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="adm-mono text-xs" style={{ color: 'var(--adm-text-3)' }}>Order</span>
                    <span className="adm-mono font-bold text-sm" style={{ color: 'var(--adm-text-1)' }}>
                      #{orderDetail.id}
                    </span>
                    <span className={statusBadgeClass(orderDetail.status)}>
                      {STATUS_LABEL[orderDetail.status] || orderDetail.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <p className="text-xs" style={{ color: 'var(--adm-text-3)' }}>
                    Placed {formatDateTime(orderDetail.created_at)}
                  </p>
                </div>

                {/* Actions */}
                <div
                  className="adm-card p-4 flex flex-col gap-3"
                  style={{ borderColor: 'var(--adm-accent)', borderLeftWidth: 3 }}
                >
                  <h4 className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--adm-text-2)' }}>
                    Actions
                  </h4>
                  <div className="flex flex-wrap items-center gap-2">
                    {orderDetail.status === 'PAID' && (
                      <>
                        <button
                          onClick={() => handleStatusTransition('PROCESSING')}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-colors"
                          style={{ background: 'var(--adm-accent)' }}
                        >
                          Mark processing
                        </button>
                        <button
                          onClick={() => handleCancelOrder()}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                          style={{ color: 'var(--adm-danger)', background: 'rgba(239,68,68,0.1)' }}
                        >
                          Cancel &amp; release stock
                        </button>
                      </>
                    )}
                    {orderDetail.status === 'PROCESSING' && (
                      <>
                        <button
                          onClick={() => handleStatusTransition('SHIPPED')}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-colors"
                          style={{ background: 'var(--adm-accent)' }}
                        >
                          Mark shipped
                        </button>
                        <button
                          onClick={() => handleCancelOrder()}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                          style={{ color: 'var(--adm-danger)', background: 'rgba(239,68,68,0.1)' }}
                        >
                          Cancel order
                        </button>
                      </>
                    )}
                    {orderDetail.status === 'SHIPPED' && (
                      <button
                        onClick={() => handleStatusTransition('OUT_FOR_DELIVERY')}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-colors"
                        style={{ background: 'var(--adm-accent)' }}
                      >
                        Mark out for delivery
                      </button>
                    )}
                    {orderDetail.status === 'OUT_FOR_DELIVERY' && (
                      <button
                        onClick={() => handleStatusTransition('DELIVERED')}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-colors"
                        style={{ background: 'var(--adm-success)' }}
                      >
                        Mark delivered
                      </button>
                    )}
                    {orderDetail.status === 'REFUND_REQUESTED' && (
                      <button
                        onClick={handleApproveRefund}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-colors"
                        style={{ background: '#be185d' }}
                      >
                        Approve refund &amp; restock
                      </button>
                    )}
                    {['SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(orderDetail.status) && (
                      <button
                        onClick={() => setShowTrackingForm(!showTrackingForm)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                        style={{
                          color: 'var(--adm-text-1)',
                          background: 'var(--adm-raised)',
                          border: '1px solid var(--adm-border)',
                        }}
                      >
                        <Truck className="w-3.5 h-3.5" />
                        {showTrackingForm ? 'Hide tracking form' : 'Add tracking event'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Tracking form */}
                {showTrackingForm && (
                  <form
                    onSubmit={handleAddTracking}
                    className="adm-card p-4 flex flex-col gap-3"
                    aria-label="Add tracking event"
                  >
                    <h5 className="text-xs font-semibold" style={{ color: 'var(--adm-text-1)' }}>Add tracking event</h5>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs mb-1 block" style={{ color: 'var(--adm-text-2)' }}>
                          Status
                        </label>
                        <select
                          value={trackingStatus}
                          onChange={(e) => setTrackingStatus(e.target.value)}
                          className="adm-select text-xs"
                        >
                          <option value="IN_TRANSIT">In transit</option>
                          <option value="ARRIVED_AT_HUB">Arrived at hub</option>
                          <option value="OUT_FOR_DELIVERY">Out for delivery</option>
                          <option value="DELIVERED">Delivered</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs mb-1 block" style={{ color: 'var(--adm-text-2)' }}>
                          Location
                        </label>
                        <input
                          type="text"
                          required
                          value={trackingLocation}
                          onChange={(e) => setTrackingLocation(e.target.value)}
                          placeholder="e.g. Bengaluru hub"
                          className="adm-input text-xs"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs mb-1 block" style={{ color: 'var(--adm-text-2)' }}>
                        Description
                      </label>
                      <input
                        type="text"
                        required
                        value={trackingDescription}
                        onChange={(e) => setTrackingDescription(e.target.value)}
                        placeholder="e.g. Package arrived at local hub"
                        className="adm-input text-xs"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setShowTrackingForm(false)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                        style={{ color: 'var(--adm-text-2)', background: 'var(--adm-raised)', border: '1px solid var(--adm-border)' }}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-colors"
                        style={{ background: 'var(--adm-accent)' }}
                      >
                        Save event
                      </button>
                    </div>
                  </form>
                )}

                {/* Items */}
                <div>
                  <h4 className="text-xs font-semibold mb-2" style={{ color: 'var(--adm-text-2)' }}>
                    Items ordered
                  </h4>
                  <div className="adm-card divide-y" style={{ borderColor: 'var(--adm-border)' }}>
                    {orderDetail.items?.length === 0 ? (
                      <p className="p-4 text-xs text-center" style={{ color: 'var(--adm-text-3)' }}>
                        No items recorded for this order.
                      </p>
                    ) : (
                      orderDetail.items?.map((item: any) => (
                        <div key={item.id} className="px-4 py-3 flex items-center justify-between text-xs">
                          <div>
                            <p className="font-medium" style={{ color: 'var(--adm-text-1)' }}>{item.product_name}</p>
                            <p className="adm-mono text-[11px]" style={{ color: 'var(--adm-text-3)' }}>
                              SKU: {item.sku || 'N/A'} &bull; Qty: {item.quantity}
                            </p>
                          </div>
                          <span className="font-semibold" style={{ color: 'var(--adm-text-1)' }}>
                            {formatPaise(item.total_price_paise)}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Customer + address */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="adm-card p-3">
                    <h5 className="font-semibold mb-1.5 flex items-center gap-1.5" style={{ color: 'var(--adm-text-2)' }}>
                      <User className="w-3.5 h-3.5" style={{ color: 'var(--adm-accent)' }} />
                      Customer
                    </h5>
                    <p className="font-medium" style={{ color: 'var(--adm-text-1)' }}>{orderDetail.full_name}</p>
                    <p style={{ color: 'var(--adm-text-3)' }}>{orderDetail.email}</p>
                  </div>
                  <div className="adm-card p-3">
                    <h5 className="font-semibold mb-1.5 flex items-center gap-1.5" style={{ color: 'var(--adm-text-2)' }}>
                      <MapPin className="w-3.5 h-3.5" style={{ color: 'var(--adm-accent)' }} />
                      Shipping address
                    </h5>
                    <p className="font-medium" style={{ color: 'var(--adm-text-1)' }}>{orderDetail.shipping_name}</p>
                    <p style={{ color: 'var(--adm-text-3)' }}>{orderDetail.line1}, {orderDetail.city}</p>
                    <p style={{ color: 'var(--adm-text-3)' }}>{orderDetail.state} &mdash; {orderDetail.pincode}</p>
                  </div>
                </div>

                {/* Tracking timeline */}
                <div>
                  <h4 className="text-xs font-semibold mb-2 flex items-center gap-1.5" style={{ color: 'var(--adm-text-2)' }}>
                    <Truck className="w-3.5 h-3.5" style={{ color: 'var(--adm-accent)' }} />
                    Tracking history
                  </h4>
                  <div className="adm-card p-4 flex flex-col gap-3">
                    {!orderDetail.tracking || orderDetail.tracking.length === 0 ? (
                      <p className="text-xs text-center" style={{ color: 'var(--adm-text-3)' }}>
                        No tracking events recorded yet.
                      </p>
                    ) : (
                      orderDetail.tracking.map((ev: any) => (
                        <div key={ev.id} className="flex items-start gap-3 text-xs">
                          <div
                            className="w-2.5 h-2.5 rounded-full mt-1 shrink-0"
                            style={{ background: 'var(--adm-accent)', boxShadow: '0 0 0 3px rgba(234,88,12,0.2)' }}
                          />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold" style={{ color: 'var(--adm-text-1)' }}>
                                {ev.status.replace(/_/g, ' ')}
                              </span>
                              <span className="adm-mono text-[10px]" style={{ color: 'var(--adm-text-3)' }}>
                                {formatDateTime(ev.created_at)}
                              </span>
                            </div>
                            <p className="mt-0.5" style={{ color: 'var(--adm-text-2)' }}>{ev.description}</p>
                            {ev.location && (
                              <p className="mt-0.5 flex items-center gap-1 text-[11px]" style={{ color: 'var(--adm-text-3)' }}>
                                <MapPin className="w-2.5 h-2.5" />
                                {ev.location}
                              </p>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Audit log */}
                <div>
                  <h4 className="text-xs font-semibold mb-2 flex items-center gap-1.5" style={{ color: 'var(--adm-text-2)' }}>
                    <Clock className="w-3.5 h-3.5" style={{ color: 'var(--adm-info)' }} />
                    Audit log
                  </h4>
                  <div className="adm-card p-3 flex flex-col divide-y" style={{ borderColor: 'var(--adm-border)' }}>
                    {orderDetail.audit?.map((a: any) => (
                      <div key={a.id} className="py-2 first:pt-0 last:pb-0 flex items-center justify-between text-xs">
                        <div>
                          <span className="adm-mono font-semibold" style={{ color: 'var(--adm-text-1)' }}>{a.action}</span>
                          <span className="ml-2" style={{ color: 'var(--adm-text-3)' }}>
                            by {a.actor_email || 'System'}
                          </span>
                        </div>
                        <span className="adm-mono text-[10px]" style={{ color: 'var(--adm-text-3)' }}>
                          {formatDateTime(a.created_at)}
                        </span>
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
