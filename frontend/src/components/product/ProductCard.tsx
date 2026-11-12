import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, Star } from 'lucide-react';
import { formatPaise, discountPercent } from '../../lib/utils';
import { useCart } from '../../contexts/CartContext';
import { useWishlist } from '../../contexts/WishlistContext';
import { ProductImage } from '../ui/ProductImage';

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
  secondary_image_url?: string | null;
  needs_image?: boolean;
  created_at?: string;
}

interface Props {
  product: ProductData;
  priority?: boolean;
  compact?: boolean;
}

function isNewProduct(createdAt?: string): boolean {
  if (!createdAt) return false;
  return Date.now() - new Date(createdAt).getTime() < 30 * 24 * 60 * 60 * 1000;
}

export function ProductCard({ product: p, priority, compact }: Props) {
  const { addToCart, cart } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();

  const disc = discountPercent(p.price_paise, p.mrp_paise);
  const ratingNum = typeof p.average_rating === 'string' ? parseFloat(p.average_rating) : (p.average_rating ?? 0);
  const showRating = (p.rating_count ?? 0) > 0;
  const inWishlist = isWishlisted(p.id);

  // Data-driven chips only
  const showSale = disc >= 5;
  const showBest = p.badge === 'Best Seller' && !showSale;
  const showNew  = (p.badge === 'New' || isNewProduct(p.created_at)) && !showSale && !showBest;

  // Check if already in cart
  const cartItem = cart?.items?.find(i => i.productId === p.id);

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    addToCart(p.id, undefined, 1);
  }

  function handleWishlist(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(p as any);
  }

  return (
    <Link
      to={`/product/${p.slug}`}
      className="group flex flex-col bg-white dark:bg-navy-800 border border-surface-border dark:border-white/10 rounded-card overflow-hidden hover:shadow-card-hover transition-shadow duration-200"
      aria-label={p.name}
    >
      {/* Image well — neutral background, fixed 1:1 aspect */}
      <div className="relative w-full aspect-square bg-neutral-50 dark:bg-navy-700 overflow-hidden">
        <ProductImage
          src={p.image_url}
          alt={p.name}
          className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
          priority={priority}
        />

        {/* Data-driven badges — top-left */}
        <div className="absolute top-1.5 left-1.5 flex flex-col gap-1 pointer-events-none">
          {showSale && <span className="chip chip-sale">{disc}% off</span>}
          {showBest && <span className="chip chip-best">Best Seller</span>}
          {showNew  && <span className="chip chip-new">New</span>}
        </div>

        {/* Wishlist — top-right */}
        <button
          type="button"
          aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
          onClick={handleWishlist}
          className="absolute top-1.5 right-1.5 p-1.5 bg-white/90 dark:bg-navy-900/90 rounded-full text-neutral-400 hover:text-red-500 transition-colors"
        >
          <Heart
            className="w-3.5 h-3.5"
            fill={inWishlist ? '#ef4444' : 'none'}
            stroke={inWishlist ? '#ef4444' : 'currentColor'}
          />
        </button>
      </div>

      {/* Product info */}
      <div className="flex flex-col flex-1 p-2.5 gap-1">
        {/* Brand */}
        {p.brand && (
          <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">{p.brand}</p>
        )}

        {/* Name — 2 lines max, full text (never 2-word truncation) */}
        <p className="text-xs font-medium text-neutral-900 dark:text-white leading-snug line-clamp-2">
          {p.name}
        </p>

        {/* Rating — HIDDEN when no reviews */}
        {showRating && (
          <div className="flex items-center gap-1 mt-0.5">
            <span className="inline-flex items-center gap-0.5 bg-green-600 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded">
              {ratingNum.toFixed(1)}
              <Star className="w-2.5 h-2.5 fill-white stroke-none" />
            </span>
            <span className="text-[10px] text-neutral-400 dark:text-neutral-500">
              ({p.rating_count?.toLocaleString('en-IN')})
            </span>
          </div>
        )}

        {/* Price row */}
        <div className="flex items-baseline gap-1.5 mt-auto pt-1 flex-wrap">
          <span className="text-sm font-semibold text-neutral-900 dark:text-white price">
            {formatPaise(p.price_paise)}
          </span>
          {p.mrp_paise > p.price_paise && (
            <span className="text-[11px] text-neutral-400 line-through price">
              {formatPaise(p.mrp_paise)}
            </span>
          )}
        </div>

        {/* Add to cart — always present to prevent layout shift; hidden in compact mode */}
        {!compact && (
          <button
            type="button"
            onClick={handleAddToCart}
            className="mt-2 w-full flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium text-primary border border-primary rounded-btn hover:bg-primary hover:text-white transition-colors"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            {cartItem ? 'Add more' : 'Add to cart'}
          </button>
        )}
      </div>
    </Link>
  );
}
