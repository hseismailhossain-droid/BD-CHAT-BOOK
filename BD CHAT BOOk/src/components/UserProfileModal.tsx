import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  User,
  Copy,
  Check,
  Share2,
  QrCode,
  Sparkles,
  Camera,
  RefreshCw,
  Volume2,
  VolumeX,
  Play,
  ShieldCheck,
  Radio,
  Flame,
  Zap,
  Smile,
  Bell,
  Sliders,
  Users,
  CheckCircle2,
  Smartphone,
  Globe,
  UploadCloud,
  Terminal,
  ExternalLink,
  FileCode,
} from 'lucide-react';
import { UserIdentity } from '../types';
import { generateQrDataUrl } from '../utils/offlineTransfer';
import { playFullDisplayAlert } from '../utils/audio';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  identity: UserIdentity;
  onUpdateIdentity: (updated: UserIdentity) => void;
  onRegenerateCode: () => void;
  savedPeersCount: number;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onReplayOpeningAnimation?: () => void;
}

// Preset visual avatars
const AVATAR_PRESETS = [
  { id: 'avatar_1', icon: '⚡', label: 'সাইবার', bg: 'from-cyan-500 to-blue-600' },
  { id: 'avatar_2', icon: '🚀', label: 'রকেট', bg: 'from-indigo-500 to-purple-600' },
  { id: 'avatar_3', icon: '💎', label: 'ডায়মন্ড', bg: 'from-emerald-500 to-teal-600' },
  { id: 'avatar_4', icon: '🔥', label: 'ব্লেজ', bg: 'from-rose-500 to-orange-600' },
  { id: 'avatar_5', icon: '🐱', label: 'ক্যাট', bg: 'from-fuchsia-500 to-pink-600' },
  { id: 'avatar_6', icon: '🌸', label: 'লোটাস', bg: 'from-teal-400 to-emerald-500' },
  { id: 'avatar_7', icon: '🛡️', label: 'শিল্ড', bg: 'from-blue-600 to-indigo-800' },
  { id: 'avatar_8', icon: '🎯', label: 'টার্গেট', bg: 'from-amber-500 to-red-600' },
];

const STATUS_PRESETS = [
  'BD CHAT BOOK এ সক্রিয় আছি ✨',
  'ফুল ডিসপ্লেতে মেসেজ পাঠান 🚀',
  'জরুরি বার্তা পাঠান ⚡',
  'অফলাইন মোড সক্রিয় 📴',
  'কাজে ব্যস্ত আছি ⏳',
  'শুধু দরকারি নক দিন 💬',
];

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  identity,
  onUpdateIdentity,
  onRegenerateCode,
  savedPeersCount,
  soundEnabled,
  onToggleSound,
  onReplayOpeningAnimation,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'qr' | 'settings' | 'publish'>('profile');
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);
  const [name, setName] = useState(identity.name);
  const [bio, setBio] = useState(identity.bio || 'BD CHAT BOOK এ সক্রিয় আছি ✨');
  const [selectedAvatar, setSelectedAvatar] = useState(identity.avatar || 'avatar_1');
  const [statusMood, setStatusMood] = useState<'online' | 'busy' | 'away' | 'focus'>(
    identity.statusMood || 'online'
  );
  const [customPhoto, setCustomPhoto] = useState<string | null>(
    identity.avatar && identity.avatar.startsWith('data:') ? identity.avatar : null
  );

  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Sync state when identity changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setName(identity.name);
      setBio(identity.bio || 'BD CHAT BOOK এ সক্রিয় আছি ✨');
      setSelectedAvatar(identity.avatar || 'avatar_1');
      setStatusMood(identity.statusMood || 'online');
      if (identity.avatar && identity.avatar.startsWith('data:')) {
        setCustomPhoto(identity.avatar);
      } else {
        setCustomPhoto(null);
      }
    }
  }, [isOpen, identity]);

  // Generate QR code for user's share link
  useEffect(() => {
    if (isOpen) {
      const shareUrl = `${window.location.origin}${window.location.pathname}?connect=${identity.code}`;
      generateQrDataUrl(shareUrl).then((url) => {
        setQrDataUrl(url);
      });
    }
  }, [isOpen, identity.code]);

  if (!isOpen) return null;

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

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('ছবির সাইজ ২MB এর চেয়ে ছোট হতে হবে');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setCustomPhoto(base64);
        setSelectedAvatar(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = () => {
    setIsSaving(true);
    const finalAvatar = customPhoto || selectedAvatar;
    const updated: UserIdentity = {
      ...identity,
      name: name.trim() || identity.name,
      bio: bio.trim(),
      avatar: finalAvatar,
      statusMood,
    };
    onUpdateIdentity(updated);

    setTimeout(() => {
      setIsSaving(false);
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        onClose();
      }, 700);
    }, 300);
  };

  const currentPreset = AVATAR_PRESETS.find((p) => p.id === selectedAvatar);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-auto"
        >
          {/* Cover Header Banner */}
          <div className="relative h-28 sm:h-32 bg-gradient-to-r from-emerald-600 via-teal-700 to-indigo-800 p-4 flex items-start justify-between overflow-hidden">
            {/* Background design elements */}
            <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px] opacity-15" />
            <div className="relative z-10 flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full bg-slate-950/60 backdrop-blur-md border border-white/20 text-white text-xs font-semibold tracking-wide flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
                <span>আমার প্রোফাইল</span>
              </span>
            </div>

            <button
              id="close-profile-modal-btn"
              type="button"
              onClick={onClose}
              className="relative z-10 p-2 rounded-full bg-slate-950/60 hover:bg-slate-950/80 border border-white/20 text-white transition-all hover:scale-105 active:scale-95"
              title="বন্ধ করুন"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Avatar & Main Info Overlap */}
          <div className="px-5 sm:px-6 relative -mt-12 sm:-mt-14 pb-4">
            <div className="flex flex-col sm:flex-row items-center sm:items-end justify-between gap-3 text-center sm:text-left">
              {/* Avatar with Status Ring */}
              <div className="relative group">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-slate-950 p-1 border-2 border-slate-700 shadow-xl overflow-hidden flex items-center justify-center">
                  {customPhoto ? (
                    <img
                      src={customPhoto}
                      alt="Profile Avatar"
                      className="w-full h-full object-cover rounded-xl"
                      referrerPolicy="no-referrer"
                    />
                  ) : currentPreset ? (
                    <div
                      className={`w-full h-full rounded-xl bg-gradient-to-tr ${currentPreset.bg} flex items-center justify-center text-4xl shadow-inner`}
                    >
                      {currentPreset.icon}
                    </div>
                  ) : (
                    <div className="w-full h-full rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-3xl font-bold text-white">
                      {name ? name.charAt(0).toUpperCase() : 'U'}
                    </div>
                  )}
                </div>

                {/* Status Dot Ring */}
                <div
                  className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-slate-900 flex items-center justify-center shadow-lg ${
                    statusMood === 'online'
                      ? 'bg-emerald-500'
                      : statusMood === 'busy'
                      ? 'bg-rose-500'
                      : statusMood === 'away'
                      ? 'bg-amber-500'
                      : 'bg-purple-500'
                  }`}
                  title={`স্ট্যাটাস: ${
                    statusMood === 'online'
                      ? 'অনলাইন'
                      : statusMood === 'busy'
                      ? 'ব্যস্ত'
                      : statusMood === 'away'
                      ? 'অনুপস্থিত'
                      : 'ফুল ফোকাস'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-white/90 animate-pulse" />
                </div>

                {/* Upload Photo Overlay Button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 bg-black/60 rounded-2xl opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity text-[11px] font-semibold"
                  title="কাস্টম ছবি আপলোড করুন"
                >
                  <Camera className="w-5 h-5 mb-1 text-cyan-300" />
                  <span>ছবি পরিবর্তন</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </div>

              {/* Name & Code Display */}
              <div className="flex-1 mt-2 sm:mt-0">
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                    {name || 'ব্যবহারকারী'}
                  </h2>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                      statusMood === 'online'
                        ? 'bg-emerald-950/80 border-emerald-800 text-emerald-400'
                        : statusMood === 'busy'
                        ? 'bg-rose-950/80 border-rose-800 text-rose-400'
                        : statusMood === 'away'
                        ? 'bg-amber-950/80 border-amber-800 text-amber-400'
                        : 'bg-purple-950/80 border-purple-800 text-purple-400'
                    }`}
                  >
                    {statusMood === 'online'
                      ? 'অনলাইন'
                      : statusMood === 'busy'
                      ? 'ব্যস্ত'
                      : statusMood === 'away'
                      ? 'দূরে আছি'
                      : 'ফোকাস মোড'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5 line-clamp-1 italic">
                  "{bio || 'BD CHAT BOOK এ সক্রিয় আছি ✨'}"
                </p>
              </div>

              {/* 9-Digit Code Tag */}
              <div className="bg-slate-950/90 border border-indigo-500/40 px-3.5 py-1.5 rounded-xl shadow-inner flex items-center gap-2">
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">আমার কোড</span>
                  <span className="font-mono text-base font-extrabold text-cyan-300 tracking-wider">
                    {identity.code}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="p-1.5 rounded-lg bg-indigo-950 hover:bg-indigo-900 border border-indigo-700/50 text-slate-300 hover:text-white transition-all"
                  title="কোড কপি করুন"
                >
                  {copiedCode ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-1.5 mt-5 p-1 bg-slate-950/80 rounded-2xl border border-slate-800 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab('profile')}
                className={`flex-1 py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'profile'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>প্রোফাইল সাজান</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('qr')}
                className={`flex-1 py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'qr'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>QR কোড ও শেয়ার</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('settings')}
                className={`flex-1 py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'settings'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>সেটিংস</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('publish')}
                className={`flex-1 py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'publish'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>পাবলিশ ও হোস্টিং</span>
              </button>
            </div>

            {/* Tab 1: Profile Customization */}
            {activeTab === 'profile' && (
              <div className="mt-4 space-y-4">
                {/* Choose Avatar Presets */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">
                    অ্যাভাটার নির্বাচন করুন অথবা কাস্টম ছবি দিন:
                  </label>
                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                    {AVATAR_PRESETS.map((preset) => {
                      const isSelected = selectedAvatar === preset.id && !customPhoto;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => {
                            setCustomPhoto(null);
                            setSelectedAvatar(preset.id);
                          }}
                          className={`p-2 rounded-2xl flex flex-col items-center justify-center gap-1 border transition-all ${
                            isSelected
                              ? 'border-cyan-400 bg-cyan-950/60 shadow-lg shadow-cyan-500/20 scale-105'
                              : 'border-slate-800 bg-slate-950/60 hover:bg-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <span className="text-xl sm:text-2xl">{preset.icon}</span>
                          <span className="text-[10px] text-slate-400 font-medium truncate max-w-full">
                            {preset.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Name Input */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    আপনার ডিসপ্লে নাম:
                  </label>
                  <input
                    id="profile-name-input"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="আপনার নাম লিখুন..."
                    maxLength={25}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none transition-colors"
                  />
                </div>

                {/* Status Mood Selection */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    স্ট্যাটাস মুড (উপস্থিতি):
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      type="button"
                      onClick={() => setStatusMood('online')}
                      className={`p-2 rounded-xl border text-xs font-medium flex items-center justify-center gap-2 transition-all ${
                        statusMood === 'online'
                          ? 'border-emerald-500 bg-emerald-950/60 text-emerald-300 shadow-md'
                          : 'border-slate-800 bg-slate-950 text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span>অনলাইন</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatusMood('busy')}
                      className={`p-2 rounded-xl border text-xs font-medium flex items-center justify-center gap-2 transition-all ${
                        statusMood === 'busy'
                          ? 'border-rose-500 bg-rose-950/60 text-rose-300 shadow-md'
                          : 'border-slate-800 bg-slate-950 text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-rose-400" />
                      <span>ব্যস্ত</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatusMood('away')}
                      className={`p-2 rounded-xl border text-xs font-medium flex items-center justify-center gap-2 transition-all ${
                        statusMood === 'away'
                          ? 'border-amber-500 bg-amber-950/60 text-amber-300 shadow-md'
                          : 'border-slate-800 bg-slate-950 text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                      <span>দূরে আছি</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatusMood('focus')}
                      className={`p-2 rounded-xl border text-xs font-medium flex items-center justify-center gap-2 transition-all ${
                        statusMood === 'focus'
                          ? 'border-purple-500 bg-purple-950/60 text-purple-300 shadow-md'
                          : 'border-slate-800 bg-slate-950 text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-purple-400" />
                      <span>ফোকাস মোড</span>
                    </button>
                  </div>
                </div>

                {/* Status Bio Line & Quick Chips */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-300">
                      বায়ো / স্ট্যাটাস বার্তা:
                    </label>
                    <span className="text-[10px] text-slate-500">{bio.length}/60</span>
                  </div>
                  <input
                    id="profile-bio-input"
                    type="text"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    maxLength={60}
                    placeholder="আপনার বর্তমান স্ট্যাটাস..."
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none transition-colors"
                  />

                  {/* Preset Bio Chips */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {STATUS_PRESETS.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setBio(preset)}
                        className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-cyan-300 hover:border-cyan-800/60 transition-all text-left"
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: QR Code & Share ID */}
            {activeTab === 'qr' && (
              <div className="mt-4 flex flex-col items-center text-center space-y-4">
                <p className="text-xs text-slate-400 max-w-sm">
                  কাছের যে কাউকে এই কিউআর কোডটি স্ক্যান করতে বলুন। স্ক্যান করলেই তাৎক্ষণিক চ্যাট
                  কানেকশন ওপেন হবে।
                </p>

                {/* QR Code Container */}
                <div className="p-3 bg-white rounded-2xl shadow-xl shadow-cyan-500/10 border-4 border-slate-800 inline-block">
                  {qrDataUrl ? (
                    <img
                      src={qrDataUrl}
                      alt="BD CHAT BOOK ID QR"
                      className="w-48 h-48 sm:w-56 sm:h-56 object-contain"
                    />
                  ) : (
                    <div className="w-48 h-48 flex items-center justify-center text-slate-400 text-xs">
                      কিউআর লোড হচ্ছে...
                    </div>
                  )}
                </div>

                {/* Code Showcase & Action Buttons */}
                <div className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="text-left w-full sm:w-auto">
                    <span className="text-[11px] text-slate-400 block font-medium">
                      শেয়ারেবল ৯-ডিজিট কোড
                    </span>
                    <span className="font-mono text-xl sm:text-2xl font-black text-cyan-300 tracking-wider">
                      {identity.code}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={handleCopyCode}
                      className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-white transition-all"
                    >
                      {copiedCode ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span>{copiedCode ? 'কপি হয়েছে' : 'কোড কপি'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleShareLink}
                      className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition-all shadow-md"
                    >
                      {copiedLink ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Share2 className="w-3.5 h-3.5" />
                      )}
                      <span>{copiedLink ? 'লিঙ্ক কপি হয়েছে' : 'লিঙ্ক শেয়ার'}</span>
                    </button>
                  </div>
                </div>

                {/* Regenerate Code warning / action */}
                <div className="w-full bg-slate-950/60 border border-amber-900/40 rounded-xl p-3 flex items-center justify-between text-left">
                  <div>
                    <p className="text-xs font-semibold text-amber-300">নতুন ৯-ডিজিট কোড চান?</p>
                    <p className="text-[11px] text-slate-400">
                      কোড পরিবর্তন করলে পুরাতন সেশনের পরিচিতিদের সাথে নতুন কোড শেয়ার করতে হবে।
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('আপনি কি নিশ্চিত যে নতুন একটি ৯-ডিজিট কোড জেনারেট করতে চান?')) {
                        onRegenerateCode();
                      }
                    }}
                    className="px-3 py-1.5 rounded-lg bg-amber-950/80 hover:bg-amber-900 border border-amber-800/80 text-amber-300 text-xs font-semibold whitespace-nowrap ml-2"
                  >
                    নতুন কোড
                  </button>
                </div>
              </div>
            )}

            {/* Tab 3: Settings & Diagnostics */}
            {activeTab === 'settings' && (
              <div className="mt-4 space-y-3">
                {/* Sound Alert Toggle & Test */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-950 border border-indigo-800 flex items-center justify-center text-indigo-400">
                      <Bell className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">ফুল ডিসপ্লে অডিও অ্যালার্ট</h4>
                      <p className="text-[11px] text-slate-400">
                        নতুন বার্তা এলে চমৎকার অ্যালার্ট টিউন বাজবে
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => playFullDisplayAlert()}
                      className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-[11px] font-medium text-cyan-300 flex items-center gap-1"
                      title="অ্যালার্ট সাউন্ড টেস্ট করুন"
                    >
                      <Play className="w-3 h-3" />
                      <span>টেস্ট</span>
                    </button>
                    <button
                      type="button"
                      onClick={onToggleSound}
                      className={`p-2 rounded-xl border transition-all ${
                        soundEnabled
                          ? 'bg-emerald-950 border-emerald-800 text-emerald-300'
                          : 'bg-slate-900 border-slate-800 text-slate-500'
                      }`}
                    >
                      {soundEnabled ? (
                        <Volume2 className="w-4 h-4" />
                      ) : (
                        <VolumeX className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Opening Animation Replay */}
                {onReplayOpeningAnimation && (
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white">ওপেনিং স্প্ল্যাশ অ্যানিমেশন</h4>
                        <p className="text-[11px] text-slate-400">
                          অ্যাপ চালুর সুন্দর সাইবার অ্যানিমেশনটি পুনরায় দেখুন
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onReplayOpeningAnimation();
                      }}
                      className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition-all shadow-md active:scale-95"
                    >
                      প্লে করুন
                    </button>
                  </div>
                )}

                {/* Account Stats & Overview */}
                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-3 text-center">
                    <Users className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                    <span className="text-lg font-bold text-white block">{savedPeersCount}</span>
                    <span className="text-[10px] text-slate-400">সেভ করা কন্টাক্ট</span>
                  </div>

                  <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-3 text-center">
                    <ShieldCheck className="w-4 h-4 text-cyan-400 mx-auto mb-1" />
                    <span className="text-xs font-bold text-emerald-400 block mt-1">সক্রিয় ও এনক্রিপ্টেড</span>
                    <span className="text-[10px] text-slate-400">P2P মেশ ইঞ্জিন</span>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 4: Publishing & Deployment Guide */}
            {activeTab === 'publish' && (
              <div className="mt-4 space-y-4 max-h-[480px] overflow-y-auto pr-1">
                {/* Intro Banner */}
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/70 via-teal-950/70 to-cyan-950/70 border border-emerald-500/30">
                  <div className="flex items-start gap-2.5">
                    <div className="p-2 rounded-xl bg-emerald-900/60 text-emerald-300 shrink-0 mt-0.5">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">অ্যাপ পাবলিশ ও হোস্টিং রেডি!</h4>
                      <p className="text-[11px] text-slate-300 leading-relaxed mt-0.5">
                        আপনার অ্যাপে গুগল সার্চ কনসোল ভেরিফিকেশন, সাইটম্যাপ, robots.txt, vercel.json এবং প্লে স্টোর TWA কনফিগারেশন স্বয়ংক্রিয়ভাবে প্রস্তুত করা হয়েছে।
                      </p>
                    </div>
                  </div>
                </div>

                {/* 1. Google Search Console */}
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-red-950/80 border border-red-800/60 flex items-center justify-center text-red-400 font-bold text-xs">
                        G
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-100">১. গুগল সার্চ কনসোল (Google Search Console)</h4>
                        <p className="text-[10px] text-slate-400">গুগলে আপনার সাইট ইনডেক্স ও সার্চ রেজাল্টে আনতে</p>
                      </div>
                    </div>
                    <a
                      href="https://search.google.com/search-console"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold"
                    >
                      <span>ওপেন কনসোল</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <div className="space-y-2 text-[11px] text-slate-300">
                    <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900 border border-slate-800">
                      <div>
                        <span className="text-slate-400 block text-[10px]">HTML ভেরিফিকেশন মেটা ট্যাগ:</span>
                        <code className="text-cyan-300 font-mono text-[10px]">
                          &lt;meta name="google-site-verification" content="..." /&gt;
                        </code>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText('<meta name="google-site-verification" content="GSC_VERIFICATION_TOKEN_HERE" />');
                          setCopiedSnippet('gsc');
                          setTimeout(() => setCopiedSnippet(null), 2000);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-semibold flex items-center gap-1"
                      >
                        {copiedSnippet === 'gsc' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedSnippet === 'gsc' ? 'কপি হয়েছে' : 'কপি'}</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800">
                        <span className="text-slate-400 block font-medium">রোবট ফাইল (Robots.txt):</span>
                        <span className="text-emerald-400 font-mono">/robots.txt (রেডি)</span>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800">
                        <span className="text-slate-400 block font-medium">সাইটম্যাপ ফাইল (Sitemap):</span>
                        <span className="text-emerald-400 font-mono">/sitemap.xml (রেডি)</span>
                      </div>
                    </div>

                    <p className="text-[10px] text-slate-400 leading-relaxed">
                      💡 <strong>ধাপ:</strong> Search Console এ URL Prefix দিয়ে ডোমেইন যুক্ত করুন ➜ Verification মেথড হিসেবে 'HTML Tag' সিলেক্ট করুন ➜ এরপর Sitemaps ট্যাবে গিয়ে <code className="text-cyan-300">sitemap.xml</code> সাবমিট করুন।
                    </p>
                  </div>
                </div>

                {/* 2. GitHub Push Instructions */}
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-purple-950/80 border border-purple-800/60 flex items-center justify-center text-purple-400">
                        <Terminal className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-100">২. গিটহাব এ আপলোড (GitHub Repo Push)</h4>
                        <p className="text-[10px] text-slate-400">কোড গিটহাবে পুশ করার টার্মিনাল কমান্ড</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const cmds = `git init\ngit add .\ngit commit -m "Initial commit for BD CHAT BOOK"\ngit branch -M main\ngit remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git\ngit push -u origin main`;
                        navigator.clipboard.writeText(cmds);
                        setCopiedSnippet('git');
                        setTimeout(() => setCopiedSnippet(null), 2000);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-semibold flex items-center gap-1"
                    >
                      {copiedSnippet === 'git' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedSnippet === 'git' ? 'কপি হয়েছে' : 'কমান্ড কপি'}</span>
                    </button>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-[10px] font-mono text-cyan-300 space-y-1 overflow-x-auto">
                    <div>git init</div>
                    <div>git add .</div>
                    <div>git commit -m "Initial commit for BD CHAT BOOK"</div>
                    <div>git branch -M main</div>
                    <div>git remote add origin https://github.com/YOUR_USERNAME/bd-chat-book.git</div>
                    <div>git push -u origin main</div>
                  </div>
                </div>

                {/* 3. Vercel Publishing */}
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-cyan-950/80 border border-cyan-800/60 flex items-center justify-center text-cyan-400">
                        <UploadCloud className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-100">৩. ভার্সেল এ ডিপ্লয় (Vercel Deployment)</h4>
                        <p className="text-[10px] text-slate-400">vercel.json অটো কনফিগার করা আছে</p>
                      </div>
                    </div>
                    <a
                      href="https://vercel.com/new"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold"
                    >
                      <span>Vercel Import</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <div className="space-y-1.5 text-[10px] text-slate-300">
                    <div className="p-2 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Framework Preset:</span>
                        <span className="text-white font-semibold">Vite</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Build Command:</span>
                        <span className="text-white font-semibold font-mono">npm run build</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Output Directory:</span>
                        <span className="text-white font-semibold font-mono">dist</span>
                      </div>
                    </div>
                    <p className="text-slate-400 leading-relaxed">
                      💡 <strong>নোট:</strong> লাইভ সিগন্যালিং এর জন্য চাইলে Render বা Railway তে ব্যাকএন্ড হোস্ট করে Vercel এর Environment Variables এ <code className="text-cyan-300">VITE_WS_URL=wss://your-backend-domain.com</code> সেট করে দিতে পারেন।
                    </p>
                  </div>
                </div>

                {/* 4. Google Play Store */}
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-emerald-950/80 border border-emerald-800/60 flex items-center justify-center text-emerald-400">
                        <Smartphone className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-100">৪. গুগল প্লে স্টোর (Google Play Store Publishing)</h4>
                        <p className="text-[10px] text-slate-400">TWA (Trusted Web Activity) ও Android App Bundle (.aab)</p>
                      </div>
                    </div>
                    <a
                      href="https://www.pwabuilder.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-semibold"
                    >
                      <span>PWABuilder</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <div className="space-y-2 text-[10px] text-slate-300">
                    <p className="leading-relaxed">
                      অ্যাপটিতে <strong>Web App Manifest</strong>, <strong>Service Worker</strong>, <strong>192x192</strong> ও <strong>512x512 PWA Icons</strong> এবং <strong>Digital Asset Links (<code className="text-cyan-300">.well-known/assetlinks.json</code>)</strong> সম্পূর্ণ রেডি আছে।
                    </p>
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>১ ক্লিকে প্লে স্টোর প্যাকেজ তৈরি:</span>
                      </div>
                      <ol className="list-decimal list-inside space-y-1 text-slate-300 pl-1">
                        <li>ভার্সেল বা আপনার লাইভ অ্যাপ URL কপি করুন</li>
                        <li><strong>PWABuilder.com</strong> এ গিয়ে URL পেস্ট করে <strong>"Start"</strong> চাপুন</li>
                        <li><strong>"Package for Stores"</strong> থেকে <strong>Android</strong> সিলেক্ট করুন</li>
                        <li><strong>Generate APK / AAB</strong> এ ক্লিক করে সরাসরি প্লে স্টোর রেডি <strong>.aab</strong> ফাইল ডাউনলোড করে নিন!</li>
                        <li>Google Play Console এ আপলোড করে লাইভ পাবলিশ করুন।</li>
                      </ol>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Save Action Button */}
            <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
              <span className="text-[11px] text-slate-500 font-mono">
                BD CHAT BOOK ID • {identity.code}
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold transition-all"
                >
                  বাতিল
                </button>

                <button
                  id="save-profile-btn"
                  type="button"
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold transition-all shadow-lg shadow-teal-500/20 active:scale-95 flex items-center gap-1.5"
                >
                  {saveSuccess ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                      <span>সেভ হয়েছে!</span>
                    </>
                  ) : isSaving ? (
                    <span>সংরক্ষণ হচ্ছে...</span>
                  ) : (
                    <span>প্রোফাইল সেভ করুন</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
