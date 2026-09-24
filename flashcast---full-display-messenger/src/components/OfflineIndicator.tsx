import React from 'react';
import { WifiOff, RefreshCw, HardDrive } from 'lucide-react';

interface OfflineIndicatorProps {
  isOnline: boolean;
  pendingCount?: number;
  onRetryConnection?: () => void;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
  isOnline,
  pendingCount = 0,
  onRetryConnection,
}) => {
  if (isOnline && pendingCount === 0) return null;

  return (
    <div
      id="offline-status-banner"
      className="fixed bottom-4 left-4 z-40 max-w-sm w-[90%] sm:w-auto animate-in fade-in slide-in-from-bottom-2"
    >
      <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl bg-amber-950/90 border border-amber-500/50 text-amber-200 shadow-xl backdrop-blur-md text-xs font-['Hind_Siliguri',sans-serif]">
        <WifiOff className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
        <div className="flex-1">
          <div className="font-bold flex items-center gap-1.5">
            <span>{!isOnline ? 'অফলাইন মোড (লোকাল P2P সক্রিয়)' : 'বার্তা পেন্ডিং'}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <p className="text-[11px] text-amber-300/80">
            {pendingCount > 0
              ? `${pendingCount} টি বার্তা সংরক্ষিত, সংযোগ পাওয়ামাত্র ডেলিভারি হবে`
              : 'স্বাভাবিক নিয়মেই টেক্সট মেসেজ অফলাইনেও আদান-প্রদান হচ্ছে'}
          </p>
        </div>

        {onRetryConnection && !isOnline && (
          <button
            type="button"
            onClick={onRetryConnection}
            className="p-1.5 rounded-xl bg-amber-900/60 hover:bg-amber-800 text-amber-200 transition-colors"
            title="পুনরায় কানেক্ট করুন"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
