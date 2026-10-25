import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, ArrowRight } from 'lucide-react';
import { useWishlist } from '../../contexts/WishlistContext';
import { ProductCard } from '../../components/product/ProductCard';

export function WishlistPage() {
  const { items, isLoading } = useWishlist();

  return (
    <div className="py-2">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-navy-700/60">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Heart className="w-6 h-6 text-red-500 fill-red-500" />
            <span>My Wishlist</span>
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Keep track of products you love and purchase them when you are ready.
          </p>
        </div>
        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-navy-700 text-gray-300 border border-navy-600">
          {items.length} {items.length === 1 ? 'Saved Item' : 'Saved Items'}
        </span>
      </div>

      {/* Loading Skeleton */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="bg-navy-800/80 rounded-2xl p-4 border border-navy-700 animate-pulse h-80 flex flex-col justify-between"
            >
              <div className="aspect-square bg-navy-700/60 rounded-xl" />
              <div className="space-y-2 mt-3">
                <div className="h-3 bg-navy-700/60 rounded w-2/3" />
                <div className="h-4 bg-navy-700/60 rounded w-full" />
                <div className="h-4 bg-navy-700/60 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        /* Empty State */
        <div className="bg-navy-800/60 rounded-3xl border border-navy-700/60 p-12 text-center max-w-lg mx-auto my-8">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto mb-4">
            <Heart className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-bold text-white mb-1.5">
            Your Wishlist is Empty
          </h2>
          <p className="text-xs text-gray-400 leading-relaxed mb-6">
            Explore our curated catalog and tap the heart icon on any product to save it to your wishlist.
          </p>
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs px-6 py-3 rounded-xl shadow-lg shadow-orange-500/20 transition-all hover:scale-[1.02]"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Discover Products</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        /* Product Cards Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
export default WishlistPage;
