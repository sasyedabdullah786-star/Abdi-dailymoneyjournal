import React, { useState } from 'react';
import { Cloud, X, Lock, Mail, UserCheck, LogOut, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface CloudSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CloudSyncModal: React.FC<CloudSyncModalProps> = ({ isOpen, onClose }) => {
  const { user, login, signup, logout } = useAuth();
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      if (isRegisterMode) {
        if (!displayName.trim()) {
          setErrorMsg('Please enter your name.');
          setLoading(false);
          return;
        }
        await signup(email, password, displayName);
        setSuccessNotice('Account created! Your journal is now synced to the cloud.');
      } else {
        await login(email, password);
        setSuccessNotice('Signed in! Your journal is synced.');
      }
      setTimeout(() => {
        setSuccessNotice(null);
        onClose();
      }, 1500);
    } catch (err: unknown) {
      const errString = err instanceof Error ? err.message : String(err);
      if (errString.includes('auth/invalid-credential') || errString.includes('auth/wrong-password')) {
        setErrorMsg('Invalid email or password.');
      } else if (errString.includes('auth/email-already-in-use')) {
        setErrorMsg('An account with this email already exists.');
      } else {
        setErrorMsg('Authentication error. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-sm overflow-hidden text-slate-800">
        {/* Header */}
        <div className="bg-slate-900 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800 hover:bg-slate-700 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-white">Cloud Backup</h3>
              <p className="text-xs text-slate-400">Sync ledger across phone & PC</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {user ? (
            <div className="text-center space-y-4 py-2">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <UserCheck className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Signed In As</p>
                <p className="font-extrabold text-slate-900 text-base">{user.displayName || user.email}</p>
                <p className="text-xs text-slate-500">{user.email}</p>
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-medium">
                ✅ Your entries are automatically backed up in real-time.
              </div>

              <button
                onClick={handleLogout}
                className="w-full py-3 px-4 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 font-bold text-xs flex items-center justify-center gap-2 border border-slate-200 transition cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <p className="text-xs text-slate-500">
                You can use Daily Money Journal 100% offline without signing in. Sign in only if you wish to back up to the cloud.
              </p>

              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-600 font-medium">
                  {errorMsg}
                </div>
              )}

              {successNotice && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 font-medium flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  {successNotice}
                </div>
              )}

              {isRegisterMode && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Your Name</label>
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-800"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email</label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-800"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-800"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm transition cursor-pointer mt-2 disabled:opacity-50"
              >
                {loading ? 'Please wait...' : isRegisterMode ? 'Create Free Account' : 'Sign In'}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsRegisterMode(!isRegisterMode);
                    setErrorMsg(null);
                  }}
                  className="text-xs text-slate-600 hover:text-slate-900 font-semibold underline cursor-pointer"
                >
                  {isRegisterMode
                    ? 'Already have an account? Sign In'
                    : "Don't have an account? Register"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
