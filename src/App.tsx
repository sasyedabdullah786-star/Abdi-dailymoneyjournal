/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { OfflineIndicator } from './components/common/OfflineIndicator';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { HomePage } from './pages/HomePage';
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
  // Views: 'journal' (direct money app) | 'home' | 'releases' | 'support' | 'login' | 'signup' | 'admin'
  const [currentView, setCurrentView] = useState<string>('journal');
  const [appSettings, setAppSettings] = useState<AppSettings>(DEFAULT_APP_SETTINGS);
  const [websiteSettings, setWebsiteSettings] = useState<WebsiteSettings>(DEFAULT_WEBSITE_SETTINGS);
  const [releases, setReleases] = useState<Release[]>(DEFAULT_RELEASES);
  const [loading, setLoading] = useState(true);

  // Sync route with URL pathname or hash
  useEffect(() => {
    const handleLocationChange = () => {
      const rawPath =
        window.location.hash.replace(/^#/, '') ||
        window.location.pathname.replace(/^\//, '');

      const normalized = rawPath === 'app' ? 'journal' : rawPath;

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
        ].includes(normalized)
      ) {
        setCurrentView(normalized);
      } else {
        setCurrentView('journal');
      }
    };

    handleLocationChange();
    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  const navigateTo = (view: string) => {
    const target = view === 'app' ? 'journal' : view;
    setCurrentView(target);
    window.location.hash = target === 'home' ? '' : `#${target}`;
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

  const currentRelease =
    releases.find((r) => r.isCurrent) || releases[0] || DEFAULT_RELEASES[0];

  return (
    <AuthProvider>
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-slate-950">
        <OfflineIndicator />

        {/* 1. MARKETING LANDING PAGE: Visitors see this first with APK Download, PWA install, and Open Web App CTA */}
        {currentView === 'home' && (
          <>
            <Navbar
              currentView={currentView}
              onNavigate={navigateTo}
              appName={appSettings.appName}
              version={appSettings.currentVersion}
            />
            <main className="flex-1">
              <HomePage
                appSettings={appSettings}
                websiteSettings={websiteSettings}
                currentRelease={currentRelease}
                onNavigate={navigateTo}
              />
            </main>
            <Footer
              onNavigate={navigateTo}
              appName={appSettings.appName}
              version={appSettings.currentVersion}
            />
          </>
        )}

        {/* 2. THE WEB JOURNAL APPLICATION: High-performance cloud ledger with bi-directional Firestore sync & receipt attachments */}
        {currentView === 'journal' && (
          <main className="flex-1 bg-[#f3f5f9] text-[#111827]">
            <JournalPage
              appSettings={appSettings}
              onOpenAdmin={() => navigateTo('admin')}
              onNavigateHome={() => navigateTo('home')}
            />
          </main>
        )}

        {/* 3. RELEASES & CHANGELOGS */}
        {currentView === 'releases' && (
          <>
            <Navbar
              currentView={currentView}
              onNavigate={navigateTo}
              appName={appSettings.appName}
              version={appSettings.currentVersion}
            />
            <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">
              <ReleasesPage releases={releases} appName={appSettings.appName} />
            </main>
            <Footer
              onNavigate={navigateTo}
              appName={appSettings.appName}
              version={appSettings.currentVersion}
            />
          </>
        )}

        {/* 4. SUPPORT & APK INSTALLATION HELP */}
        {currentView === 'support' && (
          <>
            <Navbar
              currentView={currentView}
              onNavigate={navigateTo}
              appName={appSettings.appName}
              version={appSettings.currentVersion}
            />
            <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">
              <SupportPage />
            </main>
            <Footer
              onNavigate={navigateTo}
              appName={appSettings.appName}
              version={appSettings.currentVersion}
            />
          </>
        )}

        {/* 5. AUTHENTICATION PAGES */}
        {currentView === 'login' && (
          <>
            <Navbar
              currentView={currentView}
              onNavigate={navigateTo}
              appName={appSettings.appName}
              version={appSettings.currentVersion}
            />
            <main className="flex-1 flex items-center justify-center p-4">
              <LoginPage onNavigate={navigateTo} />
            </main>
            <Footer
              onNavigate={navigateTo}
              appName={appSettings.appName}
              version={appSettings.currentVersion}
            />
          </>
        )}

        {currentView === 'signup' && (
          <>
            <Navbar
              currentView={currentView}
              onNavigate={navigateTo}
              appName={appSettings.appName}
              version={appSettings.currentVersion}
            />
            <main className="flex-1 flex items-center justify-center p-4">
              <SignupPage onNavigate={navigateTo} />
            </main>
            <Footer
              onNavigate={navigateTo}
              appName={appSettings.appName}
              version={appSettings.currentVersion}
            />
          </>
        )}

        {currentView === 'forgot-password' && (
          <>
            <Navbar
              currentView={currentView}
              onNavigate={navigateTo}
              appName={appSettings.appName}
              version={appSettings.currentVersion}
            />
            <main className="flex-1 flex items-center justify-center p-4">
              <ForgotPasswordPage onNavigate={navigateTo} />
            </main>
            <Footer
              onNavigate={navigateTo}
              appName={appSettings.appName}
              version={appSettings.currentVersion}
            />
          </>
        )}

        {currentView === 'profile' && (
          <>
            <Navbar
              currentView={currentView}
              onNavigate={navigateTo}
              appName={appSettings.appName}
              version={appSettings.currentVersion}
            />
            <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8">
              <ProfilePage onNavigate={navigateTo} />
            </main>
            <Footer
              onNavigate={navigateTo}
              appName={appSettings.appName}
              version={appSettings.currentVersion}
            />
          </>
        )}

        {/* 6. RESTRICTED ADMIN PORTAL: Discreetly accessible via footer or #admin */}
        {currentView === 'admin' && (
          <div className="bg-slate-950 min-h-screen text-slate-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <div className="flex items-center justify-between pb-6 mb-6 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold">
                    ⚙
                  </div>
                  <div>
                    <h1 className="text-lg font-bold text-white">Administrator Management Portal</h1>
                    <p className="text-xs text-slate-400">Strictly restricted to authorized administrative credentials</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigateTo('journal')}
                    className="px-3 py-1.5 rounded-xl bg-emerald-950 hover:bg-emerald-900 border border-emerald-800/80 text-emerald-300 text-xs font-bold transition cursor-pointer"
                  >
                    Open Web Journal →
                  </button>
                  <button
                    onClick={() => navigateTo('home')}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
                  >
                    Public Website
                  </button>
                </div>
              </div>

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
