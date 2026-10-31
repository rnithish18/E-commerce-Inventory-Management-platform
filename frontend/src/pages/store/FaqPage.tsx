import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, Search, ShoppingBag, CreditCard, Truck, RotateCcw, ShieldCheck } from 'lucide-react';

interface FaqItem {
  question: string;
  answer: string;
  category: 'orders' | 'payments' | 'shipping' | 'returns' | 'warranty';
}

const FAQS: FaqItem[] = [
  {
    category: 'orders',
    question: 'How do stock reservations work during checkout?',
    answer: 'When you proceed to checkout, ShopNest locks your requested quantities in our PostgreSQL inventory for 30 minutes. This guarantees that your items cannot be purchased by other customers while you complete payment.',
  },
  {
    category: 'orders',
    question: 'Can I apply a coupon code to my purchase?',
    answer: 'Yes! Eligible coupons such as WELCOME10 can be entered during checkout or directly within your active cart panel. The discount applies immediately to your order subtotal if minimum spend conditions are met.',
  },
  {
    category: 'orders',
    question: 'How do I download my GST tax invoice?',
    answer: 'Once your payment is captured, you can download a PDF copy of your tax invoice from the "My Orders" tab on your profile page or via the order confirmation screen.',
  },
  {
    category: 'payments',
    question: 'What payment methods does ShopNest support?',
    answer: 'We support all major Indian credit and debit cards (Visa, Mastercard, RuPay), UPI (Google Pay, PhonePe, Paytm), Netbanking across 50+ banks, and approved wallet providers via our secure Razorpay gateway.',
  },
  {
    category: 'payments',
    question: 'Is it safe to pay online on ShopNest?',
    answer: 'Yes. All transactions are encrypted with 256-bit TLS encryption. Card credentials are tokenized according to RBI guidelines. We never store raw card numbers or CVVs on our servers.',
  },
  {
    category: 'shipping',
    question: 'What are the delivery charges and timelines?',
    answer: 'Orders of ₹500 or more receive free standard shipping pan-India. For orders under ₹500, a flat ₹50 shipping fee applies. Metro deliveries take 24 to 48 hours; other locations typically take 2 to 4 business days.',
  },
  {
    category: 'shipping',
    question: 'Can I track my shipment without logging in?',
    answer: 'Yes! Use our guest "Track Order" page with your Order ID and associated email address to see live tracking milestones and carrier details.',
  },
  {
    category: 'returns',
    question: 'What is your return policy?',
    answer: 'We offer a 7-day easy return window on eligible items from the delivery date. Items must be unused, in their original condition, and accompanied by the original brand box and tags.',
  },
  {
    category: 'returns',
    question: 'How long does a refund take to process?',
    answer: 'Once our fulfillment team receives and verifies your returned item, refunds are triggered within 24 hours and credited to your original payment method in 3 to 5 banking days.',
  },
  {
    category: 'warranty',
    question: 'Are all products genuine with manufacturer warranty?',
    answer: 'Yes. 100% of our inventory is sourced through official brand channels. All consumer electronics and branded merchandise include original manufacturer warranties honorably valid across all authorized Indian service centers.',
  },
];

export function FaqPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const filteredFaqs = FAQS.filter((faq) => {
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    const matchesSearch =
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <span className="px-3 py-1 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20 text-xs font-bold uppercase tracking-wider">
          Help Center
        </span>
        <h1 className="text-3xl sm:text-4xl font-black font-display text-white tracking-tight mt-4">
          Frequently Asked Questions
        </h1>
        <p className="mt-2 text-sm text-gray-400">
          Find instant answers to common questions about orders, payments, logistics, and policies.
        </p>

        {/* Search Bar */}
        <div className="relative mt-6 max-w-md mx-auto">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search questions (e.g. refund, shipping, GST invoice)..."
            className="input pl-10 text-xs"
          />
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
        {[
          { id: 'all', label: 'All FAQs' },
          { id: 'orders', label: 'Orders' },
          { id: 'payments', label: 'Payments' },
          { id: 'shipping', label: 'Shipping' },
          { id: 'returns', label: 'Returns' },
          { id: 'warranty', label: 'Warranty' },
        ].map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              selectedCategory === cat.id
                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                : 'bg-navy-800 text-gray-400 hover:text-white border border-navy-700'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Accordion FAQ List */}
      <div className="space-y-3">
        {filteredFaqs.length === 0 ? (
          <div className="p-8 rounded-3xl bg-navy-800/60 border border-navy-700 text-center text-xs text-gray-400">
            No matching questions found. Please adjust your search query or contact support.
          </div>
        ) : (
          filteredFaqs.map((faq, idx) => {
            const isExpanded = expandedIndex === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl bg-navy-800/80 border border-navy-700 overflow-hidden transition-colors"
              >
                <button
                  type="button"
                  onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                  className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 focus:outline-none"
                >
                  <span className="font-bold text-white text-xs sm:text-sm">{faq.question}</span>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-orange-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                  )}
                </button>

                {isExpanded && (
                  <div className="px-4 sm:px-5 pb-5 text-xs text-gray-300 leading-relaxed border-t border-navy-700/60 pt-3">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
