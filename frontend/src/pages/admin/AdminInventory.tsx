import React, { useState, useEffect } from 'react';
import { 
  Boxes, 
  Search, 
  Filter, 
  ArrowUpDown, 
  AlertTriangle, 
  PlusCircle, 
  History, 
  Check, 
  Edit3, 
  X, 
  TrendingDown, 
  Clock, 
  User, 
  RefreshCw 
} from 'lucide-react';
import api from '../../lib/api';
import { formatPaise, formatDateTime } from '../../lib/utils';
import { FullPageSpinner } from '../../components/ui/Spinner';
import toast from 'react-hot-toast';

interface InventoryItem {
  id: string;
  sku: string;
  variant_name: string;
  stock_qty: number;
  reserved_qty: number;
  reorder_threshold: number;
  price_adjustment_paise: number;
  updated_at: string;
  product_id: string;
  product_name: string;
  price_paise: number;
  category_name: string;
  is_low_stock: boolean;
}

interface Movement {
  id: string;
  type: string;
  quantity_change: number;
  stock_before: number;
  stock_after: number;
  reason: string;
  actor_email?: string;
  created_at: string;
}

export function AdminInventory() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);

  // Adjust stock modal
  const [selectedVariant, setSelectedVariant] = useState<InventoryItem | null>(null);
  const [adjustType, setAdjustType] = useState<'PURCHASE_IN' | 'ADJUSTMENT' | 'RETURN_IN'>('PURCHASE_IN');
  const [adjustQty, setAdjustQty] = useState<string>('10');
  const [adjustReason, setAdjustReason] = useState<string>('');
  const [adjustSubmitting, setAdjustSubmitting] = useState(false);

  // History modal
  const [historyVariant, setHistoryVariant] = useState<InventoryItem | null>(null);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Inline threshold edit
  const [editingThresholdId, setEditingThresholdId] = useState<string | null>(null);
  const [tempThreshold, setTempThreshold] = useState<number>(10);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (lowStockOnly) params.set('low_stock', 'true');

      const res = await api.get(`/admin/inventory?${params.toString()}`);
      setInventory(res.data.inventory);
    } catch {
      toast.error('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [lowStockOnly]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchInventory();
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVariant) return;

    if (!adjustReason || adjustReason.trim().length < 3) {
      toast.error('Please enter a clear reason (minimum 3 characters)');
      return;
    }

    const qty = parseInt(adjustQty, 10);
    if (isNaN(qty) || qty === 0) {
      toast.error('Please specify a valid quantity change');
      return;
    }

    try {
      setAdjustSubmitting(true);
      await api.post(`/admin/inventory/${selectedVariant.id}/adjust`, {
        type: adjustType,
        quantity: qty,
        reason: adjustReason.trim(),
      });
      toast.success(`Stock adjusted for SKU: ${selectedVariant.sku}`);
      setSelectedVariant(null);
      setAdjustReason('');
      fetchInventory();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to adjust stock');
    } finally {
      setAdjustSubmitting(false);
    }
  };

  const openHistory = async (item: InventoryItem) => {
    setHistoryVariant(item);
    setHistoryLoading(true);
    try {
      const res = await api.get(`/admin/inventory/${item.id}/movements`);
      setMovements(res.data.movements);
    } catch {
      toast.error('Failed to load stock movement history');
    } finally {
      setHistoryLoading(false);
    }
  };

  const saveThreshold = async (variantId: string) => {
    try {
      await api.patch(`/admin/inventory/${variantId}/threshold`, {
        reorder_threshold: tempThreshold,
      });
      toast.success('Reorder threshold updated');
      setEditingThresholdId(null);
      fetchInventory();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update threshold');
    }
  };

  const totalSKUs = inventory.length;
  const lowStockCount = inventory.filter(i => i.is_low_stock).length;
  const totalStockUnits = inventory.reduce((acc, i) => acc + i.stock_qty, 0);

  return (
    <div className="flex flex-col gap-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Boxes className="w-6 h-6 text-orange-500" />
            <span>Inventory & Stock Management</span>
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Real-time stock ledger, ACID row-locked adjustments, and reorder threshold monitoring
          </p>
        </div>

        <button
          onClick={fetchInventory}
          className="btn-secondary text-xs flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-navy-700 flex items-center justify-center text-orange-400">
            <Boxes className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total SKUs</span>
            <p className="text-xl font-black text-white">{totalSKUs}</p>
          </div>
        </div>

        <div className="card p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-navy-700 flex items-center justify-center text-blue-400">
            <TrendingDown className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total Units in Stock</span>
            <p className="text-xl font-black text-white">{totalStockUnits.toLocaleString()}</p>
          </div>
        </div>

        <div className="card p-4 flex items-center gap-4 border-amber-500/30">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">Low Stock SKUs</span>
            <p className="text-xl font-black text-amber-400">{lowStockCount}</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by SKU or product name..."
            className="input-field pl-9 py-2 text-xs w-full"
          />
        </form>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-300">
            <input
              type="checkbox"
              checked={lowStockOnly}
              onChange={(e) => setLowStockOnly(e.target.checked)}
              className="rounded bg-navy-700 border-navy-600 text-orange-500 focus:ring-orange-500"
            />
            <span className="flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>Show Low Stock Only</span>
            </span>
          </label>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="py-20 flex justify-center">
            <FullPageSpinner />
          </div>
        ) : inventory.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-xs">
            No inventory records found matching your filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-300">
              <thead className="bg-navy-900/80 text-gray-400 font-bold uppercase text-[10px] tracking-wider border-b border-navy-700">
                <tr>
                  <th className="py-3 px-4">SKU / Variant</th>
                  <th className="py-3 px-4">Product Name</th>
                  <th className="py-3 px-4 text-center">Stock</th>
                  <th className="py-3 px-4 text-center">Reserved</th>
                  <th className="py-3 px-4 text-center">Available</th>
                  <th className="py-3 px-4 text-center">Reorder Level</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-700/60">
                {inventory.map((item) => {
                  const available = Math.max(0, item.stock_qty - item.reserved_qty);
                  return (
                    <tr key={item.id} className="hover:bg-navy-700/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-white">
                        {item.sku}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white truncate max-w-xs">{item.product_name}</div>
                        <div className="text-[11px] text-gray-400">{item.category_name}</div>
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-white">
                        {item.stock_qty}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono text-amber-400">
                        {item.reserved_qty}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-green-400">
                        {available}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {editingThresholdId === item.id ? (
                          <div className="flex items-center justify-center gap-1">
                            <input
                              type="number"
                              min="0"
                              value={tempThreshold}
                              onChange={(e) => setTempThreshold(parseInt(e.target.value, 10) || 0)}
                              className="w-16 input-field py-1 px-1.5 text-center text-xs"
                            />
                            <button
                              onClick={() => saveThreshold(item.id)}
                              className="p-1 rounded bg-green-500/20 text-green-400 hover:bg-green-500/30"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingThresholdId(null)}
                              className="p-1 rounded bg-navy-700 text-gray-400 hover:bg-navy-600"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-1.5 group">
                            <span className="font-mono text-gray-300">{item.reorder_threshold}</span>
                            <button
                              onClick={() => {
                                setEditingThresholdId(item.id);
                                setTempThreshold(item.reorder_threshold);
                              }}
                              className="opacity-0 group-hover:opacity-100 p-0.5 text-gray-400 hover:text-white"
                              title="Edit Reorder Threshold"
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {item.is_low_stock ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Low Stock</span>
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-green-400 bg-green-500/10 border border-green-500/30 px-2 py-0.5 rounded-full">
                            Optimal
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedVariant(item);
                              setAdjustQty('10');
                              setAdjustReason('');
                              setAdjustType('PURCHASE_IN');
                            }}
                            className="btn-primary py-1 px-2.5 text-[11px] flex items-center gap-1"
                          >
                            <PlusCircle className="w-3 h-3" />
                            <span>Adjust</span>
                          </button>
                          <button
                            onClick={() => openHistory(item)}
                            className="btn-secondary py-1 px-2.5 text-[11px] flex items-center gap-1"
                          >
                            <History className="w-3 h-3" />
                            <span>History</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Adjust Stock Modal */}
      {selectedVariant && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="card w-full max-w-md p-6 border-navy-600 shadow-2xl relative">
            <button
              onClick={() => setSelectedVariant(null)}
              className="absolute right-4 top-4 text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-white mb-1">
              Adjust Inventory Stock
            </h3>
            <p className="text-xs text-gray-400 mb-4 font-mono">
              SKU: {selectedVariant.sku} — {selectedVariant.product_name}
            </p>

            <form onSubmit={handleAdjustSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Movement Type
                </label>
                <select
                  value={adjustType}
                  onChange={(e) => setAdjustType(e.target.value as any)}
                  className="input-field text-xs w-full"
                >
                  <option value="PURCHASE_IN">PURCHASE_IN (Inward Procurement)</option>
                  <option value="ADJUSTMENT">ADJUSTMENT (Cycle Count / Correction)</option>
                  <option value="RETURN_IN">RETURN_IN (Customer / Warehouse Return)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Quantity Change
                </label>
                <input
                  type="number"
                  required
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(e.target.value)}
                  className="input-field text-xs w-full"
                  placeholder="e.g. 10 (or -5 for negative adjustment)"
                />
                <span className="text-[11px] text-gray-400 mt-1 block">
                  Current Stock: {selectedVariant.stock_qty} | Available: {Math.max(0, selectedVariant.stock_qty - selectedVariant.reserved_qty)}
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Mandatory Reason / Notes
                </label>
                <textarea
                  required
                  rows={3}
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="e.g. Inward PO #9482 from supplier, physical count discrepancy, damaged box write-off..."
                  className="input-field text-xs w-full resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedVariant(null)}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adjustSubmitting}
                  className="btn-primary text-xs"
                >
                  {adjustSubmitting ? 'Saving Transaction...' : 'Confirm & Write Movement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Movement History Drawer / Modal */}
      {historyVariant && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="card w-full max-w-2xl p-6 border-navy-600 shadow-2xl relative max-h-[85vh] flex flex-col">
            <button
              onClick={() => setHistoryVariant(null)}
              className="absolute right-4 top-4 text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-white mb-1">
              Stock Movement Audit Trail
            </h3>
            <p className="text-xs text-gray-400 mb-4 font-mono">
              SKU: {historyVariant.sku} — {historyVariant.product_name}
            </p>

            <div className="flex-1 overflow-y-auto divide-y divide-navy-700/60 pr-1">
              {historyLoading ? (
                <div className="py-12 flex justify-center">
                  <FullPageSpinner />
                </div>
              ) : movements.length === 0 ? (
                <div className="py-8 text-center text-xs text-gray-400">
                  No historical movements logged for this SKU yet.
                </div>
              ) : (
                movements.map((m) => (
                  <div key={m.id} className="py-3 flex items-start justify-between gap-4 text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white font-mono uppercase bg-navy-900 px-2 py-0.5 rounded border border-navy-700">
                          {m.type}
                        </span>
                        <span className={`font-mono font-black ${m.quantity_change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {m.quantity_change > 0 ? `+${m.quantity_change}` : m.quantity_change} units
                        </span>
                      </div>
                      <p className="text-gray-300 mt-1 text-[11px]">{m.reason}</p>
                      <div className="flex items-center gap-3 text-[10px] text-gray-500 mt-1">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{formatDateTime(m.created_at)}</span>
                        </span>
                        {m.actor_email && (
                          <span className="flex items-center gap-1 font-mono">
                            <User className="w-3 h-3" />
                            <span>{m.actor_email}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right font-mono text-[11px] shrink-0 text-gray-400">
                      <div>Before: <span className="text-white font-bold">{m.stock_before}</span></div>
                      <div>After: <span className="text-white font-bold">{m.stock_after}</span></div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-navy-700 flex justify-end">
              <button
                onClick={() => setHistoryVariant(null)}
                className="btn-secondary text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
