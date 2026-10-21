import React, { useState } from 'react';
import {
  User as UserIcon,
  Mail,
  Shield,
  Key,
  Copy,
  Check,
  CheckCircle2,
  AlertCircle,
  LogOut,
  Send,
  Calendar,
  Wallet,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getT } from '../../utils/translations';
import { formatUsd } from '../../utils/idGenerator';

export const ProfilePage: React.FC = () => {
  const {
    currentUser,
    userProfile,
    isAdmin,
    language,
    logout,
    resendVerification,
    resetPassword,
    settings,
  } = useAuth();
  const t = getT(language);

  const [copiedId, setCopiedId] = useState(false);
  const [resendingEmail, setResendingEmail] = useState(false);
  const [emailNotice, setEmailNotice] = useState<string | null>(null);

  const handleCopyId = () => {
    if (userProfile?.userId) {
      navigator.clipboard.writeText(userProfile.userId);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const handleResend = async () => {
    setResendingEmail(true);
    setEmailNotice(null);
    try {
      await resendVerification();
      setEmailNotice('Verification email sent! Check your inbox or spam folder.');
    } catch (e: any) {
      setEmailNotice(e.message || 'Failed to send verification email.');
    } finally {
      setResendingEmail(false);
    }
  };

  const handleSendReset = async () => {
    if (!currentUser?.email) return;
    try {
      await resetPassword(currentUser.email);
      setEmailNotice('Password reset instructions dispatched to your email.');
    } catch (e: any) {
      setEmailNotice(e.message || 'Error triggering password reset.');
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in pb-16 max-w-4xl mx-auto">
      {/* Profile Card Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-sky-600 via-indigo-700 to-purple-800 text-white p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center font-black text-2xl text-white shadow-xl">
              {userProfile?.displayName?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black">{userProfile?.displayName || 'User'}</h1>
                {isAdmin && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/30 border border-purple-400 text-white">
                    Administrator
                  </span>
                )}
              </div>
              <p className="text-xs text-sky-100 mt-0.5">{currentUser?.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={logout}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs transition flex items-center gap-2 border border-white/20"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{t.signOut}</span>
            </button>
          </div>
        </div>
      </div>

      {emailNotice && (
        <div className="p-4 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-900/50 flex items-center gap-3 text-sky-700 dark:text-sky-300 text-xs">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{emailNotice}</span>
        </div>
      )}

      {/* Profile Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Account Info */}
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-xs">
          <h3 className="font-bold text-slate-900 dark:text-white text-base border-b border-slate-100 dark:border-slate-800 pb-3">
            Account Credentials
          </h3>

          <div className="space-y-3 text-xs">
            {/* User ID */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">{t.userIdLabel}</span>
                <span className="font-mono font-bold text-sky-600 dark:text-sky-400 text-sm">
                  {userProfile?.userId || 'PB-USER'}
                </span>
              </div>
              <button
                onClick={handleCopyId}
                className="p-1.5 rounded-lg text-slate-400 hover:text-sky-500 transition"
              >
                {copiedId ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            {/* Email & Verification */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Email Status</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {currentUser?.email}
                </span>
              </div>
              <div>
                {currentUser?.emailVerified ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-500">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Verified
                  </span>
                ) : (
                  <button
                    onClick={handleResend}
                    disabled={resendingEmail}
                    className="text-[11px] font-bold text-sky-600 dark:text-sky-400 hover:underline"
                  >
                    Verify Email
                  </button>
                )}
              </div>
            </div>

            {/* Account Status */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Status</span>
                <span className="font-bold text-emerald-500 capitalize">
                  {userProfile?.status || 'Active'}
                </span>
              </div>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>

            {/* Registration Date */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Member Since</span>
                <span className="text-slate-700 dark:text-slate-300 font-medium">
                  {userProfile?.createdAt ? new Date(userProfile.createdAt).toLocaleDateString() : 'N/A'}
                </span>
              </div>
              <Calendar className="w-4 h-4 text-slate-400" />
            </div>
          </div>
        </div>

        {/* Security & Financials */}
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-xs">
          <h3 className="font-bold text-slate-900 dark:text-white text-base border-b border-slate-100 dark:border-slate-800 pb-3">
            Security & Support
          </h3>

          <div className="space-y-3 text-xs">
            <div className="p-4 rounded-2xl bg-sky-50/50 dark:bg-sky-950/30 border border-sky-100 dark:border-sky-900/40">
              <h4 className="font-bold text-slate-900 dark:text-white mb-1">Password Management</h4>
              <p className="text-slate-500 dark:text-slate-400 text-[11px] mb-3">
                Need to change or reset your password? Receive an automated reset link.
              </p>
              <button
                onClick={handleSendReset}
                className="px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-slate-800 text-white font-semibold text-xs hover:bg-slate-800 transition"
              >
                Send Password Reset Email
              </button>
            </div>

            {/* Telegram Support Link */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-500">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white">Telegram Support</h4>
                  <p className="text-slate-400 text-[11px]">Direct 24/7 assistant</p>
                </div>
              </div>
              <a
                href={settings?.supportTelegram || 'https://t.me/Proxy_bazar_c'}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs transition flex items-center gap-1 shadow-sm"
              >
                <span>Open</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
