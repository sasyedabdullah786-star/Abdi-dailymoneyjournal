import React from 'react';

export const PlaceholderScreen: React.FC = () => {
  return (
    <div className="min-h-screen w-full bg-[#0d0e12] flex flex-col items-center justify-center px-6 py-12 select-none">
      <div className="flex flex-col items-center text-center max-w-md w-full">
        {/* Central Logo Graphic */}
        <div className="w-56 h-56 sm:w-64 sm:h-64 flex items-center justify-center mb-8 sm:mb-10">
          <img
            src="/maintenance_logo.jpg"
            alt="Project Logo"
            className="w-full h-full object-contain rounded-lg shadow-2xl"
            referrerPolicy="no-referrer"
          />
        </div>

        {/* Message */}
        <div className="space-y-1 sm:space-y-1.5 text-center">
          <p className="text-slate-400 text-base sm:text-lg font-normal tracking-tight">
            No working published build found yet.
          </p>
          <p className="text-slate-500 text-sm sm:text-base font-normal tracking-tight">
            Publish or update your project to see it here.
          </p>
        </div>
      </div>
    </div>
  );
};
