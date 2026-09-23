import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ShieldCheck, Zap, ArrowRight, Radio, MessageSquare } from 'lucide-react';
import { UserIdentity } from '../types';

interface AppOpeningAnimationProps {
  identity: UserIdentity;
  onComplete: () => void;
}

export const AppOpeningAnimation: React.FC<AppOpeningAnimationProps> = ({
  identity,
  onComplete,
}) => {
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('সিকিউর কানেকশন ইনিশিয়ালাইজ হচ্ছে...');

  useEffect(() => {
    const timer1 = setTimeout(() => {
      setProgress(35);
      setStatusText('P2P এনক্রিপশন ও অফলাইন ইঞ্জিন লোড হচ্ছে...');
    }, 400);

    const timer2 = setTimeout(() => {
      setProgress(75);
      setStatusText('৯-ডিজিট সিকিউর অ্যাড্রেস প্রস্তুত...');
    }, 900);

    const timer3 = setTimeout(() => {
      setProgress(100);
      setStatusText('স্বাগতম! BD CHAT BOOK উন্মুক্ত হচ্ছে...');
    }, 1500);

    const timerComplete = setTimeout(() => {
      onComplete();
    }, 2100);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timerComplete);
    };
  }, [onComplete]);

  return (
    <motion.div
      id="app-opening-splash"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 0.5, ease: 'easeInOut' }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950 text-slate-100 overflow-hidden select-none"
    >
      {/* Dynamic Background Glow Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{
            scale: [1, 1.25, 1],
            opacity: [0.25, 0.45, 0.25],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-emerald-500/20 blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-cyan-500/20 blur-3xl"
        />
        <motion.div
          animate={{
            scale: [0.9, 1.15, 0.9],
            opacity: [0.15, 0.3, 0.15],
          }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-indigo-500/15 blur-3xl"
        />

        {/* Ambient Grid overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-30" />
      </div>

      <div className="relative z-10 flex flex-col items-center px-6 max-w-md w-full text-center">
        {/* Animated Central Emblem */}
        <div className="relative mb-6">
          {/* Pulsing Concentric Ripple Rings */}
          <motion.div
            animate={{
              scale: [1, 1.6, 2],
              opacity: [0.6, 0.3, 0],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: 'easeOut',
            }}
            className="absolute inset-0 rounded-3xl bg-cyan-500/30 blur-sm pointer-events-none"
          />
          <motion.div
            animate={{
              scale: [1, 1.8, 2.4],
              opacity: [0.4, 0.15, 0],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'easeOut',
              delay: 0.6,
            }}
            className="absolute inset-0 rounded-3xl bg-emerald-500/20 blur-md pointer-events-none"
          />

          {/* Central Logo Box */}
          <motion.div
            initial={{ scale: 0.5, rotate: -15, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-tr from-cyan-500 via-indigo-600 to-emerald-400 p-[2px] shadow-2xl shadow-cyan-500/30"
          >
            <div className="w-full h-full bg-slate-950 rounded-[22px] flex flex-col items-center justify-center relative overflow-hidden">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-cyan-400/20 via-transparent to-transparent"
              />
              <Sparkles className="w-10 h-10 sm:w-12 sm:h-12 text-cyan-300 drop-shadow-[0_0_12px_rgba(6,182,212,0.8)]" />
              <div className="flex items-center gap-1 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] font-mono tracking-widest text-emerald-400 font-bold uppercase">
                  ACTIVE
                </span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Brand Title */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-800/60 mb-2">
            <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span className="text-[11px] font-semibold text-cyan-300 tracking-wide">
              ফুল ডিসপ্লে • ৯-ডিজিট মেসেঞ্জার
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-300 via-teal-100 to-cyan-300 bg-clip-text text-transparent">
            BD CHAT BOOK
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-xs mx-auto">
            স্মার্ট ফুল স্ক্রিন অ্যালার্ট, অফলাইন চ্যাট ও নিরাপদ সরাসরি যোগাযোগ
          </p>
        </motion.div>

        {/* User Identity Chip Preview */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.35, duration: 0.5 }}
          className="mt-6 w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between shadow-xl backdrop-blur-md"
        >
          <div className="flex items-center gap-3 text-left">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
              {identity.name ? identity.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">আপনার সিকিউর কোড</p>
              <p className="font-mono text-base font-extrabold text-cyan-300 tracking-wider">
                {identity.code}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/80 border border-emerald-800/60 text-emerald-400 text-xs font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>P2P রেডি</span>
          </div>
        </motion.div>

        {/* Progress Bar & Status Text */}
        <div className="w-full mt-6">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="truncate pr-2">{statusText}</span>
            <span className="font-mono font-semibold text-cyan-400">{progress}%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden p-0.5">
            <motion.div
              initial={{ width: '0%' }}
              animate={{ width: `${progress}%` }}
              transition={{ ease: 'easeOut', duration: 0.4 }}
              className="h-full bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 rounded-full shadow-[0_0_10px_rgba(45,212,191,0.7)]"
            />
          </div>
        </div>

        {/* Fast Skip / Enter Now Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-6"
        >
          <button
            id="skip-opening-btn"
            type="button"
            onClick={onComplete}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-cyan-500/50 text-slate-200 hover:text-white text-xs font-semibold transition-all shadow-lg hover:shadow-cyan-500/20 active:scale-95 group"
          >
            <span>সরাসরি অ্যাপে প্রবেশ করুন</span>
            <ArrowRight className="w-3.5 h-3.5 text-cyan-400 group-hover:translate-x-1 transition-transform" />
          </button>
        </motion.div>
      </div>

      {/* Footer credit */}
      <div className="absolute bottom-4 text-center text-[11px] text-slate-600 font-mono">
        BD CHAT BOOK • Ultra Fast Real-time & Offline P2P Messenger
      </div>
    </motion.div>
  );
};
