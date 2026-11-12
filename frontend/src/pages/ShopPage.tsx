import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search, ArrowUpDown, Check, ChevronLeft, ChevronRight,
  X, Star, SlidersHorizontal, ChevronDown, LayoutGrid, List,
} from 'lucide-react';
import { ProductCard, ProductData } from '../components/product/ProductCard';
import { ProductCardSkeleton } from '../components/ui/Skeleton';
import { useProducts, useCatalogFilters } from '../hooks/useProducts';
import { formatPaise } from '../lib/utils';

export function ShopPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [gridDense, setGridDense]               = useState(false);
  const [brandSearch, setBrandSearch]           = useState('');
  const [brandsExpanded, setBrandsExpanded]     = useState(true);
  const [priceExpanded, setPriceExpanded]       = useState(true);
  const [ratingExpanded, setRatingExpanded]     = useState(true);
  const [discountExpanded, setDiscountExpanded] = useState(true);

  // ── URL params ──────────────────────────────────────────────────────────
  const currentCategory = searchParams.get('category')   || '';
  const currentSearch   = searchParams.get('search')     || '';
  const currentSort     = (searchParams.get('sort')      || 'newest') as string;
  const currentPage     = parseInt(searchParams.get('page') || '1', 10);
  const currentInStock  = searchParams.get('in_stock')   === 'true';
  const currentRating   = searchParams.get('rating')     ? parseInt(searchParams.get('rating')!, 10) : undefined;
  const currentDiscount = searchParams.get('discount')   ? parseInt(searchParams.get('discount')!, 10) : undefined;
  const currentMinPrice = searchParams.get('min_price')  ? parseInt(searchParams.get('min_price')!, 10) : undefined;
  const currentMaxPrice = searchParams.get('max_price')  ? parseInt(searchParams.get('max_price')!, 10) : undefined;
  const currentBrands   = (searchParams.get('brands') || '').split(',').map(b => b.trim()).filter(Boolean);

  const [searchInput, setSearchInput]       = useState(currentSearch);
  const [localMinPrice, setLocalMinPrice]   = useState(currentMinPrice ? Math.floor(currentMinPrice / 100) : 0);
  const [localMaxPrice, setLocalMaxPrice]   = useState(currentMaxPrice ? Math.floor(currentMaxPrice / 100) : 90000);

  useEffect(() => { setSearchInput(currentSearch); }, [currentSearch]);

  // ── Data ────────────────────────────────────────────────────────────────
  const { data: filterMeta } = useCatalogFilters();
  const { data, isLoading }  = useProducts({
    page:      currentPage,
    limit:     gridDense ? 20 : 12,
    category:  currentCategory || undefined,
    search:    currentSearch   || undefined,
    brands:    currentBrands.length > 0 ? currentBrands.join(',') : undefined,
    min_price: currentMinPrice,
    max_price: currentMaxPrice,
    rating:    currentRating,
    discount:  currentDiscount,
    sort:      currentSort as any,
    in_stock:  currentInStock ? 'true' : undefined,
  });

  const products: ProductData[] = data?.products    || [];
  const pagination               = data?.pagination;

  // ── Helpers ─────────────────────────────────────────────────────────────
  function updateParam(key: string, val: string | null) {
    const next = new URLSearchParams(searchParams);
    if (val && val !== '') next.set(key, val); else next.delete(key);
    next.set('page', '1');
    setSearchParams(next);
  }

  function toggleBrand(name: string) {
    const updated = currentBrands.includes(name)
      ? currentBrands.filter(b => b !== name)
      : [...currentBrands, name];
    updateParam('brands', updated.length > 0 ? updated.join(',') : null);
  }

  function applyPrice() {
    const next = new URLSearchParams(searchParams);
    if (localMinPrice > 0)     next.set('min_price', String(localMinPrice * 100)); else next.delete('min_price');
    if (localMaxPrice < 90000) next.set('max_price', String(localMaxPrice * 100)); else next.delete('max_price');
    next.set('page', '1');
    setSearchParams(next);
  }

  function resetAll() {
    setSearchInput('');
    setLocalMinPrice(0);
    setLocalMaxPrice(90000);
    setSearchParams(new URLSearchParams());
  }

  const hasActiveFilters = Boolean(
    currentCategory || currentSearch || currentInStock ||
    currentBrands.length || currentRating || currentDiscount ||
    currentMinPrice || currentMaxPrice
  );

  const filteredBrands = (filterMeta?.brands || []).filter(b =>
    b.name.toLowerCase().includes(brandSearch.toLowerCase())
  );

  // ── Filter panel (shared desktop + mobile) ───────────────────────────────
  const FilterPanel = () => (
    <div className="text-sm space-y-0">

      {/* Brands */}
      <FilterGroup
        title="Brand"
        expanded={brandsExpanded}
        onToggle={() => setBrandsExpanded(e => !e)}
      >
        <input
          value={brandSearch}
          onChange={e => setBrandSearch(e.target.value)}
          placeholder="Search brands…"
          className="input text-xs mb-2"
        />
        <div className="space-y-1 max-h-44 overflow-y-auto pr-1">
          {filteredBrands.length === 0 && (
            <p className="text-xs text-neutral-400 py-1">No brands found</p>
          )}
          {filteredBrands.map(b => {
            const checked = currentBrands.includes(b.name);
            return (
              <label
                key={b.name}
                className="flex items-center justify-between cursor-pointer group py-0.5"
              >
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleBrand(b.name)}
                    className="w-3.5 h-3.5 rounded border-neutral-300 dark:border-white/20 text-primary focus:ring-primary/30 accent-primary"
                  />
                  <span className={`text-xs ${checked ? 'text-primary font-medium' : 'text-neutral-700 dark:text-neutral-300'}`}>
                    {b.name}
                  </span>
                </div>
                <span className="text-[10px] text-neutral-400">({b.count})</span>
              </label>
            );
          })}
        </div>
      </FilterGroup>

      {/* Price range */}
      <FilterGroup
        title="Price"
        expanded={priceExpanded}
        onToggle={() => setPriceExpanded(e => !e)}
      >
        <div className="flex gap-2 mb-2">
          <div className="flex-1">
            <label className="text-[10px] text-neutral-500 dark:text-neutral-400 mb-0.5 block">Min (₹)</label>
            <input
              type="number"
              min={0} max={localMaxPrice}
              value={localMinPrice}
              onChange={e => setLocalMinPrice(Math.max(0, parseInt(e.target.value) || 0))}
              className="input text-xs"
            />
          </div>
          <div className="flex-1">
            <label className="text-[10px] text-neutral-500 dark:text-neutral-400 mb-0.5 block">Max (₹)</label>
            <input
              type="number"
              min={localMinPrice} max={90000}
              value={localMaxPrice}
              onChange={e => setLocalMaxPrice(Math.min(90000, parseInt(e.target.value) || 90000))}
              className="input text-xs"
            />
          </div>
        </div>
        <input
          type="range"
          min={0} max={90000} step={500}
          value={localMaxPrice}
          onChange={e => setLocalMaxPrice(parseInt(e.target.value))}
          aria-label="Maximum price"
          className="w-full accent-primary cursor-pointer"
        />
        <button
          onClick={applyPrice}
          className="mt-2 w-full btn-primary text-xs py-1.5"
        >
          Apply
        </button>
      </FilterGroup>

      {/* Rating */}
      <FilterGroup
        title="Rating"
        expanded={ratingExpanded}
        onToggle={() => setRatingExpanded(e => !e)}
      >
        <div className="space-y-1">
          {[4, 3, 2].map(r => {
            const active = currentRating === r;
            return (
              <button
                key={r}
                type="button"
                onClick={() => updateParam('rating', active ? null : String(r))}
                className={`w-full flex items-center justify-between px-2 py-1.5 rounded-btn text-xs transition-colors ${
                  active
                    ? 'bg-primary/10 border border-primary/30 text-primary font-medium'
                    : 'hover:bg-neutral-50 dark:hover:bg-navy-800 text-neutral-700 dark:text-neutral-300'
                }`}
              >
                <span className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3 h-3 ${i < r ? 'fill-amber-400 text-amber-400' : 'text-neutral-200 dark:text-neutral-600'}`}
                    />
                  ))}
                  <span className="ml-1 whitespace-nowrap">{r}★ &amp; above</span>
                </span>
                {active && <Check className="w-3 h-3" />}
              </button>
            );
          })}
        </div>
      </FilterGroup>

      {/* Discount */}
      <FilterGroup
        title="Discount"
        expanded={discountExpanded}
        onToggle={() => setDiscountExpanded(e => !e)}
      >
        <div className="grid grid-cols-2 gap-1.5">
          {[10, 20, 30, 50].map(disc => {
            const active = currentDiscount === disc;
            return (
              <button
                key={disc}
                type="button"
                onClick={() => updateParam('discount', active ? null : String(disc))}
                className={`py-1.5 px-2 rounded-btn text-center text-xs font-medium transition-colors whitespace-nowrap ${
                  active
                    ? 'bg-primary text-white'
                    : 'bg-neutral-100 dark:bg-navy-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-navy-700'
                }`}
              >
                {disc}% or more
              </button>
            );
          })}
        </div>
      </FilterGroup>

      {/* Availability */}
      <div className="px-4 py-3 border-b border-surface-border dark:border-white/10">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={currentInStock}
            onChange={() => updateParam('in_stock', currentInStock ? null : 'true')}
            className="w-3.5 h-3.5 rounded border-neutral-300 dark:border-white/20 accent-primary"
          />
          <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">In stock only</span>
        </label>
      </div>

      {/* Reset */}
      {hasActiveFilters && (
        <div className="px-4 py-3">
          <button
            onClick={resetAll}
            className="w-full btn-secondary text-xs py-1.5"
          >
            Clear all filters
          </button>
        </div>
      )}
    </div>
  );

  // ── Main render ──────────────────────────────────────────────────────────
  return (
    <div className="flex gap-6">

      {/* ── Desktop filter sidebar ── */}
      <aside className="hidden lg:block w-56 xl:w-64 shrink-0 filter-sidebar">
        <div className="sticky top-28 bg-white dark:bg-navy-800 border border-surface-border dark:border-white/10 rounded-card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-surface-border dark:border-white/10">
            <span className="text-sm font-semibold text-neutral-900 dark:text-white">Filters</span>
            {hasActiveFilters && (
              <button onClick={resetAll} className="text-xs text-primary hover:underline">Clear</button>
            )}
          </div>
          <FilterPanel />
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="flex-1 min-w-0">

        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Mobile filter toggle */}
            <button
              type="button"
              onClick={() => setMobileFilterOpen(true)}
              className="lg:hidden flex items-center gap-1.5 btn-secondary text-xs py-1.5"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Filters {hasActiveFilters && <span className="bg-primary text-white rounded-full w-4 h-4 flex items-center justify-center text-[9px]">{[currentCategory,currentSearch,...currentBrands,currentRating,currentDiscount].filter(Boolean).length}</span>}
            </button>

            {/* Result count */}
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              {pagination
                ? `${pagination.total.toLocaleString('en-IN')} result${pagination.total !== 1 ? 's' : ''}`
                : isLoading ? 'Loading…' : ''}
              {currentSearch && <span className="font-medium text-neutral-900 dark:text-white"> for "{currentSearch}"</span>}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Sort */}
            <div className="flex items-center gap-1.5 bg-white dark:bg-navy-800 border border-surface-border dark:border-white/10 rounded-btn px-2.5 py-1.5 text-xs">
              <ArrowUpDown className="w-3.5 h-3.5 text-neutral-400" />
              <select
                aria-label="Sort products"
                value={currentSort}
                onChange={e => updateParam('sort', e.target.value)}
                className="bg-transparent text-neutral-700 dark:text-neutral-300 font-medium focus:outline-none cursor-pointer"
              >
                <option value="newest">Newest</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="rating_desc">Highest Rated</option>
                <option value="discount_desc">Biggest Discount</option>
              </select>
            </div>

            {/* Grid density */}
            <button
              onClick={() => setGridDense(d => !d)}
              title={gridDense ? 'Standard grid' : 'Dense grid'}
              className="p-1.5 rounded-btn bg-white dark:bg-navy-800 border border-surface-border dark:border-white/10 text-neutral-500 dark:text-neutral-400 hover:text-primary transition-colors"
            >
              {gridDense ? <LayoutGrid className="w-4 h-4" /> : <List className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Active filter chips */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {currentCategory && (
              <FilterChip label={currentCategory} onRemove={() => updateParam('category', null)} />
            )}
            {currentSearch && (
              <FilterChip label={`"${currentSearch}"`} onRemove={() => updateParam('search', null)} />
            )}
            {currentBrands.map(b => (
              <FilterChip key={b} label={b} onRemove={() => toggleBrand(b)} />
            ))}
            {currentRating && (
              <FilterChip label={`${currentRating}★+`} onRemove={() => updateParam('rating', null)} />
            )}
            {currentDiscount && (
              <FilterChip label={`≥${currentDiscount}% off`} onRemove={() => updateParam('discount', null)} />
            )}
            {(currentMinPrice || currentMaxPrice) && (
              <FilterChip
                label={`₹${currentMinPrice ? Math.floor(currentMinPrice/100) : 0}–₹${currentMaxPrice ? Math.floor(currentMaxPrice/100) : '∞'}`}
                onRemove={() => { updateParam('min_price', null); updateParam('max_price', null); }}
              />
            )}
          </div>
        )}

        {/* Product grid */}
        {isLoading ? (
          <div className={`grid gap-3 ${gridDense ? 'grid-cols-3 sm:grid-cols-4 lg:grid-cols-5' : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4'}`}>
            {Array.from({ length: gridDense ? 20 : 12 }).map((_, i) => <ProductCardSkeleton key={i} />)}
          </div>
        ) : products.length > 0 ? (
          <div className={`grid gap-3 ${gridDense ? 'grid-cols-3 sm:grid-cols-4 lg:grid-cols-5' : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4'}`}>
            {products.map((p, i) => (
              <ProductCard key={p.id} product={p} priority={i < 4} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white dark:bg-navy-800 rounded-card border border-surface-border dark:border-white/10">
            <Search className="w-8 h-8 text-neutral-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-neutral-900 dark:text-white mb-1">No products found</p>
            <p className="text-xs text-neutral-500 mb-4">Try adjusting your filters or search term</p>
            <button onClick={resetAll} className="btn-primary text-xs">Clear filters</button>
          </div>
        )}

        {/* Numbered pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="flex items-center justify-center gap-1 mt-6 flex-wrap">
            <button
              onClick={() => updateParam('page', String(currentPage - 1))}
              disabled={currentPage <= 1}
              className="p-1.5 rounded-btn border border-surface-border dark:border-white/10 disabled:opacity-30 text-neutral-600 dark:text-neutral-400 hover:border-primary hover:text-primary transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: Math.min(pagination.pages, 7) }, (_, i) => {
              let page: number;
              if (pagination.pages <= 7) {
                page = i + 1;
              } else if (currentPage <= 4) {
                page = i + 1 < 6 ? i + 1 : i + 1 === 6 ? -1 : pagination.pages;
              } else if (currentPage >= pagination.pages - 3) {
                const start = pagination.pages - 6;
                page = i === 0 ? 1 : i === 1 ? -1 : start + i;
              } else {
                const offsets = [1, -1, currentPage - 1, currentPage, currentPage + 1, -1, pagination.pages];
                page = offsets[i];
              }

              if (page === -1) return <span key={`ellipsis-${i}`} className="px-1 text-neutral-400 text-sm">…</span>;

              return (
                <button
                  key={page}
                  onClick={() => updateParam('page', String(page))}
                  className={`w-8 h-8 rounded-btn text-xs font-medium transition-colors ${
                    page === currentPage
                      ? 'bg-primary text-white'
                      : 'border border-surface-border dark:border-white/10 text-neutral-600 dark:text-neutral-400 hover:border-primary hover:text-primary'
                  }`}
                >
                  {page}
                </button>
              );
            })}

            <button
              onClick={() => updateParam('page', String(currentPage + 1))}
              disabled={currentPage >= (pagination.pages ?? 1)}
              className="p-1.5 rounded-btn border border-surface-border dark:border-white/10 disabled:opacity-30 text-neutral-600 dark:text-neutral-400 hover:border-primary hover:text-primary transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* ── Mobile filter drawer ── */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden" role="dialog" aria-label="Filters">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileFilterOpen(false)} />
          <div className="relative ml-auto w-72 max-w-full h-full bg-white dark:bg-navy-900 shadow-dropdown flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-surface-border dark:border-white/10">
              <span className="font-semibold text-neutral-900 dark:text-white">Filters</span>
              <button onClick={() => setMobileFilterOpen(false)} className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-navy-800">
                <X className="w-4 h-4 text-neutral-500" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <FilterPanel />
            </div>
            <div className="border-t border-surface-border dark:border-white/10 p-3">
              <button onClick={() => setMobileFilterOpen(false)} className="btn-primary w-full py-2.5">
                Show results {pagination ? `(${pagination.total})` : ''}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Sub-components ───────────────────────────────────────────────────────── */

function FilterGroup({
  title, expanded, onToggle, children,
}: {
  title: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-surface-border dark:border-white/10">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <span className="text-xs font-semibold text-neutral-900 dark:text-white uppercase tracking-wide">{title}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-neutral-400 transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>
      {expanded && <div className="px-4 pb-3">{children}</div>}
    </div>
  );
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 pl-2.5 pr-1 py-0.5 bg-primary/10 text-primary text-xs font-medium rounded-chip">
      {label}
      <button onClick={onRemove} className="p-0.5 hover:bg-primary/20 rounded-full transition-colors">
        <X className="w-3 h-3" />
      </button>
    </span>
  );
}
