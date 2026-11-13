import React, { useState } from 'react';
import {
  TrendingUp,
  ShoppingCart,
  Users,
  AlertTriangle,
  Download,
  Boxes,
  RefreshCw,
  TrendingDown,
  Minus,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import { formatPaise } from '../../lib/utils';
import toast from 'react-hot-toast';

const STATUS_COLOURS: Record<string, string> = {
  DELIVERED:        '#22c55e',
  SHIPPED:          '#3b82f6',
  OUT_FOR_DELIVERY: '#8b5cf6',
  PROCESSING:       '#f59e0b',
  PAID:             '#06b6d4',
  PENDING_PAYMENT:  '#94a3b8',
  CANCELLED:        '#ef4444',
  REFUNDED:         '#f97316',
};

function ChangeChip({ value }: { value: number | undefined }) {
  if (value === undefined || value === null) return null;
  const up = value > 0;
  const flat = value === 0;
  return (
    <span
      className="inline-flex items-center gap-1 text-[11px] font-semibold"
      style={{ color: flat ? 'var(--adm-text-3)' : up ? 'var(--adm-success)' : 'var(--adm-danger)' }}
    >
      {flat ? <Minus className="w-3 h-3" /> : up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {flat ? 'No change' : `${up ? '+' : ''}${value}% vs prior period`}
    </span>
  );
}

export function AdminDashboard() {
  const [dateRange, setDateRange] = useState('30d');
  const queryClient = useQueryClient();

  const { data: kpi, isLoading: kpiLoading, refetch: refetchKpi } = useQuery({
    queryKey: ['admin-dashboard-kpi'],
    queryFn: async () => {
      const res = await api.get('/admin/dashboard');
      return res.data;
    },
    staleTime: 30000,
  });

  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['admin-analytics', dateRange],
    queryFn: async () => {
      const res = await api.get(`/admin/analytics?period=${dateRange}`);
      return res.data;
    },
    staleTime: 60000,
  });

  const isLoading = kpiLoading || analyticsLoading;

  const refresh = async () => {
    await Promise.all([refetchKpi(), queryClient.invalidateQueries({ queryKey: ['admin-analytics'] })]);
  };

  const exportReport = () => {
    toast.success('Preparing CSV export...');
  };

  // KPI values from dashboard endpoint (all-time)
  const totalSales   = kpi ? formatPaise(kpi.total_sales_paise) : '—';
  const totalOrders  = kpi?.total_orders ?? 0;
  const totalCustomers = kpi?.total_customers ?? 0;
  const lowStockCount = kpi?.low_stock_count ?? 0;
  const lowStockItems = kpi?.low_stock_items || [];
  const topProducts   = kpi?.top_products || [];

  // Chart data from analytics endpoint
  const chartData = (analytics?.time_series || []).map((r: any) => ({
    day: r.day || r.date || r.label || '',
    sales: Math.round((r.revenue_paise || 0) / 100),
    orders: r.order_count || r.orders || 0,
  }));

  const statusData = (analytics?.status_distribution || []).map((r: any) => ({
    name: r.status || r.name || '',
    value: parseInt(r.count ?? r.value ?? '0', 10),
    color: STATUS_COLOURS[r.status || r.name] || '#94a3b8',
  })).filter((d: any) => d.value > 0);

  const aovPaise = analytics?.kpis?.aov_paise ?? 0;
  const salesChange = analytics?.kpis?.sales_change_percent;
  const ordersChange = analytics?.kpis?.orders_change_percent;

  const totalStatusOrders = statusData.reduce((s: number, d: any) => s + d.value, 0);

  const kpiCards = [
    {
      label: 'Total revenue',
      value: totalSales,
      icon: <TrendingUp className="w-4 h-4" />,
      change: salesChange,
      colour: 'var(--adm-accent)',
    },
    {
      label: 'Orders placed',
      value: totalOrders.toLocaleString('en-IN'),
      icon: <ShoppingCart className="w-4 h-4" />,
      change: ordersChange,
      colour: 'var(--adm-info)',
    },
    {
      label: 'Customer accounts',
      value: totalCustomers.toLocaleString('en-IN'),
      icon: <Users className="w-4 h-4" />,
      change: undefined,
      colour: '#8b5cf6',
    },
    {
      label: 'SKUs below reorder level',
      value: lowStockCount.toLocaleString('en-IN'),
      icon: <AlertTriangle className="w-4 h-4" />,
      change: undefined,
      colour: lowStockCount > 0 ? 'var(--adm-warning)' : 'var(--adm-success)',
      warn: lowStockCount > 0,
    },
  ];

  const LoadingSkeleton = () => (
    <div className="animate-pulse">
      <div className="h-6 w-24 rounded mb-2" style={{ background: 'var(--adm-raised)' }} />
      <div className="h-8 w-32 rounded" style={{ background: 'var(--adm-raised)' }} />
    </div>
  );

  return (
    <div className="flex flex-col gap-5 max-w-[1600px] mx-auto pb-10">

      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--adm-text-1)' }}>Dashboard</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--adm-text-2)' }}>
            Sales and order activity for the selected period
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="adm-select text-xs rounded-lg px-3 py-2"
            aria-label="Date range"
            data-testid="dashboard-date-range"
          >
            <option value="today">Today</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          <button
            onClick={refresh}
            title="Refresh"
            aria-label="Refresh dashboard"
            className="p-2 rounded-lg transition-colors"
            style={{ color: 'var(--adm-text-2)', background: 'var(--adm-raised)' }}
            data-testid="dashboard-refresh"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[var(--adm-accent)]' : ''}`} />
          </button>
          <button
            onClick={exportReport}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors"
            style={{ background: 'var(--adm-raised)', color: 'var(--adm-text-1)', border: '1px solid var(--adm-border)' }}
            data-testid="dashboard-export"
          >
            <Download className="w-3.5 h-3.5" style={{ color: 'var(--adm-accent)' }} />
            Export CSV
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" data-testid="kpi-cards">
        {kpiCards.map((card) => (
          <div
            key={card.label}
            className="adm-card p-5 flex flex-col gap-3"
            style={card.warn ? { borderColor: 'var(--adm-warning)', background: 'rgba(245,158,11,0.05)' } : {}}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium" style={{ color: 'var(--adm-text-2)' }}>{card.label}</span>
              <span style={{ color: card.colour, opacity: 0.8 }}>{card.icon}</span>
            </div>
            {isLoading ? (
              <LoadingSkeleton />
            ) : (
              <>
                <span className="text-3xl font-bold leading-none" style={{ color: card.warn && lowStockCount > 0 ? 'var(--adm-warning)' : 'var(--adm-text-1)' }}>
                  {card.value}
                </span>
                <ChangeChip value={card.change} />
              </>
            )}
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Area chart: revenue trend */}
        <div className="adm-card p-5 lg:col-span-2" data-testid="revenue-chart">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold" style={{ color: 'var(--adm-text-1)' }}>Revenue trend</h3>
              <p className="text-xs" style={{ color: 'var(--adm-text-2)' }}>Daily revenue for the selected period</p>
            </div>
            {aovPaise > 0 && (
              <span className="adm-badge adm-badge-accent text-xs">
                Avg order: {formatPaise(aovPaise)}
              </span>
            )}
          </div>

          {chartData.length === 0 ? (
            <div className="h-48 flex items-center justify-center">
              <p className="text-sm" style={{ color: 'var(--adm-text-3)' }}>
                {analyticsLoading ? 'Loading...' : 'No orders in this period'}
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ea580c" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#ea580c" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--adm-border-s)" strokeDasharray="0" strokeOpacity={0.4} />
                <XAxis
                  dataKey="day"
                  tick={{ fill: 'var(--adm-text-2)', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: 'var(--adm-text-2)', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `\u20B9${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                  width={52}
                />
                <Tooltip
                  contentStyle={{
                    background: 'var(--adm-raised)',
                    border: '1px solid var(--adm-border-s)',
                    borderRadius: 8,
                    color: 'var(--adm-text-1)',
                    fontSize: 12,
                  }}
                  formatter={(val: any) => [`\u20B9${Number(val).toLocaleString('en-IN')}`, 'Revenue']}
                />
                <Area
                  type="monotone"
                  dataKey="sales"
                  stroke="#ea580c"
                  strokeWidth={2}
                  fill="url(#salesGrad)"
                  dot={false}
                  activeDot={{ r: 4, fill: '#ea580c' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Donut: order status distribution */}
        <div className="adm-card p-5" data-testid="status-chart">
          <div className="mb-4">
            <h3 className="text-sm font-semibold" style={{ color: 'var(--adm-text-1)' }}>Order status</h3>
            <p className="text-xs" style={{ color: 'var(--adm-text-2)' }}>Distribution for selected period</p>
          </div>

          {statusData.length === 0 ? (
            <div className="h-48 flex items-center justify-center">
              <p className="text-sm" style={{ color: 'var(--adm-text-3)' }}>
                {analyticsLoading ? 'Loading...' : 'No data for this period'}
              </p>
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={72}
                    paddingAngle={2}
                    dataKey="value"
                    aria-label="Order status distribution"
                  >
                    {statusData.map((entry: any, i: number) => (
                      <Cell key={i} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: 'var(--adm-raised)',
                      border: '1px solid var(--adm-border-s)',
                      borderRadius: 8,
                      color: 'var(--adm-text-1)',
                      fontSize: 12,
                    }}
                    formatter={(val: any, name: any) => [
                      `${val} orders (${totalStatusOrders > 0 ? Math.round((val / totalStatusOrders) * 100) : 0}%)`,
                      name,
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Legend */}
              <ul className="flex flex-col gap-1.5 mt-2" aria-label="Status legend">
                {statusData.map((d: any) => (
                  <li key={d.name} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.color }} />
                      <span style={{ color: 'var(--adm-text-2)' }}>
                        {d.name.charAt(0) + d.name.slice(1).toLowerCase().replace(/_/g, ' ')}
                      </span>
                    </span>
                    <span className="font-semibold tabular-nums" style={{ color: 'var(--adm-text-1)' }}>
                      {d.value}
                      <span className="font-normal ml-1" style={{ color: 'var(--adm-text-3)' }}>
                        ({totalStatusOrders > 0 ? Math.round((d.value / totalStatusOrders) * 100) : 0}%)
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>

      {/* Bottom row: low stock + top products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Low stock */}
        <div className="adm-card overflow-hidden" data-testid="low-stock-panel">
          <div
            className="px-5 py-3 flex items-center justify-between"
            style={{ borderBottom: '1px solid var(--adm-border)', background: 'var(--adm-raised)' }}
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" style={{ color: 'var(--adm-warning)' }} />
              <span className="text-sm font-semibold" style={{ color: 'var(--adm-text-1)' }}>Low stock</span>
            </div>
            {lowStockCount > 0 && (
              <span className="adm-badge adm-badge-warning">{lowStockCount} SKUs</span>
            )}
          </div>
          {lowStockItems.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-sm" style={{ color: 'var(--adm-text-3)' }}>All SKUs are above reorder levels.</p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: 'var(--adm-border)' }}>
              {lowStockItems.map((item: any, i: number) => (
                <div key={i} className="px-5 py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--adm-text-1)' }}>{item.name}</p>
                    <p className="text-xs adm-mono" style={{ color: 'var(--adm-text-3)' }}>{item.sku} &bull; {item.category}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-sm font-semibold" style={{ color: 'var(--adm-danger)' }}>{item.stock} left</span>
                    <p className="text-xs" style={{ color: 'var(--adm-text-3)' }}>reorder &le; {item.threshold}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top products */}
        <div className="adm-card overflow-hidden" data-testid="top-products-panel">
          <div
            className="px-5 py-3"
            style={{ borderBottom: '1px solid var(--adm-border)', background: 'var(--adm-raised)' }}
          >
            <span className="text-sm font-semibold" style={{ color: 'var(--adm-text-1)' }}>Top products by rating</span>
          </div>
          {topProducts.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-sm" style={{ color: 'var(--adm-text-3)' }}>No products found.</p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: 'var(--adm-border)' }}>
              {topProducts.map((p: any, i: number) => (
                <div key={i} className="px-5 py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--adm-text-1)' }}>{p.name}</p>
                    <p className="text-xs" style={{ color: 'var(--adm-text-3)' }}>{p.category}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold" style={{ color: 'var(--adm-text-1)' }}>
                      {formatPaise(p.price_paise)}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--adm-text-3)' }}>{p.stock} in stock</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
