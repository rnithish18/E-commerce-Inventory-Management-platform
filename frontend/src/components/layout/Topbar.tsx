import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ShoppingBag, 
  Search, 
  Bell, 
  User, 
  ShoppingCart, 
  ChevronDown, 
  LogOut, 
  Package, 
  Heart, 
  LayoutDashboard,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { formatPaise } from '../../lib/utils';

export function Topbar() {
  const { user, logout } = useAuth();
  const { cart, itemCount } = useCart();
  const [searchTerm, setSearchTerm] = useState('');
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchTerm.trim())}`);
    } else {
      navigate('/shop');
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-navy-800 border-b border-navy-600/60 backdrop-blur-md bg-opacity-95 shadow-md">
      <div className="max-w-[1720px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        
        {/* Brand / Logo */}
        <Link to="/" className="flex items-center gap-3 group shrink-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-600 to-orange-400 flex items-center justify-center shadow-lg shadow-orange-500/20 group-hover:scale-105 transition-transform duration-200">
            <ShoppingBag className="w-5 h-5 text-white" />
          </div>
          <div className="hidden sm:block">
            <div className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
              <span>Shop</span>
              <span className="text-orange-500">Nest</span>
            </div>
            <p className="text-[10px] text-gray-400 font-medium tracking-wide -mt-0.5">
              Better Products. Happier You.
            </p>
          </div>
        </Link>

        {/* Global Search Bar */}
        <form onSubmit={handleSearch} className="flex-1 max-w-2xl mx-2 md:mx-6">
          <div className="relative group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search 1,000+ products, categories, brands..."
              className="w-full bg-navy-700/80 hover:bg-navy-700 focus:bg-navy-700 text-gray-100 placeholder-gray-400 text-sm rounded-xl pl-10 pr-24 py-2 border border-navy-600 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all duration-200"
            />
            <button 
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
            >
              Search
            </button>
          </div>
        </form>

        {/* Right Actions: Notifications, Account, Cart */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          
          {/* Admin Fast Link */}
          {user?.role === 'ADMIN' && (
            <Link
              to="/admin"
              className="hidden md:flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/30 hover:bg-orange-500/20 transition-colors"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Admin Portal</span>
            </Link>
          )}

          {/* Notifications */}
          <button 
            type="button" 
            title="Notifications" 
            className="relative p-2 rounded-xl text-gray-300 hover:text-white hover:bg-navy-700 transition-colors"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-orange-500 ring-2 ring-navy-800 animate-pulse" />
          </button>

          {/* User Account Menu */}
          {user ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 p-1.5 pr-2.5 rounded-xl bg-navy-700 hover:bg-navy-600 border border-navy-600 transition-colors"
              >
                <div className="w-7 h-7 rounded-lg bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center font-bold text-xs uppercase">
                  {user.full_name?.charAt(0) || 'U'}
                </div>
                <div className="text-left hidden lg:block">
                  <p className="text-xs font-semibold text-white truncate max-w-[110px] leading-tight">
                    {user.full_name}
                  </p>
                  <p className="text-[10px] text-orange-400 font-medium leading-tight">
                    {user.role}
                  </p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400 ml-0.5" />
              </button>

              {userDropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setUserDropdownOpen(false)} 
                  />
                  <div className="absolute right-0 mt-2 w-52 bg-navy-700 border border-navy-600 rounded-xl shadow-xl py-1.5 z-50 text-sm animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-3 py-2 border-b border-navy-600/60 mb-1">
                      <p className="text-xs text-gray-400">Signed in as</p>
                      <p className="text-xs font-semibold text-white truncate">{user.email}</p>
                    </div>

                    {user.role === 'ADMIN' && (
                      <Link
                        to="/admin"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 text-orange-400 hover:bg-navy-600 transition-colors"
                      >
                        <LayoutDashboard className="w-4 h-4" />
                        <span>Admin Dashboard</span>
                      </Link>
                    )}

                    <Link
                      to="/orders"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-gray-200 hover:bg-navy-600 transition-colors"
                    >
                      <Package className="w-4 h-4" />
                      <span>My Orders</span>
                    </Link>

                    <Link
                      to="/wishlist"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-gray-200 hover:bg-navy-600 transition-colors"
                    >
                      <Heart className="w-4 h-4" />
                      <span>Wishlist</span>
                    </Link>

                    <button
                      type="button"
                      onClick={() => {
                        setUserDropdownOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-red-400 hover:bg-navy-600 transition-colors text-left border-t border-navy-600/60 mt-1"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="text-xs font-semibold px-3 py-2 rounded-xl text-gray-200 hover:text-white hover:bg-navy-700 transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="text-xs font-semibold px-3 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white shadow-md shadow-orange-500/20 transition-all"
              >
                Register
              </Link>
            </div>
          )}

          {/* Quick Cart Trigger */}
          <Link
            to="/cart"
            className="flex items-center gap-2 p-2 sm:px-3 sm:py-2 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/30 transition-all"
          >
            <div className="relative">
              <ShoppingCart className="w-5 h-5" />
              <span className="absolute -top-1.5 -right-2 bg-orange-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-navy-800">
                {itemCount}
              </span>
            </div>
            <span className="hidden sm:inline text-xs font-bold text-white">
              {formatPaise(cart.totalPaise)}
            </span>
          </Link>

        </div>
      </div>
    </header>
  );
}
