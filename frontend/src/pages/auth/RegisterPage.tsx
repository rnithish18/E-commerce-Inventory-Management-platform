import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Lock, Mail, User, Phone, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { authApi } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';

export function RegisterPage() {
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !password) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      const res = await authApi.register({
        full_name: fullName,
        email,
        phone: phone || undefined,
        password,
      });
      setUser(res.data.user);
      toast.success('Account created successfully! Welcome to ShopNest.');
      navigate('/');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-navy-900 flex flex-col items-center justify-center p-4">
      
      {/* Brand */}
      <Link to="/" className="flex items-center gap-3 mb-8 group">
        <div className="w-11 h-11 rounded-2xl bg-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/25 group-hover:scale-105 transition-transform">
          <ShoppingBag className="w-6 h-6 text-white" />
        </div>
        <div>
          <span className="text-2xl font-black text-white">Shop<span className="text-orange-500">Nest</span></span>
          <p className="text-[10px] text-gray-400 font-medium">Better Products. Happier You.</p>
        </div>
      </Link>

      <div className="w-full max-w-md bg-navy-800/90 border border-navy-700 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md">
        
        <div className="mb-6 text-center">
          <h1 className="text-xl font-bold text-white tracking-tight">Create Customer Account</h1>
          <p className="text-xs text-gray-400 mt-1">Get 10% off your first order with code WELCOME10</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">Full Name *</label>
            <div className="relative">
              <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Rohit Sharma"
                className="input pl-10 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">Email Address *</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="rohit@example.com"
                className="input pl-10 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">Mobile Phone (Optional)</label>
            <div className="relative">
              <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="9876543210"
                className="input pl-10 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">Password * (Min 8 chars)</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input pl-10 text-xs"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3 text-xs mt-2 flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20"
          >
            <span>{loading ? 'Creating Account...' : 'Agree & Register'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-navy-700/80 text-center">
          <p className="text-xs text-gray-400">
            Already have an account?{' '}
            <Link to="/login" className="text-orange-400 font-bold hover:underline">
              Sign In
            </Link>
          </p>
        </div>

      </div>

    </div>
  );
}
