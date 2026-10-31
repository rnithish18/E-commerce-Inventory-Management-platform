import React from 'react';
import { FileText, Scale, ShieldAlert, CheckCircle2 } from 'lucide-react';

export function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      <div className="mb-12">
        <span className="px-3 py-1 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20 text-xs font-bold uppercase tracking-wider">
          Legal Agreement
        </span>
        <h1 className="text-3xl sm:text-4xl font-black font-display text-white tracking-tight mt-4">
          Terms of Service
        </h1>
        <p className="mt-2 text-sm text-gray-400">
          Governing your purchases and interactions with the ShopNest commerce platform.
        </p>
      </div>

      <div className="p-8 rounded-3xl bg-navy-800/90 border border-navy-700 space-y-8 text-xs sm:text-sm text-gray-300 leading-relaxed">
        <section>
          <h2 className="text-base font-bold font-display text-white mb-2">1. Acceptance of Terms</h2>
          <p>
            By creating an account, browsing our catalog, or placing an order on ShopNest, you agree to be legally bound by these Terms of Service and all related policies referenced herein. If you disagree with any part of these terms, you must refrain from using the platform.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold font-display text-white mb-2">2. Accuracy of Product Details & Pricing</h2>
          <p>
            All prices are stated in Indian Rupees (INR) and calculated internally in integer paise (₹1 = 100 paise). Product prices include applicable Goods and Services Tax (GST) unless indicated otherwise. While we strive for absolute accuracy, in the event of an inadvertent technical pricing or inventory error, ShopNest reserves the right to cancel affected orders prior to shipment and issue a full immediate refund.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold font-display text-white mb-2">3. Orders, Reservations, and Payments</h2>
          <p>
            Placing an item in your checkout initiates a temporary 30-minute stock reservation. If payment is not confirmed within this window, the reservation automatically lapses and items are released back to public availability. Successful receipt of payment generates an order confirmation and statutory GST Tax Invoice accessible via your customer dashboard.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold font-display text-white mb-2">4. User Account & Conduct</h2>
          <p>
            You are responsible for maintaining the confidentiality of your login credentials and one-time passwords (OTPs). Creating multiple fraudulent accounts to circumvent coupon redemption limitations (e.g. WELCOME10) or utilizing automated bots to scrape product inventory is strictly prohibited and grounds for immediate termination.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold font-display text-white mb-2">5. Governing Law & Jurisdiction</h2>
          <p>
            These Terms are governed by and construed in accordance with the laws of the Republic of India. Any disputes arising hereunder shall be subject to the exclusive jurisdiction of the competent courts located in Bangalore, Karnataka.
          </p>
        </section>
      </div>
    </div>
  );
}
