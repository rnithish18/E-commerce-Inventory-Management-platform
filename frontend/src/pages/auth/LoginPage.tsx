import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ShoppingBag, Lock, Mail, ArrowRight, ShieldCheck, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnUrl = searchParams.get('returnUrl') || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter both email and password');
      return;
    }

    try {
      setLoading(true);
      await login(email, password);
      toast.success('Logged in successfully!');
      navigate(returnUrl);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoAdmin = () => {
    setEmail('admin@shopnest.com');
    setPassword('Admin@123!');
  };

  const fillDemoCustomer = () => {
    setEmail('customer1@shopnest.com');
    setPassword('Customer@123!');
  };

  return (
    <div className="min-h-screen bg-navy-900 flex flex-col items-center justify-center p-4">
      
      {/* Brand logo */}
      <Link to="/" className="flex items-center gap-3 mb-8 group">
        <div className="w-11 h-11 rounded-2xl bg-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/25 group-hover:scale-105 transition-transform">
          <ShoppingBag className="w-6 h-6 text-white" />
        </div>
        <div>
          <span className="text-2xl font-black text-white">Shop<span className="text-orange-500">Nest</span></span>
          <p className="text-[10px] text-gray-400 font-medium">Better Products. Happier You.</p>
        </div>
      </Link>

      {/* Card */}
      <div className="w-full max-w-md bg-navy-800/90 border border-navy-700 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md">
        
        <div className="mb-6 text-center">
          <h1 className="text-xl font-bold text-white tracking-tight">Welcome Back</h1>
          <p className="text-xs text-gray-400 mt-1">Sign in to your account to manage orders and checkout</p>
        </div>

        {/* Demo buttons */}
        <div className="grid grid-cols-2 gap-2 mb-6 p-1.5 rounded-2xl bg-navy-900/80 border border-navy-700">
          <button
            type="button"
            onClick={fillDemoAdmin}
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/30 text-xs font-bold transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Demo Admin</span>
          </button>
          <button
            type="button"
            onClick={fillDemoCustomer}
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-navy-700 hover:bg-navy-600 text-gray-200 text-xs font-bold transition-colors"
          >
            <User className="w-3.5 h-3.5" />
            <span>Demo Customer</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="input pl-10 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
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
            <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-navy-700/80 text-center">
          <p className="text-xs text-gray-400">
            Don't have an account?{' '}
            <Link to="/register" className="text-orange-400 font-bold hover:underline">
              Create an account
            </Link>
          </p>
        </div>

      </div>

    </div>
  );
}
