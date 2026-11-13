import React, { useState, useRef, useEffect } from 'react';
import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Boxes,
  Users,
  Ticket,
  Star,
  BarChart3,
  Settings,
  ShoppingBag,
  LogOut,
  Search,
  Bell,
  ExternalLink,
  AlertTriangle,
  ArrowRight,
  Sun,
  Moon,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import '../../styles/admin-tokens.css';

function getStoredAdminTheme(): 'dark' | 'light' {
  try {
    const v = localStorage.getItem('shopnest_admin_theme');
    return v === 'light' ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
}

export function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [bellOpen, setBellOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [adminTheme, setAdminTheme] = useState<'dark' | 'light'>(getStoredAdminTheme);
  const bellRef = useRef<HTMLDivElement>(null);

  const { data: dashboardData } = useQuery({
    queryKey: ['admin-dashboard-kpi'],
    queryFn: async () => {
      const res = await api.get('/admin/dashboard');
      return res.data;
    },
    staleTime: 30000,
  });

  const lowStockCount = dashboardData?.low_stock_count ?? 0;
  const pendingCount = dashboardData?.pending_orders_count ?? 0;
  const lowStockItems = dashboardData?.low_stock_items || [];

  const toggleTheme = () => {
    const next = adminTheme === 'dark' ? 'light' : 'dark';
    setAdminTheme(next);
    try { localStorage.setItem('shopnest_admin_theme', next); } catch { /* noop */ }
  };

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setBellOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isDark = adminTheme === 'dark';

  // Sidebar nav active style: left accent bar + subtle fill
  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all relative ${
      isActive
        ? 'bg-[rgba(234,88,12,0.12)] text-[var(--adm-text-1)] border-l-2 border-[var(--adm-accent)] pl-[10px]'
        : 'text-[var(--adm-text-2)] hover:text-[var(--adm-text-1)] hover:bg-[var(--adm-raised)]'
    }`;

  const NAV_ITEMS = [
    { to: '/admin', end: true, label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4 shrink-0" /> },
    { to: '/admin/products', end: false, label: 'Products', icon: <Package className="w-4 h-4 shrink-0" /> },
    {
      to: '/admin/orders', end: false, label: 'Orders',
      icon: <ShoppingCart className="w-4 h-4 shrink-0" />,
      badge: pendingCount > 0 ? pendingCount : null,
    },
    {
      to: '/admin/inventory', end: false, label: 'Inventory',
      icon: <Boxes className="w-4 h-4 shrink-0" />,
      badge: lowStockCount > 0 ? lowStockCount : null,
      badgeVariant: 'warn',
    },
    { to: '/admin/customers', end: false, label: 'Customers', icon: <Users className="w-4 h-4 shrink-0" /> },
    { to: '/admin/coupons', end: false, label: 'Coupons', icon: <Ticket className="w-4 h-4 shrink-0" /> },
    { to: '/admin/reviews', end: false, label: 'Reviews', icon: <Star className="w-4 h-4 shrink-0" /> },
    { to: '/admin/analytics', end: false, label: 'Analytics', icon: <BarChart3 className="w-4 h-4 shrink-0" /> },
    { to: '/admin/settings', end: false, label: 'Settings', icon: <Settings className="w-4 h-4 shrink-0" /> },
  ];

  const userInitial = (user?.full_name || user?.email || 'A')[0].toUpperCase();

  const Sidebar = () => (
    <aside
      style={{ background: 'var(--adm-surface)', borderRight: '1px solid var(--adm-border)' }}
      className="w-60 shrink-0 flex flex-col min-h-screen"
      data-testid="admin-sidebar"
    >
      {/* Brand */}
      <div style={{ borderBottom: '1px solid var(--adm-border)' }} className="p-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[var(--adm-accent)] flex items-center justify-center">
            <ShoppingBag className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="font-bold text-[var(--adm-text-1)] text-sm">ShopNest</span>
            <span className="ml-2 text-[10px] font-semibold text-[var(--adm-accent)] bg-[rgba(234,88,12,0.12)] px-1.5 py-0.5 rounded">
              Admin
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 flex flex-col gap-0.5 overflow-y-auto" aria-label="Admin navigation">
        <p className="px-3 text-[10px] font-semibold uppercase tracking-wider text-[var(--adm-text-3)] mb-2 mt-1">
          Management
        </p>
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={navLinkClass}
            onClick={() => setSidebarOpen(false)}
          >
            {item.icon}
            <span className="flex-1">{item.label}</span>
            {item.badge != null && (
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center ${
                  item.badgeVariant === 'warn'
                    ? 'bg-[rgba(245,158,11,0.15)] text-[var(--adm-warning)]'
                    : 'bg-[rgba(239,68,68,0.15)] text-[var(--adm-danger)]'
                }`}
              >
                {item.badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div style={{ borderTop: '1px solid var(--adm-border)' }} className="p-3 flex flex-col gap-1.5">
        {/* View storefront */}
        <Link
          to="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium text-[var(--adm-text-2)] hover:text-[var(--adm-text-1)] hover:bg-[var(--adm-raised)] transition-colors"
        >
          <span className="flex items-center gap-2">
            <ShoppingBag className="w-3.5 h-3.5 text-[var(--adm-accent)]" />
            <span>View Storefront</span>
          </span>
          <ExternalLink className="w-3 h-3 text-[var(--adm-text-3)]" />
        </Link>

        {/* User menu */}
        <div
          style={{ background: 'var(--adm-raised)', border: '1px solid var(--adm-border)' }}
          className="flex items-center gap-2 p-2 rounded-lg"
        >
          <div
            style={{ background: 'rgba(234,88,12,0.15)', color: 'var(--adm-accent)' }}
            className="w-7 h-7 rounded-md font-bold text-xs flex items-center justify-center shrink-0"
          >
            {userInitial}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-[var(--adm-text-1)] truncate">
              {user?.full_name || 'Admin'}
            </p>
            <p className="text-[10px] text-[var(--adm-text-3)] truncate">{user?.email || ''}</p>
          </div>
          <button
            onClick={handleLogout}
            title="Sign out"
            className="p-1.5 rounded-md text-[var(--adm-text-3)] hover:text-[var(--adm-danger)] hover:bg-[rgba(239,68,68,0.1)] transition-colors"
            aria-label="Sign out"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );

  return (
    <div
      className={`admin-root${adminTheme === 'light' ? ' admin-light' : ''} flex`}
      data-testid="admin-layout"
      data-theme={adminTheme}
    >
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar — hidden on mobile, overlay when open */}
      <div
        className={`fixed inset-y-0 left-0 z-50 lg:relative lg:z-auto lg:flex transition-transform duration-200 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <Sidebar />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header
          style={{
            background: 'var(--adm-surface)',
            borderBottom: '1px solid var(--adm-border)',
          }}
          className="h-14 px-4 flex items-center justify-between gap-4 sticky top-0 z-30"
        >
          {/* Mobile menu toggle */}
          <button
            className="lg:hidden p-2 rounded-lg text-[var(--adm-text-2)] hover:text-[var(--adm-text-1)] hover:bg-[var(--adm-raised)] transition-colors"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Search */}
          <div className="relative flex-1 max-w-xs hidden sm:block">
            <Search className="w-3.5 h-3.5 text-[var(--adm-text-3)] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search products, orders..."
              aria-label="Search admin"
              className="adm-input pl-8 py-2 text-xs rounded-lg"
              style={{ background: 'var(--adm-raised)' }}
            />
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              className="p-2 rounded-lg text-[var(--adm-text-2)] hover:text-[var(--adm-text-1)] hover:bg-[var(--adm-raised)] transition-colors"
              data-testid="admin-theme-toggle"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Low stock bell */}
            <div className="relative" ref={bellRef}>
              <button
                onClick={() => setBellOpen(!bellOpen)}
                className="relative p-2 rounded-lg text-[var(--adm-text-2)] hover:text-[var(--adm-text-1)] hover:bg-[var(--adm-raised)] transition-colors"
                title="Stock alerts"
                aria-label={`Stock alerts${lowStockCount > 0 ? `, ${lowStockCount} low stock items` : ''}`}
                data-testid="admin-bell"
              >
                <Bell className="w-4 h-4" />
                {lowStockCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-0.5 bg-[var(--adm-warning)] text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {lowStockCount > 99 ? '99+' : lowStockCount}
                  </span>
                )}
              </button>

              {bellOpen && (
                <div
                  style={{ background: 'var(--adm-surface)', border: '1px solid var(--adm-border)' }}
                  className="absolute right-0 top-full mt-2 w-80 rounded-xl shadow-2xl py-2 z-50"
                  role="dialog"
                  aria-label="Low stock alerts"
                >
                  <div
                    style={{ borderBottom: '1px solid var(--adm-border)' }}
                    className="px-4 pb-2 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-3.5 h-3.5 text-[var(--adm-warning)]" />
                      <span className="text-xs font-semibold text-[var(--adm-text-1)]">Low stock</span>
                    </div>
                    <span className="adm-badge adm-badge-warning">{lowStockCount} items</span>
                  </div>

                  <div className="max-h-60 overflow-y-auto">
                    {lowStockItems.length === 0 ? (
                      <p className="p-4 text-center text-xs text-[var(--adm-text-3)]">
                        All SKUs are above reorder levels.
                      </p>
                    ) : (
                      lowStockItems.map((item: any, i: number) => (
                        <div
                          key={i}
                          style={{ borderBottom: '1px solid var(--adm-border)' }}
                          className="px-4 py-2.5 flex items-center justify-between gap-3 hover:bg-[var(--adm-raised)] transition-colors last:border-0"
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-[var(--adm-text-1)] truncate">{item.name}</p>
                            <p className="text-[10px] text-[var(--adm-text-3)] adm-mono">{item.sku}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-xs font-semibold text-[var(--adm-danger)]">{item.stock} left</span>
                            <p className="text-[9px] text-[var(--adm-text-3)]">reorder &le; {item.threshold}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div style={{ borderTop: '1px solid var(--adm-border)' }} className="pt-2 px-3">
                    <Link
                      to="/admin/inventory"
                      onClick={() => setBellOpen(false)}
                      className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold text-[var(--adm-accent)] hover:bg-[rgba(234,88,12,0.1)] transition-colors"
                    >
                      <span>Manage inventory</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main
          className="flex-1 p-5 overflow-y-auto"
          style={{ background: 'var(--adm-bg)' }}
          data-testid="admin-main"
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
