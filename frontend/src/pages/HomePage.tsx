import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Sparkles, 
  Flame, 
  Award, 
  TrendingUp, 
  ArrowRight, 
  Truck, 
  ShieldCheck, 
  RotateCcw, 
  Headphones 
} from 'lucide-react';
import { HeroBanner } from '../components/home/HeroBanner';
import { CategoryTiles } from '../components/home/CategoryTiles';
import { ProductCard, ProductData } from '../components/product/ProductCard';
import { ProductCardSkeleton } from '../components/ui/Skeleton';
import { useFeaturedProducts } from '../hooks/useProducts';

const FILTER_TABS = [
  { id: 'all', label: 'All Picks', icon: <Sparkles className="w-3.5 h-3.5" /> },
  { id: 'Best Seller', label: 'Best Sellers', icon: <Award className="w-3.5 h-3.5" /> },
  { id: 'Trending', label: 'Trending', icon: <TrendingUp className="w-3.5 h-3.5" /> },
  { id: 'Hot', label: 'Hot Deals', icon: <Flame className="w-3.5 h-3.5" /> },
];

export function HomePage() {
  const [activeTab, setActiveTab] = useState('all');
  const { data, isLoading } = useFeaturedProducts();

  const products: ProductData[] = data?.products || [];

  const filteredProducts = activeTab === 'all'
    ? products
    : products.filter(p => p.badge === activeTab);

  return (
    <div className="flex flex-col gap-2">
      {/* 1. Hero Carousel */}
      <HeroBanner />

      {/* 2. Popular Categories */}
      <CategoryTiles />

      {/* 3. Featured Products Section */}
      <section className="mb-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 text-orange-400 text-xs font-bold uppercase tracking-wider mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Handpicked For You</span>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">
              Featured Products
            </h2>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 bg-navy-800 p-1.5 rounded-2xl border border-navy-700 overflow-x-auto">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  activeTab === tab.id
                    ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                    : 'text-gray-400 hover:text-white hover:bg-navy-700/60'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Product Cards Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProducts.map((p, idx) => (
              <ProductCard key={p.id} product={p} priority={idx < 4} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-navy-800/40 rounded-3xl border border-navy-700/60">
            <p className="text-gray-300 font-semibold text-sm">No items matching this filter</p>
            <button
              onClick={() => setActiveTab('all')}
              className="mt-3 text-xs text-orange-400 hover:text-orange-300 font-bold"
            >
              Reset filter to view all
            </button>
          </div>
        )}

        <div className="mt-8 text-center">
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 bg-navy-800 hover:bg-navy-700 text-white font-bold text-xs px-6 py-3 rounded-xl border border-navy-600/80 transition-colors shadow-md"
          >
            <span>Explore All 40+ Products in Catalog</span>
            <ArrowRight className="w-4 h-4 text-orange-400" />
          </Link>
        </div>
      </section>

      {/* 4. Value Propositions / Trust Badges */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 py-8 border-t border-navy-700/60">
        <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-navy-800/40 border border-navy-700/60">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center shrink-0 border border-orange-500/20">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">Free Express Delivery</h4>
            <p className="text-[11px] text-gray-400 mt-0.5">On all orders above ₹500</p>
          </div>
        </div>

        <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-navy-800/40 border border-navy-700/60">
          <div className="w-10 h-10 rounded-xl bg-green-500/10 text-green-400 flex items-center justify-center shrink-0 border border-green-500/20">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">100% Genuine Brands</h4>
            <p className="text-[11px] text-gray-400 mt-0.5">Direct from verified distributors</p>
          </div>
        </div>

        <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-navy-800/40 border border-navy-700/60">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/20">
            <RotateCcw className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">7-Day Free Returns</h4>
            <p className="text-[11px] text-gray-400 mt-0.5">Hassle-free doorstep pickup</p>
          </div>
        </div>

        <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-navy-800/40 border border-navy-700/60">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0 border border-purple-500/20">
            <Headphones className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">24/7 Dedicated Support</h4>
            <p className="text-[11px] text-gray-400 mt-0.5">Instant live chat assistance</p>
          </div>
        </div>
      </section>

    </div>
  );
}
