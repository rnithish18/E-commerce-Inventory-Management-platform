import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, ArrowLeft, Search, Home } from 'lucide-react';

export function NotFoundPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full bg-navy-800/90 border border-navy-700 rounded-3xl p-8 sm:p-10 text-center shadow-2xl backdrop-blur-xl">
        <div className="w-16 h-16 rounded-2xl bg-orange-500/15 border border-orange-500/30 text-orange-400 flex items-center justify-center mx-auto mb-6">
          <ShoppingBag className="w-8 h-8" />
        </div>

        <p className="text-4xl sm:text-5xl font-black font-display text-white tracking-tight">404</p>
        <h1 className="text-lg sm:text-xl font-bold text-gray-200 mt-2">Page Not Found</h1>

        <p className="text-xs text-gray-400 mt-3 leading-relaxed">
          The catalog page, product variant, or administrative view you requested does not exist or has been relocated to another department.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/"
            className="btn-primary w-full sm:w-auto px-5 py-2.5 text-xs font-bold flex items-center justify-center gap-2 rounded-xl"
          >
            <Home className="w-4 h-4" />
            <span>Storefront Home</span>
          </Link>

          <Link
            to="/shop"
            className="btn-secondary w-full sm:w-auto px-5 py-2.5 text-xs font-semibold flex items-center justify-center gap-2 rounded-xl"
          >
            <Search className="w-4 h-4" />
            <span>Browse Products</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
