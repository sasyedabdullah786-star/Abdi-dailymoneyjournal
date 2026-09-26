import React, { useState } from 'react';
import { User, Mail, Shield, Cloud, LogOut, CheckCircle2, ArrowRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getAllLocalHistoryDates, getLocalEntries, getLocalPending } from '../../services/journalService';

interface Props {
  onNavigate: (view: string) => void;
}

export const ProfilePage: React.FC<Props> = ({ onNavigate }) => {
  const { user, userProfile, isAdmin, logout } = useAuth();

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-white">Not Signed In</h2>
        <p className="text-xs text-slate-400">Please log in to manage your account and cloud sync.</p>
        <button
          onClick={() => onNavigate('login')}
          className="px-6 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs"
        >
          Sign In
        </button>
      </div>
    );
  }

  const localHistoryDates = getAllLocalHistoryDates();
  const localPending = getLocalPending();

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-16 space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white">User Account & Sync</h1>
        <p className="text-xs text-slate-400 mt-1">
          Review your account profile, permissions, and cloud backup status.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="md:col-span-2 p-6 sm:p-7 rounded-3xl bg-slate-900 border border-slate-800 space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-extrabold text-xl">
              {user.email ? user.email[0].toUpperCase() : 'U'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  {user.displayName || user.email?.split('@')[0]}
                </h3>
                {isAdmin ? (
                  <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 text-[10px] font-bold">
                    ADMIN
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-medium">
                    STANDARD USER
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">{user.email}</p>
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-slate-800 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-800/60">
              <span className="text-slate-400">User ID</span>
              <span className="font-mono text-slate-300 truncate max-w-[200px]">{user.uid}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800/60">
              <span className="text-slate-400">Account Role</span>
              <span className="font-bold text-white capitalize">{userProfile?.role || 'user'}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-400">Firebase Cloud Sync</span>
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Active
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={() => onNavigate('journal')}
              className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition cursor-pointer"
            >
              Open Daily Money Journal
            </button>
            <button
              onClick={() => {
                logout();
                onNavigate('home');
              }}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-300 font-bold text-xs transition cursor-pointer flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Local Storage Stats */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wide">
            Device Storage Status
          </h4>
          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-400 block text-[11px]">Archived Days</span>
              <span className="text-lg font-bold text-white">{localHistoryDates.length}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-400 block text-[11px]">Pending Items</span>
              <span className="text-lg font-bold text-amber-400">{localPending.length}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-400 block text-[11px]">Sync Security</span>
              <span className="text-xs font-bold text-emerald-400">Encrypted Transport</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
