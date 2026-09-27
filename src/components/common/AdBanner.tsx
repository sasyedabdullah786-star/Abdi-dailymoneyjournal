import React, { useEffect, useState } from 'react';
import { ExternalLink, Sparkles, X } from 'lucide-react';
import { getAdSettings } from '../../services/adService';
import { AdSettings } from '../../types';

interface AdBannerProps {
  placement: 'journal' | 'download';
  className?: string;
}

export const AdBanner: React.FC<AdBannerProps> = ({ placement, className = '' }) => {
  const [adSettings, setAdSettings] = useState<AdSettings | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    getAdSettings().then(setAdSettings);
  }, []);

  if (dismissed || !adSettings || !adSettings.enabled) {
    return null;
  }

  if (placement === 'journal' && !adSettings.showOnJournal) {
    return null;
  }

  if (placement === 'download' && !adSettings.showOnDownload) {
    return null;
  }

  // Google AdSense render mode
  if (adSettings.adNetwork === 'adsense' && adSettings.adsensePublisherId) {
    return (
      <div className={`w-full overflow-hidden rounded-2xl bg-slate-900/60 border border-slate-800 p-3 my-4 relative ${className}`}>
        <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2">
          <span className="flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-400" />
            Advertisement
          </span>
          <button
            onClick={() => setDismissed(true)}
            className="hover:text-slate-300 transition-colors p-1"
            title="Hide"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
        {/* AdSense Container */}
        <ins
          className="adsbygoogle"
          style={{ display: 'block' }}
          data-ad-client={adSettings.adsensePublisherId}
          data-ad-slot={adSettings.adsenseSlotId || ''}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      </div>
    );
  }

  // Custom / Sponsor / Affiliate Banner mode
  const { customBanner } = adSettings;
  if (!customBanner || !customBanner.title) {
    return null;
  }

  return (
    <div className={`w-full rounded-2xl bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800/80 p-4 my-4 relative shadow-lg overflow-hidden group hover:border-slate-700 transition-all ${className}`}>
      {/* Background Glow */}
      <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-emerald-500/10 transition-colors" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
        <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0 text-emerald-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">
                {customBanner.badgeText || 'SPONSORED'}
              </span>
              <h4 className="text-sm font-bold text-white truncate">
                {customBanner.title}
              </h4>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
              {customBanner.description}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
          <a
            href={customBanner.targetUrl && customBanner.targetUrl !== '#' ? customBanner.targetUrl : 'https://google.com'}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 active:scale-95 shadow-md shadow-emerald-950/40 transition-all"
          >
            <span>{customBanner.ctaText || 'Learn More'}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <button
            onClick={() => setDismissed(true)}
            className="text-slate-500 hover:text-slate-300 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
            title="Dismiss ad"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
