import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Sparkles, AlertCircle, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { authApi } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';

export function MagicLinkVerifyPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  const token = searchParams.get('token');
  const returnUrl = searchParams.get('returnUrl') || '/';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing sign-in token. Please request a new magic link.');
      setLoading(false);
      return;
    }

    let isMounted = true;

    async function verify() {
      try {
        setLoading(true);
        setError(null);
        await authApi.verifyMagicLink(token!, returnUrl);
        if (!isMounted) return;

        localStorage.setItem('shopnest_last_auth_provider', 'magicLink');
        await refreshUser();
        setSuccess(true);
        toast.success('Successfully signed in with Magic Link!');
        setTimeout(() => {
          navigate(returnUrl, { replace: true });
        }, 1200);
      } catch (err: any) {
        if (!isMounted) return;
        const code = err.response?.data?.error || err.response?.data?.code;
        const msg = err.response?.data?.message;

        if (code === 'BROWSER_BINDING_MISMATCH') {
          setError(
            'Security Verification Failed: Magic links must be opened in the exact browser where they were requested. Please return to the original browser tab or request a fresh link.'
          );
        } else if (code === 'TOKEN_EXPIRED') {
          setError('This magic link has expired (links are valid for 15 minutes). Please request a new sign-in link.');
        } else if (code === 'TOKEN_ALREADY_USED') {
          setError('This magic link has already been used. Please generate a new one.');
        } else {
          setError(msg || 'Failed to authenticate with magic link. Please try logging in again.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    verify();

    return () => {
      isMounted = false;
    };
  }, [token, returnUrl, navigate, refreshUser]);

  return (
    <div className="min-h-screen bg-navy-900 text-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-navy-800/90 border border-navy-700 rounded-3xl p-8 shadow-2xl backdrop-blur-xl text-center">
        <div className="w-14 h-14 rounded-2xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center mx-auto mb-6 text-orange-400">
          <Sparkles className="w-7 h-7" />
        </div>

        <h1 className="text-2xl font-black text-white tracking-tight mb-2">
          Magic Link Sign-In
        </h1>

        {loading && (
          <div className="py-6 flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-orange-400" />
            <p className="text-xs text-gray-400">Verifying your secure credentials & session...</p>
          </div>
        )}

        {!loading && success && (
          <div className="py-6 flex flex-col items-center gap-3">
            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
            <p className="text-sm font-semibold text-emerald-300">Welcome to ShopNest!</p>
            <p className="text-xs text-gray-400">Redirecting to your destination...</p>
          </div>
        )}

        {!loading && error && (
          <div className="py-4">
            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-left mb-6">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <p className="text-xs text-red-200 leading-relaxed">{error}</p>
              </div>
            </div>

            <Link
              to={`/login?returnUrl=${encodeURIComponent(returnUrl)}`}
              className="w-full py-2.5 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Sign In</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
