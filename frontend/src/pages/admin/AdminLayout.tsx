import React from 'react';
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
  ExternalLink 
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

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

            <button className="relative p-2 rounded-xl text-gray-300 hover:text-white hover:bg-navy-700">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-orange-500 rounded-full" />
            </button>
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
