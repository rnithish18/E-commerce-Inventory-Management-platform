import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Truck, RotateCcw, PackageCheck, Award, Users, ArrowRight } from 'lucide-react';

export function AboutPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
      {/* Hero Header */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <span className="px-3 py-1 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20 text-xs font-bold uppercase tracking-wider">
          Our Story
        </span>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black font-display text-white tracking-tight mt-4">
          Bespoke Commerce Built on Inventory Transparency
        </h1>
        <p className="mt-4 text-sm sm:text-base text-gray-400 leading-relaxed font-sans">
          ShopNest was conceived with a clear mandate: bridge the divide between modern digital storefronts and physical inventory truth. We operate certified fulfillment hubs across India with real-time stock reservations and authentic manufacturer verification.
        </p>
      </div>

      {/* Core Operational Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        <div className="p-6 rounded-3xl bg-navy-800/90 border border-navy-700">
          <div className="w-12 h-12 rounded-2xl bg-orange-500/15 border border-orange-500/30 text-orange-400 flex items-center justify-center mb-4">
            <PackageCheck className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold font-display text-white mb-2">Verified Inventory Only</h3>
          <p className="text-xs text-gray-400 leading-relaxed">
            Every item in our catalog is physically stocked across our Bangalore, Mumbai, and Delhi fulfillment centers. We do not participate in unverified drop-shipping.
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-navy-800/90 border border-navy-700">
          <div className="w-12 h-12 rounded-2xl bg-teal-500/15 border border-teal-500/30 text-teal-400 flex items-center justify-center mb-4">
            <Truck className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold font-display text-white mb-2">Pan-India Express Logistics</h3>
          <p className="text-xs text-gray-400 leading-relaxed">
            Partnered with BlueDart, Delhivery, and DTDC to guarantee 2 to 4 business day deliveries across 19,000+ PIN codes with tamper-evident packaging.
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-navy-800/90 border border-navy-700">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center mb-4">
            <RotateCcw className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold font-display text-white mb-2">Straightforward Returns</h3>
          <p className="text-xs text-gray-400 leading-relaxed">
            No convoluted qualification loops. Eligible items feature a 7-day hassle-free return window with direct-to-source refund processing upon doorstep pickup.
          </p>
        </div>
      </div>

      {/* Operational Story Section */}
      <div className="rounded-3xl bg-navy-800/70 border border-navy-700 p-8 sm:p-12 mb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="text-2xl font-black font-display text-white tracking-tight mb-4">
              Architecture Built For Scale and Fairness
            </h2>
            <div className="space-y-3 text-xs sm:text-sm text-gray-300 leading-relaxed">
              <p>
                In high-velocity flash sales and seasonal launches, traditional retail sites suffer from cart collisions and overselling. ShopNest employs ACID database transactions with row-level locks on stock variants, securing temporary 30-minute holds during checkout.
              </p>
              <p>
                All currency computations remain strictly in integer paise, eliminating floating-point rounding errors and guaranteeing exact GST tax compliance.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-4">
              <Link
                to="/shop"
                className="inline-flex items-center gap-2 btn-primary text-xs font-bold px-5 py-2.5 rounded-xl"
              >
                <span>Explore Catalog</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 btn-secondary text-xs font-semibold px-5 py-2.5 rounded-xl"
              >
                <span>Get in Touch</span>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-navy-900/80 border border-navy-700 text-center">
              <p className="text-3xl font-black font-display text-orange-400">42</p>
              <p className="text-xs text-gray-400 mt-1 font-semibold">Active Verified Products</p>
            </div>
            <div className="p-5 rounded-2xl bg-navy-900/80 border border-navy-700 text-center">
              <p className="text-3xl font-black font-display text-teal-400">100%</p>
              <p className="text-xs text-gray-400 mt-1 font-semibold">Genuine Warranty</p>
            </div>
            <div className="p-5 rounded-2xl bg-navy-900/80 border border-navy-700 text-center">
              <p className="text-3xl font-black font-display text-emerald-400">18%</p>
              <p className="text-xs text-gray-400 mt-1 font-semibold">Standard GST Invoice</p>
            </div>
            <div className="p-5 rounded-2xl bg-navy-900/80 border border-navy-700 text-center">
              <p className="text-3xl font-black font-display text-amber-400">&lt;24h</p>
              <p className="text-xs text-gray-400 mt-1 font-semibold">Dispatch Window</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
