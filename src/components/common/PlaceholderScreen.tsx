import React from 'react';
import { Phone, Globe, MessageSquare, ExternalLink } from 'lucide-react';

export const PlaceholderScreen: React.FC = () => {
  return (
    <div className="min-h-screen w-full bg-[#0d0e12] flex flex-col items-center justify-center px-4 py-12 select-none">
      <div className="flex flex-col items-center text-center max-w-md w-full">
        {/* Central Logo Graphic */}
        <div className="w-56 h-56 sm:w-64 sm:h-64 flex items-center justify-center mb-7 sm:mb-8">
          <img
            src="/maintenance_logo.jpg"
            alt="Project Logo"
            className="w-full h-full object-contain rounded-lg shadow-2xl"
            referrerPolicy="no-referrer"
          />
        </div>

        {/* Message */}
        <div className="space-y-1 sm:space-y-1.5 text-center mb-8">
          <p className="text-slate-400 text-base sm:text-lg font-normal tracking-tight">
            No working published build found yet.
          </p>
          <p className="text-slate-500 text-sm sm:text-base font-normal tracking-tight">
            Publish or update your project to see it here.
          </p>
        </div>

        {/* Want to buy this / Contact section */}
        <div className="w-full max-w-sm rounded-2xl bg-slate-900/60 border border-slate-800/80 p-5 shadow-xl backdrop-blur-sm">
          <div className="text-xs uppercase tracking-widest font-bold text-emerald-400 mb-3.5">
            Want to buy this?
          </div>

          <div className="space-y-2.5 text-sm">
            {/* Phone Contact */}
            <a
              href="tel:+919945485104"
              className="flex items-center justify-between px-4 py-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 text-slate-200 hover:text-white transition group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Phone className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <span className="block text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Contact Phone</span>
                  <span className="text-sm font-semibold text-white tracking-wide">+91 9945485104</span>
                </div>
              </div>
              <span className="text-xs text-emerald-400 opacity-80 group-hover:opacity-100 font-medium">Call</span>
            </a>

            {/* Website Visit */}
            <a
              href="https://www.abdi-agency.pages.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between px-4 py-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 text-slate-200 hover:text-white transition group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <Globe className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <span className="block text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Official Website</span>
                  <span className="text-sm font-semibold text-white tracking-wide">www.abdi-agency.pages.dev</span>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-blue-400 transition" />
            </a>

            {/* Quick WhatsApp Chat */}
            <a
              href="https://wa.me/919945485104?text=Hi%2C%20I%20am%20interested%20in%20purchasing%20this%20project."
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 py-2 px-3 text-xs text-slate-400 hover:text-emerald-300 transition"
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
              <span>Or chat directly on WhatsApp</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
