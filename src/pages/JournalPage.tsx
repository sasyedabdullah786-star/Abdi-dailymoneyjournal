import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  X,
  Package,
  Download,
  Calendar,
  Clock,
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  Smartphone,
  ExternalLink,
  ChevronRight,
  Database,
  Cloud,
  FileText,
  DollarSign,
  User,
  LogOut,
  RefreshCw,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { MoneyEntry, PendingItem, AppSettings, WebsiteSettings } from '../types';
import {
  getTodayDateKey,
  formatINR,
  getEffectiveUserId,
  subscribeToUserEntries,
  addMoneyEntryToFirestore,
  deleteMoneyEntryFromFirestore,
  subscribeToUserPending,
  addPendingItemToFirestore,
  deletePendingItemFromFirestore,
  subscribeToUserNotes,
  saveUserNotesToFirestore,
} from '../services/journalService';
import { useAuth } from '../contexts/AuthContext';
import { updateAppSettings, updateWebsiteSettings } from '../services/appSettingsService';
import { logDownloadEvent } from '../services/downloadService';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { InstallGuideModal } from '../components/download/InstallGuideModal';
import { GoogleSignInButton } from '../components/common/GoogleSignInButton';
import { User as FirebaseUser } from 'firebase/auth';

const CATEGORIES = [
  'Personal',
  'Home',
  'Business',
  'Food',
  'Travel',
  'Shopping',
  'Bills',
  'Customer',
  'Other',
];

interface JournalPageProps {
  appSettings: AppSettings;
  onOpenAdmin?: () => void;
}

export const JournalPage: React.FC<JournalPageProps> = ({ appSettings }) => {
  const { user, login, signup, loginWithGoogle, logout, resetPassword } = useAuth();
  const effectiveUserId = useMemo(() => getEffectiveUserId(user?.uid), [user]);

  // Views: 'landing' | 'auth' | 'app' | 'admin'
  const [view, setView] = useState<'landing' | 'auth' | 'app' | 'admin'>(() => {
    // If user is already authenticated or has local user record, go to app; otherwise show landing
    const savedUser = localStorage.getItem('dmj_user');
    return (user || savedUser) ? 'app' : 'landing';
  });

  // App internal sub-views: 'home' | 'history' | 'pending' | 'notes'
  const [appSection, setAppSection] = useState<'home' | 'history' | 'pending' | 'notes'>('home');

  // Admin sub-sections: 'dashboard' | 'app' | 'apk' | 'users' | 'website' | 'settings'
  const [adminSection, setAdminSection] = useState<'dashboard' | 'app' | 'apk' | 'users' | 'website' | 'settings'>('dashboard');

  // PWA Install state
  const { isInstalled, triggerInstall } = usePWAInstall();
  const [showInstallGuide, setShowInstallGuide] = useState(false);
  const [guidePlatform, setGuidePlatform] = useState<'android' | 'ios' | 'desktop'>('android');

  // Menu
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Auth Form State
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState<string | null>(null);

  // Journal Entry Form State - no default values for parameters
  const [entryType, setEntryType] = useState<'income' | 'expense'>('income');
  const [amountInput, setAmountInput] = useState<string>('');
  const [descriptionInput, setDescriptionInput] = useState<string>('');
  const [categoryInput, setCategoryInput] = useState<string>('');

  // Pending Money Form State
  const [pendingType, setPendingType] = useState<'receive' | 'pay'>('receive');
  const [pendingAmount, setPendingAmount] = useState<string>('');
  const [pendingDesc, setPendingDesc] = useState<string>('');

  // Data States (Clean without any legacy demo or default seed items)
  const [entries, setEntries] = useState<MoneyEntry[]>(() => {
    try {
      const local = localStorage.getItem('dmj_entries');
      if (!local) return [];
      const parsed = JSON.parse(local);
      if (!Array.isArray(parsed)) return [];
      const clean = parsed.filter((e: MoneyEntry) => !e.id?.startsWith('entry_seed_'));
      if (clean.length !== parsed.length) {
        localStorage.setItem('dmj_entries', JSON.stringify(clean));
      }
      return clean;
    } catch {
      return [];
    }
  });

  const [pendingList, setPendingList] = useState<PendingItem[]>(() => {
    try {
      const local = localStorage.getItem('dmj_pending');
      if (!local) return [];
      const parsed = JSON.parse(local);
      if (!Array.isArray(parsed)) return [];
      const clean = parsed.filter((p: PendingItem) => !p.id?.startsWith('pend_seed_'));
      if (clean.length !== parsed.length) {
        localStorage.setItem('dmj_pending', JSON.stringify(clean));
      }
      return clean;
    } catch {
      return [];
    }
  });

  const [notesText, setNotesText] = useState<string>(() => {
    const raw = localStorage.getItem('dmj_notes') || '';
    if (raw.includes('Remember to collect shop rent on the 1st')) {
      localStorage.removeItem('dmj_notes');
      return '';
    }
    return raw;
  });

  // Admin Config State
  const [adminData, setAdminData] = useState(() => {
    try {
      const local = localStorage.getItem('dmj_admin');
      if (local) return JSON.parse(local);
    } catch {}
    return {
      version: appSettings.currentVersion || '2.4.0',
      packageName: 'com.abdi.dailymoneyjournal',
      apkUrl: '/com.abdi.dailymoneyjournal.apk',
      apkSize: '0.55 MB',
      releaseNotes: 'Clean, verified Android release with MainActivity launcher & Firebase sync.',
      appName: 'Daily Money Journal',
      description: 'Simple daily money tracking.',
      logo: '',
      heroTitle: 'Your money. Kept simple.',
      support: 's.asyedabdullah786@gmail.com',
      downloads: appSettings.totalDownloads || 1420,
    };
  });

  // Toast Notification System
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = (msg: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMessage(msg);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 2600);
  };

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('dmj_entries', JSON.stringify(entries));
  }, [entries]);

  useEffect(() => {
    localStorage.setItem('dmj_pending', JSON.stringify(pendingList));
  }, [pendingList]);

  useEffect(() => {
    localStorage.setItem('dmj_notes', notesText);
  }, [notesText]);

  useEffect(() => {
    localStorage.setItem('dmj_admin', JSON.stringify(adminData));
  }, [adminData]);

  // Connect to Firebase Firestore for authenticated users, or use LocalStorage for guest mode
  useEffect(() => {
    if (user?.uid) {
      const unsubEntries = subscribeToUserEntries(
        user.uid,
        (remoteEntries) => {
          setEntries(remoteEntries || []);
        },
        (err) => console.warn('Firestore entries error:', err)
      );

      const unsubPending = subscribeToUserPending(
        user.uid,
        (remotePending) => {
          setPendingList(remotePending || []);
        },
        (err) => console.warn('Firestore pending error:', err)
      );

      const unsubNotes = subscribeToUserNotes(
        user.uid,
        (remoteNotes) => {
          setNotesText(remoteNotes || '');
        },
        (err) => console.warn('Firestore notes error:', err)
      );

      return () => {
        unsubEntries();
        unsubPending();
        unsubNotes();
      };
    } else {
      // In guest mode, load directly from local storage without connecting Firestore listeners
      try {
        const localEntries = localStorage.getItem('dmj_entries');
        if (localEntries) setEntries(JSON.parse(localEntries));
        const localPending = localStorage.getItem('dmj_pending');
        if (localPending) setPendingList(JSON.parse(localPending));
        const localNotes = localStorage.getItem('dmj_notes');
        if (localNotes) setNotesText(localNotes);
      } catch (err) {
        console.warn('Error reading local guest data:', err);
      }
    }
  }, [user]);

  // Close menu on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Today's formatted date string
  const todayFormatted = useMemo(() => {
    return new Date().toLocaleDateString('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }, []);

  const todayKey = getTodayDateKey();

  // Calculations
  const { totalBalance, receivedToday, spentToday } = useMemo(() => {
    let allInc = 0;
    let allExp = 0;
    let recToday = 0;
    let spToday = 0;

    entries.forEach((e) => {
      const val = Number(e.amount) || 0;
      if (e.type === 'income') {
        allInc += val;
        if (e.date === todayKey) recToday += val;
      } else {
        allExp += val;
        if (e.date === todayKey) spToday += val;
      }
    });

    return {
      totalBalance: allInc - allExp,
      receivedToday: recToday,
      spentToday: spToday,
    };
  }, [entries, todayKey]);

  // Today's entries list
  const todaysEntries = useMemo(() => {
    return entries.filter((e) => e.date === todayKey);
  }, [entries, todayKey]);

  // History grouped by date
  const historyByDate = useMemo(() => {
    const groups: { [date: string]: MoneyEntry[] } = {};
    entries.forEach((e) => {
      if (!groups[e.date]) groups[e.date] = [];
      groups[e.date].push(e);
    });
    // Sort dates descending
    const sortedDates = Object.keys(groups).sort((a, b) => b.localeCompare(a));
    return sortedDates.map((date) => {
      const list = groups[date];
      let dayInc = 0;
      let dayExp = 0;
      list.forEach((e) => {
        if (e.type === 'income') dayInc += e.amount;
        else dayExp += e.amount;
      });
      return {
        date,
        dayInc,
        dayExp,
        net: dayInc - dayExp,
        entries: list,
      };
    });
  }, [entries]);

  // Handler: Save Journal Entry
  const handleSaveEntry = async () => {
    const amount = Number(amountInput);
    const desc = descriptionInput.trim();

    if (!amount || amount <= 0) {
      showToast('Please enter a valid amount.');
      return;
    }
    if (!desc) {
      showToast('Please enter a description.');
      return;
    }

    const newId = 'entry_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const timeNow = new Date().toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const newEntry: MoneyEntry = {
      id: newId,
      userId: effectiveUserId,
      type: entryType,
      amount,
      description: desc,
      category: categoryInput,
      date: todayKey,
      time: timeNow,
      createdAt: new Date().toISOString(),
    };

    // Update local state immediately
    setEntries((prev) => [newEntry, ...prev]);
    setAmountInput('');
    setDescriptionInput('');
    showToast('Entry saved!');

    // Sync to Firestore if authenticated
    if (user?.uid) {
      try {
        await addMoneyEntryToFirestore(user.uid, newEntry);
      } catch (err) {
        console.warn('Firestore entry sync error:', err);
      }
    }
  };

  // Handler: Delete Journal Entry
  const handleDeleteEntry = async (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
    showToast('Entry deleted.');
    if (user?.uid) {
      try {
        await deleteMoneyEntryFromFirestore(user.uid, id);
      } catch (err) {
        console.warn('Firestore delete error:', err);
      }
    }
  };

  // Handler: Save Pending Item
  const handleSavePending = async () => {
    const amount = Number(pendingAmount);
    const desc = pendingDesc.trim();

    if (!amount || amount <= 0) {
      showToast('Please enter a valid amount.');
      return;
    }
    if (!desc) {
      showToast('Please enter person name / note.');
      return;
    }

    const newId = 'pend_' + Date.now().toString(36);
    const newItem: PendingItem = {
      id: newId,
      userId: user?.uid || 'local_guest',
      type: pendingType,
      amount,
      description: desc,
      createdAt: new Date().toISOString(),
    };

    setPendingList((prev) => [newItem, ...prev]);
    setPendingAmount('');
    setPendingDesc('');
    showToast('Pending item added.');

    if (user?.uid) {
      try {
        await addPendingItemToFirestore(user.uid, newItem);
      } catch (err) {
        console.warn('Firestore pending add error:', err);
      }
    }
  };

  // Handler: Settle Pending Item into today's ledger
  const handleSettlePending = async (item: PendingItem) => {
    // Delete pending item
    setPendingList((prev) => prev.filter((p) => p.id !== item.id));

    // Convert into Money Entry
    const newEntry: MoneyEntry = {
      id: 'settled_' + Date.now().toString(36),
      userId: user?.uid || 'local_guest',
      type: item.type === 'receive' ? 'income' : 'expense',
      amount: item.amount,
      description: `${item.type === 'receive' ? 'Received from' : 'Paid to'}: ${item.description}`,
      category: item.type === 'receive' ? 'Customer' : 'Bills',
      date: todayKey,
      time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      createdAt: new Date().toISOString(),
    };

    setEntries((prev) => [newEntry, ...prev]);
    showToast(`Settled ₹${item.amount.toLocaleString('en-IN')} into today's journal!`);

    if (user?.uid) {
      try {
        await deletePendingItemFromFirestore(user.uid, item.id);
        await addMoneyEntryToFirestore(user.uid, newEntry);
      } catch (err) {
        console.warn('Firestore settle sync error:', err);
      }
    }
  };

  // Handler: Delete Pending Item
  const handleDeletePending = async (id: string) => {
    setPendingList((prev) => prev.filter((p) => p.id !== id));
    showToast('Pending item removed.');
    if (user?.uid) {
      try {
        await deletePendingItemFromFirestore(user.uid, id);
      } catch (err) {
        console.warn('Firestore delete pending error:', err);
      }
    }
  };

  // Handler: Save Notes
  const handleSaveNotes = async () => {
    showToast('Smart notes saved!');
    if (user?.uid) {
      try {
        await saveUserNotesToFirestore(user.uid, notesText);
      } catch (err) {
        console.warn('Firestore save notes error:', err);
      }
    }
  };

  // Handler: Install directly through Chrome automatically without APK
  const handleDownloadApp = async () => {
    setAdminData((prev: typeof adminData) => ({ ...prev, downloads: (prev.downloads || 0) + 1 }));
    logDownloadEvent(adminData.version || '2.4.0', 'chrome-direct-install');

    try {
      const res = await triggerInstall();
      if (res.status === 'installed_native') {
        showToast('Daily Money Journal installed to your home screen!');
      } else if (res.status === 'already_installed') {
        showToast('App is already installed on this device!');
      } else if (res.status === 'dismissed_native') {
        showToast('Installation cancelled.');
      } else {
        // If Chrome's native sheet didn't trigger immediately
        showToast('Tap Install when prompted by Chrome.');
      }
    } catch (err) {
      console.warn('Install error:', err);
      showToast('Opening Chrome install...');
    }
  };

  // Handler: Google Sign-In Success
  const handleGoogleSuccess = (firebaseUser: FirebaseUser) => {
    localStorage.setItem(
      'dmj_user',
      JSON.stringify({
        email: firebaseUser.email,
        name: firebaseUser.displayName || firebaseUser.email?.split('@')[0],
        uid: firebaseUser.uid,
        photoURL: firebaseUser.photoURL,
      })
    );
    setView('app');
    setAppSection('home');
    showToast(`Welcome ${firebaseUser.displayName || 'back'}! Your data is protected.`);
  };

  // Handler: Auth Submit
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setForgotSuccess(null);

    const email = authEmail.trim();

    if (!email) {
      setAuthError('Please enter your email address.');
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setAuthError('Please enter a valid email address.');
      return;
    }

    if (authMode === 'forgot') {
      try {
        setAuthSubmitting(true);
        await resetPassword(email);
        setForgotSuccess('Password reset link sent to your email. Check your inbox.');
      } catch (err: unknown) {
        console.warn('Reset password error:', err);
        setAuthError(err instanceof Error ? err.message : 'Failed to send reset link.');
      } finally {
        setAuthSubmitting(false);
      }
      return;
    }

    const pass = authPassword;
    if (!pass) {
      setAuthError('Please enter your password.');
      return;
    }
    if (authMode === 'signup' && pass.length < 6) {
      setAuthError('Password must be at least 6 characters.');
      return;
    }

    try {
      setAuthSubmitting(true);
      if (authMode === 'signup') {
        const name = authName.trim() || email.split('@')[0];
        await signup(email, pass, name);
      } else {
        await login(email, pass);
      }
      localStorage.setItem('dmj_user', JSON.stringify({ email, name: authName.trim() || email.split('@')[0] }));
      setView('app');
      setAppSection('home');
      showToast(authMode === 'signup' ? 'Account created! Financial data protected.' : 'Welcome back!');
    } catch (err: unknown) {
      console.warn('Firebase auth error:', err);
      let msg = 'Authentication failed. Please verify your credentials.';
      if (err instanceof Error) {
        if (err.message.includes('user-not-found') || err.message.includes('wrong-password') || err.message.includes('invalid-credential')) {
          msg = 'Incorrect email or password. Please verify and try again.';
        } else if (err.message.includes('email-already-in-use')) {
          msg = 'This email is already registered. Please log in.';
        } else if (err.message.includes('weak-password')) {
          msg = 'Password is too weak. Please use at least 6 characters.';
        } else {
          msg = err.message;
        }
      }
      setAuthError(msg);
    } finally {
      setAuthSubmitting(false);
    }
  };

  // Handler: Logout
  const handleLogout = async () => {
    setIsMenuOpen(false);
    localStorage.removeItem('dmj_user');
    localStorage.removeItem('dmj_entries');
    localStorage.removeItem('dmj_pending');
    localStorage.removeItem('dmj_notes');
    setEntries([]);
    setPendingList([]);
    setNotesText('');
    try {
      await logout();
    } catch (e) {
      console.warn('Logout error:', e);
    }
    setView('landing');
    showToast('Signed out. Your journal data is safely protected.');
  };

  // Handler: Open Admin with Pin
  const handleOpenAdmin = () => {
    setIsMenuOpen(false);
    const pin = window.prompt('Admin access code:');
    if (pin !== 'admin123') {
      if (pin !== null) showToast('Incorrect admin code.');
      return;
    }
    setView('admin');
    setAdminSection('dashboard');
  };

  return (
    <div className="min-h-screen bg-[#f3f5f9] text-[#111827] selection:bg-slate-900 selection:text-white pb-12">
      {/* Toast Notification */}
      <div className={`toast ${toastMessage ? 'show' : ''}`} role="alert">
        {toastMessage}
      </div>

      {/* ---------------- 1. LANDING VIEW ---------------- */}
      {view === 'landing' && (
        <section className="landing-wrap animate-fadeIn">
          <div className="app-container">
            <div className="hero-box">
              <div className="brand-row items-center gap-3.5">
                <img
                  src="/logo.png"
                  alt="JENERAL APP Logo"
                  className="w-14 h-14 rounded-2xl object-contain bg-white shadow-lg border border-white/20 p-0.5 shrink-0"
                />
                <div>
                  <div className="eyebrow-text tracking-widest text-emerald-400 font-bold">SMART · SIMPLE · USEFUL</div>
                  <strong className="text-2xl tracking-tight text-white flex items-center gap-2">
                    <span>JENERAL APP</span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium">Daily Money Journal</span>
                  </strong>
                </div>
              </div>

              <h1 className="hero-h1">
                Your daily money.<br />Smart, simple, and useful.
              </h1>
              <p className="hero-desc">
                Record money in, money out, pending payments and daily notes without complicated accounting screens.
              </p>

              <div className="hero-actions">
                <button onClick={handleDownloadApp} className="dmj-btn dmj-btn-primary">
                  <Smartphone className="w-4 h-4" />
                  Install App to Phone
                </button>
                <button
                  onClick={() => {
                    const localUser = localStorage.getItem('dmj_user');
                    if (user || localUser) {
                      setView('app');
                      setAppSection('home');
                    } else {
                      setView('auth');
                      setAuthMode('login');
                    }
                  }}
                  className="dmj-btn dmj-btn-secondary"
                >
                  {user ? 'Open My Journal' : 'Sign In / Open Web App'}
                </button>
              </div>

              <div className="features-grid">
                <div className="feature-box">
                  <b>Money In / Out</b>
                  <span>Fast daily entries</span>
                </div>
                <div className="feature-box">
                  <b>History</b>
                  <span>Keep your records</span>
                </div>
                <div className="feature-box">
                  <b>Pending</b>
                  <span>Never forget a payment</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ---------------- 2. AUTH VIEW ---------------- */}
      {view === 'auth' && (
        <section className="min-h-screen grid place-items-center p-4 sm:p-6 bg-radial from-slate-100 to-slate-200 animate-fadeIn">
          <div className="w-full max-w-[430px] bg-white rounded-[28px] p-7 sm:p-8 shadow-2xl border border-slate-100">
            <button
              onClick={() => setView('landing')}
              className="text-slate-500 hover:text-slate-900 font-bold text-xs mb-4 inline-flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              ← Back to Overview
            </button>

            <div className="flex items-center gap-3 mb-5">
              <img
                src="/logo.png"
                alt="Daily Money Journal"
                className="w-12 h-12 rounded-2xl object-contain bg-slate-900 p-1.5 shadow-md shadow-slate-900/10 shrink-0"
              />
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">
                  {authMode === 'login'
                    ? 'Sign In to Journal'
                    : authMode === 'signup'
                    ? 'Create Your Account'
                    : 'Reset Password'}
                </h1>
                <p className="text-xs text-slate-500 font-medium">
                  {authMode === 'login'
                    ? 'Protect and access your daily finances securely'
                    : authMode === 'signup'
                    ? 'Secure cloud storage with user data isolation'
                    : 'We will send a reset link to your email'}
                </p>
              </div>
            </div>

            {/* Prominent Google Sign-In */}
            {authMode !== 'forgot' && (
              <div className="space-y-4 mb-5">
                <GoogleSignInButton
                  onSuccess={handleGoogleSuccess}
                  onError={(err) => setAuthError(err)}
                  label={authMode === 'login' ? 'Continue with Google' : 'Sign up with Google'}
                />

                <div className="flex items-center gap-3">
                  <div className="h-px bg-slate-200 flex-1" />
                  <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                    or continue with email
                  </span>
                  <div className="h-px bg-slate-200 flex-1" />
                </div>
              </div>
            )}

            {authError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                <span className="flex-1 leading-relaxed">{authError}</span>
              </div>
            )}

            {forgotSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                <span className="flex-1 leading-relaxed">{forgotSuccess}</span>
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-3.5">
              {authMode === 'signup' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="e.g. Syed Abdullah"
                      value={authName}
                      onChange={(e) => setAuthName(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-blue-600 focus:bg-white transition"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-blue-600 focus:bg-white transition"
                    required
                  />
                </div>
              </div>

              {authMode !== 'forgot' && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">Password</label>
                    {authMode === 'login' && (
                      <button
                        type="button"
                        onClick={() => {
                          setAuthError(null);
                          setAuthMode('forgot');
                        }}
                        className="text-[11px] font-semibold text-blue-600 hover:underline cursor-pointer"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder={authMode === 'signup' ? 'At least 6 characters' : '••••••••'}
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-blue-600 focus:bg-white transition"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                      tabIndex={-1}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={authSubmitting}
                className="w-full py-3.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-slate-900/10 cursor-pointer transition-all flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {authSubmitting ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <>
                    <span>
                      {authMode === 'login'
                        ? 'Sign In to Journal'
                        : authMode === 'signup'
                        ? 'Create Protected Account'
                        : 'Send Reset Link'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="text-center text-slate-500 text-xs mt-5 pt-4 border-t border-slate-100">
              {authMode === 'login' && (
                <div>
                  <span>Need an account? </span>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthError(null);
                      setAuthMode('signup');
                    }}
                    className="text-blue-600 font-bold hover:underline cursor-pointer ml-1"
                  >
                    Create one now
                  </button>
                </div>
              )}
              {authMode === 'signup' && (
                <div>
                  <span>Already registered? </span>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthError(null);
                      setAuthMode('login');
                    }}
                    className="text-blue-600 font-bold hover:underline cursor-pointer ml-1"
                  >
                    Sign In
                  </button>
                </div>
              )}
              {authMode === 'forgot' && (
                <div>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthError(null);
                      setAuthMode('login');
                    }}
                    className="text-blue-600 font-bold hover:underline cursor-pointer"
                  >
                    ← Back to Sign In
                  </button>
                </div>
              )}
            </div>

            {/* Data Protection Trust Note */}
            <div className="mt-5 p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-2.5 text-[11px] text-slate-600">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="leading-snug">
                <strong className="text-slate-800">Your Data is Encrypted & Protected</strong>
                <p className="mt-0.5 text-slate-500">
                  Each user account has isolated, private database storage. Nobody else can view your daily transactions.
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ---------------- 3. MAIN APP VIEW ---------------- */}
      {view === 'app' && (
        <section className="app-container pt-5 pb-12 animate-fadeIn">
          {/* Topbar */}
          <div className="topbar-wrap relative">
            <div className="flex items-center gap-3">
              <img
                src="/logo.png"
                alt="JENERAL APP"
                className="w-10 h-10 rounded-xl object-contain bg-white shadow-sm border border-slate-200 p-0.5 shrink-0"
              />
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight leading-tight">JENERAL APP</h2>
                <p className="text-xs text-slate-500 font-medium">{todayFormatted} · Daily Money Journal</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* User Session & Protection Status */}
              {user ? (
                <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="truncate max-w-[120px]">{user.displayName || user.email?.split('@')[0]}</span>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setView('auth');
                    setAuthMode('login');
                  }}
                  className="px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs font-bold text-blue-700 hover:bg-blue-100 transition cursor-pointer flex items-center gap-1"
                >
                  <Lock className="w-3 h-3" />
                  <span>Sign In</span>
                </button>
              )}

              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="dmj-menu-btn"
                aria-label="Open menu"
              >
                ⋮
              </button>
            </div>

            {/* Dropdown Menu */}
            {isMenuOpen && (
              <div
                className="dmj-dropdown-menu"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Account Header */}
                <div className="px-3.5 py-2.5 border-b border-slate-100 mb-1">
                  {user ? (
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{user.displayName || 'Protected User'}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">{user.email}</div>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <div className="text-xs font-bold text-slate-700">Guest Device Session</div>
                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          setView('auth');
                          setAuthMode('login');
                        }}
                        className="text-[11px] text-blue-600 font-bold hover:underline cursor-pointer block"
                      >
                        Sign in to encrypt & backup →
                      </button>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => {
                    setAppSection('home');
                    setIsMenuOpen(false);
                  }}
                >
                  ⌂ Home
                </button>
                <button
                  onClick={() => {
                    setAppSection('history');
                    setIsMenuOpen(false);
                  }}
                >
                  ▤ Daily History
                </button>
                <button
                  onClick={() => {
                    setAppSection('pending');
                    setIsMenuOpen(false);
                  }}
                >
                  ◷ Pending Money
                </button>
                <button
                  onClick={() => {
                    setAppSection('notes');
                    setIsMenuOpen(false);
                  }}
                >
                  ✎ Smart Notes
                </button>
                <button onClick={handleOpenAdmin}>
                  ⚙ Admin Panel
                </button>
                <button
                  onClick={() => {
                    handleDownloadApp();
                    setIsMenuOpen(false);
                  }}
                >
                  📲 Install App to Phone
                </button>

                {user ? (
                  <button
                    onClick={handleLogout}
                    className="text-rose-600 hover:bg-rose-50 border-t border-slate-100 mt-1"
                  >
                    <LogOut className="w-3.5 h-3.5 inline mr-1 text-rose-500" />
                    Sign Out Securely
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      setView('auth');
                      setAuthMode('login');
                    }}
                    className="text-blue-600 font-bold hover:bg-blue-50 border-t border-slate-100 mt-1"
                  >
                    🔑 Sign In with Google
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Sub-navigation tabs for rapid switching */}
          <div className="flex items-center gap-1.5 mb-4 overflow-x-auto pb-1 text-xs font-bold">
            <button
              onClick={() => setAppSection('home')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                appSection === 'home'
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-600 border border-slate-200'
              }`}
            >
              Home
            </button>
            <button
              onClick={() => setAppSection('history')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                appSection === 'history'
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-600 border border-slate-200'
              }`}
            >
              Daily History
            </button>
            <button
              onClick={() => setAppSection('pending')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                appSection === 'pending'
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-600 border border-slate-200'
              }`}
            >
              Pending Money
              {pendingList.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-amber-500 text-white text-[10px] grid place-items-center">
                  {pendingList.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setAppSection('notes')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                appSection === 'notes'
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-600 border border-slate-200'
              }`}
            >
              Smart Notes
            </button>
          </div>

          {/* HOME SECTION */}
          {appSection === 'home' && (
            <>
              {/* CURRENT BALANCE */}
              <div className="balance-card">
                <small>CURRENT BALANCE</small>
                <h1>₹{totalBalance.toLocaleString('en-IN')}</h1>
              </div>

              {/* SUMMARY */}
              <div className="summary-grid">
                <div className="dmj-card">
                  <p>Received Today</p>
                  <h3 className="color-green">₹{receivedToday.toLocaleString('en-IN')}</h3>
                </div>
                <div className="dmj-card">
                  <p>Spent Today</p>
                  <h3 className="color-red">₹{spentToday.toLocaleString('en-IN')}</h3>
                </div>
              </div>

              {/* QUICK ENTRY */}
              <div className="dmj-card">
                <h2 className="text-lg font-bold text-slate-900">⚡ Quick Entry</h2>
                <div className="quick-grid">
                  <button onClick={() => setAmountInput('50')} className="quick-btn">
                    ₹50
                  </button>
                  <button onClick={() => setAmountInput('100')} className="quick-btn">
                    ₹100
                  </button>
                  <button onClick={() => setAmountInput('200')} className="quick-btn">
                    ₹200
                  </button>
                  <button onClick={() => setAmountInput('500')} className="quick-btn">
                    ₹500
                  </button>
                </div>
              </div>

              {/* ADD MONEY ENTRY */}
              <div className="dmj-card">
                <h2 className="text-lg font-bold text-slate-900 mb-3">Add Money Entry</h2>
                <div className="type-toggle">
                  <button
                    onClick={() => setEntryType('income')}
                    className={`type-btn ${entryType === 'income' ? 'active-in' : ''}`}
                  >
                    ＋ MONEY IN
                  </button>
                  <button
                    onClick={() => setEntryType('expense')}
                    className={`type-btn ${entryType === 'expense' ? 'active-out' : ''}`}
                  >
                    − MONEY OUT
                  </button>
                </div>

                <input
                  type="number"
                  inputMode="decimal"
                  placeholder="Enter amount"
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value)}
                  className="dmj-input"
                />

                <input
                  placeholder="What is this money for?"
                  value={descriptionInput}
                  onChange={(e) => setDescriptionInput(e.target.value)}
                  className="dmj-input"
                />

                <select
                  value={categoryInput}
                  onChange={(e) => setCategoryInput(e.target.value)}
                  className="dmj-select"
                >
                  <option value="">Select category (optional)</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>

                <button onClick={handleSaveEntry} className="dmj-primary-btn">
                  SAVE ENTRY
                </button>
              </div>

              {/* TODAY'S ENTRIES */}
              <div className="dmj-card">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-lg font-bold text-slate-900">Today's Entries</h2>
                  <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                    {todaysEntries.length} {todaysEntries.length === 1 ? 'record' : 'records'}
                  </span>
                </div>

                <div>
                  {todaysEntries.length === 0 ? (
                    <div className="empty-state">No entries today.</div>
                  ) : (
                    todaysEntries.map((e) => (
                      <div key={e.id} className="entry-row">
                        <div>
                          <strong className="text-slate-900 font-bold block">{e.description}</strong>
                          <small>
                            {e.category} · {e.time}
                          </small>
                        </div>
                        <div className="text-right">
                          <strong
                            className={`font-mono text-base ${
                              e.type === 'income' ? 'color-green' : 'color-red'
                            }`}
                          >
                            {e.type === 'income' ? '+' : '-'}₹{e.amount.toLocaleString('en-IN')}
                          </strong>
                          <br />
                          <button
                            onClick={() => handleDeleteEntry(e.id)}
                            className="delete-btn"
                            aria-label="Delete entry"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}

          {/* DAILY HISTORY SECTION */}
          {appSection === 'history' && (
            <div className="space-y-4">
              <div className="dmj-card">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Daily History</h2>
                    <p className="text-xs text-slate-500">Grouped day by day records</p>
                  </div>
                  <button
                    onClick={() => setAppSection('home')}
                    className="text-xs font-bold text-blue-600 hover:underline"
                  >
                    ← Back to Today
                  </button>
                </div>
              </div>

              {historyByDate.length === 0 ? (
                <div className="dmj-card empty-state">No recorded history yet.</div>
              ) : (
                historyByDate.map((group) => (
                  <div key={group.date} className="dmj-card">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                      <div>
                        <strong className="text-sm font-bold text-slate-900">
                          {group.date === todayKey ? "Today's Ledger" : group.date}
                        </strong>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {group.entries.length} entries
                        </div>
                      </div>
                      <div className="text-right text-xs">
                        <span className="text-emerald-700 font-bold block">
                          +₹{group.dayInc.toLocaleString('en-IN')}
                        </span>
                        <span className="text-rose-700 font-bold block">
                          -₹{group.dayExp.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>

                    <div className="divide-y divide-slate-100">
                      {group.entries.map((e) => (
                        <div key={e.id} className="py-2.5 flex justify-between items-center text-sm">
                          <div>
                            <div className="font-semibold text-slate-900">{e.description}</div>
                            <div className="text-xs text-slate-400">
                              {e.category} · {e.time}
                            </div>
                          </div>
                          <div className="text-right">
                            <span
                              className={`font-mono font-bold ${
                                e.type === 'income' ? 'text-emerald-600' : 'text-rose-600'
                              }`}
                            >
                              {e.type === 'income' ? '+' : '-'}₹{e.amount.toLocaleString('en-IN')}
                            </span>
                            <button
                              onClick={() => handleDeleteEntry(e.id)}
                              className="block ml-auto text-[11px] text-rose-500 hover:text-rose-700 mt-0.5 font-semibold"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* PENDING MONEY SECTION */}
          {appSection === 'pending' && (
            <div className="space-y-4">
              <div className="dmj-card">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Pending Money</h2>
                    <p className="text-xs text-slate-500">Track receivables and dues</p>
                  </div>
                  <button
                    onClick={() => setAppSection('home')}
                    className="text-xs font-bold text-blue-600 hover:underline"
                  >
                    ← Back to Today
                  </button>
                </div>

                <div className="type-toggle mb-3">
                  <button
                    onClick={() => setPendingType('receive')}
                    className={`type-btn ${pendingType === 'receive' ? 'active-in' : ''}`}
                  >
                    ↓ MONEY TO RECEIVE
                  </button>
                  <button
                    onClick={() => setPendingType('pay')}
                    className={`type-btn ${pendingType === 'pay' ? 'active-out' : ''}`}
                  >
                    ↑ MONEY TO PAY
                  </button>
                </div>

                <input
                  type="number"
                  inputMode="decimal"
                  placeholder="Enter pending amount"
                  value={pendingAmount}
                  onChange={(e) => setPendingAmount(e.target.value)}
                  className="dmj-input"
                />

                <input
                  placeholder="Who owes or is owed? (e.g. Rahul, Shopkeeper)"
                  value={pendingDesc}
                  onChange={(e) => setPendingDesc(e.target.value)}
                  className="dmj-input"
                />

                <button onClick={handleSavePending} className="dmj-primary-btn">
                  ADD PENDING ITEM
                </button>
              </div>

              {/* PENDING LIST */}
              <div className="dmj-card">
                <h3 className="font-bold text-slate-900 mb-3 text-sm">Active Pending Items</h3>
                {pendingList.length === 0 ? (
                  <div className="empty-state">No pending items. You are all settled!</div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {pendingList.map((item) => (
                      <div key={item.id} className="py-3 flex justify-between items-center gap-3">
                        <div>
                          <div className="font-bold text-slate-900 text-sm">{item.description}</div>
                          <span
                            className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded mt-1 ${
                              item.type === 'receive'
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-rose-50 text-rose-700'
                            }`}
                          >
                            {item.type === 'receive' ? 'To Receive' : 'To Pay'}
                          </span>
                        </div>

                        <div className="text-right">
                          <div
                            className={`font-mono font-extrabold text-base ${
                              item.type === 'receive' ? 'color-green' : 'color-red'
                            }`}
                          >
                            ₹{item.amount.toLocaleString('en-IN')}
                          </div>
                          <div className="flex items-center gap-1.5 mt-1.5 justify-end">
                            <button
                              onClick={() => handleSettlePending(item)}
                              className="bg-slate-900 text-white text-xs font-bold px-2.5 py-1 rounded-lg hover:bg-slate-800"
                            >
                              Settle
                            </button>
                            <button
                              onClick={() => handleDeletePending(item.id)}
                              className="text-slate-400 hover:text-rose-600 text-xs px-1.5 py-1"
                            >
                              ×
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SMART NOTES SECTION */}
          {appSection === 'notes' && (
            <div className="dmj-card">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Smart Notes</h2>
                  <p className="text-xs text-slate-500">Financial scratchpad & calculations</p>
                </div>
                <button
                  onClick={() => setAppSection('home')}
                  className="text-xs font-bold text-blue-600 hover:underline"
                >
                  ← Back to Today
                </button>
              </div>

              <textarea
                rows={12}
                placeholder="Write your money notes, budgets, shopping lists, or reminders here..."
                value={notesText}
                onChange={(e) => setNotesText(e.target.value)}
                className="dmj-input font-mono text-sm leading-relaxed"
              />

              <button onClick={handleSaveNotes} className="dmj-primary-btn">
                SAVE NOTES
              </button>
            </div>
          )}
        </section>
      )}

      {/* ---------------- 4. ADMIN PANEL VIEW ---------------- */}
      {view === 'admin' && (
        <section className="app-container pt-5 pb-12 animate-fadeIn">
          <div className="topbar-wrap">
            <div>
              <h2>Admin Panel</h2>
              <p>Daily Money Journal management & APK status</p>
            </div>
            <button
              onClick={() => {
                setView('app');
                setAppSection('home');
              }}
              className="dmj-menu-btn"
              aria-label="Close admin panel"
            >
              ×
            </button>
          </div>

          {/* Admin Navigation Bar */}
          <div className="admin-nav-bar">
            <button
              onClick={() => setAdminSection('dashboard')}
              className={`admin-nav-btn ${adminSection === 'dashboard' ? 'active' : ''}`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setAdminSection('app')}
              className={`admin-nav-btn ${adminSection === 'app' ? 'active' : ''}`}
            >
              App
            </button>
            <button
              onClick={() => setAdminSection('apk')}
              className={`admin-nav-btn ${adminSection === 'apk' ? 'active' : ''}`}
            >
              App Install (PWA)
            </button>
            <button
              onClick={() => setAdminSection('users')}
              className={`admin-nav-btn ${adminSection === 'users' ? 'active' : ''}`}
            >
              Users
            </button>
            <button
              onClick={() => setAdminSection('website')}
              className={`admin-nav-btn ${adminSection === 'website' ? 'active' : ''}`}
            >
              Website
            </button>
            <button
              onClick={() => setAdminSection('settings')}
              className={`admin-nav-btn ${adminSection === 'settings' ? 'active' : ''}`}
            >
              Settings
            </button>
          </div>

          {/* TAB 1: DASHBOARD */}
          {adminSection === 'dashboard' && (
            <div className="space-y-4">
              <div className="admin-grid-box">
                <div className="admin-stat-box bg-white">
                  <small>Total Users</small>
                  <h3>{user || localStorage.getItem('dmj_user') ? 1 : 0}</h3>
                </div>
                <div className="admin-stat-box bg-white">
                  <small>Total Entries</small>
                  <h3>{entries.length}</h3>
                </div>
                <div className="admin-stat-box bg-white">
                  <small>App Version</small>
                  <h3>{adminData.version || '2.4.0'}</h3>
                </div>
                <div className="admin-stat-box bg-white">
                  <small>App Installs</small>
                  <h3>{adminData.downloads || 1420}</h3>
                </div>
              </div>

              <div className="admin-card-box">
                <h3 className="font-bold text-slate-900 mb-3">Recent Activity</h3>
                <div className="admin-list-box">
                  {entries.length === 0 ? (
                    <div className="empty-state">No activity yet.</div>
                  ) : (
                    entries.slice(0, 10).map((e) => (
                      <div key={e.id} className="admin-row-item">
                        <div>
                          <strong className="text-slate-800 text-sm">{e.description}</strong>
                          <div className="text-xs text-slate-400">
                            {e.category} · {e.date}
                          </div>
                        </div>
                        <strong
                          className={`font-mono text-sm ${
                            e.type === 'income' ? 'color-green' : 'color-red'
                          }`}
                        >
                          {e.type === 'income' ? '+' : '-'}₹{e.amount.toLocaleString('en-IN')}
                        </strong>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: APP SETTINGS */}
          {adminSection === 'app' && (
            <div className="admin-card-box">
              <h2 className="text-lg font-bold text-slate-900 mb-4">App Information</h2>
              <input
                placeholder="App name"
                value={adminData.appName}
                onChange={(e) => setAdminData({ ...adminData, appName: e.target.value })}
                className="dmj-input"
              />
              <input
                placeholder="Short description"
                value={adminData.description}
                onChange={(e) => setAdminData({ ...adminData, description: e.target.value })}
                className="dmj-input"
              />
              <input
                placeholder="Logo URL"
                value={adminData.logo}
                onChange={(e) => setAdminData({ ...adminData, logo: e.target.value })}
                className="dmj-input"
              />
              <button
                onClick={() => {
                  updateAppSettings({
                    appName: adminData.appName,
                    description: adminData.description,
                  });
                  showToast('App settings saved.');
                }}
                className="dmj-primary-btn"
              >
                SAVE APP SETTINGS
              </button>
            </div>
          )}

          {/* TAB 3: APP INSTALL & PWA CONFIG */}
          {adminSection === 'apk' && (
            <div className="admin-card-box">
              <h2 className="text-lg font-bold text-slate-900 mb-1">Mobile Web App (PWA) Installation</h2>
              <p className="text-xs text-slate-500 mb-4">
                Users can download this web app straight to their mobile phone using Chrome, Safari, or any browser.
              </p>

              <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Application Name</label>
              <input
                value={adminData.appName || 'Daily Money Journal'}
                onChange={(e) => setAdminData({ ...adminData, appName: e.target.value })}
                className="dmj-input font-bold"
              />

              <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Version</label>
              <input
                placeholder="Version e.g. 2.4.0"
                value={adminData.version}
                onChange={(e) => setAdminData({ ...adminData, version: e.target.value })}
                className="dmj-input"
              />

              <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Total Installs / Downloads</label>
              <input
                value={adminData.downloads || 0}
                readOnly
                className="dmj-input font-mono bg-slate-50"
              />

              <div className="grid gap-2.5 mt-4">
                <button
                  onClick={handleDownloadApp}
                  className="dmj-primary-btn"
                >
                  <Smartphone className="w-4 h-4 mr-2 inline" />
                  TEST DOWNLOAD / INSTALL ON THIS DEVICE
                </button>
              </div>

              <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Mobile Browser Compatibility:
                </div>
                <div>• <strong>Google Chrome (Android):</strong> 1-click native install prompt & home screen launcher.</div>
                <div>• <strong>Safari (iOS / iPhone):</strong> Share &gt; "Add to Home Screen" standalone app.</div>
                <div>• <strong>Samsung Internet / Edge:</strong> Instant home screen shortcut support.</div>
              </div>
            </div>
          )}

          {/* TAB 4: USERS */}
          {adminSection === 'users' && (
            <div className="admin-card-box">
              <h2 className="text-lg font-bold text-slate-900 mb-3">Users</h2>
              <div className="admin-list-box">
                {user || localStorage.getItem('dmj_user') ? (
                  <div className="admin-row-item">
                    <div>
                      <strong className="text-slate-800 text-sm">
                        {user?.email || JSON.parse(localStorage.getItem('dmj_user') || '{}').email || 'Registered User'}
                      </strong>
                      <div className="text-xs text-slate-400">UID: {effectiveUserId.slice(0, 16)}...</div>
                    </div>
                    <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-1 rounded-lg">
                      Active
                    </span>
                  </div>
                ) : (
                  <div className="empty-state">No users logged in currently.</div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: WEBSITE */}
          {adminSection === 'website' && (
            <div className="admin-card-box">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Website Settings</h2>
              <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Hero Title</label>
              <input
                placeholder="Homepage title"
                value={adminData.heroTitle}
                onChange={(e) => setAdminData({ ...adminData, heroTitle: e.target.value })}
                className="dmj-input"
              />

              <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Support Email</label>
              <input
                placeholder="Support email"
                value={adminData.support}
                onChange={(e) => setAdminData({ ...adminData, support: e.target.value })}
                className="dmj-input"
              />

              <button
                onClick={() => {
                  updateWebsiteSettings({
                    supportEmail: adminData.support,
                    heroTitle: adminData.heroTitle,
                  });
                  showToast('Website settings saved.');
                }}
                className="dmj-primary-btn"
              >
                SAVE WEBSITE SETTINGS
              </button>
            </div>
          )}

          {/* TAB 6: SETTINGS */}
          {adminSection === 'settings' && (
            <div className="admin-card-box">
              <h2 className="text-lg font-bold text-slate-900 mb-2">Admin Settings</h2>
              <p className="text-slate-500 text-xs leading-relaxed mb-4">
                In this deployment, database operations are backed up by Firebase Firestore and synchronized across devices.
              </p>
              <button
                onClick={() => {
                  if (window.confirm('Clear all local demo data?')) {
                    localStorage.clear();
                    setEntries([]);
                    setPendingList([]);
                    setNotesText('');
                    window.location.reload();
                  }
                }}
                className="dmj-btn bg-rose-100 hover:bg-rose-200 text-rose-700 w-full"
              >
                CLEAR LOCAL DEMO DATA
              </button>
            </div>
          )}
        </section>
      )}

      {/* Install Guide Modal (Shown only when manual browser step is needed) */}
      <InstallGuideModal
        isOpen={showInstallGuide}
        onClose={() => setShowInstallGuide(false)}
        appName={adminData.appName || 'Daily Money Journal'}
        platform={guidePlatform}
      />
    </div>
  );
};
