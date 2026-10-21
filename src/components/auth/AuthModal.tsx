import React, { useState } from 'react';
import { Mail, Lock, User, AlertCircle, ArrowRight, CheckCircle2, Shield, Loader2 } from 'lucide-react';
import { Modal } from '../common/Modal';
import { useAuth } from '../../context/AuthContext';
import { getT } from '../../utils/translations';

export const AuthModal: React.FC = () => {
  const {
    authModalOpen,
    closeAuthModal,
    authModalMode,
    setAuthModalMode,
    signUpWithEmail,
    signInWithEmail,
    signInWithGoogle,
    resetPassword,
    language,
  } = useAuth();

  const t = getT(language);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleResetState = () => {
    setError(null);
    setSuccessMsg(null);
  };

  const handleSwitchMode = (mode: 'signin' | 'signup' | 'forgot') => {
    handleResetState();
    setAuthModalMode(mode);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (authModalMode === 'signup') {
        if (!displayName.trim()) {
          throw new Error('Please enter your full name or nickname.');
        }
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters long.');
        }
        await signUpWithEmail(email, password, displayName);
      } else if (authModalMode === 'signin') {
        await signInWithEmail(email, password);
      } else if (authModalMode === 'forgot') {
        await resetPassword(email);
        setSuccessMsg('Password reset link sent to your email. Check your inbox!');
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      let msg = err.message || 'Authentication error';
      if (msg.includes('user-not-found') || msg.includes('wrong-password') || msg.includes('invalid-credential')) {
        msg = 'Invalid email or password.';
      } else if (msg.includes('email-already-in-use')) {
        msg = 'An account with this email already exists. Try signing in.';
      } else if (msg.includes('invalid-email')) {
        msg = 'Please enter a valid email address.';
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      console.error('Google sign-in error:', err);
      setError(err.message || 'Google sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  const titles = {
    signin: language === 'bn' ? 'লগইন করুন' : 'Welcome Back',
    signup: language === 'bn' ? 'নতুন অ্যাকাউন্ট তৈরি করুন' : 'Create Free Account',
    forgot: language === 'bn' ? 'পাসওয়ার্ড পুনরুদ্ধার' : 'Reset Password',
  };

  return (
    <Modal isOpen={authModalOpen} onClose={closeAuthModal} title={titles[authModalMode]} maxWidth="md">
      <div>
        {/* Top Info Banner */}
        <div className="mb-6 p-3 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-900/40 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400">
            <Shield className="w-5 h-5" />
          </div>
          <p className="text-xs text-sky-800 dark:text-sky-300">
            {language === 'bn'
              ? 'নিরাপদ এনক্রিপ্টেড সেশন ও রিয়েল-টাইম ফায়ারবেস অথেনটিকেশন।'
              : 'Secure encrypted session with 100% private proxy credentials storage.'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-start gap-3 text-rose-700 dark:text-rose-400 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 flex items-start gap-3 text-emerald-700 dark:text-emerald-400 text-xs">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {authModalMode === 'signup' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {language === 'bn' ? 'আপনার পূর্ণ নাম' : 'Full Name'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Shakib Ahmed"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              {language === 'bn' ? 'ইমেইল অ্যাড্রেস' : 'Email Address'}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
              />
            </div>
          </div>

          {authModalMode !== 'forgot' && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {language === 'bn' ? 'পাসওয়ার্ড' : 'Password'}
                </label>
                {authModalMode === 'signin' && (
                  <button
                    type="button"
                    onClick={() => handleSwitchMode('forgot')}
                    className="text-xs text-sky-600 dark:text-sky-400 hover:underline"
                  >
                    {language === 'bn' ? 'পাসওয়ার্ড ভুলে গেছেন?' : 'Forgot password?'}
                  </button>
                )}
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  minLength={6}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                {authModalMode === 'signin' && (language === 'bn' ? 'লগইন করুন' : 'Sign In')}
                {authModalMode === 'signup' && (language === 'bn' ? 'অ্যাকাউন্ট তৈরি করুন' : 'Create Account')}
                {authModalMode === 'forgot' && (language === 'bn' ? 'রিসেট লিঙ্ক পাঠান' : 'Send Reset Link')}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        {authModalMode !== 'forgot' && (
          <div className="relative my-5 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-800" />
            </div>
            <span className="relative px-3 bg-white dark:bg-slate-900 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              {language === 'bn' ? 'অথবা' : 'Or continue with'}
            </span>
          </div>
        )}

        {authModalMode !== 'forgot' && (
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-800 dark:text-slate-200 font-medium text-xs shadow-sm transition flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
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
            <span>Google</span>
          </button>
        )}

        {/* Footer switch */}
        <div className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
          {authModalMode === 'signin' && (
            <p>
              {language === 'bn' ? 'কোন অ্যাকাউন্ট নেই? ' : "Don't have an account? "}
              <button
                type="button"
                onClick={() => handleSwitchMode('signup')}
                className="text-sky-600 dark:text-sky-400 font-semibold hover:underline"
              >
                {language === 'bn' ? 'নতুন অ্যাকাউন্ট তৈরি করুন' : 'Sign up now'}
              </button>
            </p>
          )}

          {authModalMode === 'signup' && (
            <p>
              {language === 'bn' ? 'ইতিমধ্যে অ্যাকাউন্ট আছে? ' : 'Already registered? '}
              <button
                type="button"
                onClick={() => handleSwitchMode('signin')}
                className="text-sky-600 dark:text-sky-400 font-semibold hover:underline"
              >
                {language === 'bn' ? 'লগইন করুন' : 'Sign in here'}
              </button>
            </p>
          )}

          {authModalMode === 'forgot' && (
            <p>
              <button
                type="button"
                onClick={() => handleSwitchMode('signin')}
                className="text-sky-600 dark:text-sky-400 font-semibold hover:underline"
              >
                {language === 'bn' ? 'লগইনে ফিরে যান' : 'Back to Sign In'}
              </button>
            </p>
          )}
        </div>
      </div>
    </Modal>
  );
};
