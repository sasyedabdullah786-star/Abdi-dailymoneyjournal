import React, { useState, useEffect } from 'react';
import { Smartphone, Download, X, Sparkles } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

export const DirectInstallBanner: React.FC = () => {
  const { isInstalled, isIOS, triggerInstall } = usePWAInstall();
  const [dismissed, setDismissed] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [showManualTip, setShowManualTip] = useState(false);

  useEffect(() => {
    const wasDismissed = sessionStorage.getItem('pwa_banner_dismissed') === 'true';
    if (wasDismissed) {
      setDismissed(true);
    }
  }, []);

  if (isInstalled || dismissed || installed) {
    return null;
  }

  const handleInstall = async () => {
    try {
      const res = await triggerInstall();
      if (res.status === 'installed_native' || res.status === 'already_installed') {
        setInstalled(true);
        return;
      }
      if (res.status === 'manual_guide_needed') {
        setShowManualTip(true);
      }
    } catch {
      setShowManualTip(true);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('pwa_banner_dismissed', 'true');
  };

  return (
    <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white shadow-md border-b border-emerald-500/40 px-3 sm:px-4 py-2.5 transition-all">
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
            <Smartphone className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-xs sm:text-sm tracking-tight">
                Install directly through Chrome
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-emerald-950/40 text-emerald-200">
                <Sparkles className="w-2.5 h-2.5" /> 1-Tap Setup
              </span>
            </div>
            <p className="text-[11px] text-emerald-100/90 truncate hidden sm:block">
              Skip tapping the 3 dots (⋮) — tap install to add straight to your phone's home screen.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleInstall}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-emerald-800 hover:bg-emerald-50 text-xs font-bold shadow-sm transition active:scale-95 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Install Now</span>
          </button>
          <button
            onClick={handleDismiss}
            aria-label="Dismiss banner"
            className="p-1 rounded-lg text-emerald-200 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {showManualTip && (
        <div className="mt-2 pt-2 border-t border-white/20 text-[11px] text-emerald-100 flex items-center justify-between">
          <span>
            {isIOS
              ? 'On iOS Safari: Tap Share (⎋) at the bottom, then select "Add to Home Screen" (+)'
              : 'Tap Chrome menu (⋮ in the top-right) and tap "Install app" or "Add to Home screen"'}
          </span>
          <button
            onClick={() => setShowManualTip(false)}
            className="underline ml-2 hover:text-white text-[10px]"
          >
            Got it
          </button>
        </div>
      )}
    </div>
  );
};
