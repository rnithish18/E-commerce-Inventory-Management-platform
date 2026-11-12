import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search, ShoppingCart, Heart, User, MapPin,
  ChevronDown, Package, LogOut, Settings, Bell,
  Camera, Sun, Moon, X,
} from 'lucide-react';
import { VisualSearchModal } from '../search/VisualSearchModal';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { productsApi, SuggestionItem } from '../../lib/api';

export function Topbar() {
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [accountOpen, setAccountOpen] = useState(false);
  const [visualSearchOpen, setVisualSearchOpen] = useState(false);
  const [pincode, setPincode] = useState(
    () => { try { return localStorage.getItem('shopnest_pincode') || ''; } catch { return ''; } }
  );
  const [pincodeOpen, setPincodeOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('shopnest_recent_searches');
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  });
  const [isDark, setIsDark] = useState(() => {
    try { return localStorage.getItem('shopnest_theme') === 'dark'; } catch { return false; }
  });

  const accountRef = useRef<HTMLDivElement>(null);
  const searchRef  = useRef<HTMLDivElement>(null);
  const pincodeRef = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLInputElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) setAccountOpen(false);
      if (searchRef.current  && !searchRef.current.contains(e.target as Node))  setSearchOpen(false);
      if (pincodeRef.current && !pincodeRef.current.contains(e.target as Node)) setPincodeOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Autosuggest
  useEffect(() => {
    const q = searchTerm.trim();
    if (q.length < 2) { setSuggestions([]); return; }
    const timer = setTimeout(async () => {
      try {
        const res = await productsApi.suggest(q);
        setSuggestions(res.data.suggestions || []);
        setSelectedIndex(-1);
      } catch { setSuggestions([]); }
    }, 180);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  function saveRecentSearch(q: string) {
    const t = q.trim(); if (!t) return;
    const updated = [t, ...recentSearches.filter(s => s.toLowerCase() !== t.toLowerCase())].slice(0, 5);
    setRecentSearches(updated);
    try { localStorage.setItem('shopnest_recent_searches', JSON.stringify(updated)); } catch { /**/ }
  }

  function handleSearchSubmit(q: string) {
    const t = q.trim();
    setSearchOpen(false);
    if (t) { saveRecentSearch(t); navigate(`/shop?search=${encodeURIComponent(t)}`); }
    else    { navigate('/shop'); }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!searchOpen) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault(); setSelectedIndex(p => Math.min(p + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault(); setSelectedIndex(p => Math.max(p - 1, -1));
    } else if (e.key === 'Enter') {
      if (selectedIndex >= 0 && suggestions[selectedIndex]) {
        e.preventDefault();
        saveRecentSearch(suggestions[selectedIndex].name);
        setSearchOpen(false);
        navigate(`/product/${suggestions[selectedIndex].slug}`);
      } else { handleSearchSubmit(searchTerm); }
    } else if (e.key === 'Escape') { setSearchOpen(false); }
  }

  function toggleTheme() {
    const next = !isDark;
    setIsDark(next);
    try {
      localStorage.setItem('shopnest_theme', next ? 'dark' : 'light');
      document.documentElement.classList.toggle('dark', next);
    } catch { /**/ }
  }

  function handleLogout() {
    logout();
    setAccountOpen(false);
    navigate('/');
  }

  function savePincode(e: React.FormEvent) {
    e.preventDefault();
    try { localStorage.setItem('shopnest_pincode', pincode); } catch { /**/ }
    setPincodeOpen(false);
  }

  const showSearchDropdown = searchOpen && (suggestions.length > 0 || recentSearches.length > 0 || searchTerm.length === 0);

  return (
    <>
      <header className="sticky top-0 z-40 bg-white dark:bg-navy-900 border-b border-surface-border dark:border-white/10 shadow-sm">
        <div className="max-w-screen-xl mx-auto px-3 sm:px-4 h-14 flex items-center gap-2 sm:gap-3">

          {/* Logo */}
          <Link
            to="/"
            className="shrink-0 text-lg font-bold text-neutral-900 dark:text-white leading-none select-none"
          >
            Shop<span className="text-primary">Nest</span>
          </Link>

          {/* Pincode — desktop only */}
          <div ref={pincodeRef} className="relative shrink-0 hidden lg:block">
            <button
              onClick={() => setPincodeOpen(o => !o)}
              className="flex items-center gap-1 text-xs text-neutral-500 dark:text-neutral-400 hover:text-primary transition-colors py-1"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span className="max-w-[80px] truncate">
                {pincode ? `Deliver to ${pincode}` : 'Select pincode'}
              </span>
              <ChevronDown className="w-3 h-3" />
            </button>
            {pincodeOpen && (
              <div className="absolute left-0 top-full mt-1 w-56 bg-white dark:bg-navy-800 border border-surface-border dark:border-white/10 rounded-card shadow-dropdown p-3 z-50">
                <p className="text-xs font-semibold text-neutral-700 dark:text-neutral-200 mb-2">Delivery pincode</p>
                <form onSubmit={savePincode} className="flex gap-2">
                  <input
                    value={pincode}
                    onChange={e => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="e.g. 400001"
                    maxLength={6}
                    className="input text-xs flex-1"
                  />
                  <button type="submit" className="btn-primary text-xs px-3 py-1.5">Save</button>
                </form>
              </div>
            )}
          </div>

          {/* Search bar — grows to fill space */}
          <div ref={searchRef} className="flex-1 relative min-w-0">
            <div className="flex items-center bg-neutral-100 dark:bg-navy-800 border border-neutral-200 dark:border-white/10 rounded-btn focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/30 transition">
              <Search className="ml-3 w-4 h-4 text-neutral-400 shrink-0 pointer-events-none" />
              <input
                ref={inputRef}
                id="topbar-search"
                type="search"
                value={searchTerm}
                onChange={e => { setSearchTerm(e.target.value); setSearchOpen(true); }}
                onFocus={() => setSearchOpen(true)}
                onKeyDown={handleKeyDown}
                onSubmit={() => handleSearchSubmit(searchTerm)}
                placeholder="Search products, brands and more…"
                aria-label="Search products"
                aria-autocomplete="list"
                className="flex-1 bg-transparent pl-2 pr-2 py-2 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none min-w-0"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => { setSearchTerm(''); setSuggestions([]); inputRef.current?.focus(); }}
                  className="p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="button"
                title="Visual search"
                onClick={() => setVisualSearchOpen(true)}
                className="px-3 border-l border-neutral-200 dark:border-white/10 text-neutral-400 hover:text-primary transition-colors py-2"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>

            {/* Search dropdown */}
            {showSearchDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-navy-800 border border-surface-border dark:border-white/10 rounded-card shadow-dropdown z-50 max-h-80 overflow-y-auto">
                {suggestions.length > 0 ? (
                  <>
                    <div className="px-3 pt-2 pb-1 text-[11px] text-neutral-500 uppercase tracking-wide font-semibold">Suggestions</div>
                    {suggestions.slice(0, 6).map((s, i) => (
                      <button
                        key={s.slug}
                        className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors ${
                          i === selectedIndex ? 'bg-neutral-50 dark:bg-navy-700' : 'hover:bg-neutral-50 dark:hover:bg-navy-700'
                        }`}
                        onClick={() => { saveRecentSearch(s.name); navigate(`/product/${s.slug}`); setSearchOpen(false); }}
                      >
                        <Search className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                        <span className="text-neutral-900 dark:text-white">{s.name}</span>
                        {s.brand && <span className="text-xs text-neutral-400 ml-auto">{s.brand}</span>}
                      </button>
                    ))}
                  </>
                ) : recentSearches.length > 0 ? (
                  <>
                    <div className="px-3 pt-2 pb-1 text-[11px] text-neutral-500 uppercase tracking-wide font-semibold">Recent</div>
                    {recentSearches.map(r => (
                      <button
                        key={r}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-neutral-50 dark:hover:bg-navy-700 text-left transition-colors"
                        onClick={() => handleSearchSubmit(r)}
                      >
                        <Search className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                        <span className="text-neutral-700 dark:text-neutral-300">{r}</span>
                      </button>
                    ))}
                  </>
                ) : null}
                {searchTerm.trim().length >= 2 && (
                  <button
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-primary font-medium hover:bg-primary-light border-t border-surface-border dark:border-white/10"
                    onClick={() => handleSearchSubmit(searchTerm)}
                  >
                    <Search className="w-3.5 h-3.5" />
                    Search for "{searchTerm.trim()}"
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-0.5 shrink-0">

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              className="p-2 rounded-btn text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-navy-800 transition-colors"
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Notification bell — signed-in users only */}
            {user && (
              <button
                title="Notifications"
                className="p-2 rounded-btn text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-navy-800 transition-colors hidden sm:flex"
              >
                <Bell className="w-5 h-5" />
              </button>
            )}

            {/* Wishlist */}
            <Link
              to="/wishlist"
              title="Wishlist"
              className="hidden sm:flex p-2 rounded-btn text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-navy-800 transition-colors"
            >
              <Heart className="w-5 h-5" />
            </Link>

            {/* Cart */}
            <Link
              to="/cart"
              title="Cart"
              className="relative p-2 rounded-btn text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-navy-800 transition-colors"
            >
              <ShoppingCart className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-primary text-white text-[10px] font-bold leading-none px-1">
                  {itemCount > 99 ? '99+' : itemCount}
                </span>
              )}
            </Link>

            {/* Account dropdown */}
            <div ref={accountRef} className="relative">
              <button
                onClick={() => user ? setAccountOpen(o => !o) : navigate('/login')}
                title={user ? user.full_name : 'Sign in'}
                className="flex items-center gap-1.5 p-2 rounded-btn text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-navy-800 transition-colors"
              >
                <User className="w-5 h-5" />
                <span className="hidden lg:block text-xs font-medium max-w-[80px] truncate">
                  {user ? user.full_name.split(' ')[0] : 'Sign in'}
                </span>
                {user && <ChevronDown className="hidden lg:block w-3 h-3" />}
              </button>

              {accountOpen && user && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-navy-800 border border-surface-border dark:border-white/10 rounded-card shadow-dropdown z-50 py-1">
                  <div className="px-3 py-2 border-b border-surface-border dark:border-white/10">
                    <p className="text-xs font-semibold text-neutral-900 dark:text-white truncate">{user.full_name}</p>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">{user.email}</p>
                  </div>
                  <MenuLink to="/orders" icon={Package} label="My Orders" onClick={() => setAccountOpen(false)} />
                  <MenuLink to="/wishlist" icon={Heart} label="Wishlist" onClick={() => setAccountOpen(false)} />
                  <MenuLink to="/profile" icon={Settings} label="Profile" onClick={() => setAccountOpen(false)} />
                  <MenuLink to="/track-order" icon={Package} label="Track Order" onClick={() => setAccountOpen(false)} />
                  {user.role === 'ADMIN' && (
                    <MenuLink to="/admin" icon={Settings} label="Admin Panel" onClick={() => setAccountOpen(false)} />
                  )}
                  <div className="border-t border-surface-border dark:border-white/10 mt-1">
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Visual search modal */}
      {visualSearchOpen && (
        <VisualSearchModal isOpen={visualSearchOpen} onClose={() => setVisualSearchOpen(false)} />
      )}
    </>
  );
}

function MenuLink({ to, icon: Icon, label, onClick }: {
  to: string; icon: React.ElementType; label: string; onClick: () => void;
}) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-2 text-xs text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-navy-700 transition-colors"
    >
      <Icon className="w-3.5 h-3.5 text-neutral-400" />
      {label}
    </Link>
  );
}
