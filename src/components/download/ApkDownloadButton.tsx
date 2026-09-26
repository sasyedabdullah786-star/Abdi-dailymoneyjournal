import React, { useState } from 'react';
import { Download, CheckCircle, ShieldCheck, Loader2, Smartphone } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

interface Props {
  apkUrl?: string;
  version?: string;
  apkSize?: string;
  releaseId?: string;
  className?: string;
  size?: 'normal' | 'large';
  onGuideRequest?: () => void;
}

export const ApkDownloadButton: React.FC<Props> = ({
  apkUrl,
  version,
  apkSize,
  releaseId,
  className = '',
  size = 'large',
}) => {
  const { isInstalled, triggerInstall } = usePWAInstall();
  const [installing, setInstalling] = useState(false);
  const [installedSuccess, setInstalledSuccess] = useState(false);

  const handleClick = async () => {
    setInstalling(true);

    try {
      if (typeof window !== 'undefined') {
        const { logDownload } = await import('../../services/downloadService');
        await logDownload(version || '2.4.0', releaseId);
      }

      const res = await triggerInstall();
      setInstalling(false);

      if (res.status === 'installed_native' || res.status === 'already_installed') {
        setInstalledSuccess(true);
        setTimeout(() => setInstalledSuccess(false), 5000);
      }
    } catch (e) {
      console.warn('Install error:', e);
      setInstalling(false);
    }
  };

  if (size === 'normal') {
    return (
      <div className={`inline-flex flex-col gap-1.5 ${className}`}>
        <button
          onClick={handleClick}
          disabled={installing}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 shadow-md shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-70"
        >
          {installing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
              <span>Opening Chrome...</span>
            </>
          ) : installedSuccess || isInstalled ? (
            <>
              <CheckCircle className="w-4 h-4 text-slate-950" />
              <span>Installed to Phone!</span>
            </>
          ) : (
            <>
              <Smartphone className="w-4 h-4" />
              <span>Install App to Phone</span>
            </>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className={`flex flex-col w-full max-w-md ${className}`}>
      <button
        onClick={handleClick}
        disabled={installing}
        className="group relative flex items-center justify-between w-full p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400 hover:from-emerald-400 hover:to-teal-300 active:scale-[0.99] text-slate-950 font-bold shadow-xl shadow-emerald-500/25 transition-all cursor-pointer overflow-hidden disabled:opacity-80"
      >
        <div className="relative z-10 flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-slate-950 text-emerald-400 flex items-center justify-center shadow-md">
            {installing ? (
              <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
            ) : installedSuccess || isInstalled ? (
              <CheckCircle className="w-6 h-6 text-emerald-400" />
            ) : (
              <Smartphone className="w-6 h-6 group-hover:-translate-y-0.5 transition-transform" />
            )}
          </div>
          <div className="text-left">
            <div className="text-base sm:text-lg font-extrabold tracking-tight text-slate-950">
              {installing
                ? 'Opening Chrome Install...'
                : installedSuccess || isInstalled
                ? 'Installed to Home Screen!'
                : 'Install App to Phone'}
            </div>
            <div className="text-xs font-semibold text-emerald-950/80">
              {installedSuccess || isInstalled
                ? 'Ready to use on your phone launcher'
                : 'Direct 1-tap Chrome install • No manual steps'}
            </div>
          </div>
        </div>

        <div className="relative z-10 hidden sm:flex flex-col items-end text-right">
          <span className="text-[10px] uppercase font-black tracking-wider bg-slate-950/20 px-2.5 py-1 rounded-md text-slate-950">
            Direct Install
          </span>
          <span className="text-[10px] text-emerald-950/70 mt-1">Chrome & Mobile</span>
        </div>
      </button>

      {/* Auxiliary trust strip */}
      <div className="flex items-center justify-between mt-2.5 px-2 text-xs text-slate-400">
        <div className="flex items-center gap-1.5 text-slate-300">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Automatic 1-click install • Full screen native launcher</span>
        </div>
      </div>
    </div>
  );
};
