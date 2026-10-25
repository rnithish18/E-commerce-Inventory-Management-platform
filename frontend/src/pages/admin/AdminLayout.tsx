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
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';

const NAV_ITEMS = [
  { to: '/admin', end: true, label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
  { to: '/admin/products', end: false, label: 'Products', icon: <Package className="w-4 h-4" /> },
  { to: '/admin/orders', end: false, label: 'Orders', icon: <ShoppingCart className="w-4 h-4" /> },
  { to: '/admin/inventory', end: false, label: 'Inventory', icon: <Boxes className="w-4 h-4" /> },
  { to: '/admin/customers', end: false, label: 'Customers', icon: <Users className="w-4 h-4" /> },
  { to: '/admin/coupons', end: false, label: 'Coupons', icon: <Ticket className="w-4 h-4" /> },
  { to: '/admin/reviews', end: false, label: 'Reviews', icon: <Star className="w-4 h-4" /> },
  { to: '/admin/analytics', end: false, label: 'Analytics', icon: <BarChart3 className="w-4 h-4" /> },
  { to: '/admin/settings', end: false, label: 'Settings', icon: <Settings className="w-4 h-4" /> },
];

export function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [bellOpen, setBellOpen] = useState(false);
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
  const lowStockItems = dashboardData?.low_stock_items || [];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (bellRef.current && !bellRef.current.contains(event.target as Node)) {
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

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
      isActive
        ? 'bg-orange-500 text-white shadow-md shadow-orange-500/25'
        : 'text-gray-300 hover:text-white hover:bg-navy-700/80'
    }`;

  return (
    <div className="min-h-screen bg-navy-900 text-gray-100 flex font-sans">
      
      {/* Admin Sidebar */}
      <aside className="w-64 shrink-0 bg-navy-800 border-r border-navy-700/80 flex flex-col min-h-screen">
        
        {/* Admin Brand */}
        <div className="p-5 border-b border-navy-700/80">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/25">
              <ShoppingBag className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-white text-base">ShopNest</span>
              <span className="ml-1.5 text-[10px] font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30 px-1.5 py-0.2 rounded uppercase">
                Admin
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 p-3 flex flex-col gap-1 overflow-y-auto">
          <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">
            Management
          </p>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={navLinkClass}
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer actions */}
        <div className="p-3 border-t border-navy-700/80 flex flex-col gap-2">
          <Link
            to="/"
            className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-gray-300 hover:text-white hover:bg-navy-700/80 transition-colors"
          >
            <span className="flex items-center gap-2">
              <ShoppingBag className="w-3.5 h-3.5 text-orange-400" />
              <span>Back to Storefront</span>
            </span>
            <ExternalLink className="w-3 h-3 text-gray-400" />
          </Link>

          {/* User badge & logout */}
          <div className="flex items-center justify-between p-2 rounded-xl bg-navy-700/60 border border-navy-600/60 mt-1">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-7 h-7 rounded-lg bg-orange-500/20 text-orange-400 font-bold text-xs flex items-center justify-center shrink-0">
                A
              </div>
              <div className="truncate">
                <p className="text-xs font-bold text-white truncate">{user?.full_name || 'Admin'}</p>
                <p className="text-[10px] text-orange-400 truncate font-mono">Super Admin</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-navy-600 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </aside>

      {/* Main Admin Content */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Admin Topbar */}
        <header className="h-16 bg-navy-800/80 border-b border-navy-700/80 backdrop-blur-md px-6 flex items-center justify-between gap-4 sticky top-0 z-30">
          <div className="relative w-72">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search products, orders, customers..."
              className="w-full bg-navy-700/80 border border-navy-600 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-gray-400 focus:outline-none focus:border-orange-500"
            />
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold bg-green-500/10 text-green-400 border border-green-500/30 px-2.5 py-1 rounded-full flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span>Database Connected</span>
            </span>

            <div className="relative" ref={bellRef}>
              <button
                onClick={() => setBellOpen(!bellOpen)}
                className="relative p-2 rounded-xl text-gray-300 hover:text-white hover:bg-navy-700 transition-colors"
                title="Low Stock Alerts"
              >
                <Bell className="w-4 h-4" />
                {lowStockCount > 0 ? (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-orange-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-navy-800 animate-pulse">
                    {lowStockCount}
                  </span>
                ) : (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-green-500 rounded-full" />
                )}
              </button>

              {bellOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-navy-800 border border-navy-700 rounded-2xl shadow-2xl py-3 z-50">
                  <div className="px-4 pb-2 border-b border-navy-700 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                      <span className="text-xs font-bold text-white">Low Stock Alerts</span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {lowStockCount} items
                    </span>
                  </div>

                  <div className="max-h-64 overflow-y-auto divide-y divide-navy-700/50">
                    {lowStockItems.length === 0 ? (
                      <div className="p-4 text-center text-xs text-gray-400">
                        All SKUs are above reorder threshold!
                      </div>
                    ) : (
                      lowStockItems.map((item: any, i: number) => (
                        <div key={i} className="p-3 hover:bg-navy-700/50 transition-colors flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-white truncate">{item.name}</p>
                            <p className="text-[10px] font-mono text-gray-400">{item.sku} • {item.category}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-xs font-mono font-bold text-red-400">
                              {item.stock} left
                            </span>
                            <p className="text-[9px] text-gray-400">reorder ≤ {item.threshold}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="pt-2 px-3 border-t border-navy-700">
                    <Link
                      to="/admin/inventory"
                      onClick={() => setBellOpen(false)}
                      className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-xl bg-orange-500/10 hover:bg-orange-500 text-orange-400 hover:text-white text-xs font-bold transition-all border border-orange-500/30"
                    >
                      <span>Manage All Inventory</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content body */}
        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </main>

      </div>

    </div>
  );
}
