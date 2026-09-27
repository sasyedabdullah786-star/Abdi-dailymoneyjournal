import React, { useState } from 'react';
import {
  Download,
  BookOpen,
  History,
  LifeBuoy,
  ShieldAlert,
  User,
  LogOut,
  Menu,
  X,
  Sparkles,
  Smartphone,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { PWAInstallButton } from '../common/PWAInstallButton';

interface Props {
  currentView: string;
  onNavigate: (view: string) => void;
  appName?: string;
  version?: string;
}

export const Navbar: React.FC<Props> = ({
  currentView,
  onNavigate,
  appName = 'Daily Money Journal',
  version = '2.4.0',
}) => {
  const { user, isAdmin, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const handleNav = (view: string) => {
    onNavigate(view);
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/85 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand / Logo */}
        <div
          onClick={() => handleNav('home')}
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700/80 p-1.5 flex items-center justify-center shadow-md group-hover:border-emerald-500/50 transition-colors">
            <img src="/icon.svg" alt="App Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-white group-hover:text-emerald-400 transition-colors">
                {appName}
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/80">
                v{version}
              </span>
            </div>
            <span className="text-[11px] text-slate-400 hidden sm:inline-block">
              Daily Cashflow & Expense Ledger
            </span>
          </div>
        </div>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-1 text-xs font-semibold text-slate-300">
          <button
            onClick={() => handleNav('home')}
            className={`px-3 py-2 rounded-lg transition-colors cursor-pointer ${
              currentView === 'home'
                ? 'bg-slate-800 text-white font-bold'
                : 'hover:bg-slate-900 hover:text-white'
            }`}
          >
            Install App
          </button>
          <button
            onClick={() => handleNav('journal')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors cursor-pointer ${
              currentView === 'journal'
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/50 font-bold'
                : 'hover:bg-slate-900 hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
            <span>Web App (Live)</span>
          </button>
          <button
            onClick={() => handleNav('releases')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors cursor-pointer ${
              currentView === 'releases'
                ? 'bg-slate-800 text-white font-bold'
                : 'hover:bg-slate-900 hover:text-white'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Changelog</span>
          </button>
          <button
            onClick={() => handleNav('support')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors cursor-pointer ${
              currentView === 'support'
                ? 'bg-slate-800 text-white font-bold'
                : 'hover:bg-slate-900 hover:text-white'
            }`}
          >
            <LifeBuoy className="w-3.5 h-3.5" />
            <span>Help & Guide</span>
          </button>

          {/* Admin link if user is administrator */}
          {isAdmin && (
            <button
              onClick={() => handleNav('admin')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors cursor-pointer text-amber-300 ${
                currentView.startsWith('admin')
                  ? 'bg-amber-950/80 border border-amber-800 font-bold'
                  : 'hover:bg-amber-950/40 hover:text-amber-200'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Admin Panel</span>
            </button>
          )}
        </nav>

        {/* Right Action Icons & Auth */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* PWA Install Button */}
          <PWAInstallButton variant="compact" />

          {/* User profile dropdown or Login button */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200 transition-colors cursor-pointer"
              >
                <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                  {user.email ? user.email[0].toUpperCase() : 'U'}
                </div>
                <span className="text-xs font-medium hidden sm:inline max-w-[120px] truncate">
                  {user.displayName || user.email?.split('@')[0]}
                </span>
                {isAdmin && (
                  <span className="hidden sm:inline text-[9px] px-1 bg-amber-900 text-amber-300 font-bold rounded">
                    ADMIN
                  </span>
                )}
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-52 rounded-xl bg-slate-900 border border-slate-800 shadow-xl py-1 text-xs text-slate-200 animate-in fade-in z-50">
                  <div className="px-3 py-2 border-b border-slate-800">
                    <p className="font-semibold text-white truncate">{user.displayName || 'User'}</p>
                    <p className="text-slate-400 text-[11px] truncate">{user.email}</p>
                  </div>
                  <button
                    onClick={() => handleNav('profile')}
                    className="w-full text-left px-3 py-2 hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                  >
                    <User className="w-4 h-4 text-slate-400" />
                    <span>My Profile & Sync</span>
                  </button>
                  <button
                    onClick={() => handleNav('journal')}
                    className="w-full text-left px-3 py-2 hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                  >
                    <BookOpen className="w-4 h-4 text-emerald-400" />
                    <span>Open Money Journal</span>
                  </button>
                  {isAdmin && (
                    <button
                      onClick={() => handleNav('admin')}
                      className="w-full text-left px-3 py-2 hover:bg-slate-800 flex items-center gap-2 text-amber-300 cursor-pointer"
                    >
                      <ShieldAlert className="w-4 h-4" />
                      <span>Admin Management</span>
                    </button>
                  )}
                  <div className="border-t border-slate-800 my-1"></div>
                  <button
                    onClick={() => {
                      logout();
                      setUserDropdownOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-slate-800 text-red-400 flex items-center gap-2 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Log Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleNav('login')}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-900 transition-colors cursor-pointer"
              >
                Log In
              </button>
              <button
                onClick={() => handleNav('signup')}
                className="hidden sm:inline-flex px-3.5 py-1.5 rounded-lg text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 transition-colors shadow-xs cursor-pointer"
              >
                Sign Up
              </button>
            </div>
          )}

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-900"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-950 px-4 pt-3 pb-6 space-y-2 text-sm font-semibold">
          <button
            onClick={() => handleNav('home')}
            className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center gap-2.5 ${
              currentView === 'home' ? 'bg-slate-800 text-white' : 'text-slate-300'
            }`}
          >
            <Smartphone className="w-4 h-4 text-emerald-400" />
            <span>Install App to Mobile</span>
          </button>
          <button
            onClick={() => handleNav('journal')}
            className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center gap-2.5 ${
              currentView === 'journal' ? 'bg-emerald-950 text-emerald-300' : 'text-slate-300'
            }`}
          >
            <BookOpen className="w-4 h-4 text-emerald-400" />
            <span>Launch Daily Money Journal (Live)</span>
          </button>
          <button
            onClick={() => handleNav('releases')}
            className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center gap-2.5 ${
              currentView === 'releases' ? 'bg-slate-800 text-white' : 'text-slate-300'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Version History & Changelogs</span>
          </button>
          <button
            onClick={() => handleNav('support')}
            className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center gap-2.5 ${
              currentView === 'support' ? 'bg-slate-800 text-white' : 'text-slate-300'
            }`}
          >
            <LifeBuoy className="w-4 h-4" />
            <span>Installation Guide & Support</span>
          </button>
          {isAdmin && (
            <button
              onClick={() => handleNav('admin')}
              className="w-full text-left px-3 py-2.5 rounded-lg flex items-center gap-2.5 text-amber-300 bg-amber-950/40 border border-amber-800/60"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Admin Management Dashboard</span>
            </button>
          )}

          {!user && (
            <div className="pt-2 border-t border-slate-800 flex gap-2">
              <button
                onClick={() => handleNav('login')}
                className="flex-1 py-2 text-center rounded-lg border border-slate-700 bg-slate-900 text-xs font-bold text-slate-200"
              >
                Log In
              </button>
              <button
                onClick={() => handleNav('signup')}
                className="flex-1 py-2 text-center rounded-lg bg-emerald-500 text-xs font-bold text-slate-950"
              >
                Sign Up
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
