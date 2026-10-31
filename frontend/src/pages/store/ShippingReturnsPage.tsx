import React from 'react';
import { Truck, RotateCcw, Clock, ShieldCheck, MapPin, AlertCircle, HelpCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export function ShippingReturnsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      <div className="mb-12">
        <span className="px-3 py-1 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20 text-xs font-bold uppercase tracking-wider">
          Policies & Logistics
        </span>
        <h1 className="text-3xl sm:text-4xl font-black font-display text-white tracking-tight mt-4">
          Shipping & Return Guidelines
        </h1>
        <p className="mt-2 text-sm text-gray-400">
          Clear, documented fulfillment timelines, carrier partnerships, and return criteria across India.
        </p>
      </div>

      <div className="space-y-8">
        {/* Shipping Policy */}
        <section className="p-6 sm:p-8 rounded-3xl bg-navy-800/90 border border-navy-700">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/15 border border-teal-500/30 text-teal-400 flex items-center justify-center">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-display text-white">Shipping & Delivery Timelines</h2>
              <p className="text-xs text-gray-400">Domestic shipping across all 28 states and 8 union territories</p>
            </div>
          </div>

          <div className="space-y-4 text-xs sm:text-sm text-gray-300 leading-relaxed">
            <p>
              Orders placed before 2:00 PM IST on business days are processed and dispatched on the same day from our nearest regional fulfillment center. Orders placed after 2:00 PM IST or over the weekend ship on the next business day.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-navy-900/80 border border-navy-700">
                <p className="font-bold text-white text-xs">Metro Cities</p>
                <p className="text-teal-400 font-black text-lg font-display mt-1">24 to 48 Hours</p>
                <p className="text-[11px] text-gray-400 mt-1">Bangalore, Mumbai, Delhi-NCR, Hyderabad, Chennai, Kolkata</p>
              </div>

              <div className="p-4 rounded-2xl bg-navy-900/80 border border-navy-700">
                <p className="font-bold text-white text-xs">Tier 2 & 3 Cities</p>
                <p className="text-orange-400 font-black text-lg font-display mt-1">2 to 4 Days</p>
                <p className="text-[11px] text-gray-400 mt-1">State capitals and major district commercial hubs</p>
              </div>

              <div className="p-4 rounded-2xl bg-navy-900/80 border border-navy-700">
                <p className="font-bold text-white text-xs">Remote Locations</p>
                <p className="text-purple-400 font-black text-lg font-display mt-1">4 to 6 Days</p>
                <p className="text-[11px] text-gray-400 mt-1">Special regions and northeastern PIN codes</p>
              </div>
            </div>

            <div className="pt-2">
              <h3 className="font-bold text-white text-xs mb-1">Shipping Fees</h3>
              <ul className="list-disc pl-5 space-y-1 text-xs text-gray-400">
                <li>Orders ₹500 and above: <strong>FREE Delivery</strong> pan-India.</li>
                <li>Orders under ₹500: Flat standard courier fee of <strong>₹50 (5,000 paise)</strong>.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Returns Policy */}
        <section className="p-6 sm:p-8 rounded-3xl bg-navy-800/90 border border-navy-700">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-2xl bg-orange-500/15 border border-orange-500/30 text-orange-400 flex items-center justify-center">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-display text-white">7-Day Easy Returns & Replacements</h2>
              <p className="text-xs text-gray-400">Protection against manufacturing defects, shipping damages, or sizing mismatches</p>
            </div>
          </div>

          <div className="space-y-4 text-xs sm:text-sm text-gray-300 leading-relaxed">
            <p>
              We want you to be completely satisfied with your purchase. You may request a return or replacement within <strong>7 days of delivery</strong> directly through your customer orders dashboard or via our support team.
            </p>

            <div className="p-4 rounded-2xl bg-navy-900/80 border border-navy-700">
              <h4 className="font-bold text-white text-xs mb-2">Conditions for Return Acceptance:</h4>
              <ul className="list-disc pl-5 space-y-1 text-xs text-gray-400">
                <li>Item must be unused, unwashed, and in its original condition.</li>
                <li>All original manufacturer packaging, barcodes, tags, manuals, and accessories must be intact.</li>
                <li>Electronics and mobile devices must be unlinked from iCloud, Google, or personal PIN locks.</li>
              </ul>
            </div>

            <div className="p-4 rounded-2xl bg-orange-500/10 border border-orange-500/30">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                <div className="text-xs text-gray-300">
                  <strong className="text-orange-300">Refund Processing Timeline:</strong> Refunds are initiated within 24 hours of our fulfillment hub receiving and inspecting the returned item. Credited directly back to your original payment method (Cards, UPI, Netbanking) in 3 to 5 business days.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Track Order CTA */}
        <div className="p-6 rounded-3xl bg-navy-800/60 border border-navy-700 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Clock className="w-6 h-6 text-orange-400" />
            <div>
              <p className="font-bold text-white text-sm">Need to track an existing order?</p>
              <p className="text-xs text-gray-400">Track directly with your Order ID and email address without logging in.</p>
            </div>
          </div>
          <Link
            to="/track-order"
            className="btn-primary px-5 py-2 text-xs font-bold whitespace-nowrap"
          >
            Track Order Status
          </Link>
        </div>
      </div>
    </div>
  );
}
