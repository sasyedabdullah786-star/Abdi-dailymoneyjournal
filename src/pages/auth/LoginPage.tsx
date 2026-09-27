import React, { useState } from 'react';
import { Mail, Lock, ArrowRight, AlertCircle, Loader2, Eye, EyeOff, ShieldCheck, BookOpen } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { GoogleSignInButton } from '../../components/common/GoogleSignInButton';

import { getFriendlyAuthErrorMessage } from '../../lib/firebaseErrors';
import { FirebaseVercelHelperModal } from '../../components/common/FirebaseVercelHelperModal';

interface Props {
  onNavigate: (view: string) => void;
}

export const LoginPage: React.FC<Props> = ({ onNavigate }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showSetupGuide, setShowSetupGuide] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password);
      onNavigate('home');
    } catch (err: unknown) {
      console.error(err);
      const friendlyMsg = getFriendlyAuthErrorMessage(err, 'login');
      setError(friendlyMsg);
    } finally {
      setLoading(false);
    }
  };

  const isConfigError = error && (
    error.includes('Firebase Console') || 
    error.includes('not enabled') || 
    error.includes('authorized') || 
    error.includes('Vercel')
  );

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 p-2 mx-auto flex items-center justify-center">
            <img src="/logo.png" alt="App Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-2xl font-black text-white">Log in to your Account</h1>
          <p className="text-xs text-slate-400">
            Sign in to protect and backup your daily money journal entries.
          </p>
        </div>

        {/* Continue with Google and Guest Option */}
        <div className="space-y-3">
          <GoogleSignInButton
            onSuccess={() => onNavigate('home')}
            onError={(err) => setError(err)}
            label="Continue with Google"
          />

          <button
            type="button"
            onClick={() => onNavigate('journal')}
            className="w-full py-2.5 px-4 rounded-xl border border-slate-700/80 hover:border-slate-600 bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white font-medium text-xs flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <BookOpen className="w-4 h-4 text-emerald-400" />
            <span>Skip Sign-In (Continue as Guest)</span>
          </button>

          <div className="flex items-center gap-3 pt-1">
            <div className="h-px bg-slate-800 flex-1" />
            <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
              or sign in with email
            </span>
            <div className="h-px bg-slate-800 flex-1" />
          </div>
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-red-950/70 border border-red-800 text-xs text-red-200 space-y-2">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
              <span className="leading-relaxed">{error}</span>
            </div>
            {isConfigError && (
              <button
                type="button"
                onClick={() => setShowSetupGuide(true)}
                className="mt-1 w-full py-1.5 px-3 rounded-lg bg-red-900/60 hover:bg-red-800/80 text-amber-200 border border-red-700/60 text-[11px] font-bold text-center cursor-pointer transition"
              >
                View Firebase & Vercel Fix Instructions &rarr;
              </button>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Password
              </label>
              <button
                type="button"
                onClick={() => onNavigate('forgot-password')}
                className="text-[11px] text-emerald-400 hover:underline"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 cursor-pointer"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Quick Master Admin Login Button */}
          <button
            type="button"
            onClick={() => {
              setEmail('s.asyedabdullah786@gmail.com');
              setPassword('abdi9945');
            }}
            className="w-full py-2 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span>Use Admin Login (s.asyedabdullah786@gmail.com)</span>
          </button>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-70 shadow-md shadow-emerald-500/20"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Your transactions are encrypted and protected by Firebase Cloud.</span>
        </div>

        <div className="pt-2 text-center text-xs text-slate-400 space-y-3">
          <div>
            Don't have an account?{' '}
            <button
              onClick={() => onNavigate('signup')}
              className="text-emerald-400 font-bold hover:underline ml-1 cursor-pointer"
            >
              Sign up now
            </button>
          </div>

          <div className="pt-2 border-t border-slate-800/80">
            <button
              type="button"
              onClick={() => setShowSetupGuide(true)}
              className="text-[11px] text-slate-400 hover:text-emerald-400 transition cursor-pointer underline underline-offset-4"
            >
              Hosted on Vercel or seeing setup errors? Open Guide &rarr;
            </button>
          </div>
        </div>
      </div>

      <FirebaseVercelHelperModal
        isOpen={showSetupGuide}
        onClose={() => setShowSetupGuide(false)}
        initialReason={error?.includes('not enabled') ? 'operation-not-allowed' : 'general'}
      />
    </div>
  );
};
