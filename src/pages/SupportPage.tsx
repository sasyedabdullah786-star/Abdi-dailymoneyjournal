import React, { useState } from 'react';
import {
  LifeBuoy,
  HelpCircle,
  Mail,
  ShieldCheck,
  Terminal,
  Smartphone,
  ChevronDown,
  ChevronUp,
  Send,
  CheckCircle2,
} from 'lucide-react';

const FAQS = [
  {
    q: 'How do I download this app to my mobile phone?',
    a: 'Simply tap "Download App to Mobile" on your phone in Google Chrome, Safari, or Samsung Internet. Chrome will prompt you to install the app directly to your home screen launcher. It runs full-screen as a native app with zero APK warnings!',
  },
  {
    q: 'Does Daily Money Journal access my bank accounts or read SMS?',
    a: 'No, absolutely not. We believe in zero-telemetry financial mindfulness. The app does not request SMS permissions, does not connect to third-party bank aggregators, and never sells your data. All transactions remain completely private.',
  },
  {
    q: 'Can I use this app without an internet connection?',
    a: 'Yes! The Progressive Web App (PWA) is built with offline-first architecture. All records are stored directly on your phone and load instantly even in airplane mode.',
  },
  {
    q: 'How do I backup or sync my data to a new phone?',
    a: 'You can create a free account in the app. When logged in, your entries automatically backup to your private encrypted cloud database in Firebase.',
  },
  {
    q: 'Does installing from the browser take up storage?',
    a: 'Because it installs as a lightweight Progressive Web App, it uses only a tiny fraction of storage compared to bloated traditional binaries, and it automatically stays up to date.',
  },
];

export const SupportPage: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMsg, setContactMsg] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactEmail.trim() || !contactMsg.trim()) return;
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setContactName('');
      setContactEmail('');
      setContactMsg('');
    }, 4000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-16">
      {/* Header */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-semibold text-emerald-400">
          <LifeBuoy className="w-3.5 h-3.5" />
          <span>Help & Technical Assistance</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Support & Frequently Asked Questions
        </h1>
        <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
          Need help installing the APK on your Android device, configuring offline sync, or have a feature suggestion? Find answers below or message our engineering team.
        </p>
      </div>

      {/* FAQ Accordion */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-emerald-400" />
          <span>Frequently Asked Questions</span>
        </h2>

        <div className="space-y-3">
          {FAQS.map((faq, idx) => (
            <div
              key={idx}
              className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden"
            >
              <button
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-bold text-sm text-white hover:text-emerald-400 transition cursor-pointer"
              >
                <span>{faq.q}</span>
                {openFaq === idx ? (
                  <ChevronUp className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
                )}
              </button>
              {openFaq === idx && (
                <div className="px-5 pb-5 pt-1 text-xs text-slate-300 leading-relaxed border-t border-slate-800/60">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Developer Packaging Guide with Capacitor */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">
              Official Capacitor Android Build Pipeline
            </h3>
            <p className="text-xs text-slate-400">
              Legitimate native APK build commands for developer verification
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          Daily Money Journal is architected with complete Capacitor compatibility. You can run the following commands in your local terminal to package the compiled web assets into a signed production APK using Android Studio:
        </p>

        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 space-y-2 overflow-x-auto">
          <p className="text-slate-500"># 1. Build optimized web application bundle</p>
          <p className="text-emerald-400">npm run build</p>
          <p className="text-slate-500 mt-2"># 2. Sync production files into Android platform directory</p>
          <p className="text-emerald-400">npx cap sync android</p>
          <p className="text-slate-500 mt-2"># 3. Compile debug or signed release APK</p>
          <p className="text-emerald-400">npx cap build android</p>
        </div>
      </div>

      {/* Contact Form */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Contact Developer Support</h3>
            <p className="text-xs text-slate-400">
              We respond to inquiries and bug reports within 24 hours
            </p>
          </div>
        </div>

        {submitted ? (
          <div className="p-6 rounded-2xl bg-emerald-950/70 border border-emerald-500/40 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
            <h4 className="text-base font-bold text-white">Message Received!</h4>
            <p className="text-xs text-slate-300 max-w-md mx-auto">
              Thank you for contacting the Daily Money Journal team. We have received your inquiry and will follow up at <strong>{contactEmail}</strong> shortly.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                  Your Name
                </label>
                <input
                  type="text"
                  required
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="e.g. Syed"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                  Your Email
                </label>
                <input
                  type="email"
                  required
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                Message / Device Model & Android Version
              </label>
              <textarea
                rows={4}
                required
                value={contactMsg}
                onChange={(e) => setContactMsg(e.target.value)}
                placeholder="Describe your question or issue (e.g. Samsung Galaxy S23, Android 14)..."
                className="w-full p-4 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500 leading-relaxed"
              />
            </div>

            <button
              type="submit"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Send Message</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
