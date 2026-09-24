import React, { useState } from 'react';
import {
  Copy,
  Check,
  Share2,
  Edit2,
  Volume2,
  VolumeX,
  Radio,
  Sparkles,
  Users,
  RefreshCw,
  Inbox,
  Bell,
} from 'lucide-react';
import { UserIdentity } from '../types';
import { User, QrCode } from 'lucide-react';

interface UserHeaderProps {
  identity: UserIdentity;
  isConnected: boolean;
  onlineCount: number;
  soundEnabled: boolean;
  requestsCount?: number;
  onToggleSound: () => void;
  onUpdateName: (newName: string) => void;
  onRegenerateCode?: () => void;
  onOpenProfile?: () => void;
  onOpenRequestsModal?: () => void;
}

export const UserHeader: React.FC<UserHeaderProps> = ({
  identity,
  isConnected,
  onlineCount,
  soundEnabled,
  requestsCount = 0,
  onToggleSound,
  onUpdateName,
  onRegenerateCode,
  onOpenProfile,
  onOpenRequestsModal,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(identity.name);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(identity.code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleShareLink = () => {
    const url = `${window.location.origin}${window.location.pathname}?connect=${identity.code}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    if (tempName.trim()) {
      onUpdateName(tempName.trim());
      setIsEditingName(false);
    }
  };

  return (
    <header className="border-b border-slate-800 bg-slate-950/70 backdrop-blur-xl sticky top-0 z-30 px-4 py-3 sm:px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Brand & Connection Status */}
        <div className="flex items-center justify-between w-full md:w-auto gap-4">
          <div className="flex items-center gap-3">
            {/* Custom Vector Messaging Logo Emblem */}
            <div className="relative group cursor-pointer" onClick={onOpenProfile} title="BD CHAT BOOK প্রোফাইল খুলুন">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 via-indigo-600 to-emerald-400 p-[1.5px] shadow-lg shadow-cyan-500/25 transition-transform duration-300 group-hover:scale-105">
                <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center relative overflow-hidden">
                  {/* Vector SVG Emblem for Messaging Book */}
                  <svg viewBox="0 0 32 32" className="w-6 h-6" fill="none" xmlns="http://www.w3.org/2000/svg">
                    {/* Chat Bubble Base */}
                    <path
                      d="M5 9C5 6.79 6.79 5 9 5H23C25.21 5 27 6.79 27 9V19C27 21.21 25.21 23 23 23H13L8 27V23H9C7.89 23 6.89 22.55 6.17 21.83C5.45 21.11 5 20.11 5 19V9Z"
                      fill="url(#headerLogoGrad)"
                      stroke="#38bdf8"
                      strokeWidth="1.2"
                    />
                    {/* Book spine/center dividing line */}
                    <path d="M16 8V18" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" strokeDasharray="1 2" opacity="0.8" />
                    {/* Message / Page lines */}
                    <rect x="8.5" y="9.5" width="5" height="1.8" rx="0.9" fill="#ffffff" />
                    <rect x="8.5" y="13" width="4" height="1.5" rx="0.75" fill="#a7f3d0" />
                    <rect x="18.5" y="9.5" width="5" height="1.8" rx="0.9" fill="#ffffff" />
                    <rect x="18.5" y="13" width="4.5" height="1.5" rx="0.75" fill="#c7d2fe" />
                    <circle cx="21" cy="18" r="1.5" fill="#34d399" />
                    <defs>
                      <linearGradient id="headerLogoGrad" x1="5" y1="5" x2="27" y2="27" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#0891b2" />
                        <stop offset="0.5" stopColor="#4f46e5" />
                        <stop offset="1" stopColor="#059669" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              </div>
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-slate-950 animate-pulse shadow-sm" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <div className="flex items-center tracking-tight select-none">
                  <span className="font-black text-lg sm:text-xl text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.5)]">
                    BD
                  </span>
                  <span className="font-extrabold text-lg sm:text-xl text-white ml-1.5 tracking-wide">
                    CHAT
                  </span>
                  <span className="font-black text-lg sm:text-xl text-cyan-400 ml-1 tracking-wider drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]">
                    BOOK
                  </span>
                </div>
                <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-gradient-to-r from-cyan-950 to-slate-900 border border-cyan-500/50 text-cyan-300 shadow-sm flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  ফুল ডিসপ্লে
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium flex items-center gap-1.5 mt-0.5">
                <span className="text-emerald-300 font-semibold">৯-ডিজিট কোড</span>
                <span className="text-slate-600">•</span>
                <span className="text-slate-400">লাইভ P2P ও অফলাইন মেসেঞ্জার</span>
              </p>
            </div>
          </div>

          {/* Live Status indicator */}
          <div className="flex items-center gap-2 md:hidden">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                isConnected
                  ? 'bg-emerald-950/70 text-emerald-300 border-emerald-800/80'
                  : 'bg-amber-950/70 text-amber-300 border-amber-800/80'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}
              />
              <span>{isConnected ? 'অনলাইন' : 'কানেক্টিং...'}</span>
            </span>
          </div>
        </div>

        {/* User Code Card & Action Tools */}
        <div className="flex flex-wrap items-center justify-center md:justify-end gap-2.5 w-full md:w-auto">
          {/* Status badge for desktop */}
          <div className="hidden md:flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${
                isConnected
                  ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/70'
                  : 'bg-amber-950/60 text-amber-300 border-amber-800/70'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}
              />
              <span>{isConnected ? 'অনলাইন' : 'কানেক্টিং...'}</span>
            </span>

            {onlineCount > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs text-slate-400 bg-slate-900 border border-slate-800">
                <Users className="w-3.5 h-3.5 text-slate-500" />
                <span>{onlineCount} সক্রিয়</span>
              </span>
            )}
          </div>

          {/* User Profile Button with Avatar & Status */}
          <button
            id="open-profile-btn"
            type="button"
            onClick={onOpenProfile}
            className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 hover:border-cyan-500/50 text-slate-200 text-xs font-medium transition-all group shadow-sm active:scale-95"
            title="আমার প্রোফাইল ও কিউআর খুলুন"
          >
            {/* Avatar display */}
            <div className="relative">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white text-[11px] font-bold overflow-hidden shadow-inner">
                {identity.avatar && identity.avatar.startsWith('data:') ? (
                  <img
                    src={identity.avatar}
                    alt="avatar"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : identity.avatar === 'avatar_2' ? (
                  '🚀'
                ) : identity.avatar === 'avatar_3' ? (
                  '💎'
                ) : identity.avatar === 'avatar_4' ? (
                  '🔥'
                ) : identity.avatar === 'avatar_5' ? (
                  '🐱'
                ) : identity.avatar === 'avatar_6' ? (
                  '🌸'
                ) : identity.avatar === 'avatar_7' ? (
                  '🛡️'
                ) : identity.avatar === 'avatar_8' ? (
                  '🎯'
                ) : (
                  identity.name ? identity.name.charAt(0).toUpperCase() : 'U'
                )}
              </div>
              <span
                className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-slate-950 ${
                  identity.statusMood === 'busy'
                    ? 'bg-rose-400'
                    : identity.statusMood === 'away'
                    ? 'bg-amber-400'
                    : identity.statusMood === 'focus'
                    ? 'bg-purple-400'
                    : 'bg-emerald-400'
                }`}
              />
            </div>

            <div className="flex flex-col text-left">
              <span className="font-semibold text-slate-100 max-w-[85px] sm:max-w-[120px] truncate leading-tight">
                {identity.name}
              </span>
              <span className="text-[10px] text-cyan-400/80 group-hover:text-cyan-300 transition-colors leading-tight">
                প্রোফাইল
              </span>
            </div>

            <Sparkles className="w-3 h-3 text-cyan-400 opacity-60 group-hover:opacity-100 transition-opacity ml-0.5" />
          </button>

          {/* User's Distinct Code Badge */}
          <div className="flex items-center gap-1.5 bg-gradient-to-r from-indigo-950/80 to-slate-900 border border-indigo-500/40 px-3 py-1.5 rounded-xl shadow-inner">
            <span className="text-[11px] font-medium text-slate-400">আমার কোড:</span>
            <span
              id="my-user-code-display"
              className="font-mono text-sm sm:text-base font-extrabold text-cyan-300 tracking-wider"
            >
              {identity.code}
            </span>

            {/* Copy Code button */}
            <button
              id="copy-my-code-btn"
              type="button"
              onClick={handleCopyCode}
              className="p-1 rounded-lg hover:bg-indigo-800/40 text-slate-300 hover:text-white transition-all ml-0.5"
              title="কোড কপি করুন"
            >
              {copiedCode ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>

            {/* Share Direct Link button */}
            <button
              id="share-my-link-btn"
              type="button"
              onClick={handleShareLink}
              className="p-1 rounded-lg hover:bg-indigo-800/40 text-slate-300 hover:text-cyan-300 transition-all"
              title="কানেকশন লিঙ্ক কপি করুন"
            >
              {copiedLink ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Share2 className="w-3.5 h-3.5" />
              )}
            </button>

            {/* Regenerate Code button for testing in multiple tabs */}
            {onRegenerateCode && (
              <button
                id="regenerate-code-btn"
                type="button"
                onClick={onRegenerateCode}
                className="p-1 rounded-lg hover:bg-indigo-800/40 text-slate-400 hover:text-cyan-300 transition-all"
                title="নতুন কোড তৈরি করুন (ট্যাব টেস্টের জন্য)"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Message Requests Quick Button with Live Notification Badge */}
          {onOpenRequestsModal && (
            <button
              id="header-message-requests-btn"
              type="button"
              onClick={onOpenRequestsModal}
              className={`relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all shadow-sm active:scale-95 ${
                requestsCount > 0
                  ? 'bg-rose-950/80 border-rose-500/60 text-rose-200 hover:bg-rose-900/90 shadow-rose-500/20'
                  : 'bg-slate-900/90 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 hover:border-cyan-500/40'
              }`}
              title="মেসেজ রিকোয়েস্ট বক্স খুলুন"
            >
              <Inbox className={`w-4 h-4 ${requestsCount > 0 ? 'text-rose-400 animate-bounce' : 'text-cyan-400'}`} />
              <span className="hidden sm:inline font-['Hind_Siliguri',sans-serif]">রিকোয়েস্ট</span>
              {requestsCount > 0 ? (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500 text-white animate-pulse">
                  {requestsCount}
                </span>
              ) : (
                <span className="text-[10px] text-slate-500 font-mono">0</span>
              )}
            </button>
          )}

          {/* Sound Mute Toggle */}
          <button
            id="toggle-sound-btn"
            type="button"
            onClick={onToggleSound}
            className={`p-2 rounded-xl border transition-all ${
              soundEnabled
                ? 'bg-slate-900 border-slate-800 text-cyan-300 hover:bg-slate-800'
                : 'bg-slate-900/60 border-slate-800/60 text-slate-500 hover:text-slate-300'
            }`}
            title={soundEnabled ? 'সাউন্ড অ্যালার্ট চালু আছে' : 'সাউন্ড মিউট'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
};
