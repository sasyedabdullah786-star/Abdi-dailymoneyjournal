import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { GoogleSignInButton } from './common/GoogleSignInButton';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'signup' | 'forgot';
}

export const SimpleAuthModal: React.FC<Props> = ({
  isOpen,
  onClose,
  initialMode = 'login',
}) => {
  const { login, signup, resetPassword } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        await login(email, password);
        onClose();
      } else if (mode === 'signup') {
        if (password.length < 6) {
          setError('Password must be at least 6 characters.');
          setLoading(false);
          return;
        }
        await signup(email, password, name);
        onClose();
      } else if (mode === 'forgot') {
        await resetPassword(email);
        setSuccess('Password reset link sent to your email.');
      }
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : 'Authentication failed';
      if (msg.includes('user-not-found') || msg.includes('wrong-password') || msg.includes('invalid-credential')) {
        setError('Incorrect email or password. Please try again.');
      } else if (msg.includes('email-already-in-use')) {
        setError('This email is already registered. Please log in.');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-[400px] bg-white rounded-[24px] p-6 sm:p-7 shadow-2xl border border-gray-100 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center text-sm font-bold cursor-pointer"
        >
          ✕
        </button>

        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-[#111827]">Daily Money Journal</h2>
          <p className="text-xs text-gray-500 mt-1">
            {mode === 'login' && 'Sign in to save and sync your journal across devices'}
            {mode === 'signup' && 'Create a free account to secure your finances in the cloud'}
            {mode === 'forgot' && 'Reset your account password'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-[12px] bg-red-50 border border-red-200 text-xs text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 rounded-[12px] bg-green-50 border border-green-200 text-xs text-green-700">
            {success}
          </div>
        )}

        {/* Google Sign-In */}
        {mode !== 'forgot' && (
          <div className="space-y-3 mb-4">
            <GoogleSignInButton
              onSuccess={() => onClose()}
              onError={(err) => setError(err)}
              label="Continue with Google"
            />
            <div className="flex items-center gap-3">
              <div className="h-px bg-gray-200 flex-1" />
              <span className="text-[10px] font-bold tracking-wider text-gray-400 uppercase">
                or with email
              </span>
              <div className="h-px bg-gray-200 flex-1" />
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === 'signup' && (
            <div>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full Name"
                className="w-full p-3.5 border border-gray-200 rounded-[12px] text-sm outline-none focus:border-[#111827] bg-white text-[#111827]"
              />
            </div>
          )}

          <div>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              className="w-full p-3.5 border border-gray-200 rounded-[12px] text-sm outline-none focus:border-[#111827] bg-white text-[#111827]"
            />
          </div>

          {mode !== 'forgot' && (
            <div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full p-3.5 border border-gray-200 rounded-[12px] text-sm outline-none focus:border-[#111827] bg-white text-[#111827]"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full p-4 bg-[#111827] hover:bg-[#1f2937] text-white font-bold rounded-[13px] text-base transition cursor-pointer disabled:opacity-60 mt-2"
          >
            {loading
              ? 'Please wait...'
              : mode === 'login'
              ? 'LOGIN'
              : mode === 'signup'
              ? 'CREATE ACCOUNT'
              : 'SEND RESET LINK'}
          </button>
        </form>

        <div className="mt-5 text-center text-xs text-gray-500 space-y-2">
          {mode === 'login' ? (
            <>
              <div>
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setError(null);
                  }}
                  className="font-bold text-[#111827] hover:underline cursor-pointer"
                >
                  Create Account
                </button>
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => {
                    setMode('forgot');
                    setError(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>
            </>
          ) : mode === 'signup' ? (
            <div>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError(null);
                }}
                className="font-bold text-[#111827] hover:underline cursor-pointer"
              >
                Log In
              </button>
            </div>
          ) : (
            <div>
              Remember your password?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError(null);
                }}
                className="font-bold text-[#111827] hover:underline cursor-pointer"
              >
                Back to Login
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
