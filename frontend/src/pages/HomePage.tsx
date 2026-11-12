import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight, Truck, RotateCcw, Shield } from 'lucide-react';
import { HeroBanner } from '../components/home/HeroBanner';
import { CategoryTiles } from '../components/home/CategoryTiles';
import { ProductCard, ProductData } from '../components/product/ProductCard';
import { ProductCardSkeleton } from '../components/ui/Skeleton';
import { useFeaturedProducts } from '../hooks/useProducts';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

export function HomePage() {
  const { data: featuredData, isLoading } = useFeaturedProducts();
  const { data: dealsData } = useQuery({
    queryKey: ['home-deals'],
    queryFn: () => api.get('/products?badge=Sale&limit=10').then(r => r.data),
    staleTime: 5 * 60 * 1000,
  });
  const { data: newData } = useQuery({
    queryKey: ['home-new-arrivals'],
    queryFn: () => api.get('/products?sort=newest&limit=10').then(r => r.data),
    staleTime: 5 * 60 * 1000,
  });

  const featured: ProductData[] = featuredData?.products ?? [];
  const deals: ProductData[]    = dealsData?.products    ?? [];
  const newArrivals: ProductData[] = newData?.products   ?? [];

  return (
    <div className="space-y-6 pb-20 md:pb-6">

      {/* 1. Hero carousel */}
      <HeroBanner />

      {/* 2. Category circles */}
      <CategoryTiles />

      {/* 3. Deals of the day */}
      {(dealsData || isLoading) && (
        <Section
          title="Deals of the Day"
          subtitle="Prices reduced on selected items"
          to="/shop?badge=Sale"
        >
          <HorizontalProductRow products={deals} loading={!dealsData} />
        </Section>
      )}

      {/* 4. Featured products — 2×5 grid */}
      <Section title="Featured Products" to="/shop">
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {Array.from({ length: 10 }).map((_, i) => <ProductCardSkeleton key={i} />)}
          </div>
        ) : featured.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {featured.slice(0, 10).map((p, i) => (
              <ProductCard key={p.id} product={p} priority={i < 4} />
            ))}
          </div>
        ) : null}
      </Section>

      {/* 5. New arrivals — horizontal scroll */}
      {(newData || isLoading) && (
        <Section
          title="New Arrivals"
          subtitle="Recently added to the catalogue"
          to="/shop?sort=newest"
        >
          <HorizontalProductRow products={newArrivals} loading={!newData} />
        </Section>
      )}

      {/* 6. Info strip — factual only, no invented claims */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 py-2 border-t border-surface-border dark:border-white/10">
        <InfoItem icon={Truck}    title="Free delivery"     sub="On orders above ₹500" />
        <InfoItem icon={RotateCcw} title="7-day returns"   sub="Subject to return policy" />
        <InfoItem icon={Shield}   title="Secure checkout"  sub="Payments via Razorpay (test mode)" />
      </div>
    </div>
  );
}

/* ── Shared sub-components ───────────────────────────────────────────── */

function Section({
  title, subtitle, to, children,
}: {
  title: string;
  subtitle?: string;
  to?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex items-baseline justify-between mb-3">
        <div>
          <h2 className="section-title">{title}</h2>
          {subtitle && <p className="section-subtitle mt-0.5">{subtitle}</p>}
        </div>
        {to && (
          <Link
            to={to}
            className="flex items-center gap-1 text-xs text-primary font-medium hover:underline shrink-0"
          >
            View all <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

function HorizontalProductRow({
  products,
  loading,
}: {
  products: ProductData[];
  loading: boolean;
}) {
  const rowRef = useRef<HTMLDivElement>(null);

  function scroll(dir: 'l' | 'r') {
    rowRef.current?.scrollBy({ left: dir === 'r' ? 220 : -220, behavior: 'smooth' });
  }

  return (
    <div className="relative group">
      {/* Left arrow */}
      <button
        onClick={() => scroll('l')}
        aria-label="Scroll left"
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-7 h-7 bg-white dark:bg-navy-800 border border-surface-border dark:border-white/10 rounded-full shadow-card flex items-center justify-center opacity-0 group-hover:opacity-100 transition -translate-x-3 hover:border-primary"
      >
        <ChevronLeft className="w-4 h-4 text-neutral-600 dark:text-neutral-300" />
      </button>

      {/* Scrollable row */}
      <div
        ref={rowRef}
        className="flex gap-3 overflow-x-auto pb-1 scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex-shrink-0 w-40 md:w-48">
                <ProductCardSkeleton />
              </div>
            ))
          : products.map(p => (
              <div key={p.id} className="flex-shrink-0 w-40 md:w-48">
                <ProductCard product={p} compact />
              </div>
            ))
        }
      </div>

      {/* Right arrow */}
      <button
        onClick={() => scroll('r')}
        aria-label="Scroll right"
        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-7 h-7 bg-white dark:bg-navy-800 border border-surface-border dark:border-white/10 rounded-full shadow-card flex items-center justify-center opacity-0 group-hover:opacity-100 transition translate-x-3 hover:border-primary"
      >
        <ChevronRight className="w-4 h-4 text-neutral-600 dark:text-neutral-300" />
      </button>
    </div>
  );
}

function InfoItem({
  icon: Icon,
  title,
  sub,
}: {
  icon: React.ElementType;
  title: string;
  sub: string;
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-card bg-white dark:bg-navy-800 border border-surface-border dark:border-white/10">
      <Icon className="w-5 h-5 text-primary shrink-0" strokeWidth={1.75} />
      <div>
        <p className="text-xs font-semibold text-neutral-900 dark:text-white">{title}</p>
        <p className="text-[11px] text-neutral-500 dark:text-neutral-400">{sub}</p>
      </div>
    </div>
  );
}
