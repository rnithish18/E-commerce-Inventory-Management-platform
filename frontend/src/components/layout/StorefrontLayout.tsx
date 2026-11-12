import React from 'react';
import { Outlet } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { Topbar } from './Topbar';
import { CategoryBar } from './CategoryBar';
import { MobileTabBar } from './MobileTabBar';

export function StorefrontLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-neutral-100 dark:bg-navy-900 text-neutral-900 dark:text-white font-sans">
      <a href="#main-content" className="skip-link">Skip to main content</a>

      {/* Sticky top header */}
      <Topbar />

      {/* Sticky category bar (sits below topbar) */}
      <CategoryBar />

      {/* Page content — full-width up to 1280px */}
      <main
        id="main-content"
        tabIndex={-1}
        className="flex-1 w-full max-w-screen-xl mx-auto px-3 sm:px-4 lg:px-6 py-4 focus:outline-none"
      >
        <Outlet />
      </main>

      {/* Footer */}
      <StorefrontFooter />

      {/* Mobile bottom tab bar — hidden on md+ */}
      <MobileTabBar />
    </div>
  );
}

function StorefrontFooter() {
  return (
    <footer className="border-t border-surface-border dark:border-white/10 bg-white dark:bg-navy-900 text-sm">
      <div className="max-w-screen-xl mx-auto px-4 py-10 grid grid-cols-2 md:grid-cols-4 gap-8">

        {/* Brand column */}
        <div>
          <div className="mb-3">
            <span className="text-base font-bold text-neutral-900 dark:text-white">
              Shop<span className="text-primary">Nest</span>
            </span>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
            A demonstration e-commerce store built with React, Express and PostgreSQL.
            Products and prices are illustrative.
          </p>
        </div>

        {/* Company */}
        <div>
          <h4 className="font-semibold text-neutral-900 dark:text-white text-xs mb-3 uppercase tracking-wide">
            Company
          </h4>
          <ul className="space-y-2 text-xs text-neutral-600 dark:text-neutral-400">
            <li><Link to="/about"          className="hover:text-primary transition-colors">About ShopNest</Link></li>
            <li><Link to="/contact"        className="hover:text-primary transition-colors">Contact Us</Link></li>
            <li><Link to="/image-credits"  className="hover:text-primary transition-colors">Image Credits &amp; Licences</Link></li>
          </ul>
        </div>

        {/* Help */}
        <div>
          <h4 className="font-semibold text-neutral-900 dark:text-white text-xs mb-3 uppercase tracking-wide">
            Help
          </h4>
          <ul className="space-y-2 text-xs text-neutral-600 dark:text-neutral-400">
            <li><Link to="/track-order"       className="hover:text-primary transition-colors">Track Order</Link></li>
            <li><Link to="/shipping-returns"  className="hover:text-primary transition-colors">Shipping &amp; Returns</Link></li>
            <li><Link to="/faq"              className="hover:text-primary transition-colors">FAQ</Link></li>
          </ul>
        </div>

        {/* Legal */}
        <div>
          <h4 className="font-semibold text-neutral-900 dark:text-white text-xs mb-3 uppercase tracking-wide">
            Legal
          </h4>
          <ul className="space-y-2 text-xs text-neutral-600 dark:text-neutral-400">
            <li><Link to="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
            <li><Link to="/terms"   className="hover:text-primary transition-colors">Terms of Service</Link></li>
          </ul>
        </div>
      </div>

      {/* Bottom disclaimer */}
      <div className="border-t border-surface-border dark:border-white/10 py-4 px-4 text-center text-xs text-neutral-400">
        ShopNest is a demonstration store. Brand names and product images belong to their respective owners.
        <span className="mx-2">·</span>
        Payments are in test mode via Razorpay.
        <span className="mx-2">·</span>
        © {new Date().getFullYear()} ShopNest Demo Project.
      </div>
    </footer>
  );
}
