import React, { useState, useRef, useEffect } from 'react';
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
  History,
  X,
  Sun,
  Moon,
  ArrowRight,
} from 'lucide-react';
import { VisualSearchModal } from '../search/VisualSearchModal';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { formatPaise } from '../../lib/utils';
import { productsApi, SuggestionItem } from '../../lib/api';
import { ProductImage } from '../ui/ProductImage';

export function Topbar() {
  const { user, logout } = useAuth();
  const { cart, itemCount } = useCart();
  const [searchTerm, setSearchTerm] = useState('');
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [visualSearchOpen, setVisualSearchOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('shopnest_recent_searches');
      return stored ? JSON.parse(stored) : ['iPhone', 'Sony', 'Sneakers'];
    } catch {
      return ['iPhone', 'Sony', 'Sneakers'];
    }
  });

  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      return localStorage.getItem('shopnest_theme') !== 'light';
    } catch {
      return true;
    }
  });

  const bellRef = useRef<HTMLDivElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Handle outside clicks for bell & search dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (bellRef.current && !bellRef.current.contains(event.target as Node)) {
        setBellOpen(false);
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch autosuggest with debounce
  useEffect(() => {
    const trimmed = searchTerm.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await productsApi.suggest(trimmed);
        setSuggestions(res.data.suggestions || []);
        setSelectedIndex(-1);
      } catch {
        setSuggestions([]);
      }
    }, 180);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const saveRecentSearch = (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    const updated = [trimmed, ...recentSearches.filter(s => s.toLowerCase() !== trimmed.toLowerCase())].slice(0, 5);
    setRecentSearches(updated);
    try {
      localStorage.setItem('shopnest_recent_searches', JSON.stringify(updated));
    } catch {
      // ignore storage quota
    }
  };

  const removeRecentSearch = (e: React.MouseEvent, query: string) => {
    e.stopPropagation();
    const updated = recentSearches.filter(s => s !== query);
    setRecentSearches(updated);
    try {
      localStorage.setItem('shopnest_recent_searches', JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const handleSearchSubmit = (queryToSearch: string) => {
    const q = queryToSearch.trim();
    setDropdownOpen(false);
    if (q) {
      saveRecentSearch(q);
      navigate(`/shop?search=${encodeURIComponent(q)}`);
    } else {
      navigate('/shop');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!dropdownOpen) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > -1 ? prev - 1 : -1));
    } else if (e.key === 'Enter') {
      if (selectedIndex >= 0 && suggestions[selectedIndex]) {
        e.preventDefault();
        const selected = suggestions[selectedIndex];
        saveRecentSearch(selected.name);
        setDropdownOpen(false);
        navigate(`/product/${selected.slug}`);
      }
    } else if (e.key === 'Escape') {
      setDropdownOpen(false);
    }
  };

  const toggleTheme = () => {
    const nextTheme = !isDark;
    setIsDark(nextTheme);
    try {
      localStorage.setItem('shopnest_theme', nextTheme ? 'dark' : 'light');
      if (nextTheme) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch {
      // ignore
    }
  };

  // Highlight matching text in autosuggest
  const highlightMatch = (text: string, query: string) => {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <span key={i} className="text-orange-400 font-bold underline decoration-orange-500/50">
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  return (
    <>
      {/* Accessible skip link */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:px-4 focus:py-2.5 focus:bg-orange-500 focus:text-white focus:rounded-xl focus:shadow-xl focus:font-bold focus:outline-none focus:ring-4 focus:ring-orange-400"
      >
        Skip to main content
      </a>

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

          {/* Global Search Bar with Smart Autosuggest */}
          <div ref={searchContainerRef} className="relative flex-1 max-w-2xl mx-2 md:mx-6">
            <form onSubmit={(e) => { e.preventDefault(); handleSearchSubmit(searchTerm); }}>
              <div className="relative group">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
                <input
                  ref={inputRef}
                  type="text"
                  value={searchTerm}
                  onFocus={() => setDropdownOpen(true)}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setDropdownOpen(true);
                  }}
                  onKeyDown={handleKeyDown}
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
                  aria-label="Submit search"
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-orange-500 hover:bg-orange-400 text-navy-950 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
                >
                  Search
                </button>
              </div>
            </form>

            {/* Autosuggest & Recent Searches Dropdown */}
            {dropdownOpen && (
              <div className="absolute left-0 right-0 top-full mt-2 bg-navy-800 border border-navy-600 rounded-2xl shadow-2xl overflow-hidden z-50 divide-y divide-navy-700">
                {/* Live Suggestions */}
                {searchTerm.trim().length >= 2 && suggestions.length > 0 && (
                  <div className="p-2">
                    <p className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                      Product Matches
                    </p>
                    <div className="space-y-1 mt-1">
                      {suggestions.map((item, idx) => (
                        <div
                          key={item.id}
                          onClick={() => {
                            saveRecentSearch(item.name);
                            setDropdownOpen(false);
                            navigate(`/product/${item.slug}`);
                          }}
                          className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-colors ${
                            idx === selectedIndex ? 'bg-orange-500/20 border border-orange-500/30' : 'hover:bg-navy-700/70'
                          }`}
                        >
                          <div className="w-10 h-10 rounded-lg bg-navy-900 border border-navy-700 flex items-center justify-center shrink-0 overflow-hidden p-1">
                            <ProductImage
                              src={item.image_url || '/products/photo-coming-soon.svg'}
                              alt={item.name}
                              aspectRatio="aspect-square"
                              className="w-full h-full"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-gray-100 truncate">
                              {highlightMatch(item.name, searchTerm.trim())}
                            </p>
                            <p className="text-[10px] text-gray-400 truncate">
                              <span className="text-orange-400 font-medium">{item.brand}</span> • {item.category_name}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-xs font-bold text-white">
                              {formatPaise(item.price_paise)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* No Live Suggestions Match */}
                {searchTerm.trim().length >= 2 && suggestions.length === 0 && (
                  <div className="p-4 text-center">
                    <p className="text-xs text-gray-300">No instant matches for "{searchTerm.trim()}"</p>
                    <button
                      type="button"
                      onClick={() => handleSearchSubmit(searchTerm)}
                      className="mt-2 text-xs font-bold text-orange-400 hover:text-orange-300 inline-flex items-center gap-1"
                    >
                      <span>Search full catalog for "{searchTerm.trim()}"</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Recent Searches Section */}
                {recentSearches.length > 0 && (
                  <div className="p-3 bg-navy-900/40">
                    <div className="flex items-center justify-between px-2 mb-1.5">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                        <History className="w-3 h-3 text-orange-400" />
                        <span>Recent Searches</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setRecentSearches([]);
                          localStorage.removeItem('shopnest_recent_searches');
                        }}
                        className="text-[10px] text-gray-400 hover:text-white"
                      >
                        Clear
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5 px-1">
                      {recentSearches.map((query, i) => (
                        <span
                          key={i}
                          onClick={() => {
                            setSearchTerm(query);
                            handleSearchSubmit(query);
                          }}
                          className="group inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-navy-700/80 hover:bg-navy-700 text-gray-300 hover:text-white border border-navy-600/60 cursor-pointer transition-colors"
                        >
                          <span>{query}</span>
                          <button
                            type="button"
                            onClick={(e) => removeRecentSearch(e, query)}
                            className="text-gray-400 hover:text-red-400 ml-0.5 p-0.5 rounded"
                            title="Remove from history"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Actions: Theme Toggle, Notifications, Account, Cart */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            
            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              title={isDark ? 'Switch to Light mode' : 'Switch to Dark mode'}
              aria-label={isDark ? 'Switch to Light mode' : 'Switch to Dark mode'}
              className="p-2 rounded-xl text-gray-300 hover:text-white hover:bg-navy-700 transition-colors"
            >
              {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-blue-300" />}
            </button>

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
                  <div className="absolute right-0 top-full mt-2 w-56 bg-navy-800 border border-navy-700 rounded-2xl shadow-2xl py-2 z-50">
                    <div className="px-4 py-2 border-b border-navy-700">
                      <p className="text-xs font-bold text-white truncate">{user.full_name}</p>
                      <p className="text-[10px] text-gray-400 truncate">{user.email}</p>
                    </div>

                    <div className="py-1">
                      <Link
                        to="/profile"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs text-gray-200 hover:bg-navy-700 hover:text-white transition-colors"
                      >
                        <User className="w-4 h-4 text-teal-400" />
                        <span>Profile & Security</span>
                      </Link>

                      <Link
                        to="/orders"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs text-gray-200 hover:bg-navy-700 hover:text-white transition-colors"
                      >
                        <Package className="w-4 h-4 text-orange-400" />
                        <span>My Orders</span>
                      </Link>

                      <Link
                        to="/wishlist"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs text-gray-200 hover:bg-navy-700 hover:text-white transition-colors"
                      >
                        <Heart className="w-4 h-4 text-red-400" />
                        <span>Wishlist</span>
                      </Link>

                      {user.role === 'ADMIN' && (
                        <Link
                          to="/admin"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-xs text-orange-400 hover:bg-navy-700 transition-colors font-medium"
                        >
                          <LayoutDashboard className="w-4 h-4" />
                          <span>Admin Console</span>
                        </Link>
                      )}
                    </div>

                    <div className="pt-1 border-t border-navy-700">
                      <button
                        type="button"
                        onClick={() => {
                          setUserDropdownOpen(false);
                          logout();
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-red-400 hover:bg-navy-700 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="text-xs font-semibold px-3 py-1.5 rounded-xl text-gray-200 hover:text-white hover:bg-navy-700 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="text-xs font-bold px-3 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-navy-950 shadow-md shadow-orange-500/20 transition-all"
                >
                  Sign Up
                </Link>
              </div>
            )}

            {/* Cart Button */}
            <Link
              to="/cart"
              aria-label="Shopping Cart"
              className="relative flex items-center gap-2 p-2 rounded-xl bg-navy-700/80 hover:bg-navy-700 text-white border border-navy-600 transition-colors"
            >
              <ShoppingCart className="w-5 h-5 text-orange-400" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-orange-500 text-white text-[11px] font-bold flex items-center justify-center ring-2 ring-navy-800">
                  {itemCount}
                </span>
              )}
            </Link>

          </div>

        </div>
      </header>

      {/* Visual Search Modal */}
      <VisualSearchModal
        isOpen={visualSearchOpen}
        onClose={() => setVisualSearchOpen(false)}
      />
    </>
  );
}
