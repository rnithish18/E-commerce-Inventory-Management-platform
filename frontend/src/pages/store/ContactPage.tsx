import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, MessageSquare, CheckCircle2, Loader2, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { contactApi } from '../../lib/api';

export function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !subject || !message) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      await contactApi.submit({ name, email, subject, message });
      setSubmitted(true);
      toast.success('Your message has been received!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <span className="px-3 py-1 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20 text-xs font-bold uppercase tracking-wider">
          Support & Inquiries
        </span>
        <h1 className="text-3xl sm:text-4xl font-black font-display text-white tracking-tight mt-4">
          Contact Customer Care
        </h1>
        <p className="mt-2 text-sm text-gray-400">
          Have an inquiry regarding an order, corporate procurement, or product warranty? Reach out to our dedicated concierge.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Contact Info Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <div className="p-6 rounded-3xl bg-navy-800/90 border border-navy-700 space-y-6">
            <div>
              <h3 className="font-bold font-display text-white text-base mb-1">Direct Channels</h3>
              <p className="text-xs text-gray-400">Response guaranteed within 24 business hours.</p>
            </div>

            <div className="space-y-4 text-xs">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-semibold text-white">Email Inquiries</p>
                  <p className="text-gray-400 font-mono mt-0.5">support@shopnest.com</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center shrink-0">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-semibold text-white">Helpline (Mon - Sat)</p>
                  <p className="text-gray-400 font-mono mt-0.5">+91 (80) 4123-5678</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-semibold text-white">Fulfillment Hub & Headquarters</p>
                  <p className="text-gray-400 mt-0.5 leading-relaxed">
                    ShopNest (demonstration project)<br />
                    Outer Ring Road, Bellandur,<br />
                    Bangalore, Karnataka 560103
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-navy-700/80 flex items-center gap-2 text-xs text-gray-400">
              <Clock className="w-4 h-4 text-orange-400 shrink-0" />
              <span>Hours: 9:00 AM - 7:00 PM IST</span>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="lg:col-span-2">
          <div className="p-6 sm:p-8 rounded-3xl bg-navy-800/90 border border-navy-700">
            {submitted ? (
              <div className="py-12 text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold font-display text-white">Message Dispatched Successfully</h3>
                <p className="text-xs text-gray-300 max-w-md mx-auto leading-relaxed">
                  Thank you for reaching out, <strong className="text-white">{name}</strong>. A customer support ticket has been registered, and a representative will reply to <strong className="text-white">{email}</strong> shortly.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSubmitted(false);
                    setName('');
                    setEmail('');
                    setSubject('');
                    setMessage('');
                  }}
                  className="btn-secondary text-xs font-semibold px-4 py-2 mt-4"
                >
                  Send Another Inquiry
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                      Your Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Priya Sharma"
                      className="input text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="priya@example.com"
                      className="input text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                    Subject / Order Reference *
                  </label>
                  <input
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. Question regarding Order #8A34F9..."
                    className="input text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                    Your Message *
                  </label>
                  <textarea
                    required
                    rows={5}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Please include details such as model names, tracking issues, or replacement requirements..."
                    className="input text-xs resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full py-3 text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Transmit Message</span>
                      <Send className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

