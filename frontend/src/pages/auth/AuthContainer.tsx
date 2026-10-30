import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import {
  ShoppingBag,
  Lock,
  Mail,
  User,
  Phone,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Shield,
  Truck,
  RotateCcw,
  Star,
  Eye,
  EyeOff,
  X,
  Send,
  AlertCircle,
  Loader2,
  Check,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { authApi, productsApi } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { RunawayButton } from '../../components/auth/RunawayButton';
import { PasswordStrengthMeter } from '../../components/auth/PasswordStrengthMeter';
import { ProductImage } from '../../components/ui/ProductImage';
import { formatPaise } from '../../lib/utils';

interface AuthContainerProps {
  initialMode?: 'login' | 'register';
}

export function AuthContainer({ initialMode = 'login' }: AuthContainerProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const returnUrl = searchParams.get('returnUrl') || '/';

  const { login, refreshUser } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>(
    location.pathname === '/register' ? 'register' : initialMode
  );
  const [roleContext, setRoleContext] = useState<'CUSTOMER' | 'ADMIN'>('CUSTOMER');

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Register form state
  const [fullName, setFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  // Common UI state
  const [loading, setLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [devResetToken, setDevResetToken] = useState<string | null>(null);

  // Provider subsystem state
  const [providersConfig, setProvidersConfig] = useState<{
    google: boolean;
    facebook: boolean;
    github: boolean;
    phone: boolean;
    magicLink: boolean;
    googleClientId?: string;
  }>({
    google: false,
    facebook: false,
    github: false,
    phone: false,
    magicLink: false,
  });
  const [lastUsedProvider, setLastUsedProvider] = useState<string | null>(null);

  // Phone OTP modal state
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [phoneInput, setPhoneInput] = useState('');
  const [phoneOtpInput, setPhoneOtpInput] = useState('');
  const [phoneStep, setPhoneStep] = useState<'phone' | 'otp'>('phone');
  const [phoneCooldown, setPhoneCooldown] = useState(0);
  const [phoneLoading, setPhoneLoading] = useState(false);

  // Magic Link modal state
  const [showMagicModal, setShowMagicModal] = useState(false);
  const [magicEmail, setMagicEmail] = useState('');
  const [magicSent, setMagicSent] = useState(false);
  const [magicLoading, setMagicLoading] = useState(false);

  const oauthError = searchParams.get('error');

  useEffect(() => {
    authApi
      .getProviders()
      .then((res: any) => {
        const p = res.data || {};
        const provs = p.providers || {};
        setProvidersConfig({
          google: Boolean(p.google ?? provs.google),
          facebook: Boolean(p.facebook ?? provs.facebook),
          github: Boolean(p.github ?? provs.github),
          phone: Boolean(p.phone ?? provs.phone),
          magicLink: Boolean(p.magicLink ?? provs.magicLink),
          googleClientId: p.googleClientId,
        });
      })
      .catch(() => {});

    try {
      setLastUsedProvider(localStorage.getItem('shopnest_last_auth_provider'));
    } catch {}
  }, []);

  // Cooldown countdown for Phone OTP
  useEffect(() => {
    if (phoneCooldown <= 0) return;
    const timer = setInterval(() => {
      setPhoneCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [phoneCooldown]);

  // Google One Tap / GIS Setup
  useEffect(() => {
    if (providersConfig.google && providersConfig.googleClientId) {
      const handleCredential = async (response: any) => {
        try {
          setLoading(true);
          await authApi.verifyGoogleCredential(response.credential, returnUrl);
          try {
            localStorage.setItem('shopnest_last_auth_provider', 'google');
          } catch {}
          await refreshUser();
          toast.success('Signed in with Google One Tap!');
          navigate(returnUrl);
        } catch (err: any) {
          toast.error(err.response?.data?.message || 'Google One Tap sign-in failed');
        } finally {
          setLoading(false);
        }
      };

      const initGsi = () => {
        if ((window as any).google?.accounts?.id) {
          (window as any).google.accounts.id.initialize({
            client_id: providersConfig.googleClientId,
            callback: handleCredential,
            auto_select: false,
            cancel_on_tap_outside: true,
          });
          (window as any).google.accounts.id.prompt();
        }
      };

      if (!(window as any).google?.accounts?.id) {
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = initGsi;
        document.body.appendChild(script);
      } else {
        initGsi();
      }
    }
  }, [providersConfig.google, providersConfig.googleClientId, returnUrl, navigate, refreshUser]);

  const getOAuthErrorMessage = (code: string | null) => {
    if (!code) return null;
    switch (code) {
      case 'admin_google_blocked':
        return 'Google sign-in is not permitted for Admin accounts. Store Administrator accounts cannot sign in using social or passwordless methods. Please sign in using your administrator email and password.';
      case 'admin_social_blocked':
        return 'Store Administrator accounts cannot sign in using social or passwordless methods. Please sign in using your administrator email and password.';
      case 'email_not_verified':
        return 'Your Google email address is not verified by Google. Please verify it or sign in with your password.';
      case 'invalid_state':
        return 'Authentication session timed out or invalid state. Please try signing in again.';
      case 'access_denied':
        return 'Google sign-in was cancelled.';
      case 'account_disabled':
        return 'Your account has been deactivated. Please contact support.';
      case 'oauth_failed':
        return 'Authentication could not be completed. Please try again.';
      case 'missing_code':
        return 'Authorization code was missing. Please try again.';
      default:
        return 'Authentication could not be completed. Please try again.';
    }
  };

  // Showcase carousel index & dynamic DB query
  const [showcaseProducts, setShowcaseProducts] = useState<any[]>([]);
  const [showcaseIndex, setShowcaseIndex] = useState(0);

  useEffect(() => {
    productsApi
      .featured()
      .then((res) => {
        if (res.data?.products && res.data.products.length > 0) {
          setShowcaseProducts(res.data.products.slice(0, 5));
        }
      })
      .catch(() => {});
  }, []);

  // Sync mode with route
  useEffect(() => {
    if (location.pathname === '/register' && mode !== 'register') {
      setMode('register');
    } else if (location.pathname === '/login' && mode !== 'login') {
      setMode('login');
    }
  }, [location.pathname]);

  // Rotate showcase product every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setShowcaseIndex((prev) => (prev + 1) % (showcaseProducts.length || 1));
    }, 5000);
    return () => clearInterval(timer);
  }, [showcaseProducts.length]);

  const switchMode = (newMode: 'login' | 'register') => {
    setMode(newMode);
    if (newMode === 'register') {
      navigate('/register', { replace: false });
    } else {
      navigate('/login', { replace: false });
    }
  };

  // Validation checks for Runaway button
  const isEmailValid = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const isLoginFormValid = isEmailValid(loginEmail) && loginPassword.length >= 6;
  const isRegisterFormValid =
    fullName.trim().length >= 2 && isEmailValid(regEmail) && regPassword.length >= 8;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      toast.error('Please enter both email and password');
      return;
    }
    if (!isEmailValid(loginEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }

    try {
      setLoading(true);
      await login(loginEmail, loginPassword, rememberMe);
      try {
        localStorage.setItem('shopnest_last_auth_provider', 'email');
      } catch {}
      toast.success(
        roleContext === 'ADMIN'
          ? 'Welcome, Admin! Redirecting to Management Console...'
          : 'Logged in successfully! Welcome back to ShopNest.',
        { icon: '✨' }
      );
      if (roleContext === 'ADMIN') {
        navigate('/admin/dashboard');
      } else {
        navigate(returnUrl);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !regEmail || !regPassword) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (!isEmailValid(regEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }
    if (regPassword.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    try {
      setLoading(true);
      await authApi.register({
        full_name: fullName,
        email: regEmail,
        phone: phone || undefined,
        password: regPassword,
      });
      toast.success('Account created successfully! Welcome to ShopNest.', { icon: '🎉' });
      // Automatically log them in
      await login(regEmail, regPassword, false);
      navigate(returnUrl);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEmailValid(forgotEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }

    try {
      setForgotLoading(true);
      const res = await authApi.forgotPassword({ email: forgotEmail });
      setForgotSuccess(true);
      // In development mode, the response may include dev token if present
      if (res.data?.dev_token) {
        setDevResetToken(res.data.dev_token);
      }
      toast.success('Reset link dispatched! Please check your email.');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to request reset link.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleGoogleOAuth = () => {
    try {
      localStorage.setItem('shopnest_last_auth_provider', 'google');
    } catch {}
    const redirectReturnUrl = encodeURIComponent(returnUrl || '/');
    window.location.href = `/api/v1/auth/google?returnUrl=${redirectReturnUrl}`;
  };

  const handleFacebookOAuth = () => {
    try {
      localStorage.setItem('shopnest_last_auth_provider', 'facebook');
    } catch {}
    const redirectReturnUrl = encodeURIComponent(returnUrl || '/');
    window.location.href = `/api/v1/auth/facebook?returnUrl=${redirectReturnUrl}`;
  };

  const handleGitHubOAuth = () => {
    try {
      localStorage.setItem('shopnest_last_auth_provider', 'github');
    } catch {}
    const redirectReturnUrl = encodeURIComponent(returnUrl || '/');
    window.location.href = `/api/v1/auth/github?returnUrl=${redirectReturnUrl}`;
  };

  const handleSendPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phoneInput.trim();
    if (!cleanPhone) {
      toast.error('Please enter a phone number');
      return;
    }

    try {
      setPhoneLoading(true);
      await authApi.sendPhoneOtp(cleanPhone);
      setPhoneStep('otp');
      setPhoneCooldown(30);
      toast.success('Verification code dispatched via SMS!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to send verification code');
    } finally {
      setPhoneLoading(false);
    }
  };

  const handleVerifyPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phoneOtpInput.length !== 6) {
      toast.error('Please enter the 6-digit verification code');
      return;
    }

    try {
      setPhoneLoading(true);
      await authApi.verifyPhoneOtp(phoneInput.trim(), phoneOtpInput.trim(), returnUrl);
      try {
        localStorage.setItem('shopnest_last_auth_provider', 'phone');
      } catch {}
      await refreshUser();
      toast.success('Signed in successfully!');
      setShowPhoneModal(false);
      navigate(returnUrl);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Invalid or expired verification code');
    } finally {
      setPhoneLoading(false);
    }
  };

  const handleSendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEmailValid(magicEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }

    try {
      setMagicLoading(true);
      await authApi.sendMagicLink(magicEmail.trim(), returnUrl);
      setMagicSent(true);
      toast.success('Magic sign-in link dispatched to your inbox!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to send magic link');
    } finally {
      setMagicLoading(false);
    }
  };

  const fillDemoAdmin = () => {
    setRoleContext('ADMIN');
    setLoginEmail('admin@shopnest.com');
    setLoginPassword('Admin@123!');
  };

  const fillDemoCustomer = () => {
    setRoleContext('CUSTOMER');
    setLoginEmail('customer1@shopnest.com');
    setLoginPassword('Customer@123!');
  };

  const rawProduct = showcaseProducts.length > 0
    ? showcaseProducts[showcaseIndex % showcaseProducts.length]
    : null;

  const activeProduct = rawProduct
    ? {
        name: rawProduct.name,
        price: formatPaise(rawProduct.price_paise),
        image: rawProduct.image_url || '/products/photo-coming-soon.svg',
        category: rawProduct.category_name || 'Featured Category',
        rating: rawProduct.average_rating ? Number(rawProduct.average_rating).toFixed(1) : '4.8',
        reviews: rawProduct.rating_count || 0,
        badge: rawProduct.badge || 'Popular',
      }
    : {
        name: 'Apple iPhone 15 128GB Blue',
        price: '₹79,900',
        image: '/products/apple-iphone-15-128gb-blue/image-0-640.webp',
        category: 'Electronics',
        rating: '4.8',
        reviews: 24,
        badge: 'Best Seller',
      };

  return (
    <div className="min-h-screen bg-navy-900 text-white flex flex-col justify-between selection:bg-orange-500 selection:text-white">
      {/* Top Navigation Bar */}
      <header className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between z-10">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-2xl bg-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/25 group-hover:scale-105 transition-transform">
            <ShoppingBag className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-xl font-black text-white tracking-tight">
              Shop<span className="text-orange-500">Nest</span>
            </span>
            <p className="text-[10px] text-gray-400 font-medium">India's Modern Superstore</p>
          </div>
        </Link>

        <div className="flex items-center gap-4 text-xs font-semibold">
          <Link
            to="/"
            className="text-gray-400 hover:text-white transition-colors flex items-center gap-1.5"
          >
            <span>Return to Store</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* Main Split-Screen Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* LEFT COLUMN: Visual Product Showcase & Social Proof */}
        <section className="lg:col-span-6 flex flex-col justify-center space-y-8 pr-0 lg:pr-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-bold tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-orange-400" />
              <span>Next-Gen Shopping Experience</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
              Curated products. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-300 to-orange-500">
                Delivered in minutes.
              </span>
            </h1>
            <p className="text-sm text-gray-400 max-w-lg leading-relaxed">
              Explore our verified catalog of genuine products, intelligent AI visual search,
              instant refunds, and ultra-secure checkout.
            </p>
          </div>

          {/* Dynamic Showcase Card */}
          <div className="relative rounded-3xl bg-gradient-to-br from-navy-800/90 to-navy-700/60 border border-navy-600/60 p-6 shadow-2xl backdrop-blur-md overflow-hidden transition-all duration-500">
            <div className="absolute top-0 right-0 -mr-12 -mt-12 w-48 h-48 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="w-40 h-40 rounded-2xl bg-navy-900/90 border border-navy-700/80 p-2 flex items-center justify-center shrink-0 group">
                <ProductImage
                  src={activeProduct.image}
                  alt={activeProduct.name}
                  aspectRatio="aspect-square"
                  objectFit="contain"
                  className="w-full h-full"
                />
              </div>

              <div className="flex-1 space-y-2 text-center sm:text-left">
                <div className="inline-block px-2.5 py-0.5 rounded-full bg-orange-500/20 text-orange-400 text-[10px] font-bold uppercase tracking-wider">
                  {activeProduct.badge}
                </div>
                <h3 className="text-base font-bold text-white line-clamp-1">
                  {activeProduct.name}
                </h3>
                <p className="text-xs text-gray-400">{activeProduct.category}</p>

                <div className="flex items-center justify-center sm:justify-start gap-3 pt-1">
                  <span className="text-lg font-black text-white">{activeProduct.price}</span>
                  <div className="flex items-center gap-1 text-xs text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-lg border border-amber-400/20">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span className="font-bold">{activeProduct.rating}</span>
                    <span className="text-gray-400 text-[10px]">({activeProduct.reviews})</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Carousel navigation pills */}
            <div className="flex items-center justify-center sm:justify-start gap-1.5 mt-5 pt-4 border-t border-navy-700/60">
              {(showcaseProducts.length > 0 ? showcaseProducts : [1, 2, 3]).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setShowcaseIndex(idx)}
                  aria-label={`View product ${idx + 1}`}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    idx === showcaseIndex ? 'w-6 bg-orange-500' : 'w-2 bg-navy-600 hover:bg-navy-500'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Social Proof & Value Pillars */}
          <div className="grid grid-cols-3 gap-4 pt-2">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 shrink-0">
                <Truck className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Express Delivery</p>
                <p className="text-[10px] text-gray-400">Same-day in 12 cities</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 shrink-0">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">100% Genuine</p>
                <p className="text-[10px] text-gray-400">Verified inventory</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
                <RotateCcw className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Instant Refunds</p>
                <p className="text-[10px] text-gray-400">Zero-hassle returns</p>
              </div>
            </div>
          </div>
        </section>

        {/* RIGHT COLUMN: The Auth Card */}
        <section className="lg:col-span-6 flex justify-center">
          <div className="w-full max-w-md bg-navy-800/95 border border-navy-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative transition-all duration-300">
            
            {/* Role Switcher Pill (Customer / Store Admin) */}
            <div className="flex items-center justify-center mb-6">
              <div className="p-1 rounded-2xl bg-navy-900/90 border border-navy-700/80 grid grid-cols-2 gap-1 w-full max-w-xs">
                <button
                  type="button"
                  onClick={() => setRoleContext('CUSTOMER')}
                  className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    roleContext === 'CUSTOMER'
                      ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Customer</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRoleContext('ADMIN')}
                  className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    roleContext === 'ADMIN'
                      ? 'bg-amber-500 text-navy-900 shadow-md shadow-amber-500/20 font-black'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Store Admin</span>
                </button>
              </div>
            </div>

            {/* Mode Header */}
            <div className="text-center mb-6">
              <div className="flex items-center justify-center gap-2">
                <h2 className="text-2xl font-black text-white tracking-tight">
                  {mode === 'login' ? 'Welcome Back' : 'Create an Account'}
                </h2>
                {roleContext === 'ADMIN' && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
                    Admin Portal
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-1.5">
                {mode === 'login'
                  ? roleContext === 'ADMIN'
                    ? 'Enter your privileged credentials to manage store operations'
                    : 'Sign in to access your orders, wishlist, and swift checkout'
                  : 'Join 10,000+ happy shoppers & get 10% off with WELCOME10'}
              </p>
            </div>

            {/* Quick Demo Fill Buttons (Only visible if VITE_SHOW_DEMO_LOGINS=true) */}
            {import.meta.env.VITE_SHOW_DEMO_LOGINS === 'true' && (
              <div className="grid grid-cols-2 gap-2 mb-5 p-1.5 rounded-2xl bg-navy-900/80 border border-navy-700/80">
                <button
                  type="button"
                  onClick={fillDemoAdmin}
                  className="flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold transition-colors"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Demo Admin</span>
                </button>
                <button
                  type="button"
                  onClick={fillDemoCustomer}
                  className="flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-navy-700 hover:bg-navy-600 text-gray-200 text-xs font-bold transition-colors"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Demo Customer</span>
                </button>
              </div>
            )}

            {/* Friendly Inline OAuth Error Alert */}
            {oauthError && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/15 border border-red-500/40 text-red-300 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-red-200">Sign-In Notice</p>
                  <p className="mt-0.5 leading-relaxed">{getOAuthErrorMessage(oauthError)}</p>
                </div>
              </div>
            )}

            {/* Provider Buttons Group (Only rendered when at least one provider is configured) */}
            {(providersConfig.google ||
              providersConfig.facebook ||
              providersConfig.github ||
              providersConfig.phone ||
              providersConfig.magicLink) && (
              <>
                <div className="space-y-2 mb-4">
                  {providersConfig.google && (
                    <button
                      type="button"
                      onClick={handleGoogleOAuth}
                      className="w-full py-2.5 px-3.5 rounded-xl bg-navy-900/80 hover:bg-navy-700/80 border border-navy-700 text-gray-200 text-xs font-semibold flex items-center justify-between transition-colors focus:outline-none focus:ring-2 focus:ring-teal-400/50"
                    >
                      <div className="flex items-center gap-2.5">
                        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                          <path
                            fill="#4285F4"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          />
                          <path
                            fill="#34A853"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          />
                          <path
                            fill="#FBBC05"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                          />
                          <path
                            fill="#EA4335"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                          />
                        </svg>
                        <span>Continue with Google</span>
                      </div>
                      {lastUsedProvider === 'google' && (
                        <span className="px-2 py-0.5 rounded-full bg-teal-500/15 text-teal-400 border border-teal-500/30 text-[10px] font-bold">
                          Last used
                        </span>
                      )}
                    </button>
                  )}

                  {providersConfig.facebook && (
                    <button
                      type="button"
                      onClick={handleFacebookOAuth}
                      className="w-full py-2.5 px-3.5 rounded-xl bg-navy-900/80 hover:bg-navy-700/80 border border-navy-700 text-gray-200 text-xs font-semibold flex items-center justify-between transition-colors focus:outline-none focus:ring-2 focus:ring-teal-400/50"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-4 h-4 rounded-full bg-[#1877F2] flex items-center justify-center p-0.5 shrink-0">
                          <svg className="w-full h-full fill-white" viewBox="0 0 24 24">
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                          </svg>
                        </div>
                        <span>Continue with Facebook</span>
                      </div>
                      {lastUsedProvider === 'facebook' && (
                        <span className="px-2 py-0.5 rounded-full bg-teal-500/15 text-teal-400 border border-teal-500/30 text-[10px] font-bold">
                          Last used
                        </span>
                      )}
                    </button>
                  )}

                  {providersConfig.github && (
                    <button
                      type="button"
                      onClick={handleGitHubOAuth}
                      className="w-full py-2.5 px-3.5 rounded-xl bg-navy-900/80 hover:bg-navy-700/80 border border-navy-700 text-gray-200 text-xs font-semibold flex items-center justify-between transition-colors focus:outline-none focus:ring-2 focus:ring-teal-400/50"
                    >
                      <div className="flex items-center gap-2.5">
                        <svg className="w-4 h-4 fill-white shrink-0" viewBox="0 0 24 24">
                          <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                        </svg>
                        <span>Continue with GitHub</span>
                      </div>
                      {lastUsedProvider === 'github' && (
                        <span className="px-2 py-0.5 rounded-full bg-teal-500/15 text-teal-400 border border-teal-500/30 text-[10px] font-bold">
                          Last used
                        </span>
                      )}
                    </button>
                  )}

                  {providersConfig.phone && (
                    <button
                      type="button"
                      onClick={() => setShowPhoneModal(true)}
                      className="w-full py-2.5 px-3.5 rounded-xl bg-navy-900/80 hover:bg-navy-700/80 border border-navy-700 text-gray-200 text-xs font-semibold flex items-center justify-between transition-colors focus:outline-none focus:ring-2 focus:ring-teal-400/50"
                    >
                      <div className="flex items-center gap-2.5">
                        <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>Continue with Phone OTP (+91)</span>
                      </div>
                      {lastUsedProvider === 'phone' && (
                        <span className="px-2 py-0.5 rounded-full bg-teal-500/15 text-teal-400 border border-teal-500/30 text-[10px] font-bold">
                          Last used
                        </span>
                      )}
                    </button>
                  )}

                  {providersConfig.magicLink && (
                    <button
                      type="button"
                      onClick={() => setShowMagicModal(true)}
                      className="w-full py-2.5 px-3.5 rounded-xl bg-navy-900/80 hover:bg-navy-700/80 border border-navy-700 text-gray-200 text-xs font-semibold flex items-center justify-between transition-colors focus:outline-none focus:ring-2 focus:ring-teal-400/50"
                    >
                      <div className="flex items-center gap-2.5">
                        <Sparkles className="w-4 h-4 text-orange-400 shrink-0" />
                        <span>Continue with Magic Link</span>
                      </div>
                      {lastUsedProvider === 'magicLink' && (
                        <span className="px-2 py-0.5 rounded-full bg-teal-500/15 text-teal-400 border border-teal-500/30 text-[10px] font-bold">
                          Last used
                        </span>
                      )}
                    </button>
                  )}
                </div>

                <div className="relative flex items-center justify-center my-4">
                  <div className="border-t border-navy-700 w-full" />
                  <span className="bg-navy-800 px-3 text-[11px] text-gray-500 uppercase tracking-widest font-semibold absolute">
                    or with email
                  </span>
                </div>
              </>
            )}

            {/* FORM CONTAINER: LOGIN VS REGISTER */}
            {mode === 'login' ? (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder={
                        roleContext === 'ADMIN' ? 'admin@shopnest.com' : 'name@example.com'
                      }
                      className="input pl-10 text-xs focus:ring-teal-400/70 focus:border-teal-400 focus:shadow-[0_0_12px_rgba(45,212,191,0.25)]"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-gray-300">Password</label>
                    <button
                      type="button"
                      onClick={() => setShowForgotModal(true)}
                      className="text-[11px] text-orange-400 hover:text-orange-300 font-medium transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showLoginPassword ? 'text' : 'password'}
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      className="input pl-10 pr-10 text-xs focus:ring-teal-400/70 focus:border-teal-400 focus:shadow-[0_0_12px_rgba(45,212,191,0.25)]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      aria-pressed={showLoginPassword}
                      aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 transition-colors"
                    >
                      {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Remember Me Checkbox */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="rememberMe"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded bg-navy-900 border-navy-600 text-orange-500 focus:ring-teal-400/50 cursor-pointer"
                  />
                  <label htmlFor="rememberMe" className="text-xs text-gray-300 cursor-pointer select-none">
                    Remember me for 30 days
                  </label>
                </div>

                {/* Interactive Runaway Submit Button */}
                <RunawayButton
                  isValid={isLoginFormValid}
                  loading={loading}
                  label={roleContext === 'ADMIN' ? 'Access Admin Console' : 'Sign In to ShopNest'}
                  loadingLabel="Authenticating..."
                  roleContext={roleContext}
                />
              </form>
            ) : (
              /* REGISTER FORM */
              <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Full Name *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Rohit Sharma"
                      className="input pl-10 text-xs focus:ring-teal-400/70 focus:border-teal-400 focus:shadow-[0_0_12px_rgba(45,212,191,0.25)]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="rohit@example.com"
                      className="input pl-10 text-xs focus:ring-teal-400/70 focus:border-teal-400 focus:shadow-[0_0_12px_rgba(45,212,191,0.25)]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Mobile Phone (Optional)
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="9876543210"
                      className="input pl-10 text-xs focus:ring-teal-400/70 focus:border-teal-400 focus:shadow-[0_0_12px_rgba(45,212,191,0.25)]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Password * (Min 8 chars)
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      required
                      minLength={8}
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="••••••••"
                      className="input pl-10 pr-10 text-xs focus:ring-teal-400/70 focus:border-teal-400 focus:shadow-[0_0_12px_rgba(45,212,191,0.25)]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      aria-pressed={showRegPassword}
                      aria-label={showRegPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 transition-colors"
                    >
                      {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {/* Live Password Strength Meter */}
                  <PasswordStrengthMeter password={regPassword} />
                </div>

                <button
                  type="submit"
                  disabled={loading || !isRegisterFormValid}
                  className="btn-primary w-full py-3 text-xs mt-3 flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 disabled:opacity-50"
                >
                  <span>{loading ? 'Creating Account...' : 'Agree & Register'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}

            {/* Switch between Login and Register */}
            <div className="mt-6 pt-5 border-t border-navy-700/80 text-center">
              {mode === 'login' ? (
                <p className="text-xs text-gray-400">
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => switchMode('register')}
                    className="text-orange-400 font-bold hover:underline cursor-pointer"
                  >
                    Create an account
                  </button>
                </p>
              ) : (
                <p className="text-xs text-gray-400">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => switchMode('login')}
                    className="text-orange-400 font-bold hover:underline cursor-pointer"
                  >
                    Sign In
                  </button>
                </p>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-navy-800 border border-navy-700 rounded-3xl p-6 sm:p-8 shadow-2xl relative">
            <button
              onClick={() => {
                setShowForgotModal(false);
                setForgotSuccess(false);
                setDevResetToken(null);
              }}
              className="absolute top-5 right-5 text-gray-400 hover:text-white p-1 rounded-lg hover:bg-navy-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {forgotSuccess ? (
              <div className="text-center py-2 space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white">Reset Link Dispatched</h3>
                <p className="text-xs text-gray-300 leading-relaxed">
                  If an account exists for <strong className="text-white">{forgotEmail}</strong>, a
                  password reset link has been dispatched. Check your inbox (or dev server logs).
                </p>

                {devResetToken && (
                  <div className="p-3 rounded-xl bg-navy-900 border border-orange-500/30 text-left">
                    <p className="text-[11px] font-bold text-orange-400 mb-1">
                      🛠️ Dev Mode Active:
                    </p>
                    <Link
                      to={`/reset-password?token=${devResetToken}`}
                      onClick={() => setShowForgotModal(false)}
                      className="text-xs text-teal-300 underline font-mono break-all"
                    >
                      Click here to reset your password directly
                    </Link>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setShowForgotModal(false);
                    setForgotSuccess(false);
                  }}
                  className="btn-primary w-full py-2.5 text-xs font-bold"
                >
                  Return to Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="text-center mb-2">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 mx-auto flex items-center justify-center mb-3">
                    <Lock className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold text-white">Reset Password</h3>
                  <p className="text-xs text-gray-400 mt-1">
                    Enter your account's email address and we'll send you a secure link to reset your
                    credentials.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                    Account Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="input pl-10 text-xs focus:ring-teal-400/70 focus:border-teal-400"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={forgotLoading || !isEmailValid(forgotEmail)}
                  className="btn-primary w-full py-3 text-xs flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20"
                >
                  {forgotLoading ? (
                    <span>Sending Instructions...</span>
                  ) : (
                    <>
                      <span>Send Reset Link</span>
                      <Send className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Phone OTP Modal */}
      {showPhoneModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-navy-800 border border-navy-700 rounded-3xl p-6 sm:p-7 shadow-2xl relative">
            <button
              type="button"
              onClick={() => {
                setShowPhoneModal(false);
                setPhoneStep('phone');
                setPhoneOtpInput('');
              }}
              className="absolute top-5 right-5 text-gray-400 hover:text-white p-1 rounded-lg hover:bg-navy-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center mb-3">
                <Phone className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">
                {phoneStep === 'phone' ? 'Sign in with Phone' : 'Enter Verification Code'}
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                {phoneStep === 'phone'
                  ? 'Enter your mobile number to receive a 6-digit one-time passcode.'
                  : `Enter the 6-digit code sent to ${phoneInput}.`}
              </p>
            </div>

            {phoneStep === 'phone' ? (
              <form onSubmit={handleSendPhoneOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                    Mobile Number
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 text-xs font-bold text-gray-400 select-none">
                      +91
                    </span>
                    <input
                      type="tel"
                      required
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="9876543210"
                      className="input pl-12 text-xs font-mono tracking-wider focus:ring-teal-400/70 focus:border-teal-400"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={phoneLoading || phoneInput.length < 10}
                  className="btn-primary w-full py-2.5 text-xs flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {phoneLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>Send Verification Code</span>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyPhoneOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                    6-Digit Security Code
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={phoneOtpInput}
                    onChange={(e) => setPhoneOtpInput(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    className="input text-center text-lg font-mono tracking-widest font-black focus:ring-teal-400/70 focus:border-teal-400"
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-gray-400">
                  <button
                    type="button"
                    onClick={() => setPhoneStep('phone')}
                    className="hover:text-gray-200 transition-colors"
                  >
                    Change number
                  </button>

                  {phoneCooldown > 0 ? (
                    <span className="text-gray-500">Resend in {phoneCooldown}s</span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSendPhoneOtp}
                      className="text-orange-400 hover:text-orange-300 font-bold transition-colors"
                    >
                      Resend Code
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={phoneLoading || phoneOtpInput.length !== 6}
                  className="btn-primary w-full py-2.5 text-xs flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {phoneLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>Verify & Continue</span>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Magic Link Modal */}
      {showMagicModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-navy-800 border border-navy-700 rounded-3xl p-6 sm:p-7 shadow-2xl relative">
            <button
              type="button"
              onClick={() => {
                setShowMagicModal(false);
                setMagicSent(false);
              }}
              className="absolute top-5 right-5 text-gray-400 hover:text-white p-1 rounded-lg hover:bg-navy-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-5">
              <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-400 mx-auto flex items-center justify-center mb-3">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">
                {magicSent ? 'Check Your Inbox' : 'One-Click Sign In'}
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                {magicSent
                  ? `We've sent a magic sign-in link to ${magicEmail}.`
                  : 'Receive a passwordless sign-in link directly in your email inbox.'}
              </p>
            </div>

            {magicSent ? (
              <div className="space-y-4 text-center">
                <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300">
                  Click the link in your email to instantly authenticate. Links expire after 15 minutes and can only be opened on this device.
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowMagicModal(false);
                    setMagicSent(false);
                  }}
                  className="btn-primary w-full py-2.5 text-xs font-bold"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleSendMagicLink} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                    Your Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={magicEmail}
                      onChange={(e) => setMagicEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="input pl-10 text-xs focus:ring-teal-400/70 focus:border-teal-400"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={magicLoading || !isEmailValid(magicEmail)}
                  className="btn-primary w-full py-2.5 text-xs flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {magicLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>Send Magic Link</span>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-4 text-center text-[11px] text-gray-500 border-t border-navy-800">
        © 2026 ShopNest E-Commerce Platform. End-to-end encrypted & certified.
      </footer>
    </div>
  );
}
