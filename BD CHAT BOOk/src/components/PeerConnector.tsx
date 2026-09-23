import React, { useState } from 'react';
import {
  UserPlus,
  ArrowRight,
  History,
  Copy,
  Check,
  Share2,
  Trash2,
  PhoneCall,
  PhoneOff,
  Radio,
  Clock,
  Shield,
  RefreshCw,
  Sparkles,
  QrCode,
  WifiOff,
} from 'lucide-react';
import { PeerContact } from '../types';
import { formatCode, normalizeCode } from '../utils/codeGenerator';

export type ConnectionStatus = 'idle' | 'requesting' | 'connected';

interface PeerConnectorProps {
  myCode: string;
  currentPeerCode: string | null;
  currentPeerName?: string;
  sessionStatus: ConnectionStatus;
  pendingTargetCode?: string | null;
  recentPeers: PeerContact[];
  onRequestConnection: (targetCode: string) => void;
  onCancelRequest: () => void;
  onDisconnectSession: () => void;
  onSelectPeer: (peerCode: string, name?: string) => void;
  onRemovePeer: (peerCode: string) => void;
  onRegenerateCode?: () => void;
  onOpenOfflineModal?: () => void;
}

export const PeerConnector: React.FC<PeerConnectorProps> = ({
  myCode,
  currentPeerCode,
  currentPeerName,
  sessionStatus,
  pendingTargetCode,
  recentPeers,
  onRequestConnection,
  onCancelRequest,
  onDisconnectSession,
  onSelectPeer,
  onRemovePeer,
  onRegenerateCode,
  onOpenOfflineModal,
}) => {
  const [inputCode, setInputCode] = useState('');
  const [inputError, setInputError] = useState('');
  const [copiedMyCode, setCopiedMyCode] = useState(false);

  const handleCopyMyCode = () => {
    navigator.clipboard.writeText(myCode);
    setCopiedMyCode(true);
    setTimeout(() => setCopiedMyCode(false), 2000);
  };

  const handleConnectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = inputCode.trim();
    const normalized = normalizeCode(cleaned);

    if (!normalized) {
      setInputError('অনুগ্রহ করে কোডটি লিখুন');
      return;
    }

    if (normalized === normalizeCode(myCode)) {
      setInputError('নিজের কোডে রিকোয়েস্ট পাঠানো যাবে না');
      return;
    }

    if (normalized.length < 3) {
      setInputError('সঠিক ৯-ডিজিটের কোড দিন');
      return;
    }

    setInputError('');
    onRequestConnection(cleaned);
  };

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-4 sm:p-5 backdrop-blur-md shadow-2xl flex flex-col gap-5">
      {/* 1. THIS DESK (এই ডিভাইস / আপনার কোড) - AnyDesk Style */}
      <div className="bg-slate-950/90 border border-slate-800/90 rounded-2xl p-4 shadow-inner">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              এই ডিভাইস (আপনার কোড)
            </h3>
          </div>
          <span className="text-[11px] text-emerald-400 font-semibold bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-800/50">
            সংযোগের জন্য প্রস্তুত
          </span>
        </div>

        <div className="flex items-center justify-between gap-2 bg-slate-900/90 border border-indigo-500/30 rounded-xl p-3">
          <div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">
              আপনার চ্যাট কোড:
            </div>
            <div
              id="connector-my-code"
              className="font-mono text-xl sm:text-2xl font-black text-cyan-300 tracking-wider"
            >
              {myCode}
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              id="connector-copy-btn"
              type="button"
              onClick={handleCopyMyCode}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all shadow-sm"
              title="কোড কপি করুন"
            >
              {copiedMyCode ? (
                <Check className="w-4 h-4 text-emerald-400" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>

            {onRegenerateCode && (
              <button
                id="connector-refresh-code-btn"
                type="button"
                onClick={onRegenerateCode}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-cyan-300 transition-all shadow-sm"
                title="নতুন কোড তৈরি করুন"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <p className="text-[11px] text-slate-400 mt-2 flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span>কেউ কানেক্ট হতে চাইলে আপনার স্ক্রিনে অনুমোদন (Accept) চাওয়ার পপআপ আসবে।</span>
        </p>
      </div>

      {/* 2. REMOTE PEER (বন্ধুর কোড দিয়ে কানেক্ট) */}
      <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <UserPlus className="w-4 h-4 text-emerald-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            নতুন চ্যাট (বন্ধুর কোড দিয়ে কানেক্ট)
          </h3>
        </div>

        {/* STATE A: ACTIVE CONNECTED SESSION */}
        {sessionStatus === 'connected' && currentPeerCode ? (
          <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-xl p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-bold text-emerald-300 uppercase tracking-wide">
                  সক্রিয় চ্যাট সেশন
                </span>
              </div>
              <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-950 px-2 py-0.5 rounded-md border border-emerald-800/60">
                লাইভ
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-400 block">সংযুক্ত আইডি:</span>
                <span className="font-mono text-lg font-bold text-white tracking-wider">
                  {currentPeerCode}
                </span>
                {currentPeerName && (
                  <span className="text-xs text-slate-300 block">({currentPeerName})</span>
                )}
              </div>

              {/* AnyDesk End Session / Disconnect button */}
              <button
                id="disconnect-session-btn"
                type="button"
                onClick={onDisconnectSession}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-bold text-xs shadow-lg shadow-rose-600/30 transition-all"
                title="সেশন শেষ করুন"
              >
                <PhoneOff className="w-3.5 h-3.5" />
                <span>সংযোগ বিচ্ছিন্ন</span>
              </button>
            </div>
          </div>
        ) : sessionStatus === 'requesting' ? (
          /* STATE B: WAITING FOR REMOTE APPROVAL */
          <div className="bg-amber-950/40 border border-amber-500/50 rounded-xl p-3.5 space-y-3 animate-in fade-in">
            <div className="flex items-center gap-2 text-amber-300 text-xs font-bold">
              <Clock className="w-4 h-4 animate-spin" />
              <span>অনুরোধ পাঠানো হয়েছে...</span>
            </div>

            <div className="text-xs text-slate-300 leading-relaxed font-['Hind_Siliguri',sans-serif]">
              <span className="font-mono font-bold text-cyan-300">
                {pendingTargetCode || inputCode}
              </span>
              -এর কাছে সংযোগের অনুরোধ গেছে। অপর পাশের ব্যবহারকারী <strong>Accept</strong> করলেই কথা শুরু হবে।
            </div>

            <button
              id="cancel-request-btn"
              type="button"
              onClick={onCancelRequest}
              className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-rose-950/60 border border-slate-700 hover:border-rose-500 text-slate-300 hover:text-rose-200 text-xs font-semibold transition-all"
            >
              অনুরোধ বাতিল করুন
            </button>
          </div>
        ) : (
          /* STATE C: IDLE - ENTER REMOTE CODE & SEND REQUEST */
          <form onSubmit={handleConnectSubmit} className="space-y-3">
            <p className="text-xs text-slate-400">
              যাঁর সাথে কথা বলতে চান তাঁর ৯-ডিজিট কোড দিন:
            </p>

            <div className="flex flex-col gap-2.5">
              <input
                id="remote-peer-input"
                type="text"
                value={inputCode}
                onChange={(e) => {
                  setInputCode(e.target.value);
                  if (inputError) setInputError('');
                }}
                placeholder="যেমন: 845 291 736"
                className="w-full bg-slate-900 border border-slate-700 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 rounded-xl px-3.5 py-2.5 text-base font-mono text-cyan-300 placeholder-slate-600 tracking-wider focus:outline-none transition-all uppercase"
              />

              <button
                id="send-connection-request-btn"
                type="submit"
                disabled={!inputCode.trim()}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 hover:from-emerald-400 hover:to-cyan-500 text-white font-bold text-sm shadow-lg shadow-emerald-500/20 active:scale-95 disabled:opacity-40 transition-all"
              >
                <PhoneCall className="w-4 h-4" />
                <span>রিকোয়েস্ট পাঠান</span>
              </button>
            </div>

            {inputError && (
              <p className="text-xs text-rose-400 font-medium flex items-center gap-1">
                <span>•</span> {inputError}
              </p>
            )}
          </form>
        )}
      </div>

      {/* 2.5 NATURAL OFFLINE MESSAGING BADGE */}
      <div className="p-3 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-cyan-950/40 border border-emerald-500/30 rounded-2xl flex items-center justify-between gap-3 overflow-hidden">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-bold text-white font-['Hind_Siliguri',sans-serif]">স্বাভাবিক অফলাইন মেসেঞ্জার</span>
              <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-bold shrink-0">
                কোনো QR স্ক্যানের ঝামেলা নেই
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-['Hind_Siliguri',sans-serif] leading-tight mt-0.5">
              স্বাভাবিক নিয়মেই টেক্সট মেসেজ অফলাইনেও আদান-প্রদান হবে ও ফুল ডিসপ্লেতে ভেসে উঠবে
            </p>
          </div>
        </div>

        <div className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[10px] font-mono font-semibold shrink-0">
          সক্রিয়
        </div>
      </div>

      {/* 3. RECENT PEERS / CONTACTS */}
      {recentPeers.length > 0 && (
        <div className="border-t border-slate-800/80 pt-3">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <History className="w-3.5 h-3.5 text-slate-500" />
              <span>পূর্বের পরিচিতি</span>
            </div>
            <span className="text-[11px] text-slate-500">{recentPeers.length} টি কোড</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
            {recentPeers.map((peer) => {
              const isCurrent =
                normalizeCode(currentPeerCode || '') === normalizeCode(peer.code);
              return (
                <div
                  key={peer.code}
                  className={`group flex items-center justify-between gap-2 p-2.5 rounded-xl border transition-all ${
                    isCurrent && sessionStatus === 'connected'
                      ? 'bg-emerald-950/50 border-emerald-500/50 shadow-md ring-1 ring-emerald-500/30'
                      : 'bg-slate-950/40 border-slate-800/70 hover:bg-slate-800/50 hover:border-slate-700'
                  }`}
                >
                  <button
                    id={`select-peer-${normalizeCode(peer.code)}`}
                    type="button"
                    onClick={() => {
                      setInputCode(peer.code);
                      if (sessionStatus !== 'connected') {
                        onRequestConnection(peer.code);
                      }
                    }}
                    className="flex-1 flex items-center gap-2.5 text-left min-w-0"
                  >
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono text-xs font-bold shrink-0 ${
                        isCurrent && sessionStatus === 'connected'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-800 text-cyan-300 group-hover:bg-slate-700'
                      }`}
                    >
                      {peer.code.slice(0, 2)}
                    </div>

                    <div className="truncate">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-bold text-white tracking-wider">
                          {peer.code}
                        </span>
                        {isCurrent && sessionStatus === 'connected' && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        )}
                      </div>
                      {peer.name && (
                        <p className="text-[11px] text-slate-400 truncate">{peer.name}</p>
                      )}
                    </div>
                  </button>

                  <button
                    id={`remove-peer-${normalizeCode(peer.code)}`}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemovePeer(peer.code);
                    }}
                    className="p-1 rounded-md text-slate-600 hover:text-rose-400 hover:bg-rose-950/40 opacity-0 group-hover:opacity-100 transition-all"
                    title="তালিকা থেকে মুছুন"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
