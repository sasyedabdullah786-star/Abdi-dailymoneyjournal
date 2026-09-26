import React, { useState } from 'react';
import {
  Download,
  Calendar,
  CheckCircle2,
  HardDrive,
  ShieldCheck,
  Tag,
  FileCheck,
  ExternalLink,
} from 'lucide-react';
import { Release } from '../types';
import { ApkDownloadButton } from '../components/download/ApkDownloadButton';
import { InstallGuideModal } from '../components/download/InstallGuideModal';

interface Props {
  releases: Release[];
  appName?: string;
}

export const ReleasesPage: React.FC<Props> = ({
  releases,
  appName = 'Daily Money Journal',
}) => {
  const [guideOpen, setGuideOpen] = useState(false);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-12">
      <InstallGuideModal
        isOpen={guideOpen}
        onClose={() => setGuideOpen(false)}
        appName={appName}
      />

      {/* Header */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-semibold text-emerald-400">
          <Tag className="w-3.5 h-3.5" />
          <span>Official Distribution Channels</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Release History & Changelogs
        </h1>
        <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
          Every release of {appName} is independently packaged and cryptographically verified. Download current or archived builds for testing or deployment on older Android devices.
        </p>
      </div>

      {/* Releases List */}
      <div className="space-y-8">
        {releases.map((rel) => (
          <div
            key={rel.id}
            className={`p-6 sm:p-8 rounded-3xl border transition-all ${
              rel.isCurrent
                ? 'bg-slate-900/95 border-emerald-500/40 shadow-xl shadow-emerald-950/20 ring-1 ring-emerald-500/30'
                : 'bg-slate-900/60 border-slate-800'
            }`}
          >
            {/* Header row */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <h2 className="text-xl sm:text-2xl font-black text-white">
                    Version {rel.version}
                  </h2>
                  {rel.isCurrent && (
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                      Current Stable
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <span>{rel.releaseDate}</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <HardDrive className="w-3.5 h-3.5 text-slate-500" />
                    <span>{rel.apkSize}</span>
                  </span>
                  <span>•</span>
                  <span>Min: {rel.minAndroid}</span>
                  <span>•</span>
                  <span className="text-emerald-400/90 font-mono">
                    Build #{rel.versionCode}
                  </span>
                </div>
              </div>

              {/* Download action button */}
              <div>
                <ApkDownloadButton
                  apkUrl={rel.apkUrl}
                  version={rel.version || rel.versionName || '2.4.0'}
                  apkSize={rel.apkSize || rel.fileSize || '8.4 MB'}
                  releaseId={rel.id}
                  size="normal"
                  onGuideRequest={() => setGuideOpen(true)}
                />
              </div>
            </div>

            {/* Changelog items */}
            <div className="py-6 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Changes in this release
              </h3>
              <ul className="space-y-2 text-xs text-slate-300">
                {rel.changelog && rel.changelog.length > 0 ? (
                  rel.changelog.map((c, i) => (
                    <li key={i} className="flex items-start gap-2.5 leading-relaxed">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{c}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-slate-500">General performance and stability improvements.</li>
                )}
              </ul>
            </div>

            {/* Integrity details */}
            {rel.sha256 && (
              <div className="pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px] text-slate-400">
                <div className="flex items-center gap-1.5 font-mono text-slate-500 truncate max-w-xl">
                  <FileCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="text-slate-400 font-semibold">SHA-256:</span>
                  <span className="truncate">{rel.sha256}</span>
                </div>
                <div className="flex items-center gap-1 text-emerald-400 text-xs font-medium">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Digitally Signed</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
