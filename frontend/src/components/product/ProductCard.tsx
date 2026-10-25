import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Star, ShoppingCart, Check } from 'lucide-react';
import { formatPaise, discountPercent } from '../../lib/utils';
import { useCart } from '../../contexts/CartContext';
import { useWishlist } from '../../contexts/WishlistContext';

export interface ProductData {
  id: string;
  name: string;
  slug: string;
  brand?: string;
  category_name?: string;
  category_slug?: string;
  price_paise: number;
  mrp_paise: number;
  badge?: string | null;
  average_rating?: string | number | null;
  rating_count?: number;
  total_stock?: number;
  image_url?: string | null;
}

interface Props {
  product: ProductData;
}

export function ProductCard({ product }: Props) {
  const { addToCart } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const [isAdded, setIsAdded] = useState(false);

  const wishlisted = isWishlisted(product.id);
  const discount = discountPercent(product.price_paise, product.mrp_paise);
  
  // Real rating calculation: show "No reviews yet" if 0 reviews
  const reviewCount = Number(product.rating_count || 0);
  const hasReviews = reviewCount > 0 && product.average_rating != null;
  const rating = hasReviews ? Number(product.average_rating).toFixed(1) : null;
  const inStock = (product.total_stock ?? 1) > 0;

  const handleToggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await toggleWishlist(product);
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!inStock) return;
    setIsAdded(true);
    await addToCart(product.id, undefined, 1);
    setTimeout(() => setIsAdded(false), 2000);
  };

  // Badge color mapping
  const badgeColors: Record<string, string> = {
    'Best Seller': 'bg-amber-500 text-black font-extrabold',
    'Hot': 'bg-red-500 text-white font-bold',
    'Trending': 'bg-purple-500 text-white font-bold',
    'Sale': 'bg-green-500 text-white font-bold',
    'New': 'bg-blue-500 text-white font-bold',
  };

  return (
    <div className="group relative flex flex-col bg-navy-800/90 rounded-2xl border border-navy-700/80 hover:border-orange-500/50 p-3.5 transition-all duration-200 hover:-translate-y-1 shadow-lg hover:shadow-orange-500/10">
      
      {/* Top action row: Badge & Wishlist Heart */}
      <div className="absolute top-5 left-5 right-5 z-10 flex items-center justify-between pointer-events-none">
        {product.badge ? (
          <span className={`px-2 py-0.5 rounded-full text-[10px] tracking-wider uppercase shadow-sm pointer-events-auto ${badgeColors[product.badge] || 'bg-orange-500 text-white'}`}>
            {product.badge}
          </span>
        ) : <div />}

        <button
          type="button"
          onClick={handleToggleWishlist}
          title={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          className={`pointer-events-auto p-2 rounded-xl backdrop-blur-md transition-all ${
            wishlisted 
              ? 'bg-red-500/20 text-red-500 border border-red-500/40' 
              : 'bg-navy-900/70 text-gray-400 hover:text-white border border-white/10 hover:bg-navy-900'
          }`}
        >
          <Heart className={`w-3.5 h-3.5 ${wishlisted ? 'fill-red-500 text-red-500' : ''}`} />
        </button>
      </div>

      {/* Image Container */}
      <Link to={`/product/${product.slug}`} className="block relative aspect-square rounded-xl overflow-hidden bg-navy-900/60 mb-3">
        <img
          src={product.image_url || `https://placehold.co/400x400/0f172a/f97316?text=${encodeURIComponent(product.brand || 'ShopNest')}`}
          alt={product.name}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src = `https://placehold.co/400x400/0f172a/f97316?text=${encodeURIComponent(product.brand || 'ShopNest')}`;
          }}
        />
        {!inStock && (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center">
            <span className="bg-red-500/90 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              Out of Stock
            </span>
          </div>
        )}
      </Link>

      {/* Brand & Category */}
      <div className="flex items-center justify-between text-[11px] text-gray-400 mb-1">
        <span className="font-semibold text-orange-400 truncate max-w-[140px]">
          {product.brand || 'ShopNest Choice'}
        </span>
        {product.category_name && (
          <span className="truncate max-w-[100px] text-gray-500">
            {product.category_name}
          </span>
        )}
      </div>

      {/* Title */}
      <Link 
        to={`/product/${product.slug}`}
        className="font-bold text-sm text-gray-100 hover:text-orange-400 transition-colors line-clamp-2 leading-snug mb-2 flex-1"
        title={product.name}
      >
        {product.name}
      </Link>

      {/* Real Rating & Reviews */}
      <div className="flex items-center gap-1.5 mb-2.5 min-h-[22px]">
        {hasReviews ? (
          <>
            <div className="flex items-center gap-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded-md text-[11px] font-bold">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span>{rating}</span>
            </div>
            <span className="text-[11px] text-gray-400">
              ({reviewCount})
            </span>
          </>
        ) : (
          <span className="text-[11px] text-gray-500 italic">
            No reviews yet
          </span>
        )}
      </div>

      {/* Price row — unclipped layout */}
      <div className="flex items-center flex-wrap gap-1.5 mb-3">
        <span className="text-base font-extrabold text-white">
          {formatPaise(product.price_paise)}
        </span>
        {product.mrp_paise > product.price_paise && (
          <>
            <span className="text-xs text-gray-500 line-through">
              {formatPaise(product.mrp_paise)}
            </span>
            <span className="text-[10px] font-bold text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded whitespace-nowrap shrink-0">
              {discount}% OFF
            </span>
          </>
        )}
      </div>

      {/* Add to Cart CTA */}
      <button
        type="button"
        disabled={!inStock}
        onClick={handleAddToCart}
        className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md ${
          !inStock
            ? 'bg-navy-700 text-gray-500 cursor-not-allowed border border-navy-600'
            : isAdded
            ? 'bg-green-600 text-white shadow-green-500/20'
            : 'bg-orange-500 hover:bg-orange-600 text-white shadow-orange-500/20 active:scale-95'
        }`}
      >
        {isAdded ? (
          <>
            <Check className="w-4 h-4" />
            <span>Added!</span>
          </>
        ) : (
          <>
            <ShoppingCart className="w-4 h-4" />
            <span>{inStock ? 'Add to Cart' : 'Out of Stock'}</span>
          </>
        )}
      </button>

    </div>
  );
}
