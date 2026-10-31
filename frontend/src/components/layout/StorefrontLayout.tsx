import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Topbar } from './Topbar';
import { Sidebar } from './Sidebar';
import { RightPanel } from './RightPanel';

interface Props {
  showRightPanel?: boolean;
}

export function StorefrontLayout({ showRightPanel = true }: Props) {
  return (
    <div className="min-h-screen bg-navy-900 text-gray-100 flex flex-col font-sans">
      <Topbar />
      
      <div className="flex-1 flex max-w-[1720px] w-full mx-auto">
        {/* Left Sidebar */}
        <Sidebar />

        {/* Center Main Content Area */}
        <main id="main-content" tabIndex={-1} className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 overflow-y-auto focus:outline-none">
          <Outlet />
        </main>

        {/* Right Info & Tracking Panel */}
        {showRightPanel && <RightPanel />}
      </div>

      {/* Storefront Editorial Footer */}
      <footer className="w-full border-t border-navy-800 bg-navy-950/90 text-xs text-gray-400">
        <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm font-black font-display text-white">
                Shop<span className="text-orange-500">Nest</span>
              </span>
            </div>
            <p className="text-[11px] text-gray-400 leading-relaxed">
              Curated e-commerce with real-time inventory reservations, verified photos, and pan-India fulfillment.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-white text-xs mb-3 uppercase tracking-wider">Company</h4>
            <ul className="space-y-2 text-[11px]">
              <li>
                <Link to="/about" className="hover:text-white transition-colors">
                  About ShopNest
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-white transition-colors">
                  Customer Concierge
                </Link>
              </li>
              <li>
                <Link to="/image-credits" className="hover:text-white transition-colors">
                  Image Credits & Licenses
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white text-xs mb-3 uppercase tracking-wider">Help & Services</h4>
            <ul className="space-y-2 text-[11px]">
              <li>
                <Link to="/track-order" className="hover:text-white transition-colors">
                  Track Order (Guest)
                </Link>
              </li>
              <li>
                <Link to="/shipping-returns" className="hover:text-white transition-colors">
                  Shipping & Deliveries
                </Link>
              </li>
              <li>
                <Link to="/faq" className="hover:text-white transition-colors">
                  Frequently Asked Questions
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white text-xs mb-3 uppercase tracking-wider">Trust & Legal</h4>
            <ul className="space-y-2 text-[11px]">
              <li>
                <Link to="/privacy" className="hover:text-white transition-colors">
                  Privacy Policy (DPDP Act)
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <span className="text-[10px] text-emerald-400 block mt-1">
                  • 256-Bit Encrypted Checkout
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-navy-900 py-4 px-6 text-center text-[11px] text-gray-500">
          <p>
            ShopNest is a demonstration store. Brand names and product images belong to their respective owners.
            <span className="mx-2 text-gray-700">•</span>
            © 2026 ShopNest Technologies Pvt. Ltd.
          </p>
        </div>
      </footer>
    </div>
  );
}
