import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  User,
  Shield,
  KeyRound,
  Link2,
  Trash2,
  Lock,
  Mail,
  Phone,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Calendar,
  ExternalLink,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { authApi } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { PasswordStrengthMeter } from '../../components/auth/PasswordStrengthMeter';

interface IdentityItem {
  provider: string;
  provider_user_id: string;
  email: string | null;
  created_at: string;
}

export function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [identities, setIdentities] = useState<IdentityItem[]>([]);
  const [hasPassword, setHasPassword] = useState(true);
  const [loading, setLoading] = useState(true);

  // Set password form state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [settingPassword, setSettingPassword] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  // Disconnect loading
  const [disconnectingProvider, setDisconnectingProvider] = useState<string | null>(null);

  const fetchIdentities = async () => {
    try {
      setLoading(true);
      const res = await authApi.getIdentities();
      setIdentities(res.data.identities || []);
      setHasPassword(res.data.hasPassword);
    } catch (err: any) {
      toast.error('Failed to load profile security details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIdentities();
  }, []);

  const handleDisconnect = async (provider: string) => {
    const confirm = window.confirm(
      `Are you sure you want to disconnect ${provider.toUpperCase()} from your account?`
    );
    if (!confirm) return;

    try {
      setDisconnectingProvider(provider);
      await authApi.disconnectIdentity(provider);
      toast.success(`Disconnected ${provider} successfully`);
      await fetchIdentities();
      await refreshUser();
    } catch (err: any) {
      const code = err.response?.data?.error || err.response?.data?.code;
      if (code === 'CANNOT_DISCONNECT_LAST_METHOD') {
        toast.error(
          'Cannot disconnect your only sign-in method. Please set a password below first.'
        );
      } else {
        toast.error(err.response?.data?.message || `Failed to disconnect ${provider}`);
      }
    } finally {
      setDisconnectingProvider(null);
    }
  };

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    try {
      setSettingPassword(true);
      await authApi.setPassword(newPassword);
      toast.success('Password successfully set!');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordForm(false);
      await fetchIdentities();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to set password');
    } finally {
      setSettingPassword(false);
    }
  };

  const getProviderIcon = (provider: string) => {
    switch (provider.toLowerCase()) {
      case 'google':
        return (
          <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center p-1.5">
            <svg className="w-full h-full" viewBox="0 0 24 24">
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
          </div>
        );
      case 'github':
        return (
          <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center p-1.5">
            <svg className="w-full h-full text-white fill-current" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
          </div>
        );
      case 'facebook':
        return (
          <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center p-1.5">
            <svg className="w-full h-full text-white fill-current" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
          </div>
        );
      case 'phone':
        return (
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Phone className="w-4 h-4" />
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center">
            <KeyRound className="w-4 h-4" />
          </div>
        );
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-black text-white tracking-tight">Account & Security</h1>
        <p className="text-xs text-gray-400 mt-1">
          Manage your personal information, linked login methods, and security preferences.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Profile Card */}
        <div className="md:col-span-1 space-y-4">
          <div className="p-6 rounded-3xl bg-navy-800/90 border border-navy-700">
            <div className="w-16 h-16 rounded-2xl bg-orange-500/20 border border-orange-500/40 text-orange-400 flex items-center justify-center text-2xl font-black mx-auto mb-4">
              {user?.full_name?.charAt(0) || 'U'}
            </div>
            <h2 className="text-center font-bold text-white text-base truncate">
              {user?.full_name}
            </h2>
            <p className="text-center text-xs text-gray-400 truncate mt-0.5">{user?.email}</p>

            <div className="mt-4 pt-4 border-t border-navy-700/80 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Account Role</span>
                <span className="px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 font-bold text-[10px]">
                  {user?.role || 'CUSTOMER'}
                </span>
              </div>
              {user?.phone && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Phone</span>
                  <span className="text-gray-300 font-mono text-[11px]">{user.phone}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Security, Connected Methods, Password */}
        <div className="md:col-span-2 space-y-6">
          {/* Linked Methods Card */}
          <div className="p-6 rounded-3xl bg-navy-800/90 border border-navy-700">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Link2 className="w-4 h-4 text-orange-400" />
                <h3 className="font-bold text-white text-sm">Connected Sign-In Methods</h3>
              </div>
              <span className="text-[11px] text-gray-400">
                {identities.length} method{identities.length !== 1 ? 's' : ''} linked
              </span>
            </div>

            {loading ? (
              <div className="py-8 flex justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-orange-400" />
              </div>
            ) : identities.length === 0 ? (
              <div className="p-4 rounded-2xl bg-navy-900/60 border border-navy-700 text-center text-xs text-gray-400">
                No third-party login methods connected. You sign in with your email and password.
              </div>
            ) : (
              <div className="space-y-3">
                {identities.map((id) => (
                  <div
                    key={`${id.provider}-${id.provider_user_id}`}
                    className="p-3.5 rounded-2xl bg-navy-900/70 border border-navy-700 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      {getProviderIcon(id.provider)}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-xs capitalize">
                            {id.provider}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                            Active
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-400 truncate mt-0.5">
                          {id.email || `ID: ${id.provider_user_id.slice(0, 14)}...`}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={disconnectingProvider === id.provider}
                      onClick={() => handleDisconnect(id.provider)}
                      className="px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                    >
                      {disconnectingProvider === id.provider ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                      <span>Disconnect</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Password Management Card */}
          <div className="p-6 rounded-3xl bg-navy-800/90 border border-navy-700">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-orange-400" />
                <h3 className="font-bold text-white text-sm">Account Password</h3>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  hasPassword
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                }`}
              >
                {hasPassword ? 'Password Configured' : 'No Password Set'}
              </span>
            </div>

            {!hasPassword && !showPasswordForm && (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 mb-4">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div className="flex-1 text-xs">
                    <p className="font-semibold text-amber-300">Set a Password for Traditional Login</p>
                    <p className="text-gray-300 mt-1 leading-relaxed">
                      You authenticated via social login or passwordless OTP. Setting a password allows you to sign in with email/password even if your third-party account becomes unavailable.
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowPasswordForm(true)}
                      className="mt-3 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-navy-950 font-bold text-xs transition-colors"
                    >
                      Set a Password Now
                    </button>
                  </div>
                </div>
              </div>
            )}

            {hasPassword && !showPasswordForm && (
              <div className="flex items-center justify-between text-xs py-2">
                <span className="text-gray-400">
                  Password was configured. You can update it anytime.
                </span>
                <button
                  type="button"
                  onClick={() => setShowPasswordForm(true)}
                  className="px-3 py-1.5 rounded-xl bg-navy-700 hover:bg-navy-600 text-white font-bold transition-colors"
                >
                  Change Password
                </button>
              </div>
            )}

            {showPasswordForm && (
              <form onSubmit={handleSetPassword} className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="w-full px-3.5 py-2 rounded-xl bg-navy-900 border border-navy-700 text-white text-xs focus:outline-none focus:border-orange-500"
                  />
                  <div className="mt-2">
                    <PasswordStrengthMeter password={newPassword} />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    className="w-full px-3.5 py-2 rounded-xl bg-navy-900 border border-navy-700 text-white text-xs focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordForm(false);
                      setNewPassword('');
                      setConfirmPassword('');
                    }}
                    className="px-3 py-1.5 rounded-xl bg-navy-700 hover:bg-navy-600 text-gray-300 text-xs font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={settingPassword || newPassword.length < 8}
                    className="px-4 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    {settingPassword && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Save Password</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
