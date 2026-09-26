import React, { useState } from 'react';
import { X, Smartphone, Check, Copy, Share2, MoreVertical, PlusSquare } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  appName?: string;
  version?: string;
  platform?: 'android' | 'ios' | 'desktop';
}

export const InstallGuideModal: React.FC<Props> = ({
  isOpen,
  onClose,
  appName = 'Daily Money Journal',
  version,
  platform = 'android',
}) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'chrome' | 'ios' | 'samsung'>(
    platform === 'ios' ? 'ios' : 'chrome'
  );

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-5 sm:p-6 text-slate-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white">Download Web App to Phone</h2>
            <p className="text-xs text-slate-400">Install {appName} directly using your mobile browser</p>
          </div>
        </div>

        {/* Browser Selector Tabs */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-800/80 rounded-xl mb-5 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('chrome')}
            className={`py-2 rounded-lg transition-all ${
              activeTab === 'chrome'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Google Chrome
          </button>
          <button
            onClick={() => setActiveTab('ios')}
            className={`py-2 rounded-lg transition-all ${
              activeTab === 'ios'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            iPhone Safari
          </button>
          <button
            onClick={() => setActiveTab('samsung')}
            className={`py-2 rounded-lg transition-all ${
              activeTab === 'samsung'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Samsung / Other
          </button>
        </div>

        {/* Chrome Tab Instructions */}
        {activeTab === 'chrome' && (
          <div className="space-y-3.5">
            <div className="flex gap-3 p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 items-start">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center flex-shrink-0">
                1
              </div>
              <div className="text-xs leading-relaxed">
                <div className="font-semibold text-white flex items-center gap-1.5 mb-0.5">
                  <MoreVertical className="w-3.5 h-3.5 text-emerald-400" />
                  Tap the 3 dots menu (⋮)
                </div>
                In the top-right corner of Google Chrome on your phone, tap the three vertical dots.
              </div>
            </div>

            <div className="flex gap-3 p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 items-start">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center flex-shrink-0">
                2
              </div>
              <div className="text-xs leading-relaxed">
                <div className="font-semibold text-white flex items-center gap-1.5 mb-0.5">
                  <PlusSquare className="w-3.5 h-3.5 text-emerald-400" />
                  Select "Install app" or "Add to Home screen"
                </div>
                Tap <strong>Install app</strong> (or <strong>Add to Home screen</strong>) in the Chrome menu.
              </div>
            </div>

            <div className="flex gap-3 p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 items-start">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center flex-shrink-0">
                3
              </div>
              <div className="text-xs leading-relaxed">
                <div className="font-semibold text-white mb-0.5">
                  Tap "Install" to download to phone
                </div>
                Chrome will download and add the full app to your phone launcher. It opens in standalone mode without browser bars!
              </div>
            </div>
          </div>
        )}

        {/* Safari / iOS Tab */}
        {activeTab === 'ios' && (
          <div className="space-y-3.5">
            <div className="flex gap-3 p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 items-start">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center flex-shrink-0">
                1
              </div>
              <div className="text-xs leading-relaxed">
                <div className="font-semibold text-white flex items-center gap-1.5 mb-0.5">
                  <Share2 className="w-3.5 h-3.5 text-emerald-400" />
                  Tap the Share button
                </div>
                In Safari, tap the <strong>Share</strong> icon (the square with an arrow pointing up) at the bottom of your screen.
              </div>
            </div>

            <div className="flex gap-3 p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 items-start">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center flex-shrink-0">
                2
              </div>
              <div className="text-xs leading-relaxed">
                <div className="font-semibold text-white mb-0.5">
                  Tap "Add to Home Screen"
                </div>
                Scroll down through the share options and tap <strong>Add to Home Screen</strong>.
              </div>
            </div>

            <div className="flex gap-3 p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 items-start">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center flex-shrink-0">
                3
              </div>
              <div className="text-xs leading-relaxed">
                <div className="font-semibold text-white mb-0.5">
                  Tap "Add"
                </div>
                Tap <strong>Add</strong> in the top-right corner. {appName} is now installed on your iPhone!
              </div>
            </div>
          </div>
        )}

        {/* Samsung / Other Browser Tab */}
        {activeTab === 'samsung' && (
          <div className="space-y-3.5">
            <div className="flex gap-3 p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 items-start">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center flex-shrink-0">
                1
              </div>
              <div className="text-xs leading-relaxed">
                <div className="font-semibold text-white mb-0.5">
                  Open Browser Menu
                </div>
                Tap the menu icon (usually ☰ or ⋮) at the bottom or top of your browser.
              </div>
            </div>

            <div className="flex gap-3 p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 items-start">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center flex-shrink-0">
                2
              </div>
              <div className="text-xs leading-relaxed">
                <div className="font-semibold text-white mb-0.5">
                  Add Page to Home Screen
                </div>
                Select <strong>Add page to</strong> &gt; <strong>Home screen</strong> or tap <strong>Install</strong>.
              </div>
            </div>
          </div>
        )}

        {/* Bottom Actions */}
        <div className="mt-5 pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            onClick={handleCopyLink}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Link Copied to Clipboard!' : 'Copy Web App Link'}
          </button>

          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
