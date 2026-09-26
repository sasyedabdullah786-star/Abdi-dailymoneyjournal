import React, { useState } from 'react';
import {
  Download,
  Smartphone,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Clock,
  ArrowRight,
  Sparkles,
  Lock,
  Calendar,
  AlertTriangle,
  FileCheck,
  ExternalLink,
  RefreshCw,
  PlusCircle,
  HelpCircle,
} from 'lucide-react';
import { AppSettings, WebsiteSettings, Release } from '../types';
import { ApkDownloadButton } from '../components/download/ApkDownloadButton';
import { InstallGuideModal } from '../components/download/InstallGuideModal';
import { PWAInstallButton } from '../components/common/PWAInstallButton';

interface Props {
  appSettings: AppSettings;
  websiteSettings: WebsiteSettings;
  currentRelease: Release;
  onNavigate: (view: string) => void;
}

export const HomePage: React.FC<Props> = ({
  appSettings,
  websiteSettings,
  currentRelease,
  onNavigate,
}) => {
  const [guideOpen, setGuideOpen] = useState(false);

  return (
    <div className="space-y-16 sm:space-y-24 pb-16">
      <InstallGuideModal
        isOpen={guideOpen}
        onClose={() => setGuideOpen(false)}
        appName={appSettings.appName}
        version={appSettings.currentVersion}
      />

      {/* Announcement Banner */}
      {websiteSettings.announcementActive && websiteSettings.announcementText && (
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-950 border-b border-emerald-800/40 py-2.5 px-4 text-center">
          <div className="max-w-7xl mx-auto flex items-center justify-center gap-2.5 text-xs text-emerald-200">
            {websiteSettings.announcementBadge && (
              <span className="font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-500 text-slate-950 text-[10px] tracking-wide">
                {websiteSettings.announcementBadge}
              </span>
            )}
            <span className="font-medium">{websiteSettings.announcementText}</span>
            <button
              onClick={() => onNavigate('releases')}
              className="hidden sm:inline-flex items-center gap-1 font-bold underline hover:text-white ml-2 text-xs"
            >
              See Changelog →
            </button>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative px-4 sm:px-6 lg:px-8 pt-8 sm:pt-14 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left Column: Value Proposition & Download Action */}
          <div className="lg:col-span-7 space-y-6">
            {/* Version Badge & Status */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-700/80 text-xs font-semibold text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Official Android Release</span>
              <span className="text-slate-500">•</span>
              <span className="text-emerald-400 font-bold">v{appSettings.currentVersion}</span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-400">{appSettings.releaseDate}</span>
            </div>

            {/* Headline */}
            <div className="space-y-3">
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.12]">
                {websiteSettings.heroTitle || 'Master Your Daily Money with Absolute Privacy.'}
              </h1>
              <p className="text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed">
                {appSettings.appTagline ||
                  'Simple, fast, and 100% private daily personal cashflow ledger for Android. Zero ads, instant offline transactions, pending money tracker, and optional private cloud sync.'}
              </p>
            </div>

            {/* Primary Action Button: Large Obvious APK Download CTA */}
            <div className="pt-2">
              <ApkDownloadButton
                apkUrl={appSettings.apkUrl}
                version={appSettings.currentVersion}
                apkSize={appSettings.apkSize}
                releaseId={currentRelease.id}
                onGuideRequest={() => setGuideOpen(true)}
              />
            </div>

            {/* Secondary CTA options: Launch Web App & PWA */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={() => onNavigate('journal')}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold text-xs border border-slate-700 hover:border-slate-600 transition shadow-sm cursor-pointer"
              >
                <span>Launch Web Application (Live Demo)</span>
                <ArrowRight className="w-4 h-4 text-emerald-400" />
              </button>

              <button
                onClick={() => setGuideOpen(true)}
                className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
              >
                <HelpCircle className="w-4 h-4 text-slate-400" />
                <span>APK Installation Help</span>
              </button>
            </div>

            {/* Quick Spec Strip */}
            <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-800/80 max-w-lg text-xs">
              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-slate-400 block text-[11px]">File Size</span>
                <span className="text-white font-bold">{appSettings.apkSize}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Compatibility</span>
                <span className="text-white font-bold truncate">Android 8.0+</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-slate-400 block text-[11px]">License</span>
                <span className="text-emerald-400 font-bold">Free • Zero Ads</span>
              </div>
            </div>
          </div>

          {/* Right Column: High-Fidelity Phone Showcase with Live Interactive Mockup */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-full max-w-[340px] sm:max-w-[370px]">
              {/* Outer Phone Mockup Frame */}
              <div className="relative rounded-[40px] border-4 border-slate-700 bg-slate-900 shadow-2xl shadow-emerald-500/10 p-3 overflow-hidden">
                {/* Speaker pill notch */}
                <div className="mx-auto w-24 h-4 bg-slate-800 rounded-full mb-3 flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-slate-700/80" />
                </div>

                {/* Simulated App Screen */}
                <div className="bg-slate-950 rounded-[30px] p-4 text-slate-100 border border-slate-800 space-y-3 font-sans">
                  {/* Mock Header */}
                  <div className="flex items-center justify-between pb-1 border-b border-slate-800/60">
                    <div>
                      <h2 className="text-sm font-extrabold text-white">Daily Money Journal</h2>
                      <p className="text-[10px] text-slate-400">Today • Thursday, 24 Sep</p>
                    </div>
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold">
                      ₹
                    </div>
                  </div>

                  {/* Mock Balance Card */}
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700/60 text-white shadow-inner">
                    <span className="text-[10px] tracking-wider uppercase text-slate-400 font-bold">
                      CURRENT BALANCE
                    </span>
                    <div className="text-2xl font-black text-white mt-0.5">₹14,250</div>
                  </div>

                  {/* Mock Received & Spent grid */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Money In</span>
                      <span className="text-xs font-bold text-emerald-400">+₹18,500</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Money Out</span>
                      <span className="text-xs font-bold text-rose-400">-₹4,250</span>
                    </div>
                  </div>

                  {/* Mock Quick Entry */}
                  <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                    <span className="text-[10px] font-bold text-slate-400 block mb-1.5">
                      ⚡ Quick Entry Presets
                    </span>
                    <div className="grid grid-cols-4 gap-1 text-[11px] font-bold">
                      <span className="p-1.5 text-center bg-slate-800 text-blue-300 rounded-md">₹50</span>
                      <span className="p-1.5 text-center bg-slate-800 text-blue-300 rounded-md">₹100</span>
                      <span className="p-1.5 text-center bg-slate-800 text-blue-300 rounded-md">₹200</span>
                      <span className="p-1.5 text-center bg-slate-800 text-blue-300 rounded-md">₹500</span>
                    </div>
                  </div>

                  {/* Mock Recent Transaction */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                      Recent Ledger
                    </span>
                    <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800/80 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-semibold text-slate-200 text-[11px]">Client Payment</div>
                        <div className="text-[9px] text-slate-500">Business • 10:15 AM</div>
                      </div>
                      <span className="text-emerald-400 font-bold text-xs">+₹12,000</span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800/80 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-semibold text-slate-200 text-[11px]">Groceries & Milk</div>
                        <div className="text-[9px] text-slate-500">Home • 08:30 AM</div>
                      </div>
                      <span className="text-rose-400 font-bold text-xs">-₹750</span>
                    </div>
                  </div>

                  {/* Interactive Button to launch actual Web App */}
                  <button
                    onClick={() => onNavigate('journal')}
                    className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl font-bold text-xs text-center transition flex items-center justify-center gap-1.5"
                  >
                    <span>Try Interactive Web App</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PWA Universal Install Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <PWAInstallButton variant="banner" />
      </section>

      {/* Core Features & Highlights Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
            Built for Real Everyday Finances
          </h2>
          <p className="text-2xl sm:text-3xl font-extrabold text-white">
            Everything You Need to Track Cashflow Without Noise
          </p>
          <p className="text-sm text-slate-400">
            Most finance apps are bloated with ads, banking integrations that break, and intrusive popups. Daily Money Journal keeps your focus strictly on what matters: money coming in and money going out.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Feature 1 */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              ⚡
            </div>
            <h3 className="text-base font-bold text-white">Quick Cash Entry</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Log transactions in under 3 seconds. Use quick amount buttons (₹50, ₹100, ₹200, ₹500) and one-tap Income / Expense switching.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
              ⏳
            </div>
            <h3 className="text-base font-bold text-white">Pending Money Ledger</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Never forget who owes you money or who you need to pay. Mark them as received or paid in one tap, and it automatically enters your daily journal.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              📚
            </div>
            <h3 className="text-base font-bold text-white">Daily History Archive</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Inspect historical records date-by-date. View closing balances, income breakdowns, and expense items categorized automatically.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
              📝
            </div>
            <h3 className="text-base font-bold text-white">Smart Financial Notes</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Dedicated scratchpad for upcoming bills, commitments, home budget estimates, and future payments. Autosaved with instant access.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all space-y-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center font-bold">
              🔒
            </div>
            <h3 className="text-base font-bold text-white">100% Offline & Private</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              No mandatory bank logins, no SMS scrapers, and no intrusive telemetry. Works on flights, rural areas, or without internet.
            </p>
          </div>

          {/* Feature 6 */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all space-y-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center font-bold">
              🐎
            </div>
            <h3 className="text-base font-bold text-white">Mustang Goals Vault</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Special section to plan long-term savings goals, emergency fund milestones, and special investments with visual progress meters.
            </p>
          </div>
        </div>
      </section>

      {/* Step-by-Step Android APK Installation Guide */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 space-y-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Direct 1-Click Installation
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white mt-1">
                Install directly through Chrome without manual steps
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800/80 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 font-extrabold text-xs flex items-center justify-center">
                1
              </div>
              <h4 className="text-sm font-bold text-white">Tap Install App</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Click the green Install button on your phone or computer.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800/80 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 font-extrabold text-xs flex items-center justify-center">
                2
              </div>
              <h4 className="text-sm font-bold text-white">Automatic Chrome Prompt</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Chrome automatically pops up the native Android install prompt without opening the 3-dots menu.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800/80 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 font-extrabold text-xs flex items-center justify-center">
                3
              </div>
              <h4 className="text-sm font-bold text-white">Tap "Install"</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Confirm by tapping Install in Chrome's sheet. Zero security warnings or unknown APK risks!
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800/80 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 font-extrabold text-xs flex items-center justify-center">
                4
              </div>
              <h4 className="text-sm font-bold text-white">Instant Home Screen App</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                The app icon appears directly on your phone launcher. Opens standalone in full-screen with offline support.
            </div>
          </div>
        </div>
      </section>

      {/* Latest Changelog & Releases Preview */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-4 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              Release Notes
            </span>
            <h2 className="text-2xl font-extrabold text-white">
              What's New in Version {currentRelease.version}
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Every build is compiled with strict quality checks, security hashing, and backwards compatibility for older Android versions.
            </p>
            <div className="pt-2">
              <button
                onClick={() => onNavigate('releases')}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-300"
              >
                <span>Browse Full Version Archive</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="lg:col-span-8 p-6 sm:p-7 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-sm font-bold text-white">Build {currentRelease.versionCode}</span>
                <span className="text-xs text-slate-400 ml-2">Released on {currentRelease.releaseDate}</span>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold">
                Current Stable
              </span>
            </div>

            <ul className="space-y-2.5 text-xs text-slate-300">
              {(currentRelease.changelog || currentRelease.whatsNew || []).map((item: string, idx: number) => (
                <li key={idx} className="flex items-start gap-2.5 leading-relaxed">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            {currentRelease.sha256 && (
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                <span className="font-mono">SHA256: {currentRelease.sha256.slice(0, 24)}...</span>
                <span className="text-slate-400">Verified Binary</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Bottom CTA Card */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-900 border border-emerald-500/30 p-8 sm:p-12 overflow-hidden shadow-2xl text-center space-y-6">
          <div className="max-w-2xl mx-auto space-y-3">
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
              Get Daily Money Journal on Your Phone Now
            </h2>
            <p className="text-sm text-slate-300">
              No registration required to use the Android app. Download the APK directly and gain control over your everyday cashflow today.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <ApkDownloadButton
              apkUrl={appSettings.apkUrl}
              version={appSettings.currentVersion}
              apkSize={appSettings.apkSize}
              releaseId={currentRelease.id}
              size="normal"
              onGuideRequest={() => setGuideOpen(true)}
            />

            <button
              onClick={() => onNavigate('journal')}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition"
            >
              <span>Open in Browser</span>
              <ArrowRight className="w-4 h-4 text-emerald-400" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
