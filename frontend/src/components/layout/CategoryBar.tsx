import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { X, Menu } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';

interface Category { id: string; name: string; slug: string; icon?: string; }

export function CategoryBar() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { data } = useQuery<{ categories: Category[] }>({
    queryKey: ['categories'],
    queryFn: () => api.get('/categories').then(r => r.data),
    staleTime: 5 * 60 * 1000,
  });
  const categories = data?.categories ?? [];

  return (
    <>
      {/* Desktop sticky category bar */}
      <nav
        aria-label="Product categories"
        className="sticky top-14 z-30 bg-white dark:bg-navy-900 border-b border-surface-border dark:border-white/10 hidden md:block shadow-sm"
      >
        <div className="max-w-screen-xl mx-auto px-4 flex items-center overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <Link
            to="/shop"
            className="flex items-center gap-1.5 px-3 py-3 text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:text-primary dark:hover:text-primary whitespace-nowrap transition-colors border-b-2 border-transparent hover:border-primary shrink-0"
          >
            <Menu className="w-3.5 h-3.5" />
            All Categories
          </Link>
          {categories.slice(0, 10).map(cat => (
            <Link
              key={cat.id}
              to={`/shop?category=${cat.slug}`}
              className="px-3 py-3 text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:text-primary dark:hover:text-primary whitespace-nowrap transition-colors border-b-2 border-transparent hover:border-primary shrink-0"
            >
              {cat.name}
            </Link>
          ))}
          {categories.length > 10 && (
            <Link
              to="/shop"
              className="px-3 py-3 text-xs font-medium text-neutral-500 hover:text-primary whitespace-nowrap transition-colors shrink-0"
            >
              More →
            </Link>
          )}
        </div>
      </nav>

      {/* Mobile category drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden" role="dialog" aria-label="Category menu">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDrawerOpen(false)} />
          <div className="relative w-72 max-w-full h-full bg-white dark:bg-navy-900 shadow-dropdown flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-surface-border dark:border-white/10">
              <span className="font-semibold text-sm text-neutral-900 dark:text-white">Categories</span>
              <button onClick={() => setDrawerOpen(false)} className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-navy-800">
                <X className="w-4 h-4 text-neutral-500" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto py-2">
              <Link to="/shop" onClick={() => setDrawerOpen(false)}
                className="flex items-center px-4 py-3 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-navy-800 font-medium">
                All Products
              </Link>
              {categories.map(cat => (
                <Link key={cat.id} to={`/shop?category=${cat.slug}`} onClick={() => setDrawerOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-navy-800">
                  {cat.icon && <span className="text-base">{cat.icon}</span>}
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
