import React from 'react';
import { ShieldCheck, Smartphone, Terminal, Mail, Heart, Github } from 'lucide-react';

interface Props {
  onNavigate: (view: string) => void;
  appName?: string;
  version?: string;
}

export const Footer: React.FC<Props> = ({
  onNavigate,
  appName = 'Daily Money Journal',
  version = '2.4.0',
}) => {
  return (
    <footer className="border-t border-slate-800/80 bg-slate-950 text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-1 flex items-center justify-center">
                <img src="/icon.svg" alt="App Logo" className="w-full h-full object-contain" />
              </div>
              <span className="font-extrabold text-sm text-white tracking-tight">
                {appName}
              </span>
            </div>
            <p className="text-slate-400 max-w-md leading-relaxed text-xs">
              A distraction-free, privacy-preserving daily income and expense ledger for Android and the modern web. Built for individuals, shopkeepers, students, and households who desire immediate financial clarity without ad tracking.
            </p>
            <div className="flex flex-wrap items-center gap-4 text-slate-400 pt-1">
              <div className="flex items-center gap-1.5 text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
                <span>Zero Ads & Zero Invasions</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-300">
                <Smartphone className="w-4 h-4 text-blue-400" />
                <span>Works 100% Offline</span>
              </div>
            </div>
          </div>

          {/* Quick Navigation */}
          <div>
            <h4 className="font-bold text-white uppercase text-[11px] tracking-wider mb-3">
              Application
            </h4>
            <ul className="space-y-2 text-slate-400">
              <li>
                <button
                  onClick={() => onNavigate('home')}
                  className="hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  Download Android APK
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('journal')}
                  className="hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  Launch Web Application
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('releases')}
                  className="hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  Version Changelogs
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('support')}
                  className="hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  Installation & Help Guide
                </button>
              </li>
            </ul>
          </div>

          {/* Developer & Packaging */}
          <div>
            <h4 className="font-bold text-white uppercase text-[11px] tracking-wider mb-3">
              Android Packaging
            </h4>
            <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
              Daily Money Journal is packaged with standard Android Webview tooling & Capacitor.
            </p>
            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-[10px] font-mono text-slate-300 flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="truncate">npx cap build android</span>
            </div>
          </div>
        </div>

        {/* Bottom row */}
        <div className="mt-10 pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <div>
            © {new Date().getFullYear()} {appName}. Licensed and distributed for personal finance management.
          </div>
          <div className="flex items-center gap-4">
            <span className="font-mono text-slate-400">Release: v{version} (Build 24)</span>
            <span>•</span>
            <button
              onClick={() => onNavigate('support')}
              className="hover:text-slate-300 transition-colors cursor-pointer"
            >
              Contact Support
            </button>
            <span>•</span>
            <button
              onClick={() => onNavigate('admin')}
              className="hover:text-slate-400 text-slate-600 transition-colors cursor-pointer text-[10px]"
              title="Administrator Management Console"
            >
              System Console
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
