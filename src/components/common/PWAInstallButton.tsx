import React, { useState } from 'react';
import { Download, Smartphone, CheckCircle2 } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { InstallGuideModal } from '../download/InstallGuideModal';

interface Props {
  className?: string;
  variant?: 'button' | 'banner' | 'compact';
}

export const PWAInstallButton: React.FC<Props> = ({ className = '', variant = 'button' }) => {
  const { isInstalled, isIOS, triggerInstall } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);
  const [guidePlatform, setGuidePlatform] = useState<'android' | 'ios' | 'desktop'>(isIOS ? 'ios' : 'android');
  const [installSuccess, setInstallSuccess] = useState(false);

  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    // 1. If native prompt is available, trigger it
    try {
      const res = await triggerInstall();
      if (res.status === 'installed_native' || res.status === 'already_installed') {
        setInstallSuccess(true);
        setTimeout(() => setInstallSuccess(false), 4000);
        return;
      }
    } catch {
      // Fallback to direct APK download
    }

    // 2. Direct download application to mobile
    const a = document.createElement('a');
    a.href = '/daily-money-journal.apk';
    a.download = 'daily-money-journal.apk';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setInstallSuccess(true);
    setTimeout(() => setInstallSuccess(false), 4000);
  };

  if (installSuccess) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-emerald-400 bg-emerald-950/70 border border-emerald-800 rounded-lg">
        <CheckCircle2 className="w-4 h-4" />
        App Installed!
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <>
        <button
          onClick={handleInstallClick}
          title="Install Web App"
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 hover:text-white border border-slate-700 rounded-lg transition-colors cursor-pointer ${className}`}
        >
          <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
          <span>Install Web App</span>
        </button>
        <InstallGuideModal
          isOpen={showGuide}
          onClose={() => setShowGuide(false)}
          platform={guidePlatform}
        />
      </>
    );
  }

  if (variant === 'banner') {
    return (
      <>
        <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-slate-900 border border-emerald-500/30 rounded-xl shadow-lg shadow-emerald-950/20 ${className}`}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-100">Use Daily Money Journal on your phone</p>
              <p className="text-xs text-slate-400">Install directly from Chrome or any browser with instant offline launching.</p>
            </div>
          </div>
          <button
            onClick={handleInstallClick}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Install to Home Screen
          </button>
        </div>
        <InstallGuideModal
          isOpen={showGuide}
          onClose={() => setShowGuide(false)}
          platform={guidePlatform}
        />
      </>
    );
  }

  return (
    <>
      <button
        onClick={handleInstallClick}
        className={`inline-flex items-center gap-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white px-3.5 py-2 text-xs font-medium border border-slate-700 transition shadow-xs cursor-pointer ${className}`}
      >
        <Smartphone className="w-4 h-4 text-emerald-400" />
        <span>Install Web App</span>
      </button>
      <InstallGuideModal
        isOpen={showGuide}
        onClose={() => setShowGuide(false)}
        platform={guidePlatform}
      />
    </>
  );
};
