import React, { useState, useEffect } from 'react';
import { Layers, Check, ExternalLink } from 'lucide-react';
import {
  isPipSupported,
  openFloatingPipWindow,
  closeFloatingPipWindow,
} from '../utils/mobilePopup';
import { ChatMessage } from '../types';

interface FloatingPipButtonProps {
  currentMessage?: ChatMessage | null;
  onSelectMessage?: (msg: ChatMessage) => void;
}

export const FloatingPipButton: React.FC<FloatingPipButtonProps> = ({
  currentMessage = null,
}) => {
  const [isActive, setIsActive] = useState(false);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    setSupported(isPipSupported());
  }, []);

  if (!supported) return null;

  const handleToggle = async () => {
    if (isActive) {
      closeFloatingPipWindow();
      setIsActive(false);
    } else {
      const opened = await openFloatingPipWindow(currentMessage, () => {
        setIsActive(false);
      });
      setIsActive(opened);
    }
  };

  return (
    <button
      id="toggle-pip-floating-btn"
      type="button"
      onClick={handleToggle}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
        isActive
          ? 'bg-cyan-950 border-cyan-500 text-cyan-300 shadow-md shadow-cyan-500/20'
          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
      }`}
      title={
        isActive
          ? 'ফ্লোটিং পপআপ উইন্ডো চালু আছে (অন্য অ্যাপের উপরেও দেখাবে)'
          : 'মোবাইলের অন্য অ্যাপ চালালেও উপরে পপআপ উইন্ডো ভেসে থাকবে'
      }
    >
      <Layers className={`w-3.5 h-3.5 ${isActive ? 'animate-pulse text-cyan-400' : ''}`} />
      <span className="hidden sm:inline">পপআপ উইন্ডো:</span>
      <span>{isActive ? 'চালু' : 'চালু করুন'}</span>
    </button>
  );
};
