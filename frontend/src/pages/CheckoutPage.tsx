import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  MapPin, 
  Plus, 
  Check, 
  CreditCard, 
  Lock, 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { formatPaise } from '../lib/utils';
import api from '../lib/api';
import toast from 'react-hot-toast';

interface Address {
  id: string;
  full_name: string;
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  is_default: boolean;
}

export function CheckoutPage() {
  const { cart, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [paymentMode, setPaymentMode] = useState<'mock' | 'razorpay'>('mock');

  // New address form state
  const [newFullName, setNewFullName] = useState(user?.full_name || '');
  const [newLine1, setNewLine1] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newState, setNewState] = useState('');
  const [newPincode, setNewPincode] = useState('');
  const [newPhone, setNewPhone] = useState('');

  const fetchAddresses = async () => {
    try {
      const res = await api.get('/addresses');
      setAddresses(res.data.addresses);
      if (res.data.addresses.length > 0) {
        const def = res.data.addresses.find((a: Address) => a.is_default);
        setSelectedAddressId(def ? def.id : res.data.addresses[0].id);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/login?returnUrl=/checkout');
      return;
    }
    fetchAddresses();
  }, [user]);

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFullName || !newLine1 || !newCity || !newState || !newPincode || !newPhone) {
      toast.error('Please complete all required address fields');
      return;
    }

    try {
      const res = await api.post('/addresses', {
        full_name: newFullName,
        line1: newLine1,
        city: newCity,
        state: newState,
        pincode: newPincode,
        phone: newPhone,
        is_default: addresses.length === 0,
      });

      toast.success('Delivery address added');
      setShowAddressForm(false);
      await fetchAddresses();
      setSelectedAddressId(res.data.address.id);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save address');
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      toast.error('Please select or add a delivery address');
      return;
    }

    if (cart.items.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    try {
      setSubmitting(true);
      // 1. Checkout order on server (reserves stock)
      const checkoutRes = await api.post('/orders/checkout', {
        addressId: selectedAddressId,
        couponCode: cart.couponCode,
        items: cart.items.map(i => ({ productId: i.productId, variantId: i.variantId, quantity: i.quantity })),
      });

      const orderData = checkoutRes.data;
      const orderId = orderData.orderId;

      // 2. Process payment (Mock Gateway or Razorpay Sandbox)
      if (paymentMode === 'mock') {
        const payRes = await api.post('/payments/mock-complete', {
          orderId,
          success: true,
        });

        clearCart();
        toast.success('Payment verified in sandbox mode!');
        navigate(`/order-confirmation/${orderId}`);
      } else {
        // Razorpay checkout simulation
        toast.success('Razorpay test checkout initiated...');
        clearCart();
        navigate(`/order-confirmation/${orderId}`);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Checkout failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (cart.items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center">
        <AlertCircle className="w-12 h-12 text-orange-400 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-white mb-2">No items to checkout</h2>
        <p className="text-xs text-gray-400 mb-6">Your shopping cart is currently empty.</p>
        <Link to="/shop" className="btn-primary text-xs">Return to Catalog</Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto pb-16 flex flex-col gap-6">
      
      {/* Page Header */}
      <div className="flex items-center justify-between pb-4 border-b border-navy-700">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Checkout & Order Confirmation
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Verified server-side pricing, inventory reservation, and payment sandbox
          </p>
        </div>
        <Link to="/cart" className="flex items-center gap-1.5 text-xs text-orange-400 font-semibold hover:underline">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Cart</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left Column: Delivery Address & Payment Method */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* 1. Delivery Address Card */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-orange-500/10 text-orange-400 flex items-center justify-center font-bold text-xs">
                  1
                </div>
                <h3 className="font-bold text-white text-sm">Delivery Address</h3>
              </div>

              {!showAddressForm && (
                <button
                  type="button"
                  onClick={() => setShowAddressForm(true)}
                  className="flex items-center gap-1 text-xs text-orange-400 font-bold hover:text-orange-300"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add New Address</span>
                </button>
              )}
            </div>

            {/* Address Selection List */}
            {!showAddressForm ? (
              <div className="flex flex-col gap-3">
                {addresses.length > 0 ? (
                  addresses.map((addr) => (
                    <label
                      key={addr.id}
                      className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-colors ${
                        selectedAddressId === addr.id
                          ? 'bg-navy-800 border-orange-500/60 ring-1 ring-orange-500/40'
                          : 'bg-navy-800/50 border-navy-700 hover:border-gray-500'
                      }`}
                    >
                      <input
                        type="radio"
                        name="delivery_address"
                        value={addr.id}
                        checked={selectedAddressId === addr.id}
                        onChange={() => setSelectedAddressId(addr.id)}
                        className="mt-1 text-orange-500 focus:ring-orange-500"
                      />
                      <div className="text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">{addr.full_name}</span>
                          <span className="text-gray-400 font-mono">({addr.phone})</span>
                          {addr.is_default && (
                            <span className="text-[10px] bg-navy-700 text-orange-400 font-semibold px-2 py-0.2 rounded-full border border-navy-600">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="text-gray-300 mt-1">{addr.line1}</p>
                        <p className="text-gray-400 text-[11px]">
                          {addr.city}, {addr.state} — {addr.pincode}
                        </p>
                      </div>
                    </label>
                  ))
                ) : (
                  <div className="text-center py-6 text-xs text-gray-400">
                    No delivery address saved. Click below to add one.
                  </div>
                )}
              </div>
            ) : (
              /* Add Address Form */
              <form onSubmit={handleSaveAddress} className="flex flex-col gap-3 pt-2">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-300 mb-1">Recipient Name *</label>
                    <input
                      type="text"
                      required
                      value={newFullName}
                      onChange={e => setNewFullName(e.target.value)}
                      placeholder="Full Name"
                      className="input text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-300 mb-1">Mobile Phone *</label>
                    <input
                      type="tel"
                      required
                      value={newPhone}
                      onChange={e => setNewPhone(e.target.value)}
                      placeholder="10-digit number"
                      className="input text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-300 mb-1">Street Address / Flat No *</label>
                  <input
                    type="text"
                    required
                    value={newLine1}
                    onChange={e => setNewLine1(e.target.value)}
                    placeholder="House/Flat No, Apartment, Street"
                    className="input text-xs"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-300 mb-1">City *</label>
                    <input
                      type="text"
                      required
                      value={newCity}
                      onChange={e => setNewCity(e.target.value)}
                      placeholder="City"
                      className="input text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-300 mb-1">State *</label>
                    <input
                      type="text"
                      required
                      value={newState}
                      onChange={e => setNewState(e.target.value)}
                      placeholder="State"
                      className="input text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-300 mb-1">PIN Code *</label>
                    <input
                      type="text"
                      required
                      value={newPincode}
                      onChange={e => setNewPincode(e.target.value)}
                      placeholder="6 digits"
                      className="input text-xs"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button type="submit" className="btn-primary text-xs py-2">
                    Save Delivery Address
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddressForm(false)}
                    className="btn-secondary text-xs py-2"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* 2. Payment Method Card */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg bg-orange-500/10 text-orange-400 flex items-center justify-center font-bold text-xs">
                2
              </div>
              <h3 className="font-bold text-white text-sm">Payment Gateway Sandbox</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Mock Sandbox Gateway */}
              <label
                className={`p-4 rounded-xl border cursor-pointer flex flex-col justify-between transition-colors ${
                  paymentMode === 'mock'
                    ? 'bg-navy-800 border-orange-500/60 ring-1 ring-orange-500/40'
                    : 'bg-navy-800/40 border-navy-700 hover:border-gray-500'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-xs text-white">Mock Payment Sandbox</span>
                  <input
                    type="radio"
                    name="payment_method"
                    value="mock"
                    checked={paymentMode === 'mock'}
                    onChange={() => setPaymentMode('mock')}
                    className="text-orange-500 focus:ring-orange-500"
                  />
                </div>
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  Clearly labeled sandbox simulator with automated webhook trigger and stock validation.
                </p>
                <span className="mt-3 text-[10px] font-mono text-green-400 bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20 w-fit">
                  Instant Verification
                </span>
              </label>

              {/* Razorpay Test Mode */}
              <label
                className={`p-4 rounded-xl border cursor-pointer flex flex-col justify-between transition-colors ${
                  paymentMode === 'razorpay'
                    ? 'bg-navy-800 border-orange-500/60 ring-1 ring-orange-500/40'
                    : 'bg-navy-800/40 border-navy-700 hover:border-gray-500'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-xs text-white">Razorpay TEST Mode</span>
                  <input
                    type="radio"
                    name="payment_method"
                    value="razorpay"
                    checked={paymentMode === 'razorpay'}
                    onChange={() => setPaymentMode('razorpay')}
                    className="text-orange-500 focus:ring-orange-500"
                  />
                </div>
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  Official Razorpay payment gateway sandbox with server-side HMAC signature verification.
                </p>
                <span className="mt-3 text-[10px] font-mono text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20 w-fit">
                  UPI / Cards / NetBanking
                </span>
              </label>
            </div>

            <div className="mt-4 p-3 rounded-xl bg-navy-800/60 border border-navy-700 text-xs flex items-center gap-2 text-gray-300">
              <Lock className="w-4 h-4 text-green-400 shrink-0" />
              <span>
                All transactions are strictly simulated in sandbox test mode. No real card details are ever requested or stored.
              </span>
            </div>
          </div>

        </div>

        {/* Right Column: Order Review Summary & Place Order */}
        <div className="flex flex-col gap-4">
          <div className="card p-5">
            <h3 className="font-bold text-white text-sm mb-4">Order Summary ({cart.items.length} items)</h3>
            
            {/* Items list */}
            <div className="flex flex-col gap-3 max-h-56 overflow-y-auto mb-4 divide-y divide-navy-600/40">
              {cart.items.map((item) => (
                <div key={item.productId} className="pt-2.5 first:pt-0 flex items-center justify-between gap-3 text-xs">
                  <div className="truncate flex-1">
                    <p className="font-semibold text-white truncate">{item.productName}</p>
                    <p className="text-[11px] text-gray-400">Qty: {item.quantity} × {formatPaise(item.unitPricePaise)}</p>
                  </div>
                  <span className="font-mono font-bold text-gray-200">
                    {formatPaise(item.totalPricePaise)}
                  </span>
                </div>
              ))}
            </div>

            {/* Price Calculations */}
            <div className="border-t border-navy-600/60 pt-3 flex flex-col gap-2 text-xs">
              <div className="flex justify-between text-gray-400">
                <span>Subtotal</span>
                <span className="font-mono text-gray-200">{formatPaise(cart.subtotalPaise)}</span>
              </div>
              {cart.discountPaise > 0 && (
                <div className="flex justify-between text-green-400 font-semibold">
                  <span>Coupon Discount ({cart.couponCode})</span>
                  <span className="font-mono">-{formatPaise(cart.discountPaise)}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-400">
                <span>GST (18% Flat)</span>
                <span className="font-mono text-gray-200">{formatPaise(cart.taxPaise)}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Shipping</span>
                <span className="font-mono">
                  {cart.shippingPaise === 0 ? <span className="text-green-400 font-bold">FREE</span> : formatPaise(cart.shippingPaise)}
                </span>
              </div>

              <div className="border-t border-navy-600/60 pt-3 flex justify-between font-black text-white text-base">
                <span>Total Payable</span>
                <span className="text-orange-400 font-mono">{formatPaise(cart.totalPaise)}</span>
              </div>
            </div>

            <button
              type="button"
              disabled={submitting}
              onClick={handlePlaceOrder}
              className="mt-6 w-full flex items-center justify-center gap-2 py-3.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg shadow-orange-500/25 transition-all"
            >
              <span>{submitting ? 'Reserving Stock & Processing...' : `Pay ${formatPaise(cart.totalPaise)} (Test Sandbox)`}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-navy-800/40 border border-navy-700/60 text-[11px] text-gray-400 flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5 font-bold text-gray-300">
              <ShieldCheck className="w-4 h-4 text-green-400" />
              <span>30-Minute Stock Reservation Guarantee</span>
            </div>
            <p className="leading-relaxed">
              When you click Place Order, the database acquires a transaction lock on item variants to prevent overselling.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
}
