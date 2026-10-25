import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ShoppingBag, Lock, Eye, EyeOff, CheckCircle2, ArrowRight, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { authApi } from '../../lib/api';
import { PasswordStrengthMeter } from '../../components/auth/PasswordStrengthMeter';

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      toast.error('Reset token is missing or invalid.');
      return;
    }
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      await authApi.resetPassword({ token, password });
      setCompleted(true);
      toast.success('Password reset successfully! Please log in with your new credentials.');
      setTimeout(() => {
        navigate('/login');
      }, 2500);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Password reset failed. Token may be expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-navy-900 text-white flex flex-col items-center justify-center p-4">
      {/* Brand logo */}
      <Link to="/" className="flex items-center gap-3 mb-8 group">
        <div className="w-11 h-11 rounded-2xl bg-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/25 group-hover:scale-105 transition-transform">
          <ShoppingBag className="w-6 h-6 text-white" />
        </div>
        <div>
          <span className="text-2xl font-black text-white">
            Shop<span className="text-orange-500">Nest</span>
          </span>
          <p className="text-[10px] text-gray-400 font-medium">Better Products. Happier You.</p>
        </div>
      </Link>

      <div className="w-full max-w-md bg-navy-800/95 border border-navy-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md">
        {!token ? (
          <div className="text-center py-4">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 mx-auto flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-white mb-2">Invalid or Missing Token</h2>
            <p className="text-xs text-gray-400 mb-6">
              The password reset link is invalid or has expired. Please request a new link.
            </p>
            <Link
              to="/login"
              className="btn-primary inline-flex items-center justify-center gap-2 text-xs py-2.5 px-5 w-full"
            >
              <span>Back to Login</span>
            </Link>
          </div>
        ) : completed ? (
          <div className="text-center py-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center mb-4 animate-bounce">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-white mb-2">Password Reset Complete!</h2>
            <p className="text-xs text-gray-400 mb-6">
              Your password has been securely updated. Redirecting you to sign in...
            </p>
            <Link
              to="/login"
              className="btn-primary inline-flex items-center justify-center gap-2 text-xs py-2.5 px-5 w-full"
            >
              <span>Go to Sign In Now</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-6 text-center">
              <h1 className="text-xl font-bold text-white tracking-tight">Create New Password</h1>
              <p className="text-xs text-gray-400 mt-1">
                Enter your new password below to secure your ShopNest account
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    className="input pl-10 pr-10 text-xs focus:ring-teal-400/80 focus:border-teal-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-pressed={showPassword}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <PasswordStrengthMeter password={password} />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="input pl-10 pr-10 text-xs focus:ring-teal-400/80 focus:border-teal-400"
                  />
                </div>
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-[11px] text-red-400 mt-1 font-medium">Passwords do not match</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || password.length < 8 || password !== confirmPassword}
                className="btn-primary w-full py-3 text-xs mt-2 flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20"
              >
                <span>{loading ? 'Updating Password...' : 'Save & Sign In'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="mt-6 pt-4 border-t border-navy-700/80 text-center">
              <Link to="/login" className="text-xs text-gray-400 hover:text-orange-400 font-medium">
                Back to Sign In
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
