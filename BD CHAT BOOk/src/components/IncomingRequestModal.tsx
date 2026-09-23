import React, { useEffect } from 'react';
import { ShieldCheck, PhoneCall, Check, X, Radio, Sparkles } from 'lucide-react';
import { ConnectionRequest } from '../types';
import { playIncomingRingSound } from '../utils/audio';

interface IncomingRequestModalProps {
  request: ConnectionRequest;
  onAccept: (fromCode: string) => void;
  onReject: (fromCode: string) => void;
  soundEnabled?: boolean;
}

export const IncomingRequestModal: React.FC<IncomingRequestModalProps> = ({
  request,
  onAccept,
  onReject,
  soundEnabled = true,
}) => {
  // Play ring sound on appearance
  useEffect(() => {
    if (soundEnabled) {
      playIncomingRingSound();
      const interval = setInterval(() => {
        playIncomingRingSound();
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [soundEnabled]);

  return (
    <div
      id="incoming-connection-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-md bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-emerald-500/50 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-emerald-500/20 text-center overflow-hidden">
        {/* Decorative Ring Glows */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Pulsing Phone/Connection Icon (AnyDesk style) */}
        <div className="relative mx-auto w-20 h-20 mb-5 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" />
          <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/30">
            <PhoneCall className="w-8 h-8 animate-bounce" />
          </div>
        </div>

        {/* Title */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2">
          <Radio className="w-3.5 h-3.5 animate-pulse" />
          <span>ইনকামিং কানেকশন রিকোয়েস্ট</span>
        </div>

        <h3 className="text-xl sm:text-2xl font-extrabold text-white mb-1">
          সংযোগের অনুমতি চান
        </h3>

        <p className="text-xs sm:text-sm text-slate-400 mb-6 font-['Hind_Siliguri',sans-serif]">
          নিচের ব্যবহারকারী আপনার সাথে রিয়েলটাইমে কানেক্ট হয়ে কথা বলতে চাচ্ছেন:
        </p>

        {/* Requester Identity Card */}
        <div className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-4 mb-6 shadow-inner text-left">
          <div className="text-[11px] uppercase font-bold text-slate-400 tracking-wider mb-1">
            অনুরোধকারীর চ্যাট কোড:
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-2xl sm:text-3xl font-extrabold tracking-wider text-cyan-300">
              {request.fromCode}
            </span>
            <span className="text-xs px-2.5 py-1 rounded-lg bg-indigo-950 text-indigo-300 border border-indigo-500/30 font-semibold">
              {request.fromName || 'অপরিচিত'}
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-800 flex items-center gap-2 text-xs text-slate-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>অনুমোদন দিলে ফুল ডিসপ্লে টেক্সট, ছবি, ভিডিও, ভয়েস ও ড্রয়িং দেখতে পারবেন।</span>
          </div>
        </div>

        {/* Action Buttons: Accept / Decline */}
        <div className="grid grid-cols-2 gap-3">
          <button
            id="reject-incoming-request-btn"
            type="button"
            onClick={() => onReject(request.fromCode)}
            className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-slate-900 hover:bg-rose-950/70 border border-slate-700 hover:border-rose-500 text-slate-300 hover:text-rose-200 font-bold text-sm transition-all active:scale-95"
          >
            <X className="w-5 h-5 text-rose-400" />
            <span>বাতিল করুন</span>
          </button>

          <button
            id="accept-incoming-request-btn"
            type="button"
            onClick={() => onAccept(request.fromCode)}
            className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-500/30 transition-all active:scale-95"
          >
            <Check className="w-5 h-5" />
            <span>গ্রহণ করুন</span>
          </button>
        </div>
      </div>
    </div>
  );
};
