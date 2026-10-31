import React from 'react';
import { Shield, Lock, Eye, FileText, Database, CheckCircle2 } from 'lucide-react';

export function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      <div className="mb-12">
        <span className="px-3 py-1 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20 text-xs font-bold uppercase tracking-wider">
          Compliance & Trust
        </span>
        <h1 className="text-3xl sm:text-4xl font-black font-display text-white tracking-tight mt-4">
          Privacy Policy
        </h1>
        <p className="mt-2 text-sm text-gray-400">
          Last revised: October 2026. Compliant with the Digital Personal Data Protection (DPDP) Act, 2023.
        </p>
      </div>

      <div className="p-8 rounded-3xl bg-navy-800/90 border border-navy-700 space-y-8 text-xs sm:text-sm text-gray-300 leading-relaxed">
        <section>
          <h2 className="text-base font-bold font-display text-white mb-2">1. Overview and Purpose</h2>
          <p>
            ShopNest is committed to respecting and protecting the personal data of our users. This policy outlines our standards regarding the collection, processing, storage, and erasure of personal data acquired during your use of our digital platforms, APIs, and fulfillment services.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold font-display text-white mb-2">2. Data We Collect</h2>
          <ul className="list-disc pl-5 space-y-1.5 text-gray-400 text-xs">
            <li><strong>Identity and Contact Data:</strong> Full name, verified email address, mobile phone number, delivery and billing addresses.</li>
            <li><strong>Transactional and Financial Data:</strong> Order records, payment IDs, GST invoice records. We never store credit/debit card numbers or CVVs on our servers; payments are tokenized and processed through RBI-authorized payment aggregators (e.g. Razorpay).</li>
            <li><strong>Authentication & Technical Data:</strong> IP address, device user-agent, session identifiers, and third-party identity subject IDs (Google, Facebook, GitHub) when you choose social single sign-on.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-bold font-display text-white mb-2">3. Purpose and Legal Basis for Processing</h2>
          <p>We process your data exclusively for defined legal purposes:</p>
          <ul className="list-disc pl-5 space-y-1.5 text-gray-400 text-xs mt-2">
            <li>Execution and fulfillment of purchases and order contracts.</li>
            <li>Issuance of statutory tax invoices compliant with Indian GST laws.</li>
            <li>Communication regarding shipment status, OTP authentications, and customer support inquiries.</li>
            <li>Fraud prevention, prevention of multi-account cart abuse, and system audit logging.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-bold font-display text-white mb-2">4. Data Retention & Security Architecture</h2>
          <p>
            Personal data is encrypted both in transit (TLS 1.3) and at rest within secure PostgreSQL clusters located within the Republic of India. Account passwords are encrypted using salted bcrypt hashes (work factor 12). Transactional records and tax invoices are retained for the statutory period required by Indian tax statutes (7 years), after which data is scrubbed or pseudonymized.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold font-display text-white mb-2">5. Your Statutory Rights (DPDP Act, 2023)</h2>
          <p>Under the DPDP Act, you maintain the following rights:</p>
          <ul className="list-disc pl-5 space-y-1.5 text-gray-400 text-xs mt-2">
            <li><strong>Right to Access:</strong> You may request an export of all personal data held about you.</li>
            <li><strong>Right to Correction & Erasure:</strong> You may request the update or deletion of non-statutory data.</li>
            <li><strong>Right of Grievance Redressal:</strong> Contact our designated Grievance Officer at <code className="text-orange-400">privacy@shopnest.com</code>.</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
