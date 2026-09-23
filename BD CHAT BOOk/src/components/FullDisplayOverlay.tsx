import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Send,
  Sparkles,
  Clock,
  User,
  Radio,
  RotateCcw,
  Download,
  Play,
  Pause,
  Palette,
  Film,
  Image as ImageIcon,
  Mic,
} from 'lucide-react';
import { ChatMessage, DisplayTheme } from '../types';
import { playFullDisplayAlert } from '../utils/audio';
import {
  acquireWakeLock,
  releaseWakeLock,
  updateFloatingPipContent,
} from '../utils/mobilePopup';

interface FullDisplayOverlayProps {
  message: ChatMessage | null;
  onClose: () => void;
  onQuickReply: (text: string) => void;
  onOpenDrawingReply?: () => void;
  isSenderPreview?: boolean;
}

const THEME_STYLES: Record<
  DisplayTheme,
  {
    name: string;
    bgClass: string;
    textClass: string;
    glowClass: string;
    accentClass: string;
    badgeBg: string;
    inputBg: string;
    neonColor: string;
  }
> = {
  neon: {
    name: 'Neon Cyan',
    bgClass: 'bg-slate-950 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(6,182,212,0.25),rgba(255,255,255,0))]',
    textClass: 'text-cyan-100 drop-shadow-[0_0_35px_rgba(6,182,212,0.6)]',
    glowClass: 'text-cyan-400',
    accentClass: 'border-cyan-500/30 text-cyan-300',
    badgeBg: 'bg-cyan-950/80 border-cyan-500/40 text-cyan-200',
    inputBg: 'bg-slate-900/90 border-cyan-500/40 focus:border-cyan-400',
    neonColor: '#06b6d4',
  },
  midnight: {
    name: 'Midnight Violet',
    bgClass: 'bg-slate-950 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(124,58,237,0.25),rgba(255,255,255,0))]',
    textClass: 'text-purple-100 drop-shadow-[0_0_35px_rgba(168,85,247,0.55)]',
    glowClass: 'text-purple-400',
    accentClass: 'border-purple-500/30 text-purple-300',
    badgeBg: 'bg-purple-950/80 border-purple-500/40 text-purple-200',
    inputBg: 'bg-slate-900/90 border-purple-500/40 focus:border-purple-400',
    neonColor: '#a855f7',
  },
  crimson: {
    name: 'Crimson Pulse',
    bgClass: 'bg-slate-950 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(239,68,68,0.28),rgba(255,255,255,0))]',
    textClass: 'text-rose-100 drop-shadow-[0_0_35px_rgba(244,63,94,0.6)]',
    glowClass: 'text-rose-400',
    accentClass: 'border-rose-500/30 text-rose-300',
    badgeBg: 'bg-rose-950/80 border-rose-500/40 text-rose-200',
    inputBg: 'bg-slate-900/90 border-rose-500/40 focus:border-rose-400',
    neonColor: '#f43f5e',
  },
  emerald: {
    name: 'Emerald Aurora',
    bgClass: 'bg-slate-950 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(16,185,129,0.25),rgba(255,255,255,0))]',
    textClass: 'text-emerald-100 drop-shadow-[0_0_35px_rgba(16,185,129,0.55)]',
    glowClass: 'text-emerald-400',
    accentClass: 'border-emerald-500/30 text-emerald-300',
    badgeBg: 'bg-emerald-950/80 border-emerald-500/40 text-emerald-200',
    inputBg: 'bg-slate-900/90 border-emerald-500/40 focus:border-emerald-400',
    neonColor: '#10b981',
  },
  sunset: {
    name: 'Sunset Flame',
    bgClass: 'bg-slate-950 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(249,115,22,0.28),rgba(255,255,255,0))]',
    textClass: 'text-amber-100 drop-shadow-[0_0_35px_rgba(245,158,11,0.6)]',
    glowClass: 'text-amber-400',
    accentClass: 'border-amber-500/30 text-amber-300',
    badgeBg: 'bg-amber-950/80 border-amber-500/40 text-amber-200',
    inputBg: 'bg-slate-900/90 border-amber-500/40 focus:border-amber-400',
    neonColor: '#f59e0b',
  },
  cyberpunk: {
    name: 'Cyber Gold',
    bgClass: 'bg-zinc-950 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(234,179,8,0.25),rgba(255,255,255,0))]',
    textClass: 'text-yellow-100 drop-shadow-[0_0_35px_rgba(234,179,8,0.65)]',
    glowClass: 'text-yellow-400',
    accentClass: 'border-yellow-500/30 text-yellow-300',
    badgeBg: 'bg-yellow-950/80 border-yellow-500/40 text-yellow-200',
    inputBg: 'bg-zinc-900/90 border-yellow-500/40 focus:border-yellow-400',
    neonColor: '#eab308',
  },
  monochrome: {
    name: 'Pure Monochrome',
    bgClass: 'bg-black bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(255,255,255,0.15),rgba(255,255,255,0))]',
    textClass: 'text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.45)]',
    glowClass: 'text-zinc-200',
    accentClass: 'border-zinc-700 text-zinc-300',
    badgeBg: 'bg-zinc-900 border-zinc-700 text-white',
    inputBg: 'bg-zinc-900 border-zinc-700 focus:border-zinc-400',
    neonColor: '#ffffff',
  },
};

export const FullDisplayOverlay: React.FC<FullDisplayOverlayProps> = ({
  message,
  onClose,
  onQuickReply,
  onOpenDrawingReply,
  isSenderPreview = false,
}) => {
  const [quickReplyText, setQuickReplyText] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [autoDismissSeconds, setAutoDismissSeconds] = useState<number | null>(null);
  const [remainingTime, setRemainingTime] = useState<number>(12);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Audio note playback state
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  const themeKey = (message?.theme || 'neon') as DisplayTheme;
  const currentTheme = THEME_STYLES[themeKey] || THEME_STYLES.neon;

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Handle sound effect chime on open, wake lock, and PiP update
  useEffect(() => {
    if (message) {
      acquireWakeLock();
      updateFloatingPipContent(message);

      if (message.sound !== false && !isSenderPreview) {
        playFullDisplayAlert(themeKey);
      }
    }

    return () => {
      releaseWakeLock();
    };
  }, [message, themeKey, isSenderPreview]);

  // Audio element auto setup for voice messages
  useEffect(() => {
    if (message?.msgType === 'audio' && message.mediaUrl) {
      const audio = new Audio(message.mediaUrl);
      audioElementRef.current = audio;

      audio.onloadedmetadata = () => {
        setAudioDuration(audio.duration || message.mediaInfo?.duration || 0);
      };

      audio.ontimeupdate = () => {
        if (audio.duration) {
          setAudioProgress((audio.currentTime / audio.duration) * 100);
        }
      };

      audio.onended = () => {
        setIsPlayingAudio(false);
        setAudioProgress(0);
      };

      // Autoplay voice note if receiver wants
      if (!isSenderPreview) {
        audio.play().then(() => setIsPlayingAudio(true)).catch(() => {});
      }

      return () => {
        audio.pause();
        audioElementRef.current = null;
      };
    }
  }, [message, isSenderPreview]);

  const togglePlayAudio = () => {
    const audio = audioElementRef.current;
    if (!audio) return;

    if (isPlayingAudio) {
      audio.pause();
      setIsPlayingAudio(false);
    } else {
      audio.play().then(() => setIsPlayingAudio(true)).catch(() => {});
    }
  };

  // Auto-dismiss countdown
  useEffect(() => {
    if (!autoDismissSeconds) return;

    setRemainingTime(autoDismissSeconds);
    const interval = setInterval(() => {
      setRemainingTime((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [autoDismissSeconds, onClose]);

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;

    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch {
      // ignore fullscreen failures in iframe
    }
  };

  const handleSpeak = () => {
    if (!message || typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const textToSpeak = message.content || message.mediaInfo?.name || 'নতুন বার্তা এসেছে';
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = 0.95;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleReplayChime = () => {
    playFullDisplayAlert(themeKey);
  };

  const handleSendQuickReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickReplyText.trim()) return;
    onQuickReply(quickReplyText.trim());
    setQuickReplyText('');
    onClose();
  };

  const handleDownload = (dataUrl?: string, filename?: string) => {
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename || `flashcast-${Date.now()}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (!message) return null;

  const msgType = message.msgType || (message.drawingData ? 'drawing' : message.mediaUrl ? 'image' : 'text');

  const length = message.content ? message.content.length : 0;
  let fontClasses = 'text-4xl sm:text-6xl md:text-7xl lg:text-8xl';
  if (length <= 15) {
    fontClasses = 'text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black tracking-tight';
  } else if (length <= 40) {
    fontClasses = 'text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight';
  } else if (length <= 100) {
    fontClasses = 'text-2xl sm:text-4xl md:text-5xl font-bold';
  } else {
    fontClasses = 'text-xl sm:text-2xl md:text-3xl font-medium leading-relaxed max-w-4xl';
  }

  const formatTime = (ts: number) => {
    const date = new Date(ts);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <AnimatePresence>
      <motion.div
        ref={containerRef}
        id="full-display-overlay"
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.97 }}
        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
        className={`fixed inset-0 z-50 flex flex-col justify-between overflow-hidden p-3 sm:p-6 select-text ${currentTheme.bgClass}`}
      >
        {/* Ambient glow backdrop */}
        <div className="absolute inset-0 pointer-events-none opacity-40 mix-blend-screen bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.08)_0%,transparent_70%)]" />

        {/* Top Header Bar */}
        <div className="relative z-10 flex items-center justify-between gap-3 w-full max-w-7xl mx-auto">
          {/* Sender Identity Badge */}
          <div className="flex items-center gap-2.5">
            <div
              className={`px-3.5 py-1.5 rounded-full border backdrop-blur-md flex items-center gap-2 shadow-lg ${currentTheme.badgeBg}`}
            >
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <div className="flex items-center gap-1.5 font-semibold text-xs sm:text-sm">
                <User className="w-3.5 h-3.5 opacity-70" />
                <span>{message.senderName}</span>
                <span className="opacity-40">·</span>
                <span className="font-mono tracking-wider font-bold">{message.senderCode}</span>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 bg-slate-900/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-800">
              <Clock className="w-3.5 h-3.5 opacity-60" />
              <span>{formatTime(message.timestamp)}</span>
            </div>

            {isSenderPreview && (
              <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-1 rounded-full font-medium">
                রিসিভারের স্ক্রিন প্রিভিউ
              </span>
            )}
          </div>

          {/* Action Controls */}
          <div className="flex items-center gap-2">
            {/* Auto-Dismiss toggle */}
            <button
              id="full-display-autodismiss-btn"
              type="button"
              onClick={() => {
                if (autoDismissSeconds) {
                  setAutoDismissSeconds(null);
                } else {
                  setAutoDismissSeconds(12);
                }
              }}
              className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-all backdrop-blur-md ${
                autoDismissSeconds
                  ? 'bg-indigo-600/40 text-indigo-200 border-indigo-500/50'
                  : 'bg-slate-900/70 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
              title="১২ সেকেন্ডে অটো ক্লোজ"
            >
              {autoDismissSeconds ? `অটো ক্লোজ (${remainingTime}s)` : 'অটো ক্লোজ'}
            </button>

            {/* Audio Chime Replay */}
            <button
              id="full-display-chime-btn"
              type="button"
              onClick={handleReplayChime}
              className="p-2 rounded-full bg-slate-900/70 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-all backdrop-blur-md"
              title="সাউন্ড পুনরায় বাজান"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Download button for drawings / photos */}
            {(msgType === 'drawing' || msgType === 'image') && (
              <button
                type="button"
                onClick={() =>
                  handleDownload(
                    message.drawingData || message.mediaUrl,
                    `${message.senderCode}_${msgType}_${Date.now()}.png`
                  )
                }
                className="p-2 rounded-full bg-slate-900/70 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-all backdrop-blur-md"
                title="ডাউনলোড ও সংরক্ষণ করুন"
              >
                <Download className="w-4 h-4" />
              </button>
            )}

            {/* Text to Speech for text */}
            {msgType === 'text' && typeof window !== 'undefined' && 'speechSynthesis' in window && (
              <button
                id="full-display-speak-btn"
                type="button"
                onClick={handleSpeak}
                className={`p-2 rounded-full border transition-all backdrop-blur-md ${
                  isSpeaking
                    ? 'bg-cyan-500/30 text-cyan-200 border-cyan-400 animate-pulse'
                    : 'bg-slate-900/70 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
                title={isSpeaking ? 'বন্ধ করুন' : 'পড়ে শোনান'}
              >
                <Volume2 className="w-4 h-4" />
              </button>
            )}

            {/* Fullscreen toggle */}
            <button
              id="full-display-fullscreen-btn"
              type="button"
              onClick={toggleFullscreen}
              className="p-2 rounded-full bg-slate-900/70 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-all backdrop-blur-md"
              title={isFullscreen ? 'সাধারণ ভিউ' : 'ফুলস্ক্রিন মোড'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Close Button */}
            <button
              id="full-display-close-btn"
              type="button"
              onClick={onClose}
              className="p-2 rounded-full bg-slate-900/90 border border-slate-700 text-slate-200 hover:text-white hover:bg-rose-950/60 hover:border-rose-600 transition-all backdrop-blur-md group"
              title="বন্ধ করুন (Esc)"
            >
              <X className="w-4 h-4 group-hover:scale-110 transition-transform" />
            </button>
          </div>
        </div>

        {/* Center Display: Adapts to type (Drawing / Image / Video / Voice / Text) */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center my-3 sm:my-6 px-2 sm:px-6 max-w-6xl mx-auto w-full overflow-hidden">
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{
              type: 'spring',
              stiffness: 260,
              damping: 24,
            }}
            className="w-full flex flex-col items-center justify-center max-h-[70vh]"
          >
            {/* 1. DRAWING DISPLAY */}
            {msgType === 'drawing' && (
              <div className="flex flex-col items-center justify-center max-h-[65vh] w-full">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-3 bg-pink-950/70 border border-pink-500/40 backdrop-blur-md text-pink-300">
                  <Palette className="w-3.5 h-3.5 text-pink-400" />
                  <span>লাইভ ড্রয়িং স্কেচ বার্তা 🎨</span>
                </div>

                <div className="relative p-2 rounded-2xl bg-slate-950/90 border-2 border-slate-800 shadow-[0_0_50px_rgba(236,72,153,0.3)] max-h-[50vh] flex items-center justify-center">
                  <img
                    src={message.drawingData || message.mediaUrl}
                    alt="User Drawing"
                    className="max-h-[46vh] w-auto max-w-full rounded-xl object-contain shadow-2xl"
                  />
                </div>

                {message.content && (
                  <p className="mt-3 text-lg sm:text-2xl font-bold text-white drop-shadow-md">
                    {message.content}
                  </p>
                )}
              </div>
            )}

            {/* 2. IMAGE DISPLAY */}
            {msgType === 'image' && (
              <div className="flex flex-col items-center justify-center max-h-[65vh] w-full">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-3 bg-cyan-950/70 border border-cyan-500/40 backdrop-blur-md text-cyan-300">
                  <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
                  <span>ফুল এইচডি ফটো ডিসপ্লে 📷</span>
                </div>

                <div className="relative p-1.5 rounded-2xl bg-slate-950/80 border border-slate-700/80 shadow-[0_0_60px_rgba(6,182,212,0.3)] max-h-[52vh] flex items-center justify-center">
                  <img
                    src={message.mediaUrl}
                    alt="Incoming photo"
                    className="max-h-[48vh] w-auto max-w-full rounded-xl object-contain shadow-2xl"
                  />
                </div>

                {message.content && (
                  <p className="mt-3 text-lg sm:text-2xl font-semibold text-white drop-shadow">
                    {message.content}
                  </p>
                )}
              </div>
            )}

            {/* 3. VIDEO DISPLAY */}
            {msgType === 'video' && (
              <div className="flex flex-col items-center justify-center max-h-[65vh] w-full max-w-3xl">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-3 bg-indigo-950/70 border border-indigo-500/40 backdrop-blur-md text-indigo-300">
                  <Film className="w-3.5 h-3.5 text-indigo-400" />
                  <span>ভিডিও প্লেয়ার থিয়েটার মোড 🎬</span>
                </div>

                <div className="relative w-full max-h-[50vh] rounded-2xl overflow-hidden bg-black border-2 border-indigo-500/50 shadow-[0_0_60px_rgba(99,102,241,0.35)] flex items-center justify-center">
                  <video
                    src={message.mediaUrl}
                    controls
                    autoPlay
                    playsInline
                    className="max-h-[48vh] w-full object-contain"
                  />
                </div>

                {message.content && (
                  <p className="mt-3 text-lg sm:text-2xl font-semibold text-white">
                    {message.content}
                  </p>
                )}
              </div>
            )}

            {/* 4. VOICE NOTE DISPLAY */}
            {msgType === 'audio' && (
              <div className="flex flex-col items-center justify-center max-w-xl w-full p-6 sm:p-8 rounded-3xl bg-slate-950/80 border border-indigo-500/30 backdrop-blur-xl shadow-[0_0_60px_rgba(99,102,241,0.25)]">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-6 bg-indigo-950/80 border border-indigo-500/40 text-indigo-300">
                  <Mic className="w-3.5 h-3.5 text-indigo-400" />
                  <span>ফুলস্ক্রিন ভয়েস অডিও ম্যাসেজ 🎙️</span>
                </div>

                {/* Animated visualizer concentric ripples */}
                <div className="relative mb-8 flex items-center justify-center">
                  {isPlayingAudio && (
                    <>
                      <div className="absolute w-36 h-36 rounded-full bg-indigo-500/20 animate-ping" />
                      <div className="absolute w-28 h-28 rounded-full bg-cyan-500/30 animate-pulse" />
                    </>
                  )}
                  <button
                    type="button"
                    onClick={togglePlayAudio}
                    className="relative z-10 w-20 h-20 rounded-full bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-600 hover:scale-105 active:scale-95 text-white flex items-center justify-center shadow-xl shadow-indigo-500/40 transition-all"
                  >
                    {isPlayingAudio ? (
                      <Pause className="w-9 h-9" />
                    ) : (
                      <Play className="w-9 h-9 translate-x-0.5" />
                    )}
                  </button>
                </div>

                {/* Progress bar */}
                <div className="w-full space-y-2">
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all duration-150"
                      style={{ width: `${audioProgress}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                    <span>{isPlayingAudio ? 'বাজছে...' : 'প্লে করতে ক্লিক করুন'}</span>
                    <span>{message.mediaInfo?.duration ? `${message.mediaInfo.duration}s` : ''}</span>
                  </div>
                </div>

                {message.content && (
                  <p className="mt-4 text-base sm:text-xl font-medium text-slate-200">
                    "{message.content}"
                  </p>
                )}
              </div>
            )}

            {/* 5. TEXT DISPLAY */}
            {msgType === 'text' && (
              <>
                <div className="flex items-center gap-2 mb-6 flex-wrap justify-center">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-900/60 border border-slate-800 backdrop-blur-md text-slate-400">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>ফুল ডিসপ্লে বার্তা · {currentTheme.name}</span>
                  </div>

                  {message.isEdited && (
                    <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/20 border border-amber-500/40 text-amber-300">
                      <span>সম্পাদিত (Edited)</span>
                    </div>
                  )}

                  {message.expiresAt && (
                    <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/20 border border-purple-500/40 text-purple-300">
                      <Clock className="w-3 h-3" />
                      <span>TTL: {message.ttlSeconds}s</span>
                    </div>
                  )}
                </div>

                <h1
                  id="full-display-message-text"
                  className={`font-['Hind_Siliguri','Plus_Jakarta_Sans',sans-serif] ${fontClasses} ${currentTheme.textClass} break-words whitespace-pre-wrap selection:bg-white/20`}
                >
                  {message.content}
                </h1>
              </>
            )}
          </motion.div>
        </div>

        {/* Bottom Bar: Quick Reply & Direct Controls */}
        <div className="relative z-10 w-full max-w-3xl mx-auto">
          {!isSenderPreview && (
            <div className="flex flex-col gap-2">
              <form
                id="full-display-reply-form"
                onSubmit={handleSendQuickReply}
                className="flex items-center gap-2 p-1.5 sm:p-2 rounded-2xl bg-slate-950/80 border border-slate-800 shadow-2xl backdrop-blur-xl"
              >
                <div className="flex items-center gap-2 pl-3 text-xs text-slate-400 font-medium hidden sm:flex">
                  <Radio className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                  <span>রিপ্লাই:</span>
                </div>

                <input
                  id="full-display-reply-input"
                  type="text"
                  value={quickReplyText}
                  onChange={(e) => setQuickReplyText(e.target.value)}
                  placeholder="সরাসরি ফুলস্ক্রিন থেকে রিপ্লাই লিখুন..."
                  className="flex-1 bg-transparent px-3 py-2 text-sm sm:text-base text-white placeholder-slate-500 focus:outline-none"
                />

                {onOpenDrawingReply && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenDrawingReply();
                    }}
                    className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-pink-300 transition-colors"
                    title="ড্র করে রিপ্লাই দিন"
                  >
                    <Palette className="w-4 h-4" />
                  </button>
                )}

                <button
                  id="full-display-reply-send-btn"
                  type="submit"
                  disabled={!quickReplyText.trim()}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-white font-semibold text-xs sm:text-sm shadow-lg shadow-indigo-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <span>পাঠান</span>
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}

          <div className="flex items-center justify-between text-xs text-slate-500 mt-2.5 px-2">
            <span>Esc কিবোর্ড কি চাপলে বন্ধ হবে</span>
            <span>{currentTheme.name} স্টাইল</span>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
