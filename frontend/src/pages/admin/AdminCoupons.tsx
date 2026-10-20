import React, { useState, useEffect } from 'react';
import { 
  Ticket, 
  Plus, 
  Trash2, 
  Check, 
  X, 
  AlertCircle, 
  Calendar, 
  DollarSign, 
  Percent, 
  Layers 
} from 'lucide-react';
import api from '../../lib/api';
import { formatPaise, formatDateTime } from '../../lib/utils';
import { FullPageSpinner } from '../../components/ui/Spinner';
import toast from 'react-hot-toast';

interface Coupon {
  id: string;
  code: string;
  type: 'percent' | 'flat';
  value_paise: number;
  min_order_paise: number;
  max_discount_paise: number | null;
  usage_limit: number | null;
  per_user_limit: number;
  valid_from: string;
  valid_until: string | null;
  is_active: boolean;
  created_at: string;
  redemption_count: number;
}

export function AdminCoupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [code, setCode] = useState('');
  const [type, setType] = useState<'percent' | 'flat'>('percent');
  const [valueInput, setValueInput] = useState('10'); // 10% or ₹100
  const [minOrderInput, setMinOrderInput] = useState('500'); // ₹500
  const [maxDiscountInput, setMaxDiscountInput] = useState('500'); // ₹500
  const [usageLimit, setUsageLimit] = useState('');
  const [perUserLimit, setPerUserLimit] = useState('1');
  const [submitting, setSubmitting] = useState(false);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/coupons');
      setCoupons(res.data.coupons);
    } catch {
      toast.error('Failed to load coupons');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      toast.error('Coupon code is required');
      return;
    }

    // Convert values to paise
    const val = parseFloat(valueInput);
    if (isNaN(val) || val <= 0) {
      toast.error('Please enter a valid coupon discount value');
      return;
    }

    const value_paise = type === 'percent' ? Math.round(val * 100) : Math.round(val * 100);
    const min_order_paise = Math.round((parseFloat(minOrderInput) || 0) * 100);
    const max_discount_paise = maxDiscountInput ? Math.round(parseFloat(maxDiscountInput) * 100) : null;

    try {
      setSubmitting(true);
      await api.post('/admin/coupons', {
        code: code.trim().toUpperCase(),
        type,
        value_paise,
        min_order_paise,
        max_discount_paise,
        usage_limit: usageLimit ? parseInt(usageLimit, 10) : null,
        per_user_limit: parseInt(perUserLimit, 10) || 1,
        is_active: true,
      });

      toast.success(`Coupon ${code.toUpperCase()} created successfully!`);
      setShowModal(false);
      setCode('');
      fetchCoupons();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create coupon');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivate = async (id: string, codeName: string) => {
    if (!confirm(`Are you sure you want to deactivate coupon ${codeName}?`)) return;
    try {
      await api.delete(`/admin/coupons/${id}`);
      toast.success(`Coupon ${codeName} deactivated`);
      fetchCoupons();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to deactivate coupon');
    }
  };

  return (
    <div className="flex flex-col gap-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Ticket className="w-6 h-6 text-orange-500" />
            <span>Coupons & Promotion Engine</span>
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Configure percentage and flat discount vouchers with strict server-side validation
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="btn-primary text-xs flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Create Coupon</span>
        </button>
      </div>

      {/* Coupons Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="py-20 flex justify-center">
            <FullPageSpinner />
          </div>
        ) : coupons.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-xs">
            No discount coupons found. Click "Create Coupon" to add promotional codes.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-300">
              <thead className="bg-navy-900/80 text-gray-400 font-bold uppercase text-[10px] tracking-wider border-b border-navy-700">
                <tr>
                  <th className="py-3 px-4">Coupon Code</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Discount</th>
                  <th className="py-3 px-4">Min Order</th>
                  <th className="py-3 px-4">Max Discount</th>
                  <th className="py-3 px-4 text-center">Redemptions</th>
                  <th className="py-3 px-4 text-center">Per User</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-700/60">
                {coupons.map((c) => (
                  <tr key={c.id} className="hover:bg-navy-700/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-black text-white text-sm">
                      <span className="bg-navy-900 px-2.5 py-1 rounded-lg border border-navy-700 text-orange-400">
                        {c.code}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold uppercase text-[11px] text-gray-300">
                      {c.type}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-white font-mono">
                      {c.type === 'percent' ? `${c.value_paise / 100}%` : formatPaise(c.value_paise)}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-gray-300">
                      {formatPaise(c.min_order_paise)}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-gray-300">
                      {c.max_discount_paise ? formatPaise(c.max_discount_paise) : 'No Cap'}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono">
                      <span className="font-bold text-white">{c.redemption_count || 0}</span>
                      {c.usage_limit && <span className="text-gray-500"> / {c.usage_limit}</span>}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-gray-400">
                      {c.per_user_limit}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {c.is_active ? (
                        <span className="text-[10px] font-bold text-green-400 bg-green-500/10 border border-green-500/30 px-2.5 py-0.5 rounded-full">
                          Active
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-red-400 bg-red-500/10 border border-red-500/30 px-2.5 py-0.5 rounded-full">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {c.is_active && (
                        <button
                          onClick={() => handleDeactivate(c.id, c.code)}
                          className="btn-secondary py-1 px-2.5 text-[11px] text-red-400 hover:text-red-300"
                        >
                          Deactivate
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Coupon Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="card w-full max-w-lg p-6 border-navy-600 shadow-2xl relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-white mb-1">
              Create New Promotion Coupon
            </h3>
            <p className="text-xs text-gray-400 mb-4">
              Coupons apply to customer subtotals and respect minimum spend requirements
            </p>

            <form onSubmit={handleCreateCoupon} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Coupon Code
                  </label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="e.g. SUMMER25"
                    className="input-field text-xs w-full uppercase font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Discount Type
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="input-field text-xs w-full"
                  >
                    <option value="percent">Percentage (%)</option>
                    <option value="flat">Flat Amount (₹)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Discount Value {type === 'percent' ? '(%)' : '(₹)'}
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={valueInput}
                    onChange={(e) => setValueInput(e.target.value)}
                    placeholder={type === 'percent' ? '10' : '100'}
                    className="input-field text-xs w-full"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Min Order Value (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={minOrderInput}
                    onChange={(e) => setMinOrderInput(e.target.value)}
                    placeholder="500"
                    className="input-field text-xs w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Max Discount Cap (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={maxDiscountInput}
                    onChange={(e) => setMaxDiscountInput(e.target.value)}
                    placeholder="Leave empty for no cap"
                    className="input-field text-xs w-full"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Per User Limit
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={perUserLimit}
                    onChange={(e) => setPerUserLimit(e.target.value)}
                    placeholder="1"
                    className="input-field text-xs w-full"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Total Global Usage Limit (Optional)
                </label>
                <input
                  type="number"
                  min="1"
                  value={usageLimit}
                  onChange={(e) => setUsageLimit(e.target.value)}
                  placeholder="e.g. 500 total redemptions"
                  className="input-field text-xs w-full"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary text-xs"
                >
                  {submitting ? 'Creating Coupon...' : 'Create & Activate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
