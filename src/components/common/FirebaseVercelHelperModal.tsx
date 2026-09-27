import React, { useState } from 'react';
import { X, ExternalLink, AlertTriangle, ShieldCheck, Mail, Key, Sparkles, Check, RefreshCw } from 'lucide-react';
import firebaseConfig from '../../../firebase-applet-config.json';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialReason?: 'operation-not-allowed' | 'unauthorized-domain' | 'password-reset' | 'permission-denied' | 'general';
}

export const FirebaseVercelHelperModal: React.FC<Props> = ({
  isOpen,
  onClose,
  initialReason = 'permission-denied',
}) => {
  const [activeTab, setActiveTab] = useState<'explanation' | 'custom-project' | 'guest'>('explanation');
  const [customConfigJson, setCustomConfigJson] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  if (!isOpen) return null;

  const projectId = firebaseConfig.projectId || 'mega-task-cxctm';
  const currentHost = typeof window !== 'undefined' ? window.location.hostname : 'your-vercel-domain.vercel.app';

  const handleSaveCustomConfig = () => {
    setSaveError(null);
    try {
      let parsed: Record<string, string> = {};
      const trimmed = customConfigJson.trim();
      
      if (trimmed.startsWith('{')) {
        parsed = JSON.parse(trimmed);
      } else {
        // Parse JS object style: apiKey: "...", projectId: "..."
        const clean = trimmed
          .replace(/(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '"$2":')
          .replace(/'/g, '"');
        parsed = JSON.parse(clean);
      }

      if (!parsed.projectId || !parsed.apiKey) {
        throw new Error('Config must contain at least "projectId" and "apiKey"');
      }

      localStorage.setItem('custom_firebase_config', JSON.stringify(parsed));
      setSaveSuccess(true);
      setTimeout(() => {
        window.location.reload();
      }, 1200);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Invalid JSON format. Please paste the object copied from Firebase Console.');
    }
  };

  const handleClearCustomConfig = () => {
    localStorage.removeItem('custom_firebase_config');
    window.location.reload();
  };

  const hasCustomConfig = typeof window !== 'undefined' && !!localStorage.getItem('custom_firebase_config');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl p-6 text-slate-200">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Firebase Permission & Vercel Fix</h2>
              <p className="text-xs text-slate-400">"To manage sign-in methods, ask a project owner for permission"</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-2 mt-4 p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('explanation')}
            className={`flex-1 py-2 px-3 rounded-lg transition cursor-pointer text-center ${
              activeTab === 'explanation' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Why This Happens
          </button>
          <button
            onClick={() => setActiveTab('custom-project')}
            className={`flex-1 py-2 px-3 rounded-lg transition cursor-pointer text-center ${
              activeTab === 'custom-project' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Use Your Own Firebase (100% Free)
          </button>
          <button
            onClick={() => setActiveTab('guest')}
            className={`flex-1 py-2 px-3 rounded-lg transition cursor-pointer text-center ${
              activeTab === 'guest' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Instant Guest Mode
          </button>
        </div>

        {/* TAB 1: EXPLANATION */}
        {activeTab === 'explanation' && (
          <div className="mt-5 space-y-4 text-xs">
            <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/30 text-amber-200 leading-relaxed space-y-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                Why you see "Ask a project owner for the necessary permission"
              </h3>
              <p>
                The project <code className="px-1.5 py-0.5 rounded bg-slate-900 text-amber-300 font-mono">{projectId}</code> was generated through the cloud sandbox service account. Your personal Google Account does not have <strong>Firebase Authentication Admin / Owner</strong> roles inside that Google Cloud project.
              </p>
              <p>
                Because of this, Google will not let you toggle the Authentication switches on <code className="text-white font-mono">{projectId}</code>.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                You have 2 immediate solutions:
              </h4>

              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 font-bold">
                    1
                  </div>
                  <div>
                    <h5 className="font-bold text-white">Create your own Firebase project (Takes 2 minutes)</h5>
                    <p className="text-slate-400 mt-0.5">
                      Since <strong>you are the Owner</strong> of your own project, you can turn on Email/Password, Google Login, and Authorized Domains with zero permission restrictions.
                    </p>
                    <button
                      onClick={() => setActiveTab('custom-project')}
                      className="mt-2 text-emerald-400 hover:underline font-bold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <span>See how to connect your project &rarr;</span>
                    </button>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 font-bold">
                    2
                  </div>
                  <div>
                    <h5 className="font-bold text-white">Use Guest Mode (Zero setup required)</h5>
                    <p className="text-slate-400 mt-0.5">
                      Click <strong>"Skip Sign-In (Continue as Guest)"</strong> on the login screen. Daily Money Journal runs offline-first directly in your browser or phone with full storage!
                    </p>
                    <button
                      onClick={() => {
                        onClose();
                        window.location.hash = '#journal';
                      }}
                      className="mt-2 text-blue-400 hover:underline font-bold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <span>Launch Guest Mode Now &rarr;</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CONNECT OWN FIREBASE PROJECT */}
        {activeTab === 'custom-project' && (
          <div className="mt-5 space-y-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <h4 className="font-bold text-white text-sm">How to create & connect your project:</h4>
              <ol className="text-slate-400 space-y-2 list-decimal list-inside pl-1 leading-relaxed">
                <li>
                  Go to <a href="https://console.firebase.google.com" target="_blank" rel="noreferrer" className="text-emerald-400 hover:underline font-semibold inline-flex items-center gap-1">console.firebase.google.com <ExternalLink className="w-3 h-3" /></a> and click <strong>"Add project"</strong>.
                </li>
                <li>
                  In your new project, go to <strong>Authentication &rarr; Sign-in method</strong> &rarr; enable <strong>Email/Password</strong> and <strong>Google</strong>.
                </li>
                <li>
                  Go to <strong>Authentication &rarr; Settings &rarr; Authorized domains</strong> &rarr; add your Vercel domain (<code className="text-emerald-300 font-mono">{currentHost}</code>).
                </li>
                <li>
                  Go to <strong>Project Settings (gear icon) &rarr; General &rarr; Your apps &rarr; Web app (&lt;/&gt;)</strong> &rarr; copy the configuration object.
                </li>
              </ol>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-300">
                Paste your Firebase Config (JSON or JS Object):
              </label>
              <textarea
                rows={5}
                value={customConfigJson}
                onChange={(e) => setCustomConfigJson(e.target.value)}
                placeholder={`{\n  "apiKey": "AIzaSy...",\n  "authDomain": "my-journal.firebaseapp.com",\n  "projectId": "my-journal",\n  "storageBucket": "my-journal.appspot.com",\n  "appId": "1:..."\n}`}
                className="w-full p-3 font-mono text-[11px] rounded-xl bg-slate-950 border border-slate-700 text-emerald-400 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {saveError && (
              <div className="p-3 rounded-xl bg-red-950/70 border border-red-800 text-red-200">
                {saveError}
              </div>
            )}

            {saveSuccess && (
              <div className="p-3 rounded-xl bg-emerald-950/70 border border-emerald-500/50 text-emerald-200 flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Connected! Reloading app with your Firebase project...</span>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              {hasCustomConfig ? (
                <button
                  type="button"
                  onClick={handleClearCustomConfig}
                  className="text-xs text-red-400 hover:underline cursor-pointer"
                >
                  Reset to default config
                </button>
              ) : <div />}

              <button
                type="button"
                onClick={handleSaveCustomConfig}
                disabled={!customConfigJson.trim()}
                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-xs cursor-pointer transition flex items-center gap-2"
              >
                <Key className="w-4 h-4" />
                <span>Save & Connect Project</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: GUEST MODE */}
        {activeTab === 'guest' && (
          <div className="mt-5 space-y-4 text-xs">
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white text-center">
                100% Private, Zero Login Required
              </h3>
              <p className="text-slate-300 leading-relaxed text-center">
                Daily Money Journal was built with offline-first mindfulness. You do not need any Firebase project or authentication to use all features!
              </p>
              
              <ul className="space-y-2 pt-2 text-slate-400 list-disc list-inside">
                <li><strong className="text-white">Full Journal entries</strong>: Daily earnings, expenses, categorisation, and balance.</li>
                <li><strong className="text-white">Pending Money tracker</strong>: Debits, credits, and settlement statuses.</li>
                <li><strong className="text-white">Mustang Dream Goal</strong>: Visual progress bars and milestone calculations.</li>
                <li><strong className="text-white">Local device persistence</strong>: Stored securely in your browser's persistent storage.</li>
              </ul>

              <div className="pt-3">
                <button
                  onClick={() => {
                    onClose();
                    window.location.hash = '#journal';
                  }}
                  className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase tracking-wider cursor-pointer transition shadow-lg shadow-emerald-500/20"
                >
                  Enter Daily Money Journal as Guest &rarr;
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs">
          <div className="text-slate-500">
            Current project: <code className="text-slate-400 font-mono">{projectId}</code>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
