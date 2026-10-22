import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  TrendingUp, 
  ShoppingCart, 
  Users, 
  AlertTriangle, 
  Download, 
  RefreshCw, 
  Calendar, 
  ArrowUpRight, 
  ArrowDownRight, 
  Info, 
  Boxes, 
  Layers 
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  ComposedChart, 
  Bar, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  PieChart, 
  Pie, 
  Cell, 
  Legend 
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import { formatPaise } from '../../lib/utils';
import toast from 'react-hot-toast';

const STATUS_COLORS: Record<string, string> = {
  PAID: '#22c55e',
  PROCESSING: '#3b82f6',
  SHIPPED: '#8b5cf6',
  OUT_FOR_DELIVERY: '#f97316',
  DELIVERED: '#10b981',
  CANCELLED: '#ef4444',
  REFUNDED: '#6b7280',
  PENDING_PAYMENT: '#f59e0b',
};

export function AdminAnalytics() {
  const [period, setPeriod] = useState<'today' | '7d' | '30d' | 'custom'>('7d');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [showCustomPicker, setShowCustomPicker] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-analytics', period, customFrom, customTo],
    queryFn: async () => {
      let url = `/admin/analytics?period=${period}`;
      if (period === 'custom' && customFrom && customTo) {
        url += `&from=${customFrom}&to=${customTo}`;
      }
      const res = await api.get(url);
      return res.data;
    },
    staleTime: 15000,
  });

  const kpis = data?.kpis || {
    total_sales_paise: 0,
    sales_change_percent: 0,
    total_orders: 0,
    orders_change_percent: 0,
    total_customers: 0,
    customers_change_percent: 0,
    low_stock_items: 0,
    low_stock_change_percent: 0,
  };

  const timeSeries = data?.time_series || [];
  const statusDistribution = data?.status_distribution || [];
  const topProducts = data?.top_products || [];
  const lowStockAlerts = data?.low_stock_alerts || [];

  const handleExportCSV = () => {
    if (!timeSeries.length) {
      toast.error('No analytics data available to export');
      return;
    }
    const headers = 'Day,Date,Gross Revenue (Paise),Gross Revenue (INR),Orders Count\n';
    const rows = timeSeries.map((d: any) => `${d.day},${d.label},${d.revenue_paise},${d.revenue_rupees},${d.orders_count}`).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `ShopNest_Analytics_${period}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Analytics CSV report downloaded');
  };

  return (
    <div className="flex flex-col gap-6 max-w-[1600px] mx-auto pb-12">
      
      {/* Top Header & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-white tracking-tight">
              Business Analytics & Sales Engine
            </h1>
            <button
              onClick={() => {
                refetch();
                toast.success('Live analytics aggregates refreshed');
              }}
              title="Refresh database aggregates"
              className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-navy-700 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-orange-400' : ''}`} />
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            Real-time turnover, volume metrics, and inventory exposure bucketed in Asia/Kolkata (UTC+5:30)
          </p>
        </div>

        {/* Filter controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="bg-navy-800 border border-navy-700 rounded-xl p-1 flex items-center gap-1 text-xs font-semibold">
            <button
              onClick={() => { setPeriod('today'); setShowCustomPicker(false); }}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                period === 'today'
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'text-gray-400 hover:text-white hover:bg-navy-700'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => { setPeriod('7d'); setShowCustomPicker(false); }}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                period === '7d'
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'text-gray-400 hover:text-white hover:bg-navy-700'
              }`}
            >
              7 Days
            </button>
            <button
              onClick={() => { setPeriod('30d'); setShowCustomPicker(false); }}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                period === '30d'
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'text-gray-400 hover:text-white hover:bg-navy-700'
              }`}
            >
              30 Days
            </button>
            <button
              onClick={() => { setPeriod('custom'); setShowCustomPicker(!showCustomPicker); }}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all ${
                period === 'custom'
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'text-gray-400 hover:text-white hover:bg-navy-700'
              }`}
            >
              <Calendar className="w-3 h-3" />
              <span>Custom</span>
            </button>
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 bg-navy-800 hover:bg-navy-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl border border-navy-700 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-orange-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Custom Date Pickers Drawer */}
      {showCustomPicker && (
        <div className="card p-4 flex flex-wrap items-center gap-4 bg-navy-800/90 border-navy-700">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-400">From:</span>
            <input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="bg-navy-900 border border-navy-700 rounded-lg px-2.5 py-1 text-white focus:outline-none focus:border-orange-500"
            />
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-400">To:</span>
            <input
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="bg-navy-900 border border-navy-700 rounded-lg px-2.5 py-1 text-white focus:outline-none focus:border-orange-500"
            />
          </div>
          <button
            onClick={() => refetch()}
            className="btn-primary text-xs py-1 px-3"
          >
            Apply Range
          </button>
        </div>
      )}

      {/* 4 Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Sales */}
        <div className="card p-5 flex flex-col justify-between group hover:border-navy-600 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-gray-400">Total Sales</span>
              <div className="relative group/tip cursor-help">
                <Info className="w-3.5 h-3.5 text-gray-400 hover:text-white" />
                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1 hidden group-hover/tip:block w-48 p-2 bg-navy-900 border border-navy-600 text-[11px] text-gray-300 rounded-lg shadow-xl z-20 pointer-events-none">
                  Sum of integer total_paise for verified paid orders in selected period.
                </div>
              </div>
            </div>
            <div className="w-8 h-8 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-3">
            <h3 className="text-2xl font-black text-white tracking-tight font-mono">
              {formatPaise(kpis.total_sales_paise)}
            </h3>
            <div className="flex items-center gap-1.5 mt-1 text-xs">
              {kpis.sales_change_percent >= 0 ? (
                <span className="flex items-center font-bold text-green-400">
                  <ArrowUpRight className="w-3 h-3" />
                  +{kpis.sales_change_percent}%
                </span>
              ) : (
                <span className="flex items-center font-bold text-red-400">
                  <ArrowDownRight className="w-3 h-3" />
                  {kpis.sales_change_percent}%
                </span>
              )}
              <span className="text-gray-400">vs previous period</span>
            </div>
          </div>
        </div>

        {/* Total Orders */}
        <div className="card p-5 flex flex-col justify-between group hover:border-navy-600 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-gray-400">Total Orders</span>
              <div className="relative group/tip cursor-help">
                <Info className="w-3.5 h-3.5 text-gray-400 hover:text-white" />
                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1 hidden group-hover/tip:block w-48 p-2 bg-navy-900 border border-navy-600 text-[11px] text-gray-300 rounded-lg shadow-xl z-20 pointer-events-none">
                  Total non-pending customer checkouts created within time bucket.
                </div>
              </div>
            </div>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-3">
            <h3 className="text-2xl font-black text-white tracking-tight font-mono">
              {kpis.total_orders}
            </h3>
            <div className="flex items-center gap-1.5 mt-1 text-xs">
              {kpis.orders_change_percent >= 0 ? (
                <span className="flex items-center font-bold text-green-400">
                  <ArrowUpRight className="w-3 h-3" />
                  +{kpis.orders_change_percent}%
                </span>
              ) : (
                <span className="flex items-center font-bold text-red-400">
                  <ArrowDownRight className="w-3 h-3" />
                  {kpis.orders_change_percent}%
                </span>
              )}
              <span className="text-gray-400">vs previous period</span>
            </div>
          </div>
        </div>

        {/* Total Customers */}
        <div className="card p-5 flex flex-col justify-between group hover:border-navy-600 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-gray-400">Total Customers</span>
              <div className="relative group/tip cursor-help">
                <Info className="w-3.5 h-3.5 text-gray-400 hover:text-white" />
                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1 hidden group-hover/tip:block w-48 p-2 bg-navy-900 border border-navy-600 text-[11px] text-gray-300 rounded-lg shadow-xl z-20 pointer-events-none">
                  Total active customer accounts registered in PostgreSQL database.
                </div>
              </div>
            </div>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-3">
            <h3 className="text-2xl font-black text-white tracking-tight font-mono">
              {kpis.total_customers}
            </h3>
            <div className="flex items-center gap-1.5 mt-1 text-xs">
              <span className="flex items-center font-bold text-green-400">
                <ArrowUpRight className="w-3 h-3" />
                +{kpis.customers_change_percent}%
              </span>
              <span className="text-gray-400">vs previous period</span>
            </div>
          </div>
        </div>

        {/* Low Stock Items */}
        <div className="card p-5 flex flex-col justify-between group hover:border-navy-600 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-gray-400">Low Stock Items</span>
              <div className="relative group/tip cursor-help">
                <Info className="w-3.5 h-3.5 text-gray-400 hover:text-white" />
                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1 hidden group-hover/tip:block w-48 p-2 bg-navy-900 border border-navy-600 text-[11px] text-gray-300 rounded-lg shadow-xl z-20 pointer-events-none">
                  Count of SKU variants where stock_qty is less than or equal to reorder_threshold.
                </div>
              </div>
            </div>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-3">
            <h3 className="text-2xl font-black text-white tracking-tight font-mono">
              {kpis.low_stock_items}
            </h3>
            <div className="flex items-center gap-1.5 mt-1 text-xs">
              <span className="text-amber-400 font-semibold">Immediate reorder required</span>
            </div>
          </div>
        </div>

      </div>

      {/* Charts Row: Sales & Orders Combo + Order Status Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Sales & Orders Combo Chart */}
        <div className="lg:col-span-2 card p-5 flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-navy-600/60 mb-4">
            <div>
              <h3 className="font-bold text-white text-sm">
                Sales Revenue & Order Volume
              </h3>
              <p className="text-[11px] text-gray-400">
                Daily bar (₹ Turnover) paired with order volume line
              </p>
            </div>
            <span className="text-xs font-mono text-orange-400 bg-orange-500/10 px-2.5 py-0.5 rounded-full border border-orange-500/20 font-bold">
              Asia/Kolkata
            </span>
          </div>

          <div className="h-72 w-full pt-2">
            {timeSeries.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-gray-400">
                No orders recorded during this timeframe. Place a checkout to view live chart data!
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={timeSeries}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                  <XAxis dataKey="label" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis yAxisId="left" stroke="#64748b" fontSize={11} tickLine={false} tickFormatter={(v) => `₹${v.toLocaleString()}`} />
                  <YAxis yAxisId="right" orientation="right" stroke="#38bdf8" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '0.75rem',
                      fontSize: '12px',
                    }}
                    formatter={(value: any, name: any) => {
                      if (name === 'Daily Revenue') return [`₹${Number(value).toLocaleString()}`, name];
                      return [value, name];
                    }}
                  />
                  <Bar yAxisId="left" dataKey="revenue_rupees" name="Daily Revenue" fill="#f97316" radius={[4, 4, 0, 0]} barSize={28} />
                  <Line yAxisId="right" type="monotone" dataKey="orders_count" name="Orders Count" stroke="#38bdf8" strokeWidth={2.5} dot={{ r: 4 }} />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Order Status Donut */}
        <div className="card p-5 flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-navy-600/60 mb-2">
            <h3 className="font-bold text-white text-sm">
              Order Fulfillment Breakdown
            </h3>
            <span className="text-[11px] text-gray-400 font-mono">Status Distribution</span>
          </div>

          <div className="h-64 w-full">
            {statusDistribution.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-gray-400">
                No status events recorded
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {statusDistribution.map((entry: any) => (
                      <Cell key={entry.status} fill={STATUS_COLORS[entry.status] || '#64748b'} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '0.75rem',
                      fontSize: '12px',
                    }}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36} 
                    iconSize={8}
                    formatter={(val) => <span className="text-[11px] text-gray-300">{val}</span>} 
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </div>

      {/* Bottom Grid: Top Selling Products & Low Stock Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Top Selling Products */}
        <div className="card p-5 flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-navy-600/60 mb-3">
            <div className="flex items-center gap-2">
              <Boxes className="w-4 h-4 text-orange-400" />
              <h3 className="font-bold text-white text-sm">Top Selling Products</h3>
            </div>
            <span className="text-[11px] text-gray-400 font-mono">By Units Sold</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-gray-400 border-b border-navy-700">
                  <th className="pb-2 font-semibold">Product Name</th>
                  <th className="pb-2 font-semibold">SKU</th>
                  <th className="pb-2 font-semibold text-right">Units</th>
                  <th className="pb-2 font-semibold text-right">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-700/50">
                {topProducts.map((p: any, idx: number) => (
                  <tr key={idx} className="hover:bg-navy-700/30">
                    <td className="py-2.5 font-bold text-white max-w-[200px] truncate">{p.product_name}</td>
                    <td className="py-2.5 font-mono text-gray-400">{p.sku}</td>
                    <td className="py-2.5 font-bold font-mono text-orange-400 text-right">{p.units_sold}</td>
                    <td className="py-2.5 font-bold font-mono text-white text-right">{formatPaise(p.revenue_paise)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="card p-5 flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-navy-600/60 mb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <h3 className="font-bold text-white text-sm">Low Stock Alerts & Reorder Needed</h3>
            </div>
            <Link to="/admin/inventory" className="text-xs text-orange-400 hover:text-orange-300 font-semibold flex items-center gap-1">
              <span>Adjust Stock</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-gray-400 border-b border-navy-700">
                  <th className="pb-2 font-semibold">SKU / Item</th>
                  <th className="pb-2 font-semibold">Category</th>
                  <th className="pb-2 font-semibold text-right">Current Stock</th>
                  <th className="pb-2 font-semibold text-right">Threshold</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-700/50">
                {lowStockAlerts.map((item: any, idx: number) => (
                  <tr key={idx} className="hover:bg-navy-700/30">
                    <td className="py-2.5">
                      <p className="font-bold text-white max-w-[180px] truncate">{item.product_name}</p>
                      <p className="font-mono text-[10px] text-gray-400">{item.sku}</p>
                    </td>
                    <td className="py-2.5 text-gray-300">{item.category}</td>
                    <td className="py-2.5 text-right">
                      <span className="font-mono font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">
                        {item.stock_qty} units
                      </span>
                    </td>
                    <td className="py-2.5 font-mono text-gray-400 text-right">{item.reorder_threshold}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
}
