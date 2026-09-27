import React, { useState } from 'react';
import {
  Smartphone,
  ArrowRight,
  ShieldCheck,
  Zap,
  Camera,
  CheckCircle2,
  ExternalLink,
  HelpCircle,
  X,
  Sparkles,
} from 'lucide-react';
import { AppSettings, WebsiteSettings, Release } from '../types';
import { usePWAInstall } from '../hooks/usePWAInstall';

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
  const { isInstalled, isIOS, isInIframe, triggerInstall } = usePWAInstall();
  const [installStatus, setInstallStatus] = useState<'idle' | 'installed' | 'prompting' | 'guide'>('idle');
  const [showIframeModal, setShowIframeModal] = useState(false);

  const handleInstallClick = async () => {
    // If inside an iframe (like AI Studio preview), Chrome disables beforeinstallprompt.
    if (isInIframe) {
      setShowIframeModal(true);
      return;
    }

    setInstallStatus('prompting');
    try {
      const res = await triggerInstall();
      if (res.status === 'installed_native' || res.status === 'already_installed') {
        setInstallStatus('installed');
        setTimeout(() => {
          onNavigate('journal');
        }, 1500);
        return;
      }
      if (res.status === 'iframe_blocked') {
        setShowIframeModal(true);
        setInstallStatus('idle');
        return;
      }
      if (res.status === 'manual_guide_needed') {
        setInstallStatus('guide');
        return;
      }
      setInstallStatus('idle');
    } catch (err) {
      console.warn('Install error:', err);
      setInstallStatus('guide');
    }
  };

  const openInNewTab = () => {
    window.open(window.location.href, '_blank');
    setShowIframeModal(false);
  };

  return (
    <div className="min-h-[85vh] flex flex-col justify-center items-center px-4 py-8 sm:py-16 max-w-xl mx-auto text-center">
      {/* Iframe Notice Modal */}
      {showIframeModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-emerald-500/40 rounded-2xl p-6 max-w-md w-full text-left shadow-2xl relative">
            <button
              onClick={() => setShowIframeModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Direct Chrome Installation</h3>
                <p className="text-xs text-slate-400">Open in a standard browser tab to install</p>
              </div>
            </div>
            <p className="text-sm text-slate-300 mb-5 leading-relaxed">
              Google Chrome requires a real browser tab to trigger the native 1-tap install sheet. Tap the button below to open in Chrome and install instantly:
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={openInNewTab}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 transition active:scale-95 cursor-pointer"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Open in Chrome &amp; Install</span>
              </button>
              <button
                onClick={() => {
                  setShowIframeModal(false);
                  onNavigate('journal');
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition cursor-pointer text-center"
              >
                Continue in Browser Instead
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Chrome Install Guide Modal */}
      {installStatus === 'guide' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full text-left shadow-2xl relative">
            <button
              onClick={() => setInstallStatus('idle')}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">How to Install in Chrome</h3>
                <p className="text-xs text-slate-400">2 quick taps directly in your browser</p>
              </div>
            </div>
            
            <div className="space-y-3 mb-5 text-xs text-slate-300">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/80 border border-slate-700">
                <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0">1</span>
                <div>
                  <strong className="text-white block text-sm">Tap the 3 dots (⋮)</strong>
                  <span className="text-slate-400">Located in the top-right corner of Google Chrome.</span>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/80 border border-slate-700">
                <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0">2</span>
                <div>
                  <strong className="text-white block text-sm">Tap &quot;Install app&quot; or &quot;Add to Home screen&quot;</strong>
                  <span className="text-slate-400">The app will appear instantly on your phone like any store app!</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setInstallStatus('idle');
                onNavigate('journal');
              }}
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition cursor-pointer"
            >
              Open Web App Now →
            </button>
          </div>
        </div>
      )}

      {/* App Branding & Icon */}
      <div className="relative mb-6">
        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-slate-900 border-2 border-slate-700 p-3 flex items-center justify-center shadow-2xl shadow-emerald-500/10">
          <img
            src="/logo.png"
            alt="Daily Money Journal"
            className="w-full h-full object-contain"
          />
        </div>
        <div className="absolute -bottom-2 -right-2 px-2.5 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-black text-[10px] uppercase tracking-wider shadow-md">
          v{appSettings.currentVersion || '2.4.0'}
        </div>
      </div>

      {/* App Title & Pitch */}
      <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight mb-2">
        {appSettings.appName || 'Daily Money Journal'}
      </h1>
      <p className="text-sm sm:text-base text-slate-400 max-w-md mx-auto leading-relaxed mb-8">
        Track your daily money in, money out, and pending payments with zero ads and complete privacy.
      </p>

      {/* THE TWO MAIN BUTTONS: Install App OR Continue to App */}
      <div className="w-full max-w-sm space-y-3.5 mb-10">
        {/* OPTION 1: Install App Directly (Orders Chrome to show native install option) */}
        <button
          onClick={handleInstallClick}
          disabled={installStatus === 'prompting'}
          className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-base shadow-xl shadow-emerald-950/50 hover:shadow-emerald-900/60 active:scale-[0.98] transition-all flex items-center justify-center gap-3 cursor-pointer group border border-emerald-400/30"
        >
          {installStatus === 'installed' ? (
            <>
              <CheckCircle2 className="w-5 h-5 text-white animate-bounce" />
              <span>Installed! Launching...</span>
            </>
          ) : (
            <>
              <Smartphone className="w-5 h-5 text-emerald-200 group-hover:scale-110 transition-transform" />
              <div className="text-left">
                <div className="leading-tight">Install App</div>
                <div className="text-[11px] font-normal text-emerald-100/90 leading-tight">
                  Add to Phone with 1-Tap
                </div>
              </div>
            </>
          )}
        </button>

        {/* OPTION 2: Continue to App Online without installing */}
        <button
          onClick={() => onNavigate('journal')}
          className="w-full py-4 px-6 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-100 font-bold text-base border border-slate-700/80 hover:border-slate-600 active:scale-[0.98] transition-all flex items-center justify-center gap-3 cursor-pointer group shadow-md"
        >
          <div className="text-left flex-1">
            <div className="leading-tight text-white group-hover:text-emerald-300 transition-colors">
              Continue to App
            </div>
            <div className="text-[11px] font-normal text-slate-400 leading-tight">
              Use online in browser without installing
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-white group-hover:translate-x-1 transition-all" />
        </button>
      </div>

      {/* 3 Core Highlights (Clean & Simple) */}
      <div className="grid grid-cols-3 gap-2.5 w-full max-w-md text-center text-xs">
        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1">
          <Zap className="w-4 h-4 text-amber-400 mx-auto" />
          <div className="font-bold text-slate-200 text-[11px]">100% Offline</div>
          <div className="text-[10px] text-slate-500">Works without net</div>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1">
          <ShieldCheck className="w-4 h-4 text-emerald-400 mx-auto" />
          <div className="font-bold text-slate-200 text-[11px]">Private Cloud</div>
          <div className="text-[10px] text-slate-500">Encrypted backup</div>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1">
          <Camera className="w-4 h-4 text-blue-400 mx-auto" />
          <div className="font-bold text-slate-200 text-[11px]">Bill Photos</div>
          <div className="text-[10px] text-slate-500">Attach receipts</div>
        </div>
      </div>

      {/* Help Link & Discreet Admin */}
      <div className="mt-8 flex items-center justify-center gap-4 text-xs text-slate-500">
        <button
          onClick={() => setInstallStatus('guide')}
          className="hover:text-slate-300 transition-colors cursor-pointer flex items-center gap-1"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Install Help</span>
        </button>
        <span>•</span>
        <button
          onClick={() => onNavigate('admin')}
          className="hover:text-slate-400 text-slate-600 transition-colors cursor-pointer"
        >
          Admin Console
        </button>
      </div>
    </div>
  );
};
