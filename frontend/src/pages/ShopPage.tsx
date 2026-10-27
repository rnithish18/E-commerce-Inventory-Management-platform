import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Filter, 
  Search, 
  ArrowUpDown, 
  Check, 
  ChevronLeft, 
  ChevronRight, 
  RotateCcw 
} from 'lucide-react';
import { ProductCard, ProductData } from '../components/product/ProductCard';
import { ProductCardSkeleton } from '../components/ui/Skeleton';
import { useProducts } from '../hooks/useProducts';

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

  const currentCategory = searchParams.get('category') || '';
  const currentSearch = searchParams.get('search') || '';
  const currentSort = (searchParams.get('sort') || 'newest') as any;
  const currentPage = parseInt(searchParams.get('page') || '1', 10);
  const currentInStock = searchParams.get('in_stock') === 'true';

  const [searchInput, setSearchInput] = useState(currentSearch);

  useEffect(() => {
    setSearchInput(currentSearch);
  }, [currentSearch]);

  const { data, isLoading } = useProducts({
    page: currentPage,
    limit: 12,
    category: currentCategory || undefined,
    search: currentSearch || undefined,
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
    next.set('page', '1'); // Reset to page 1 on filter change
    setSearchParams(next);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateParam('search', searchInput.trim());
  };

  const resetAllFilters = () => {
    setSearchInput('');
    setSearchParams(new URLSearchParams());
  };

  return (
    <div className="flex flex-col gap-6">
      
      {/* Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-navy-700/60">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Explore All Products
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            {pagination ? `Showing ${products.length} of ${pagination.total} items` : 'Loading catalog items...'}
          </p>
        </div>

        {/* Search inside shop */}
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search catalog..."
            className="w-full bg-navy-800 border border-navy-600 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-gray-400 focus:outline-none focus:border-orange-500"
          />
        </form>
      </div>

      {/* Filter and Sort Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-navy-800/80 p-3 rounded-2xl border border-navy-700">
        
        {/* Category Pills / dropdown */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 max-w-full">
          <Filter className="w-4 h-4 text-orange-400 shrink-0 ml-1" />
          {CATEGORIES.map((cat) => (
            <button
              key={cat.slug}
              type="button"
              onClick={() => updateParam('category', cat.slug)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-colors ${
                currentCategory === cat.slug
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'bg-navy-700 text-gray-300 hover:text-white hover:bg-navy-600'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Right Sort & In-Stock filter */}
        <div className="flex items-center gap-3 ml-auto">
          {/* In-Stock Toggle */}
          <button
            type="button"
            onClick={() => updateParam('in_stock', currentInStock ? null : 'true')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
              currentInStock
                ? 'bg-green-500/20 text-green-400 border-green-500/40'
                : 'bg-navy-700 text-gray-400 border-navy-600 hover:text-gray-200'
            }`}
          >
            <Check className={`w-3.5 h-3.5 ${currentInStock ? 'opacity-100' : 'opacity-40'}`} />
            <span>In Stock Only</span>
          </button>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-1.5 bg-navy-700 px-3 py-1.5 rounded-xl border border-navy-600 text-xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
            <select
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

      {/* Active filters summary */}
      {(currentCategory || currentSearch || currentInStock) && (
        <div className="flex items-center gap-2 text-xs">
          <span className="text-gray-400 font-medium">Active filters:</span>
          {currentCategory && (
            <span className="bg-orange-500/10 text-orange-400 border border-orange-500/30 px-2 py-0.5 rounded-md font-semibold">
              Category: {CATEGORIES.find(c => c.slug === currentCategory)?.label}
            </span>
          )}
          {currentSearch && (
            <span className="bg-orange-500/10 text-orange-400 border border-orange-500/30 px-2 py-0.5 rounded-md font-semibold">
              Search: "{currentSearch}"
            </span>
          )}
          {currentInStock && (
            <span className="bg-green-500/10 text-green-400 border border-green-500/30 px-2 py-0.5 rounded-md font-semibold">
              In Stock Only
            </span>
          )}
          <button
            onClick={resetAllFilters}
            className="flex items-center gap-1 text-gray-400 hover:text-white ml-2"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        </div>
      )}

      {/* Products Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((p, idx) => (
            <ProductCard key={p.id} product={p} priority={idx < 4} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-navy-800/40 rounded-3xl border border-navy-700/60">
          <p className="text-gray-300 font-bold text-base mb-1">No products found</p>
          <p className="text-xs text-gray-400 max-w-sm mx-auto mb-4">
            Try adjusting your search terms, changing the category, or clearing filters.
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
        <div className="flex items-center justify-center gap-2 pt-6 pb-2">
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
  );
}
