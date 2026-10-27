import React, { useState, useEffect } from 'react';
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
  ArrowLeft,
  MapPin,
  ThumbsUp,
  Image as ImageIcon,
  Clock,
  Sparkles,
  Layers,
  UploadCloud,
  X,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useProduct } from '../hooks/useProducts';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';
import { useAuth } from '../contexts/AuthContext';
import { formatPaise, discountPercent, formatDate } from '../lib/utils';
import { FullPageSpinner } from '../components/ui/Spinner';
import { ProductGallery } from '../components/product/ProductGallery';
import { ProductCard } from '../components/product/ProductCard';
import { ProductImage } from '../components/ui/ProductImage';
import { reviewsApi, uploadsApi } from '../lib/api';

export function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const { data, isLoading, refetch } = useProduct(slug || '');

  const [qty, setQty] = useState(1);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [pincode, setPincode] = useState('');
  const [deliveryEstimate, setDeliveryEstimate] = useState<string | null>(null);
  const [reviewSort, setReviewSort] = useState<'helpful' | 'newest' | 'rating'>('helpful');
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [recentlyViewed, setRecentlyViewed] = useState<any[]>([]);

  // Review submission state
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewBody, setReviewBody] = useState('');
  const [reviewImages, setReviewImages] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);

  const product = data?.product;

  // Manage recently viewed products in localStorage
  useEffect(() => {
    if (!product) return;
    try {
      const stored = localStorage.getItem('shopnest_recently_viewed');
      const list: any[] = stored ? JSON.parse(stored) : [];
      const filtered = list.filter((p: any) => p.id !== product.id);
      const updated = [
        {
          id: product.id,
          name: product.name,
          slug: product.slug,
          brand: product.brand,
          price_paise: product.price_paise,
          mrp_paise: product.mrp_paise,
          image_url: product.images?.[0]?.url || null,
          category_name: product.category_name,
          category_slug: product.category_slug,
          badge: product.badge,
          average_rating: product.average_rating,
          rating_count: product.rating_count,
        },
        ...filtered,
      ].slice(0, 6);
      localStorage.setItem('shopnest_recently_viewed', JSON.stringify(updated));
      setRecentlyViewed(filtered.slice(0, 4));
    } catch {
      // ignore
    }
  }, [product?.id]);

  useEffect(() => {
    if (product?.variants && product.variants.length > 0 && !selectedVariantId) {
      setSelectedVariantId(product.variants[0].id);
    }
  }, [product?.variants]);

  if (isLoading) return <FullPageSpinner />;

  if (!product) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-bold text-white mb-2">Product Not Found</h2>
        <p className="text-xs text-gray-400 mb-4">The item you are looking for does not exist or has been removed.</p>
        <Link to="/shop" className="btn-primary text-xs">Return to Shop</Link>
      </div>
    );
  }

  const wishlisted = isWishlisted(product.id);
  const discount = discountPercent(product.price_paise, product.mrp_paise);
  const images = product.images || [];
  
  // Selected variant handling
  const activeVariant = product.variants?.find((v: any) => v.id === selectedVariantId) || product.variants?.[0];
  const effectivePricePaise = product.price_paise + (activeVariant?.price_adjustment_paise || 0);
  const totalStock = activeVariant
    ? Math.max(0, (activeVariant.stock_qty || 0) - (activeVariant.reserved_qty || 0))
    : (product.variants?.reduce((sum: number, v: any) => sum + Math.max(0, (v.stock_qty || 0) - (v.reserved_qty || 0)), 0) ?? 15);
  const inStock = totalStock > 0;

  // Real review counts
  const reviewCount = Number(product.rating_count || 0);
  const hasReviews = reviewCount > 0 && product.average_rating != null;
  const rating = hasReviews ? Number(product.average_rating).toFixed(1) : null;

  // Sort reviews
  const rawReviews = product.reviews || [];
  const sortedReviews = [...rawReviews].sort((a: any, b: any) => {
    if (reviewSort === 'helpful') {
      return (b.helpful_count || 0) - (a.helpful_count || 0);
    }
    if (reviewSort === 'rating') {
      return b.rating - a.rating;
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const ratingDistribution = product.rating_distribution || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  const totalReviewRatings = Object.values(ratingDistribution).reduce((acc: number, c: any) => acc + (Number(c) || 0), 0) || 1;

  const handleAddToCart = async () => {
    if (!inStock) return;
    await addToCart(product.id, activeVariant?.id, qty);
  };

  const handleBuyNow = async () => {
    if (!inStock) return;
    await addToCart(product.id, activeVariant?.id, qty);
    navigate('/checkout');
  };

  const checkPincodeDelivery = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = pincode.trim();
    if (!/^\d{6}$/.test(clean)) {
      toast.error('Please enter a valid 6-digit Indian PIN code');
      return;
    }
    const days = (parseInt(clean.slice(-1), 10) % 3) + 2;
    const estDate = new Date();
    estDate.setDate(estDate.getDate() + days);
    const dateStr = estDate.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
    setDeliveryEstimate(`Express Delivery by ${dateStr} to ${clean} • FREE on orders over ₹500`);
    toast.success(`Delivery available to pincode ${clean}!`);
  };

  const handleHelpfulVote = async (reviewId: string) => {
    if (!user) {
      toast.error('Please sign in to vote on customer reviews');
      navigate('/login');
      return;
    }
    try {
      const res = await reviewsApi.toggleHelpful(reviewId);
      toast.success(res.data.helpful ? 'Marked as helpful' : 'Vote removed');
      refetch();
    } catch {
      toast.error('Could not register vote');
    }
  };

  const handleReviewPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (reviewImages.length >= 3) {
      toast.error('Maximum 3 photos allowed per review');
      return;
    }
    setUploadingImage(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const res = await uploadsApi.uploadImage(fd);
      setReviewImages(prev => [...prev, res.data.url]);
      toast.success('Photo attached');
    } catch {
      toast.error('Failed to upload image. Please ensure it is a JPG or PNG under 5MB.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please log in to submit a product review');
      navigate('/login');
      return;
    }
    setSubmittingReview(true);
    try {
      // Find eligible order item
      await reviewsApi.submit({
        product_id: product.id,
        order_item_id: 'auto',
        rating: reviewRating,
        title: reviewTitle,
        body: reviewBody,
        images: reviewImages,
      });
      toast.success('Review submitted successfully for moderation!');
      setReviewModalOpen(false);
      refetch();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'You must have received this product to leave a verified review.';
      toast.error(msg);
    } finally {
      setSubmittingReview(false);
    }
  };

  // Structured specifications items
  const specs = [
    { label: 'Brand', value: product.brand || 'ShopNest Official' },
    { label: 'Category', value: product.category_name },
    { label: 'SKU / Model', value: activeVariant?.sku || `${product.brand?.toUpperCase().slice(0, 3) || 'SNP'}-001` },
    { label: 'Warranty', value: '1 Year Manufacturer Limited Warranty' },
    { label: 'Return Policy', value: '7-Day Replacement or Full Refund' },
    { label: 'Tax Assessment', value: '18% GST (Included in Listed Price)' },
    { label: 'Authentication', value: '100% Genuine Certified & Serialized' },
  ];

  // Schema.org JSON-LD structured data
  const jsonLd = {
    '@context': 'https://schema.org/',
    '@type': 'Product',
    name: product.name,
    image: images.map((img: any) => img.url),
    description: product.description,
    brand: {
      '@type': 'Brand',
      name: product.brand || 'ShopNest',
    },
    offers: {
      '@type': 'Offer',
      priceCurrency: 'INR',
      price: (effectivePricePaise / 100).toFixed(2),
      availability: inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: 'ShopNest Retail Private Limited',
      },
    },
    ...(hasReviews && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: rating,
        reviewCount: reviewCount,
      },
    }),
  };

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-8 pb-12">
      
      {/* Dynamic Title and JSON-LD */}
      <title>{`${product.name} | ShopNest`}</title>
      <meta name="description" content={product.description?.slice(0, 160) || `Buy ${product.name} at ShopNest with free express delivery.`} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

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
        
        {/* Left: Gallery with Zoom & Lightbox */}
        <div className="w-full">
          <ProductGallery
            images={images}
            productName={product.name}
            badge={product.badge}
            needsImage={product.needs_image}
          />
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

          {/* Rating, Stock row & Urgency Badge */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 min-h-[24px]">
              {hasReviews ? (
                <div className="flex items-center gap-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-lg text-xs font-bold">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>{rating}</span>
                  <span className="text-gray-400 ml-1">({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})</span>
                </div>
              ) : (
                <span className="text-xs text-gray-400 italic">No reviews yet</span>
              )}
            </div>

            <div className="flex items-center gap-1.5 text-xs font-semibold">
              <span className={`w-2 h-2 rounded-full ${inStock ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
              <span className={inStock ? 'text-green-400' : 'text-red-400'}>
                {inStock ? `In Stock (${totalStock} available)` : 'Currently Out of Stock'}
              </span>
            </div>

            {/* Urgency Badge if stock is 10 or less */}
            {inStock && totalStock <= 10 && (
              <span className="px-2.5 py-0.5 rounded-md bg-red-500/10 text-red-400 border border-red-500/30 text-[11px] font-bold animate-pulse">
                ⚡ Only {totalStock} left — order soon!
              </span>
            )}
          </div>

          {/* Price Box */}
          <div className="p-4 rounded-2xl bg-navy-800/80 border border-navy-700 flex items-baseline gap-3">
            <span className="text-3xl font-black text-white">
              {formatPaise(effectivePricePaise)}
            </span>
            {product.mrp_paise > effectivePricePaise && (
              <>
                <span className="text-sm text-gray-400 line-through">
                  {formatPaise(product.mrp_paise)}
                </span>
                <span className="text-xs font-bold text-green-400 bg-green-500/10 px-2 py-0.5 rounded-md border border-green-500/20">
                  Save {discount}% ({formatPaise(product.mrp_paise - effectivePricePaise)})
                </span>
              </>
            )}
            <span className="text-[11px] text-gray-400 block w-full mt-1">
              Inclusive of all taxes & GST (18%)
            </span>
          </div>

          {/* Variants Selector */}
          {product.variants && product.variants.length > 1 && (
            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold text-gray-300">Choose Option / Variant</span>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v: any) => {
                  const isSelected = v.id === selectedVariantId;
                  const vStock = Math.max(0, (v.stock_qty || 0) - (v.reserved_qty || 0));
                  return (
                    <button
                      key={v.id}
                      type="button"
                      disabled={vStock <= 0}
                      onClick={() => setSelectedVariantId(v.id)}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                        isSelected
                          ? 'bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-500/20'
                          : vStock <= 0
                          ? 'bg-navy-900/40 text-gray-500 border-navy-800 line-through cursor-not-allowed'
                          : 'bg-navy-800 text-gray-200 border-navy-700 hover:border-gray-500'
                      }`}
                    >
                      <span>{v.name}</span>
                      {v.price_adjustment_paise !== 0 && (
                        <span className="text-[10px] ml-1 opacity-80">
                          ({v.price_adjustment_paise > 0 ? '+' : ''}{formatPaise(v.price_adjustment_paise)})
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

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

          {/* Action CTAs & Wishlist Button */}
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

            <button
              type="button"
              onClick={() => toggleWishlist(product)}
              title={wishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
              className={`p-3.5 rounded-xl border transition-all shrink-0 ${
                wishlisted
                  ? 'bg-red-500/20 text-red-500 border-red-500/40'
                  : 'bg-navy-800 hover:bg-navy-700 text-gray-400 hover:text-white border-navy-600'
              }`}
            >
              <Heart className={`w-4 h-4 ${wishlisted ? 'fill-red-500 text-red-500' : ''}`} />
            </button>
          </div>

          {/* Pincode Delivery Estimator */}
          <div className="p-3.5 rounded-2xl bg-navy-800/60 border border-navy-700 text-xs">
            <form onSubmit={checkPincodeDelivery} className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-orange-400 shrink-0" />
              <input
                type="text"
                maxLength={6}
                value={pincode}
                onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                placeholder="Enter 6-digit PIN code"
                className="flex-1 bg-navy-900 border border-navy-600 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
              />
              <button
                type="submit"
                className="px-3 py-1.5 rounded-lg bg-navy-700 hover:bg-navy-600 text-white font-semibold text-xs transition-colors"
              >
                Check
              </button>
            </form>
            {deliveryEstimate && (
              <p className="mt-2 text-[11px] text-green-400 flex items-center gap-1.5 font-medium">
                <Check className="w-3.5 h-3.5" />
                <span>{deliveryEstimate}</span>
              </p>
            )}
          </div>

          {/* Trust Guarantees */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-navy-700/80 text-[11px] text-gray-300">
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

      {/* Specifications Table Section */}
      <div className="p-6 rounded-3xl bg-navy-800/80 border border-navy-700/80">
        <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
          <Layers className="w-4 h-4 text-orange-400" />
          <span>Product Specifications</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {specs.map((item, idx) => (
            <div key={idx} className="flex justify-between p-2.5 rounded-xl bg-navy-900/60 border border-navy-700/40">
              <span className="text-gray-400 font-medium">{item.label}</span>
              <span className="text-gray-100 font-semibold">{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Overview & Reviews Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Description */}
        <div className="md:col-span-1 flex flex-col gap-4">
          <h3 className="text-lg font-bold text-white">Product Overview</h3>
          <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
            {product.description || 'Premium quality e-commerce item crafted to high engineering standards. Tested rigorously for durability, performance, and everyday consumer convenience.'}
          </p>

          <h4 className="text-sm font-bold text-white mt-4">Key Highlights</h4>
          <ul className="list-disc list-inside text-xs text-gray-300 space-y-1.5">
            <li>Original manufacturer authentic item with serial verification</li>
            <li>Energy efficient and tested under strict temperature cycles</li>
            <li>Designed for long-lasting ergonomics and daily reliability</li>
            <li>Compatible with standard accessories across India</li>
          </ul>
        </div>

        {/* Customer Reviews Section */}
        <div className="md:col-span-2 flex flex-col gap-5 bg-navy-800/40 p-6 rounded-3xl border border-navy-700">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-navy-700">
            <div>
              <h3 className="text-base font-bold text-white">Customer Reviews</h3>
              <p className="text-xs text-gray-400">
                {hasReviews ? `${reviewCount} verified ratings and impressions` : 'No verified reviews yet'}
              </p>
            </div>
            
            <button
              type="button"
              onClick={() => setReviewModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-colors shrink-0"
            >
              Write a Review
            </button>
          </div>

          {/* Rating Distribution Breakdown */}
          {hasReviews && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-navy-700/80 items-center">
              <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-navy-800/90 border border-navy-700">
                <span className="text-4xl font-black text-white">{rating}</span>
                <div className="flex items-center gap-1 text-amber-400 my-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${i < Math.round(Number(rating)) ? 'fill-amber-400 text-amber-400' : 'text-gray-600'}`}
                    />
                  ))}
                </div>
                <span className="text-xs text-gray-400">Based on {reviewCount} reviews</span>
              </div>

              {/* Progress Bars 5 to 1 */}
              <div className="space-y-1.5 text-xs">
                {[5, 4, 3, 2, 1].map((stars) => {
                  const count = Number(ratingDistribution[stars] || 0);
                  const pct = Math.round((count / totalReviewRatings) * 100);
                  return (
                    <div key={stars} className="flex items-center gap-2">
                      <span className="w-6 text-gray-400 font-semibold">{stars}★</span>
                      <div className="flex-1 h-2 rounded-full bg-navy-900 overflow-hidden">
                        <div
                          className="h-full bg-amber-400 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-8 text-right text-[11px] text-gray-400">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Sort bar */}
          {sortedReviews.length > 0 && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400 font-medium">Sorted reviews:</span>
              <div className="flex items-center gap-1.5">
                {(['helpful', 'newest', 'rating'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setReviewSort(mode)}
                    className={`px-2.5 py-1 rounded-lg capitalize font-semibold transition-colors ${
                      reviewSort === mode
                        ? 'bg-orange-500 text-white'
                        : 'bg-navy-800 text-gray-300 hover:text-white'
                    }`}
                  >
                    {mode === 'helpful' ? 'Most Helpful' : mode === 'rating' ? 'Top Rated' : 'Newest'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Review Cards */}
          {sortedReviews.length > 0 ? (
            <div className="space-y-3">
              {sortedReviews.map((rev: any) => (
                <div key={rev.id} className="p-4 rounded-2xl bg-navy-800/90 border border-navy-700/80 text-xs">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-white text-sm">{rev.reviewer_name}</span>
                    <span className="text-[10px] text-gray-400">{formatDate(rev.created_at)}</span>
                  </div>

                  <div className="flex items-center gap-1 text-amber-400 mb-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${i < rev.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-600'}`}
                      />
                    ))}
                  </div>

                  <p className="font-bold text-gray-100 text-xs">{rev.title}</p>
                  <p className="text-gray-300 text-xs mt-1 leading-relaxed">{rev.body}</p>

                  {/* Customer Photo Uploads attached to review */}
                  {rev.images && rev.images.length > 0 && (
                    <div className="flex items-center gap-2 mt-3 pt-2 border-t border-navy-700/60">
                      {rev.images.map((imgUrl: string, idx: number) => (
                        <div key={idx} className="w-14 h-14 rounded-xl overflow-hidden border border-navy-600 bg-navy-900">
                          <img src={imgUrl} alt={`Review by ${rev.reviewer_name}`} className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Helpful Vote Button */}
                  <div className="mt-3 pt-2 border-t border-navy-700/60 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => handleHelpfulVote(rev.id)}
                      className="flex items-center gap-1.5 text-gray-400 hover:text-orange-400 transition-colors"
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span>Helpful ({rev.helpful_count || 0})</span>
                    </button>
                    <span className="text-[10px] text-green-400 flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      <span>Verified Purchase</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-xs text-gray-400">No customer reviews yet.</p>
              <p className="text-[11px] text-gray-500 mt-1">Be the first to share your thoughts after purchase!</p>
            </div>
          )}

        </div>

      </div>

      {/* You May Also Like Section */}
      {product.related_products && product.related_products.length > 0 && (
        <div className="mt-6 pt-6 border-t border-navy-700/80">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-orange-400" />
                <span>You May Also Like</span>
              </h3>
              <p className="text-xs text-gray-400">Related recommendations from {product.category_name}</p>
            </div>
            <Link to={`/shop?category=${product.category_slug}`} className="text-xs text-orange-400 hover:text-orange-300 font-semibold">
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {product.related_products.map((rel: any) => (
              <ProductCard key={rel.id} product={rel} />
            ))}
          </div>
        </div>
      )}

      {/* Recently Viewed Products */}
      {recentlyViewed.length > 0 && (
        <div className="mt-6 pt-6 border-t border-navy-700/80">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                <Clock className="w-5 h-5 text-orange-400" />
                <span>Recently Viewed</span>
              </h3>
              <p className="text-xs text-gray-400">Items you previously explored</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {recentlyViewed.map((item: any) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </div>
      )}

      {/* Write a Review Modal */}
      {reviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-navy-950/80 backdrop-blur-sm" onClick={() => setReviewModalOpen(false)} />
          <div className="relative w-full max-w-md bg-navy-800 border border-navy-700 rounded-3xl p-6 shadow-2xl z-50">
            <div className="flex items-center justify-between pb-3 border-b border-navy-700 mb-4">
              <h3 className="text-base font-bold text-white">Write a Review</h3>
              <button onClick={() => setReviewModalOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitReview} className="space-y-4 text-xs">
              {/* Rating Star Selection */}
              <div>
                <label className="block text-gray-300 font-bold mb-1.5">Overall Rating</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`w-6 h-6 ${star <= reviewRating ? 'fill-amber-400 text-amber-400' : 'text-gray-600'}`}
                      />
                    </button>
                  ))}
                  <span className="text-gray-300 font-bold ml-2">{reviewRating} / 5</span>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-gray-300 font-bold mb-1">Headline / Title</label>
                <input
                  type="text"
                  required
                  value={reviewTitle}
                  onChange={(e) => setReviewTitle(e.target.value)}
                  placeholder="e.g. Exceptional build quality and sound"
                  className="w-full bg-navy-900 border border-navy-600 rounded-xl px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
                />
              </div>

              {/* Body */}
              <div>
                <label className="block text-gray-300 font-bold mb-1">Detailed Review</label>
                <textarea
                  required
                  rows={4}
                  value={reviewBody}
                  onChange={(e) => setReviewBody(e.target.value)}
                  placeholder="Share details of your experience with this product..."
                  className="w-full bg-navy-900 border border-navy-600 rounded-xl px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 resize-none"
                />
              </div>

              {/* Photo Attachments */}
              <div>
                <label className="block text-gray-300 font-bold mb-1">Attach Customer Photos (Max 3)</label>
                <div className="flex items-center gap-2">
                  {reviewImages.map((img, i) => (
                    <div key={i} className="relative w-12 h-12 rounded-xl overflow-hidden border border-navy-600">
                      <img src={img} alt="Upload preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setReviewImages(reviewImages.filter((_, idx) => idx !== i))}
                        className="absolute top-0 right-0 p-0.5 bg-red-500 text-white rounded-bl"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}

                  {reviewImages.length < 3 && (
                    <label className="w-12 h-12 rounded-xl border border-dashed border-navy-600 hover:border-orange-500 flex flex-col items-center justify-center cursor-pointer transition-colors bg-navy-900/60">
                      <UploadCloud className="w-4 h-4 text-gray-400" />
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={handleReviewPhotoUpload}
                        className="hidden"
                        disabled={uploadingImage}
                      />
                    </label>
                  )}
                </div>
                {uploadingImage && <p className="text-[10px] text-orange-400 mt-1">Uploading photo...</p>}
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setReviewModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-navy-700 text-gray-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="flex-1 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold disabled:opacity-50"
                >
                  {submittingReview ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
