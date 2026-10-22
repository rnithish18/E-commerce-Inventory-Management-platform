import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Star, 
  ShoppingCart, 
  Zap, 
  Truck, 
  ShieldCheck, 
  RotateCcw, 
  ChevronRight, 
  Heart, 
  Plus, 
  Minus, 
  Check, 
  ArrowLeft 
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useProduct } from '../hooks/useProducts';
import { useCart } from '../contexts/CartContext';
import { formatPaise, discountPercent, formatDate } from '../lib/utils';
import { FullPageSpinner } from '../components/ui/Spinner';

export function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { data, isLoading } = useProduct(slug || '');
  const [qty, setQty] = useState(1);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  if (isLoading) return <FullPageSpinner />;

  const product = data?.product;
  if (!product) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-bold text-white mb-2">Product Not Found</h2>
        <p className="text-xs text-gray-400 mb-4">The item you are looking for does not exist or has been removed.</p>
        <Link to="/shop" className="btn-primary text-xs">Return to Shop</Link>
      </div>
    );
  }

  const discount = discountPercent(product.price_paise, product.mrp_paise);
  const images = product.images || [];
  const primaryImage = selectedImage || (images[0]?.url) || `https://placehold.co/600x600/0f172a/f97316?text=${encodeURIComponent(product.brand || 'ShopNest')}`;
  const totalStock = product.variants?.reduce((sum: number, v: any) => sum + (v.stock_qty || 0), 0) ?? 15;
  const inStock = totalStock > 0;

  const handleAddToCart = async () => {
    if (!inStock) return;
    await addToCart(product.id, product.variants?.[0]?.id, qty);
  };

  const handleBuyNow = async () => {
    if (!inStock) return;
    await addToCart(product.id, product.variants?.[0]?.id, qty);
    navigate('/checkout');
  };

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-8 pb-12">
      
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-gray-400">
        <Link to="/" className="hover:text-white transition-colors">Home</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link to="/shop" className="hover:text-white transition-colors">Shop</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link to={`/shop?category=${product.category_slug}`} className="hover:text-white transition-colors">
          {product.category_name}
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-gray-200 truncate max-w-[200px]">{product.name}</span>
      </nav>

      {/* Main Grid: Gallery & Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        
        {/* Left: Gallery */}
        <div className="flex flex-col gap-3">
          <div className="relative aspect-square rounded-3xl overflow-hidden bg-navy-800 border border-navy-700 shadow-xl">
            <img
              src={primaryImage}
              alt={product.name}
              className="w-full h-full object-cover object-center"
              onError={(e) => {
                (e.target as HTMLImageElement).src = `https://placehold.co/600x600/0f172a/f97316?text=${encodeURIComponent(product.brand || 'ShopNest')}`;
              }}
            />
            {product.badge && (
              <span className="absolute top-4 left-4 bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-md">
                {product.badge}
              </span>
            )}
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto py-1">
              {images.map((img: any, i: number) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSelectedImage(img.url)}
                  className={`w-16 h-16 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${
                    primaryImage === img.url ? 'border-orange-500 scale-105' : 'border-navy-700 hover:border-gray-500'
                  }`}
                >
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Product Details */}
        <div className="flex flex-col gap-5">
          <div>
            <span className="text-xs font-bold text-orange-400 uppercase tracking-wider">
              {product.brand || 'ShopNest Official'}
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1 leading-snug">
              {product.name}
            </h1>
          </div>

          {/* Rating & Stock row */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-lg text-xs font-bold">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>{product.average_rating ? Number(product.average_rating).toFixed(1) : '4.7'}</span>
              <span className="text-gray-400 ml-1">({product.rating_count || 128} reviews)</span>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-semibold">
              <span className={`w-2 h-2 rounded-full ${inStock ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
              <span className={inStock ? 'text-green-400' : 'text-red-400'}>
                {inStock ? `In Stock (${totalStock} available)` : 'Currently Out of Stock'}
              </span>
            </div>
          </div>

          {/* Price Box */}
          <div className="p-4 rounded-2xl bg-navy-800/80 border border-navy-700 flex items-baseline gap-3">
            <span className="text-3xl font-black text-white">
              {formatPaise(product.price_paise)}
            </span>
            {product.mrp_paise > product.price_paise && (
              <>
                <span className="text-sm text-gray-400 line-through">
                  {formatPaise(product.mrp_paise)}
                </span>
                <span className="text-xs font-bold text-green-400 bg-green-500/10 px-2 py-0.5 rounded-md border border-green-500/20">
                  Save {discount}% ({formatPaise(product.mrp_paise - product.price_paise)})
                </span>
              </>
            )}
            <span className="text-[11px] text-gray-400 block w-full mt-1">
              Inclusive of all taxes & GST (18%)
            </span>
          </div>

          {/* Quantity selector */}
          {inStock && (
            <div className="flex items-center gap-4">
              <span className="text-xs font-bold text-gray-300">Quantity</span>
              <div className="flex items-center gap-2 bg-navy-800 border border-navy-700 rounded-xl p-1">
                <button
                  type="button"
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-navy-700"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="text-xs font-bold text-white w-8 text-center">{qty}</span>
                <button
                  type="button"
                  onClick={() => setQty(Math.min(totalStock, qty + 1))}
                  className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-navy-700"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <button
              type="button"
              disabled={!inStock}
              onClick={handleAddToCart}
              className="w-full sm:flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-xs font-bold bg-navy-800 hover:bg-navy-700 text-white border border-navy-600 transition-colors disabled:opacity-50"
            >
              <ShoppingCart className="w-4 h-4 text-orange-400" />
              <span>Add to Cart</span>
            </button>

            <button
              type="button"
              disabled={!inStock}
              onClick={handleBuyNow}
              className="w-full sm:flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-xs font-bold bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/25 transition-all disabled:opacity-50"
            >
              <Zap className="w-4 h-4" />
              <span>Buy Now</span>
            </button>
          </div>

          {/* Trust Guarantees */}
          <div className="grid grid-cols-3 gap-2 pt-4 border-t border-navy-700/80 text-[11px] text-gray-300">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-orange-400 shrink-0" />
              <span>Free 2-Day Delivery</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-green-400 shrink-0" />
              <span>1 Year Warranty</span>
            </div>
            <div className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-blue-400 shrink-0" />
              <span>7-Day Return</span>
            </div>
          </div>

        </div>

      </div>

      {/* Description & Reviews Section */}
      <div className="mt-8 pt-8 border-t border-navy-700/80 grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Description */}
        <div className="md:col-span-2 flex flex-col gap-4">
          <h3 className="text-lg font-bold text-white">Product Overview</h3>
          <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
            {product.description || 'Premium quality e-commerce item crafted to high engineering standards. Tested rigorously for durability, performance, and everyday consumer convenience.'}
          </p>

          <h4 className="text-sm font-bold text-white mt-4">Key Features</h4>
          <ul className="list-disc list-inside text-xs text-gray-300 space-y-1.5">
            <li>Original manufacturer authentic item with serial verification</li>
            <li>Energy efficient and tested under strict temperature cycles</li>
            <li>Designed for long-lasting ergonomics and daily reliability</li>
            <li>Compatible with all modern standard accessories</li>
          </ul>
        </div>

        {/* Customer Reviews */}
        <div className="flex flex-col gap-4 bg-navy-800/40 p-5 rounded-2xl border border-navy-700">
          <h3 className="text-base font-bold text-white">Verified Reviews</h3>
          
          {product.reviews && product.reviews.length > 0 ? (
            <div className="flex flex-col gap-3">
              {product.reviews.map((rev: any) => (
                <div key={rev.id} className="p-3 rounded-xl bg-navy-800 border border-navy-700 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-white">{rev.reviewer_name}</span>
                    <span className="text-[10px] text-gray-400">{formatDate(rev.created_at)}</span>
                  </div>
                  <div className="flex items-center gap-1 text-amber-400 mb-1">
                    {Array.from({ length: rev.rating }).map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-amber-400" />
                    ))}
                  </div>
                  <p className="font-semibold text-gray-200">{rev.title}</p>
                  <p className="text-gray-400 text-[11px] mt-0.5">{rev.body}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-xs text-gray-400">No customer reviews yet.</p>
              <p className="text-[11px] text-gray-500 mt-1">Be the first to review this product after purchase!</p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
