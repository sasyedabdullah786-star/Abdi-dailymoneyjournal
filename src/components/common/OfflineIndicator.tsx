import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2.5 rounded-lg bg-amber-600/95 text-white px-3.5 py-2 text-xs font-semibold shadow-xl border border-amber-500/50 backdrop-blur-xs animate-in fade-in slide-in-from-bottom-2">
      <WifiOff className="w-4 h-4 shrink-0 animate-pulse text-amber-200" />
      <span>Offline Mode — All changes are preserved locally in your browser/device.</span>
    </div>
  );
};
