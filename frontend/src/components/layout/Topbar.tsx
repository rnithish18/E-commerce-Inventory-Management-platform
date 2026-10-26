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
  ShieldCheck,
  Camera,
} from 'lucide-react';
import { VisualSearchModal } from '../search/VisualSearchModal';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { formatPaise } from '../../lib/utils';
import { useRef, useEffect } from 'react';

export function Topbar() {
  const { user, logout } = useAuth();
  const { cart, itemCount } = useCart();
  const [searchTerm, setSearchTerm] = useState('');
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [visualSearchOpen, setVisualSearchOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (bellRef.current && !bellRef.current.contains(event.target as Node)) {
        setBellOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
              placeholder="Search products, brands and categories..."
              className="w-full bg-navy-700/80 hover:bg-navy-700 focus:bg-navy-700 text-gray-100 placeholder-gray-400 text-sm rounded-xl pl-10 pr-28 py-2 border border-navy-600 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all duration-200"
            />
            <button
              type="button"
              onClick={() => setVisualSearchOpen(true)}
              title="Search by image (AI Vision)"
              aria-label="Search by image (AI Vision)"
              className="absolute right-20 top-1/2 -translate-y-1/2 text-gray-400 hover:text-orange-400 p-1.5 rounded-lg hover:bg-navy-600 transition-colors"
            >
              <Camera className="w-4 h-4" />
            </button>
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

          {/* Notifications Dropdown */}
          <div className="relative" ref={bellRef}>
            <button 
              type="button" 
              onClick={() => setBellOpen(!bellOpen)}
              title="Notifications" 
              className="relative p-2 rounded-xl text-gray-300 hover:text-white hover:bg-navy-700 transition-colors"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-orange-500 ring-2 ring-navy-800 animate-pulse" />
            </button>

            {bellOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-navy-800 border border-navy-700 rounded-2xl shadow-2xl py-3 z-50">
                <div className="px-4 pb-2 border-b border-navy-700 flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Notifications & Deals</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30">
                    Live
                  </span>
                </div>

                <div className="p-2 space-y-1.5 text-xs">
                  <div className="p-2.5 rounded-xl bg-navy-700/50 hover:bg-navy-700 transition-colors">
                    <div className="flex items-center gap-2 text-orange-400 font-bold mb-0.5">
                      <span>🎁</span>
                      <span>WELCOME10 Active</span>
                    </div>
                    <p className="text-[11px] text-gray-300">
                      Get 10% off your first order with coupon code <span className="font-mono font-bold text-white">WELCOME10</span>.
                    </p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-navy-700/50 hover:bg-navy-700 transition-colors">
                    <div className="flex items-center gap-2 text-green-400 font-bold mb-0.5">
                      <span>🚚</span>
                      <span>Free Express Shipping</span>
                    </div>
                    <p className="text-[11px] text-gray-300">
                      Orders above ₹500 qualify for zero delivery fee anywhere in India.
                    </p>
                  </div>

                  {user?.role === 'ADMIN' && (
                    <div className="p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/30 hover:bg-orange-500/20 transition-colors">
                      <div className="flex items-center gap-2 text-orange-400 font-bold mb-0.5">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Admin Alert</span>
                      </div>
                      <p className="text-[11px] text-gray-300 mb-1.5">
                        Check low-stock SKU inventory in the admin dashboard.
                      </p>
                      <Link
                        to="/admin/inventory"
                        onClick={() => setBellOpen(false)}
                        className="text-[10px] font-bold text-orange-400 hover:text-orange-300 flex items-center gap-1"
                      >
                        <span>Open Inventory Control →</span>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

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

      {/* AI Visual Search Modal */}
      <VisualSearchModal
        isOpen={visualSearchOpen}
        onClose={() => setVisualSearchOpen(false)}
      />
    </header>
  );
}
