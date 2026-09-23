import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Maximize2,
  Eye,
  Radio,
  Sparkles,
  CheckCheck,
  Check,
  Palette,
  Image as ImageIcon,
  Mic,
  Trash2,
  Play,
  Pause,
  Film,
  Download,
  PhoneOff,
  QrCode,
  WifiOff,
  MoreVertical,
  Clock,
  Edit3,
} from 'lucide-react';
import { ChatMessage, DisplayTheme } from '../types';
import { ThemeSelector } from './ThemeSelector';
import { FloatingPipButton } from './FloatingPipButton';
import { MessageActionModal } from './MessageActionModal';

interface ChatViewProps {
  myCode: string;
  peerCode: string;
  peerName?: string;
  isPeerOnline?: boolean;
  isPeerTyping?: boolean;
  messages: ChatMessage[];
  onSendMessage: (content: string, theme: DisplayTheme, ttlSeconds?: number) => void;
  onEditMessage?: (messageId: string, newContent: string) => void;
  onDeleteMessage?: (messageId: string, deleteForEveryone: boolean) => void;
  onOpenFullDisplay: (message: ChatMessage) => void;
  onPreviewFullDisplay: (content: string, theme: DisplayTheme) => void;
  onSendTyping: (isTyping: boolean) => void;
  autoFullDisplay: boolean;
  onToggleAutoFullDisplay: () => void;
  onOpenDrawingModal: () => void;
  onOpenMediaModal: () => void;
  onOpenVoiceModal: () => void;
  onOpenOfflineModal?: (text?: string) => void;
  onClearHistory?: () => void;
  onDisconnect?: () => void;
}

const TTL_OPTIONS = [
  { label: 'সাধারণ (সবসময়)', value: 0 },
  { label: '১০ সেকেন্ড', value: 10 },
  { label: '৩০ সেকেন্ড', value: 30 },
  { label: '১ মিনিট', value: 60 },
  { label: '৫ মিনিট', value: 300 },
  { label: '১ ঘন্টা', value: 3600 },
  { label: '২৪ ঘন্টা', value: 86400 },
];

const QUICK_PRESETS = [
  'হ্যালো!',
  'কোথায় তুমি?',
  'জরুরী কথা আছে!',
  'প্লিজ কল দাও!',
  'সব ঠিক আছে?',
  'দেখা হচ্ছে!',
];

export const ChatView: React.FC<ChatViewProps> = ({
  myCode,
  peerCode,
  peerName,
  isPeerOnline,
  isPeerTyping,
  messages,
  onSendMessage,
  onEditMessage,
  onDeleteMessage,
  onOpenFullDisplay,
  onPreviewFullDisplay,
  onSendTyping,
  autoFullDisplay,
  onToggleAutoFullDisplay,
  onOpenDrawingModal,
  onOpenMediaModal,
  onOpenVoiceModal,
  onOpenOfflineModal,
  onClearHistory,
  onDisconnect,
}) => {
  const [inputText, setInputText] = useState('');
  const [selectedTheme, setSelectedTheme] = useState<DisplayTheme>('neon');
  const [selectedTTL, setSelectedTTL] = useState<number>(0);
  const [isTTLMenuOpen, setIsTTLMenuOpen] = useState<boolean>(false);
  const [actionModalMessage, setActionModalMessage] = useState<ChatMessage | null>(null);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isPeerTyping]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);

    // Broadcast typing status
    onSendTyping(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      onSendTyping(false);
    }, 1500);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputText.trim();
    if (!text) return;

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    onSendTyping(false);

    onSendMessage(text, selectedTheme, selectedTTL > 0 ? selectedTTL : undefined);
    setInputText('');
  };

  const handlePresetClick = (preset: string) => {
    setInputText(preset);
  };

  const handlePreview = () => {
    const text = inputText.trim() || 'নমুনা ফুল ডিসপ্লে বার্তা!';
    onPreviewFullDisplay(text, selectedTheme);
  };

  const handlePlayVoice = (msgId: string, audioUrl?: string) => {
    if (!audioUrl) return;

    if (playingAudioId === msgId && currentAudioRef.current) {
      currentAudioRef.current.pause();
      setPlayingAudioId(null);
      return;
    }

    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
    }

    const audio = new Audio(audioUrl);
    currentAudioRef.current = audio;
    setPlayingAudioId(msgId);

    audio.onended = () => {
      setPlayingAudioId(null);
    };

    audio.play().catch(() => {
      setPlayingAudioId(null);
    });
  };

  const formatMessageTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-md shadow-2xl">
      {/* Peer Chat Top Bar */}
      <div className="px-4 py-3 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center font-mono font-bold text-white shadow-md">
            {peerCode.slice(0, 2)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm sm:text-base font-bold text-white tracking-wide">
                {peerCode}
              </span>
              {peerName && (
                <span className="text-xs text-slate-300 font-medium hidden sm:inline">
                  ({peerName})
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span
                className={`w-2 h-2 rounded-full ${isPeerOnline ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`}
              />
              <span className="text-xs text-slate-400">
                {isPeerOnline ? 'অনলাইন ও সক্রিয়' : 'অফলাইন (ম্যাসেজ সেভ থাকবে)'}
              </span>
            </div>
          </div>
        </div>

        {/* Top bar right controls */}
        <div className="flex items-center gap-2">
          {/* Floating Pop-up Window Toggle */}
          <FloatingPipButton currentMessage={messages[messages.length - 1] || null} />

          {/* Auto Full Display Toggle */}
          <button
            id="toggle-auto-fullscreen-btn"
            type="button"
            onClick={onToggleAutoFullDisplay}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
              autoFullDisplay
                ? 'bg-cyan-950/70 border-cyan-500/50 text-cyan-300 shadow-sm shadow-cyan-500/10'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title="ম্যাসেজ আসলেই স্বয়ংক্রিয়ভাবে ফুল ডিসপ্লে হবে"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">স্বয়ংক্রিয় ফুল ডিসপ্লে:</span>
            <span>{autoFullDisplay ? 'চালু' : 'বন্ধ'}</span>
          </button>

          {/* Clear history button */}
          {onClearHistory && messages.length > 0 && (
            <button
              id="clear-chat-history-btn"
              type="button"
              onClick={onClearHistory}
              className="p-2 rounded-xl bg-slate-900 hover:bg-rose-950/70 border border-slate-800 hover:border-rose-700 text-slate-400 hover:text-rose-300 transition-all"
              title="চ্যাট হিস্ট্রি মুছুন"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}

          {/* AnyDesk End Session / Disconnect button */}
          {onDisconnect && (
            <button
              id="chat-disconnect-btn"
              type="button"
              onClick={onDisconnect}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600/90 hover:bg-rose-600 text-white font-semibold text-xs shadow-md shadow-rose-600/20 active:scale-95 transition-all"
              title="সংযোগ বিচ্ছিন্ন করুন"
            >
              <PhoneOff className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">সেশন শেষ</span>
            </button>
          )}
        </div>
      </div>

      {/* Message Feed Container */}
      <div className="flex-1 p-3 sm:p-5 overflow-y-auto space-y-4 min-h-[300px] max-h-[460px]">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-950/60 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <h3 className="font-semibold text-slate-200 text-sm sm:text-base">
              প্রফেশনাল ফুল ডিসপ্লে চ্যাট শুরু করুন!
            </h3>
            <p className="text-xs text-slate-400 max-w-sm">
              নিচ থেকে বার্তা লিখুন, ছবি, ভিডিও, ভয়েস রেকর্ড পাঠান অথবা ড্রয়িং করুন — সাথে সাথেই অপর পাশের স্ক্রিনে ফুল ডিসপ্লেতে ভেসে উঠবে।
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderCode.toUpperCase() === myCode.toUpperCase();
            const msgType = msg.msgType || (msg.drawingData ? 'drawing' : msg.mediaUrl ? 'image' : 'text');

            return (
              <div
                key={msg.id}
                id={`message-item-${msg.id}`}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} group`}
              >
                <div className="flex items-center gap-2 mb-1 px-1 text-[11px] text-slate-400">
                  <span className="font-mono font-medium">
                    {isMe ? 'আমি' : msg.senderName || msg.senderCode}
                  </span>
                  <span>·</span>
                  <span>{formatMessageTime(msg.timestamp)}</span>
                </div>

                <div
                  className={`relative max-w-[88%] sm:max-w-md p-3 sm:p-4 rounded-2xl border transition-all ${
                    isMe
                      ? 'bg-gradient-to-br from-indigo-950/80 to-slate-900 border-indigo-500/40 text-slate-100 rounded-tr-none'
                      : 'bg-slate-900 border-slate-700/80 text-white rounded-tl-none'
                  }`}
                >
                  {/* TYPE 1: DRAWING */}
                  {msgType === 'drawing' && (
                    <div className="space-y-2">
                      <div className="relative rounded-xl overflow-hidden bg-slate-950 border border-slate-800 p-1">
                        <img
                          src={msg.drawingData || msg.mediaUrl}
                          alt="Drawing"
                          className="w-full max-h-56 object-contain rounded-lg cursor-pointer hover:opacity-95 transition-opacity"
                          onClick={() => onOpenFullDisplay(msg)}
                        />
                      </div>
                      {msg.content && (
                        <p className="text-xs sm:text-sm font-medium text-slate-200">
                          {msg.content}
                        </p>
                      )}
                    </div>
                  )}

                  {/* TYPE 2: IMAGE */}
                  {msgType === 'image' && (
                    <div className="space-y-2">
                      <div className="relative rounded-xl overflow-hidden bg-slate-950 border border-slate-800">
                        <img
                          src={msg.mediaUrl}
                          alt="Shared media"
                          className="w-full max-h-60 object-cover rounded-lg cursor-pointer hover:scale-[1.01] transition-transform"
                          onClick={() => onOpenFullDisplay(msg)}
                        />
                      </div>
                      {msg.content && (
                        <p className="text-xs sm:text-sm font-medium text-slate-200">
                          {msg.content}
                        </p>
                      )}
                    </div>
                  )}

                  {/* TYPE 3: VIDEO */}
                  {msgType === 'video' && (
                    <div className="space-y-2">
                      <div className="relative rounded-xl overflow-hidden bg-black border border-slate-800">
                        <video
                          src={msg.mediaUrl}
                          controls
                          className="w-full max-h-60 object-contain rounded-lg"
                        />
                      </div>
                      {msg.content && (
                        <p className="text-xs sm:text-sm font-medium text-slate-200">
                          {msg.content}
                        </p>
                      )}
                    </div>
                  )}

                  {/* TYPE 4: VOICE AUDIO */}
                  {msgType === 'audio' && (
                    <div className="space-y-2 py-1">
                      <div className="flex items-center gap-3 bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
                        <button
                          type="button"
                          onClick={() => handlePlayVoice(msg.id, msg.mediaUrl)}
                          className="p-2.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white shadow-md active:scale-95 transition-transform"
                        >
                          {playingAudioId === msg.id ? (
                            <Pause className="w-4 h-4" />
                          ) : (
                            <Play className="w-4 h-4 translate-x-0.5" />
                          )}
                        </button>
                        <div className="flex-1">
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                            <Mic className="w-3.5 h-3.5 text-indigo-400" />
                            <span>ভয়েস রেকর্ড বার্তা</span>
                          </div>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {msg.mediaInfo?.duration ? `${msg.mediaInfo.duration} সেকেন্ড` : 'অডিও'}
                          </span>
                        </div>
                      </div>
                      {msg.content && (
                        <p className="text-xs text-slate-300 italic">
                          "{msg.content}"
                        </p>
                      )}
                    </div>
                  )}

                  {/* TYPE 5: TEXT */}
                  {msgType === 'text' && (
                    <div>
                      {msg.isDeletedForEveryone ? (
                        <p className="font-['Hind_Siliguri',sans-serif] text-xs sm:text-sm italic text-slate-400/90 flex items-center gap-1.5 py-1">
                          <Trash2 className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                          <span>এই বার্তাটি মুছে ফেলা হয়েছে (This message was deleted)</span>
                        </p>
                      ) : (
                        <p className="font-['Hind_Siliguri',sans-serif] text-sm sm:text-base leading-relaxed break-words whitespace-pre-wrap font-medium">
                          {msg.content}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Message Bottom Action Bar */}
                  <div className="flex items-center justify-between gap-3 mt-2.5 pt-2 border-t border-white/10 text-xs">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] text-slate-400 capitalize flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                        {msgType} · {msg.theme || 'neon'}
                      </span>

                      {/* Edited Tag */}
                      {msg.isEdited && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px]">
                          <Edit3 className="w-2.5 h-2.5" />
                          <span>সম্পাদিত (Edited)</span>
                        </span>
                      )}

                      {/* Auto-delete / Disappearing message badge */}
                      {msg.expiresAt && (
                        <span
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-purple-500/10 border border-purple-500/20 text-purple-300 text-[10px]"
                          title="নির্দিষ্ট সময় পর স্বয়ংক্রিয়ভাবে মুছে যাবে"
                        >
                          <Clock className="w-2.5 h-2.5" />
                          <span>TTL {msg.ttlSeconds ? `${msg.ttlSeconds}s` : ''}</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Button to blast this message to Full Display */}
                      <button
                        id={`view-full-display-btn-${msg.id}`}
                        type="button"
                        onClick={() => onOpenFullDisplay(msg)}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white/10 hover:bg-cyan-500/20 text-cyan-300 hover:text-cyan-200 border border-cyan-500/30 font-medium text-[11px] transition-all"
                        title="ফুল ডিসপ্লেতে দেখুন"
                      >
                        <Maximize2 className="w-3 h-3" />
                        <span className="hidden sm:inline">ফুল ডিসপ্লে</span>
                      </button>

                      {/* Message Options (Edit, Delete for Me, Delete for Everyone) */}
                      <button
                        id={`message-action-btn-${msg.id}`}
                        type="button"
                        onClick={() => setActionModalMessage(msg)}
                        className="p-1 rounded-lg bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white border border-white/10 transition-all"
                        title="বার্তা অপশন (এডিট / ডিলিট)"
                      >
                        <MoreVertical className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {isMe && (
                  <div className="flex items-center gap-1 mt-0.5 px-1 text-[10px] text-slate-400">
                    <span>{msg.delivered ? 'ডেলিভার্ড' : 'পাঠানো হয়েছে'}</span>
                    {msg.delivered ? (
                      <CheckCheck className="w-3 h-3 text-cyan-400" />
                    ) : (
                      <Check className="w-3 h-3" />
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Peer Typing Indicator */}
        {isPeerTyping && (
          <div className="flex items-center gap-2 text-xs text-cyan-400 py-1 px-2 animate-pulse">
            <span className="font-mono font-bold">{peerCode}</span>
            <span>টাইপ করছেন...</span>
            <span className="flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" />
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.2s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.4s]" />
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Preset Buttons */}
      <div className="px-4 py-2 border-t border-slate-800/80 bg-slate-950/40 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
        <span className="text-[11px] text-slate-500 shrink-0 font-medium">দ্রুত বার্তা:</span>
        {QUICK_PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => handlePresetClick(preset)}
            className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-white hover:border-slate-700 whitespace-nowrap transition-all shrink-0"
          >
            {preset}
          </button>
        ))}
      </div>

      {/* Message Compose Box with Multi-Media Tools */}
      <div className="p-3 sm:p-4 bg-slate-950 border-t border-slate-800 flex flex-col gap-2.5">
        {/* Theme Selector Strip */}
        <ThemeSelector selectedTheme={selectedTheme} onSelectTheme={setSelectedTheme} />

        {/* Action Tools & Text Input */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {/* Multi-Media Actions Bar */}
          <div className="flex items-center gap-1.5 shrink-0 bg-slate-900/90 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
            {/* Drawing Button */}
            <button
              id="open-drawing-modal-btn"
              type="button"
              onClick={onOpenDrawingModal}
              className="p-2.5 rounded-lg hover:bg-pink-950/60 text-pink-400 hover:text-pink-300 transition-colors flex items-center gap-1 text-xs font-semibold"
              title="ড্রয়িং / স্কেচ করে কথা বলুন"
            >
              <Palette className="w-4 h-4" />
              <span className="hidden md:inline">ড্রয়িং</span>
            </button>

            {/* Photo / Video Button */}
            <button
              id="open-media-modal-btn"
              type="button"
              onClick={onOpenMediaModal}
              className="p-2.5 rounded-lg hover:bg-cyan-950/60 text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1 text-xs font-semibold"
              title="ছবি ও ভিডিও পাঠান"
            >
              <ImageIcon className="w-4 h-4" />
              <span className="hidden md:inline">ছবি/ভিডিও</span>
            </button>

            {/* Voice Recording Button */}
            <button
              id="open-voice-modal-btn"
              type="button"
              onClick={onOpenVoiceModal}
              className="p-2.5 rounded-lg hover:bg-indigo-950/60 text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1 text-xs font-semibold"
              title="ভয়েস রেকর্ড করে পাঠান"
            >
              <Mic className="w-4 h-4" />
              <span className="hidden md:inline">ভয়েস</span>
            </button>

            {/* Disappearing / Auto-delete message timer toggle */}
            <div className="relative">
              <button
                id="toggle-ttl-timer-btn"
                type="button"
                onClick={() => setIsTTLMenuOpen((prev) => !prev)}
                className={`p-2.5 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold ${
                  selectedTTL > 0
                    ? 'bg-purple-950/80 text-purple-300 border border-purple-500/40 shadow-sm'
                    : 'hover:bg-purple-950/40 text-slate-400 hover:text-purple-300'
                }`}
                title="নির্দিষ্ট সময় পর বার্তা ডিলিট হওয়ার টাইমার নির্ধারণ করুন"
              >
                <Clock className="w-4 h-4" />
                <span className="hidden lg:inline">
                  {selectedTTL > 0
                    ? `${TTL_OPTIONS.find((o) => o.value === selectedTTL)?.label}`
                    : 'টাইমার'}
                </span>
              </button>

              {/* TTL Popup Menu */}
              {isTTLMenuOpen && (
                <div
                  id="ttl-timer-dropdown"
                  className="absolute bottom-full left-0 mb-2 w-48 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-1 z-30 space-y-1"
                >
                  <div className="px-2.5 py-1.5 text-[10px] font-bold text-slate-400 border-b border-slate-800">
                    অটো-ডিলিট টাইমার (Disappearing):
                  </div>
                  {TTL_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        setSelectedTTL(opt.value);
                        setIsTTLMenuOpen(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                        selectedTTL === opt.value
                          ? 'bg-purple-600/30 text-purple-200 font-bold'
                          : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <span>{opt.label}</span>
                      {selectedTTL === opt.value && <Check className="w-3.5 h-3.5 text-purple-400" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Text Input and Send Buttons */}
          <form onSubmit={handleSend} className="flex-1 flex items-center gap-2">
            <input
              id="chat-message-input"
              type="text"
              value={inputText}
              onChange={handleInputChange}
              placeholder="বার্তা লিখুন (অফলাইনেও স্বাভাবিক নিয়মে অপর পাশে ফুল ডিসপ্লেতে ভেসে উঠবে)..."
              className="flex-1 bg-slate-900/90 border border-slate-700 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 rounded-xl px-4 py-2.5 text-sm sm:text-base text-white placeholder-slate-500 focus:outline-none transition-all font-['Hind_Siliguri',sans-serif]"
            />

            {/* Preview Fullscreen button */}
            <button
              id="preview-fullscreen-btn"
              type="button"
              onClick={handlePreview}
              className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-cyan-300 transition-all shrink-0"
              title="ফুল ডিসপ্লে প্রিভিউ দেখুন"
            >
              <Eye className="w-4 h-4" />
            </button>

            {/* Send button */}
            <button
              id="send-message-btn"
              type="submit"
              disabled={!inputText.trim()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-500/25 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0"
            >
              <span>পাঠান</span>
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* Message Action Modal for Edit & Delete */}
      <MessageActionModal
        isOpen={!!actionModalMessage}
        message={actionModalMessage}
        isMyMessage={!!actionModalMessage && actionModalMessage.senderCode.replace(/\D/g, '') === myCode.replace(/\D/g, '')}
        onClose={() => setActionModalMessage(null)}
        onEditMessage={(msgId, newContent) => {
          if (onEditMessage) onEditMessage(msgId, newContent);
        }}
        onDeleteMessage={(msgId, deleteForEveryone) => {
          if (onDeleteMessage) onDeleteMessage(msgId, deleteForEveryone);
        }}
      />
    </div>
  );
};
