import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { 
  Home, 
  Store, 
  Package, 
  Heart, 
  ShoppingCart, 
  User, 
  Sparkles, 
  Copy, 
  Check, 
  Laptop, 
  Shirt, 
  Armchair, 
  Sparkle, 
  Trophy, 
  BookOpen, 
  Gamepad2,
  ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';

interface CategoryItem {
  name: string;
  slug: string;
  icon: React.ReactNode;
}

const CATEGORIES: CategoryItem[] = [
  { name: 'Electronics', slug: 'electronics', icon: <Laptop className="w-4 h-4" /> },
  { name: 'Fashion', slug: 'fashion', icon: <Shirt className="w-4 h-4" /> },
  { name: 'Home & Living', slug: 'home-living', icon: <Armchair className="w-4 h-4" /> },
  { name: 'Beauty & Personal Care', slug: 'beauty-personal-care', icon: <Sparkle className="w-4 h-4" /> },
  { name: 'Sports & Outdoors', slug: 'sports-outdoors', icon: <Trophy className="w-4 h-4" /> },
  { name: 'Books & Stationery', slug: 'books-stationery', icon: <BookOpen className="w-4 h-4" /> },
  { name: 'Toys & Games', slug: 'toys-games', icon: <Gamepad2 className="w-4 h-4" /> },
];

export function Sidebar() {
  const [copied, setCopied] = useState(false);

  const copyCoupon = () => {
    navigator.clipboard.writeText('WELCOME10');
    setCopied(true);
    toast.success('Coupon WELCOME10 copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const navItemClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
      isActive
        ? 'bg-orange-500 text-white shadow-md shadow-orange-500/25 font-semibold'
        : 'text-gray-300 hover:text-white hover:bg-navy-700/80'
    }`;

  return (
    <aside className="w-64 shrink-0 hidden md:flex flex-col gap-6 py-6 px-4 bg-navy-800/60 border-r border-navy-700/60 min-h-[calc(100vh-4rem)]">
      
      {/* Primary Navigation */}
      <nav className="flex flex-col gap-1">
        <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1">
          Menu
        </p>
        <NavLink to="/" end className={navItemClass}>
          <Home className="w-4 h-4" />
          <span>Home</span>
        </NavLink>
        <NavLink to="/shop" className={navItemClass}>
          <Store className="w-4 h-4" />
          <span>Shop Catalog</span>
        </NavLink>
        <NavLink to="/orders" className={navItemClass}>
          <Package className="w-4 h-4" />
          <span>My Orders</span>
        </NavLink>
        <NavLink to="/wishlist" className={navItemClass}>
          <Heart className="w-4 h-4" />
          <span>Wishlist</span>
        </NavLink>
        <NavLink to="/cart" className={navItemClass}>
          <ShoppingCart className="w-4 h-4" />
          <span>Your Cart</span>
        </NavLink>
      </nav>

      {/* Categories Section */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between px-3 mb-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
            Categories
          </p>
          <Link to="/shop" className="text-[11px] text-orange-400 hover:text-orange-300 font-semibold">
            All
          </Link>
        </div>

        <div className="flex flex-col gap-0.5">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.slug}
              to={`/shop?category=${cat.slug}`}
              className="group flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-gray-300 hover:text-white hover:bg-navy-700/60 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-gray-400 group-hover:text-orange-400 transition-colors">
                  {cat.icon}
                </span>
                <span>{cat.name}</span>
              </div>
              <ChevronRight className="w-3 h-3 text-gray-500 group-hover:text-gray-300 group-hover:translate-x-0.5 transition-all" />
            </Link>
          ))}
        </div>
      </div>

      {/* Promo Card: WELCOME10 */}
      <div className="mt-auto p-4 rounded-2xl bg-gradient-to-br from-orange-500/20 via-orange-500/10 to-transparent border border-orange-500/30 relative overflow-hidden group">
        <div className="absolute -right-4 -bottom-4 w-20 h-20 rounded-full bg-orange-500/10 blur-xl group-hover:bg-orange-500/20 transition-colors" />
        
        <div className="flex items-center gap-2 text-orange-400 text-xs font-bold mb-1">
          <Sparkles className="w-4 h-4" />
          <span>FIRST ORDER OFFER</span>
        </div>
        <p className="text-white text-sm font-bold leading-snug">
          Get 10% Off on ₹500+
        </p>
        <p className="text-gray-400 text-[11px] mt-0.5 mb-3">
          Use coupon at checkout
        </p>

        <button
          type="button"
          onClick={copyCoupon}
          className="w-full flex items-center justify-between bg-navy-800/90 hover:bg-navy-800 border border-orange-500/40 text-orange-300 px-3 py-2 rounded-xl text-xs font-mono font-bold transition-all shadow-sm"
        >
          <span>WELCOME10</span>
          {copied ? (
            <Check className="w-3.5 h-3.5 text-green-400" />
          ) : (
            <Copy className="w-3.5 h-3.5 text-orange-400 group-hover:scale-110 transition-transform" />
          )}
        </button>
      </div>

    </aside>
  );
}
