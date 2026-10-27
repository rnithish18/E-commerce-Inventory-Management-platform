import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Filter, 
  Search, 
  ArrowUpDown, 
  Check, 
  ChevronLeft, 
  ChevronRight, 
  RotateCcw,
  X,
  Star,
  SlidersHorizontal,
  ChevronDown,
} from 'lucide-react';
import { ProductCard, ProductData } from '../components/product/ProductCard';
import { ProductCardSkeleton } from '../components/ui/Skeleton';
import { useProducts, useCatalogFilters } from '../hooks/useProducts';
import { formatPaise } from '../lib/utils';

const CATEGORIES = [
  { slug: '', label: 'All Categories' },
  { slug: 'electronics', label: 'Electronics' },
  { slug: 'fashion', label: 'Fashion' },
  { slug: 'home-living', label: 'Home & Living' },
  { slug: 'beauty-personal-care', label: 'Beauty & Personal Care' },
  { slug: 'sports-outdoors', label: 'Sports & Outdoors' },
  { slug: 'books-stationery', label: 'Books & Stationery' },
  { slug: 'toys-games', label: 'Toys & Games' },
];

export function ShopPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Parse params
  const currentCategory = searchParams.get('category') || '';
  const currentSearch = searchParams.get('search') || '';
  const currentSort = (searchParams.get('sort') || 'newest') as any;
  const currentPage = parseInt(searchParams.get('page') || '1', 10);
  const currentInStock = searchParams.get('in_stock') === 'true';
  const currentRating = searchParams.get('rating') ? parseInt(searchParams.get('rating')!, 10) : undefined;
  const currentDiscount = searchParams.get('discount') ? parseInt(searchParams.get('discount')!, 10) : undefined;
  const currentMinPrice = searchParams.get('min_price') ? parseInt(searchParams.get('min_price')!, 10) : undefined;
  const currentMaxPrice = searchParams.get('max_price') ? parseInt(searchParams.get('max_price')!, 10) : undefined;
  const currentBrands = (searchParams.get('brands') || '')
    .split(',')
    .map(b => b.trim())
    .filter(Boolean);

  const [searchInput, setSearchInput] = useState(currentSearch);
  const [localPriceRange, setLocalPriceRange] = useState<[number, number]>([
    currentMinPrice ? Math.floor(currentMinPrice / 100) : 0,
    currentMaxPrice ? Math.floor(currentMaxPrice / 100) : 90000,
  ]);

  useEffect(() => {
    setSearchInput(currentSearch);
  }, [currentSearch]);

  const { data: filterMetadata } = useCatalogFilters();

  const { data, isLoading } = useProducts({
    page: currentPage,
    limit: 12,
    category: currentCategory || undefined,
    search: currentSearch || undefined,
    brands: currentBrands.length > 0 ? currentBrands.join(',') : undefined,
    min_price: currentMinPrice,
    max_price: currentMaxPrice,
    rating: currentRating,
    discount: currentDiscount,
    sort: currentSort,
    in_stock: currentInStock ? 'true' : undefined,
  });

  const products: ProductData[] = data?.products || [];
  const pagination = data?.pagination;

  const updateParam = (key: string, val: string | null) => {
    const next = new URLSearchParams(searchParams);
    if (val && val !== '') {
      next.set(key, val);
    } else {
      next.delete(key);
    }
    next.set('page', '1');
    setSearchParams(next);
  };

  const toggleBrand = (brandName: string) => {
    const isSelected = currentBrands.includes(brandName);
    const updated = isSelected
      ? currentBrands.filter(b => b !== brandName)
      : [...currentBrands, brandName];
    updateParam('brands', updated.length > 0 ? updated.join(',') : null);
  };

  const handleApplyPrice = () => {
    const next = new URLSearchParams(searchParams);
    if (localPriceRange[0] > 0) {
      next.set('min_price', String(localPriceRange[0] * 100));
    } else {
      next.delete('min_price');
    }
    if (localPriceRange[1] < 90000) {
      next.set('max_price', String(localPriceRange[1] * 100));
    } else {
      next.delete('max_price');
    }
    next.set('page', '1');
    setSearchParams(next);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateParam('search', searchInput.trim());
  };

  const resetAllFilters = () => {
    setSearchInput('');
    setLocalPriceRange([0, 90000]);
    setSearchParams(new URLSearchParams());
  };

  const hasActiveFilters = Boolean(
    currentCategory ||
    currentSearch ||
    currentInStock ||
    currentBrands.length > 0 ||
    currentRating ||
    currentDiscount ||
    currentMinPrice ||
    currentMaxPrice
  );

  // Render filter sidebar contents (shared desktop & mobile drawer)
  const FilterContent = () => (
    <div className="flex flex-col gap-6 text-xs">
      
      {/* Brands Multi-Select */}
      <div className="border-b border-navy-700/70 pb-5">
        <h3 className="font-bold text-gray-200 uppercase tracking-wider mb-3">Brands</h3>
        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
          {filterMetadata?.brands && filterMetadata.brands.length > 0 ? (
            filterMetadata.brands.map((b) => {
              const checked = currentBrands.includes(b.name);
              return (
                <label
                  key={b.name}
                  className="flex items-center justify-between text-gray-300 hover:text-white cursor-pointer group"
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleBrand(b.name)}
                      className="w-4 h-4 rounded border-navy-600 bg-navy-900 text-orange-500 focus:ring-orange-500/20"
                    />
                    <span className={`text-xs ${checked ? 'text-orange-400 font-semibold' : ''}`}>
                      {b.name}
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-500 group-hover:text-gray-400">
                    ({b.count})
                  </span>
                </label>
              );
            })
          ) : (
            <p className="text-gray-500 text-[11px]">Loading brands...</p>
          )}
        </div>
      </div>

      {/* Price Range Slider */}
      <div className="border-b border-navy-700/70 pb-5">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-gray-200 uppercase tracking-wider">Price Range</h3>
          <span className="text-[11px] font-mono text-orange-400 font-semibold">
            ₹{localPriceRange[0]} - ₹{localPriceRange[1]}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="range"
            aria-label="Filter products by maximum price in rupees"
            min="0"
            max="90000"
            step="500"
            value={localPriceRange[1]}
            onChange={(e) => setLocalPriceRange([localPriceRange[0], parseInt(e.target.value, 10)])}
            className="w-full accent-orange-500 cursor-pointer"
          />
        </div>
        <button
          type="button"
          onClick={handleApplyPrice}
          className="mt-2.5 w-full py-1.5 rounded-lg bg-navy-700 hover:bg-navy-600 text-white font-semibold text-[11px] transition-colors"
        >
          Apply Price Filter
        </button>
      </div>

      {/* Customer Rating Filter */}
      <div className="border-b border-navy-700/70 pb-5">
        <h3 className="font-bold text-gray-200 uppercase tracking-wider mb-2.5">Customer Rating</h3>
        <div className="space-y-1.5">
          {[4, 3, 2].map((r) => {
            const active = currentRating === r;
            return (
              <button
                key={r}
                type="button"
                onClick={() => updateParam('rating', active ? null : String(r))}
                className={`w-full flex items-center justify-between p-2 rounded-xl transition-colors ${
                  active ? 'bg-orange-500/20 border border-orange-500/40 text-orange-400 font-bold' : 'hover:bg-navy-700/60 text-gray-300'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <div className="flex items-center text-amber-400">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${i < r ? 'fill-amber-400 text-amber-400' : 'text-gray-600'}`}
                      />
                    ))}
                  </div>
                  <span className="text-xs">& above</span>
                </div>
                {active && <Check className="w-3.5 h-3.5" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Minimum Discount Filter */}
      <div className="border-b border-navy-700/70 pb-5">
        <h3 className="font-bold text-gray-200 uppercase tracking-wider mb-2.5">Minimum Discount</h3>
        <div className="grid grid-cols-2 gap-1.5">
          {[10, 20, 30, 50].map((disc) => {
            const active = currentDiscount === disc;
            return (
              <button
                key={disc}
                type="button"
                onClick={() => updateParam('discount', active ? null : String(disc))}
                className={`py-1.5 px-2 rounded-lg text-center font-bold transition-colors ${
                  active
                    ? 'bg-orange-500 text-navy-950 shadow-sm'
                    : 'bg-navy-700/60 hover:bg-navy-700 text-gray-300'
                }`}
              >
                {disc}% & more
              </button>
            );
          })}
        </div>
      </div>

      {/* Availability / In-Stock */}
      <div>
        <label className="flex items-center gap-2 cursor-pointer text-gray-200 hover:text-white">
          <input
            type="checkbox"
            checked={currentInStock}
            onChange={() => updateParam('in_stock', currentInStock ? null : 'true')}
            className="w-4 h-4 rounded border-navy-600 bg-navy-900 text-orange-500 focus:ring-orange-500/20"
          />
          <span className="font-semibold text-xs">Exclude Out of Stock</span>
        </label>
      </div>

    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      
      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-navy-700/60">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Explore All Products
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            {pagination ? `Showing ${products.length} of ${pagination.total} catalog items` : 'Loading catalog items...'}
          </p>
        </div>

        {/* Search inside shop */}
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search catalog or brands..."
            className="w-full bg-navy-800 border border-navy-600 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-gray-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
          />
        </form>
      </div>

      {/* Category Pills & Mobile Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-navy-800/80 p-3 rounded-2xl border border-navy-700">
        
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 max-w-full">
          <Filter className="w-4 h-4 text-orange-400 shrink-0 ml-1" />
          {CATEGORIES.map((cat) => (
            <button
              key={cat.slug}
              type="button"
              onClick={() => updateParam('category', cat.slug)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-colors ${
                currentCategory === cat.slug
                  ? 'bg-orange-500 text-navy-950 shadow-sm'
                  : 'bg-navy-700 text-gray-300 hover:text-white hover:bg-navy-600'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Right Sort & Mobile Drawer Trigger */}
        <div className="flex items-center gap-2 sm:gap-3 ml-auto">
          {/* Mobile Filter Toggle Button */}
          <button
            type="button"
            onClick={() => setMobileDrawerOpen(true)}
            className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-navy-700 border border-navy-600 text-gray-200"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-orange-400" />
            <span>Filters</span>
          </button>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-1.5 bg-navy-700 px-3 py-1.5 rounded-xl border border-navy-600 text-xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
            <select
              aria-label="Sort products by"
              value={currentSort}
              onChange={(e) => updateParam('sort', e.target.value)}
              className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
            >
              <option value="newest" className="bg-navy-800 text-white">Newest First</option>
              <option value="price_asc" className="bg-navy-800 text-white">Price: Low to High</option>
              <option value="price_desc" className="bg-navy-800 text-white">Price: High to Low</option>
              <option value="rating_desc" className="bg-navy-800 text-white">Highest Rated</option>
              <option value="discount_desc" className="bg-navy-800 text-white">Biggest Discount</option>
            </select>
          </div>
        </div>

      </div>

      {/* Active Filter Chips Bar */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 text-xs py-1">
          <span className="text-gray-400 font-medium">Active filters:</span>
          
          {currentCategory && (
            <span className="inline-flex items-center gap-1 bg-orange-500/10 text-orange-400 border border-orange-500/30 px-2.5 py-1 rounded-lg font-semibold">
              <span>Category: {CATEGORIES.find(c => c.slug === currentCategory)?.label}</span>
              <button onClick={() => updateParam('category', null)} className="hover:text-white">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {currentSearch && (
            <span className="inline-flex items-center gap-1 bg-orange-500/10 text-orange-400 border border-orange-500/30 px-2.5 py-1 rounded-lg font-semibold">
              <span>Search: "{currentSearch}"</span>
              <button onClick={() => updateParam('search', null)} className="hover:text-white">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {currentBrands.map((brand) => (
            <span key={brand} className="inline-flex items-center gap-1 bg-orange-500/10 text-orange-400 border border-orange-500/30 px-2.5 py-1 rounded-lg font-semibold">
              <span>Brand: {brand}</span>
              <button onClick={() => toggleBrand(brand)} className="hover:text-white">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}

          {currentRating && (
            <span className="inline-flex items-center gap-1 bg-orange-500/10 text-orange-400 border border-orange-500/30 px-2.5 py-1 rounded-lg font-semibold">
              <span>Rating: {currentRating}★ & above</span>
              <button onClick={() => updateParam('rating', null)} className="hover:text-white">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {currentDiscount && (
            <span className="inline-flex items-center gap-1 bg-orange-500/10 text-orange-400 border border-orange-500/30 px-2.5 py-1 rounded-lg font-semibold">
              <span>Discount: {currentDiscount}%+</span>
              <button onClick={() => updateParam('discount', null)} className="hover:text-white">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {currentInStock && (
            <span className="inline-flex items-center gap-1 bg-green-500/10 text-green-400 border border-green-500/30 px-2.5 py-1 rounded-lg font-semibold">
              <span>In Stock Only</span>
              <button onClick={() => updateParam('in_stock', null)} className="hover:text-white">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {(currentMinPrice || currentMaxPrice) && (
            <span className="inline-flex items-center gap-1 bg-orange-500/10 text-orange-400 border border-orange-500/30 px-2.5 py-1 rounded-lg font-semibold">
              <span>Price: ₹{localPriceRange[0]} - ₹{localPriceRange[1]}</span>
              <button onClick={() => {
                const next = new URLSearchParams(searchParams);
                next.delete('min_price');
                next.delete('max_price');
                setSearchParams(next);
              }} className="hover:text-white">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          <button
            onClick={resetAllFilters}
            className="flex items-center gap-1 text-gray-400 hover:text-white ml-2 text-xs underline underline-offset-4"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Clear all</span>
          </button>
        </div>
      )}

      {/* Main Catalog Layout: Sidebar + Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        {/* Desktop Filter Sidebar */}
        <aside className="hidden lg:block lg:col-span-1 bg-navy-800/90 border border-navy-700/80 rounded-2xl p-5 shadow-lg sticky top-20">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-navy-700">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-orange-400" />
              <h2 className="font-bold text-white text-sm">Refine Catalog</h2>
            </div>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetAllFilters}
                className="text-[11px] text-gray-400 hover:text-white"
              >
                Reset
              </button>
            )}
          </div>
          <FilterContent />
        </aside>

        {/* Products Grid */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {Array.from({ length: 9 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {products.map((p, idx) => (
                <ProductCard key={p.id} product={p} priority={idx < 3} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-navy-800/40 rounded-3xl border border-navy-700/60">
              <p className="text-gray-300 font-bold text-base mb-1">No products match your filters</p>
              <p className="text-xs text-gray-400 max-w-sm mx-auto mb-4">
                Try expanding your price range, choosing different brands, or clearing active filters.
              </p>
              <button
                onClick={resetAllFilters}
                className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors"
              >
                Clear All Filters
              </button>
            </div>
          )}

          {/* Pagination Controls */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4 pb-2">
              <button
                disabled={!pagination.hasPrev}
                onClick={() => {
                  const next = new URLSearchParams(searchParams);
                  next.set('page', String(currentPage - 1));
                  setSearchParams(next);
                }}
                className="flex items-center gap-1 px-3 py-2 rounded-xl bg-navy-800 hover:bg-navy-700 text-white text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed border border-navy-700"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              <span className="text-xs font-bold text-gray-300 px-3">
                Page {pagination.page} of {pagination.totalPages}
              </span>

              <button
                disabled={!pagination.hasNext}
                onClick={() => {
                  const next = new URLSearchParams(searchParams);
                  next.set('page', String(currentPage + 1));
                  setSearchParams(next);
                }}
                className="flex items-center gap-1 px-3 py-2 rounded-xl bg-navy-800 hover:bg-navy-700 text-white text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed border border-navy-700"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

      </div>

      {/* Mobile Drawer */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-navy-950/80 backdrop-blur-sm"
            onClick={() => setMobileDrawerOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 w-full max-w-xs bg-navy-800 border-l border-navy-700 p-5 flex flex-col justify-between shadow-2xl z-50 overflow-y-auto">
            <div>
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-navy-700">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-orange-400" />
                  <h2 className="font-bold text-white text-sm">Filters</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileDrawerOpen(false)}
                  className="p-1 rounded-lg text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <FilterContent />
            </div>

            <div className="pt-6 border-t border-navy-700 mt-6 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  resetAllFilters();
                  setMobileDrawerOpen(false);
                }}
                className="flex-1 py-2 rounded-xl bg-navy-700 text-gray-300 text-xs font-semibold"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(false)}
                className="flex-1 py-2 rounded-xl bg-orange-500 text-white text-xs font-bold"
              >
                View Results
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
