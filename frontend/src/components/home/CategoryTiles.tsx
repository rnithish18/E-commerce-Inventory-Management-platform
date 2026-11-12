import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';

const ICON_MAP: Record<string, string> = {
  'electronics':   '📱',
  'fashion':       '👕',
  'home-living':   '🏠',
  'beauty':        '💄',
  'sports':        '⚽',
  'books':         '📚',
  'toys':          '🎮',
  'kitchen':       '🍳',
  'stationery':    '✏️',
  'bags':          '👜',
};

interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  product_count?: number;
}

export function CategoryTiles() {
  const { data, isLoading } = useQuery<{ categories: Category[] }>({
    queryKey: ['categories'],
    queryFn: () => api.get('/categories').then(r => r.data),
    staleTime: 5 * 60 * 1000,
  });

  const categories = data?.categories ?? [];

  if (isLoading) {
    return (
      <section aria-label="Browse by category">
        <h2 className="section-title mb-3">Shop by Category</h2>
        <div className="flex gap-4 overflow-x-auto pb-2 [scrollbar-width:none]">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2 shrink-0 animate-pulse">
              <div className="w-14 h-14 rounded-full bg-neutral-200 dark:bg-navy-700" />
              <div className="w-12 h-3 bg-neutral-200 dark:bg-navy-700 rounded" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (!categories.length) return null;

  return (
    <section aria-label="Browse by category">
      <h2 className="section-title mb-3">Shop by Category</h2>
      <div className="flex gap-4 sm:gap-5 overflow-x-auto pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {categories.map(cat => {
          const icon = cat.icon || ICON_MAP[cat.slug] || '🛒';
          return (
            <Link
              key={cat.id}
              to={`/shop?category=${cat.slug}`}
              className="flex flex-col items-center gap-1.5 shrink-0 group"
              aria-label={`Browse ${cat.name}`}
            >
              {/* Circle — 56px on mobile, 64px on sm+ */}
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white dark:bg-navy-800 border-2 border-neutral-200 dark:border-white/10 group-hover:border-primary transition-colors flex items-center justify-center text-2xl sm:text-3xl shadow-card">
                {icon}
              </div>
              {/* Name — min-width prevents clipping, centered, up to 2 lines */}
              <span className="text-[11px] sm:text-xs text-center text-neutral-700 dark:text-neutral-300 group-hover:text-primary transition-colors font-medium leading-tight min-w-[60px] max-w-[72px] line-clamp-2">
                {cat.name}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
