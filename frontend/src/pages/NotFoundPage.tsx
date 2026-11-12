import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export function NotFoundPage() {
  const { pathname } = useLocation();

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-16">
      <div className="text-center max-w-sm">
        <p
          className="text-7xl font-black text-neutral-200 dark:text-navy-700 select-none"
          aria-hidden="true"
        >
          404
        </p>

        <h1 className="mt-2 text-xl font-bold text-neutral-900 dark:text-white">
          This page does not exist.
        </h1>

        {pathname !== '/' && (
          <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400 font-mono break-all">
            {pathname}
          </p>
        )}

        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/"
            id="not-found-home-link"
            className="btn-primary w-full sm:w-auto px-6 py-2.5 text-sm"
          >
            Go to Home
          </Link>
          <Link
            to="/shop"
            id="not-found-catalog-link"
            className="btn-secondary w-full sm:w-auto px-6 py-2.5 text-sm"
          >
            Browse Catalog
          </Link>
        </div>
      </div>
    </div>
  );
}
