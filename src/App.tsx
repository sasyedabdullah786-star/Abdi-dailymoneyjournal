/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { OfflineIndicator } from './components/common/OfflineIndicator';
import { JournalPage } from './pages/JournalPage';
import { ReleasesPage } from './pages/ReleasesPage';
import { SupportPage } from './pages/SupportPage';
import { LoginPage } from './pages/auth/LoginPage';
import { SignupPage } from './pages/auth/SignupPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { ProfilePage } from './pages/auth/ProfilePage';
import { AdminPanel } from './pages/admin/AdminPanel';
import {
  AppSettings,
  WebsiteSettings,
  Release,
} from './types';
import {
  getAppSettings,
  getWebsiteSettings,
  DEFAULT_APP_SETTINGS,
  DEFAULT_WEBSITE_SETTINGS,
} from './services/appSettingsService';
import { getReleases, DEFAULT_RELEASES } from './services/releaseService';

export default function App() {
  // Default to journal/home
  const [currentView, setCurrentView] = useState<string>('home');
  const [appSettings, setAppSettings] = useState<AppSettings>(DEFAULT_APP_SETTINGS);
  const [websiteSettings, setWebsiteSettings] = useState<WebsiteSettings>(DEFAULT_WEBSITE_SETTINGS);
  const [releases, setReleases] = useState<Release[]>(DEFAULT_RELEASES);
  const [loading, setLoading] = useState(true);

  // Sync route with URL pathname or hash
  useEffect(() => {
    const handleLocationChange = () => {
      const path =
        window.location.pathname.replace(/^\//, '') ||
        window.location.hash.replace(/^#/, '');
      if (
        [
          'home',
          'journal',
          'releases',
          'support',
          'login',
          'signup',
          'forgot-password',
          'profile',
          'admin',
        ].includes(path)
      ) {
        setCurrentView(path);
      } else {
        setCurrentView('home');
      }
    };

    handleLocationChange();
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  const navigateTo = (view: string) => {
    setCurrentView(view);
    window.history.pushState(null, '', view === 'home' ? '/' : `/${view}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const loadData = async () => {
    try {
      const [appData, siteData, rels] = await Promise.all([
        getAppSettings(),
        getWebsiteSettings(),
        getReleases(),
      ]);
      setAppSettings(appData);
      setWebsiteSettings(siteData);
      setReleases(rels);
    } catch (err) {
      console.warn('Error loading initial app config:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <AuthProvider>
      <div className="min-h-screen bg-[#f3f5f9] text-slate-800">
        <OfflineIndicator />

        {/* Primary View: When home or journal, load the Daily Money Journal directly */}
        {(currentView === 'home' || currentView === 'journal') && (
          <JournalPage
            appSettings={appSettings}
            onOpenAdmin={() => navigateTo('admin')}
          />
        )}

        {/* Secondary Views (Accessible when specifically requested) */}
        {currentView === 'releases' && (
          <div className="max-w-2xl mx-auto p-4">
            <button
              onClick={() => navigateTo('home')}
              className="mb-4 text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              ← Back to Daily Money Journal
            </button>
            <ReleasesPage releases={releases} appName={appSettings.appName} />
          </div>
        )}

        {currentView === 'support' && (
          <div className="max-w-2xl mx-auto p-4">
            <button
              onClick={() => navigateTo('home')}
              className="mb-4 text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              ← Back to Daily Money Journal
            </button>
            <SupportPage />
          </div>
        )}

        {currentView === 'login' && <LoginPage onNavigate={navigateTo} />}

        {currentView === 'signup' && <SignupPage onNavigate={navigateTo} />}

        {currentView === 'forgot-password' && (
          <ForgotPasswordPage onNavigate={navigateTo} />
        )}

        {currentView === 'profile' && <ProfilePage onNavigate={navigateTo} />}

        {currentView === 'admin' && (
          <div className="bg-slate-950 min-h-screen text-slate-100">
            <div className="max-w-6xl mx-auto p-4">
              <button
                onClick={() => navigateTo('home')}
                className="mb-4 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 cursor-pointer"
              >
                ← Return to Daily Money Journal
              </button>
              <AdminPanel
                appSettings={appSettings}
                websiteSettings={websiteSettings}
                onRefreshSettings={loadData}
                onNavigate={navigateTo}
              />
            </div>
          </div>
        )}
      </div>
    </AuthProvider>
  );
}
