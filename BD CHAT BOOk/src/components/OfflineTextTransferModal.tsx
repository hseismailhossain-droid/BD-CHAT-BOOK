import React, { useState, useEffect, useRef, useCallback } from 'react';
import jsQR from 'jsqr';
import {
  QrCode,
  Scan,
  X,
  Sparkles,
  WifiOff,
  Copy,
  Check,
  Camera,
  RefreshCw,
  Zap,
  ArrowRight,
  ShieldCheck,
  Smartphone,
  Info,
} from 'lucide-react';
import { ChatMessage, DisplayTheme } from '../types';
import { ThemeSelector } from './ThemeSelector';
import {
  encodeOfflineMessage,
  decodeOfflineMessage,
  generateQrDataUrl,
} from '../utils/offlineTransfer';
import { playConnectedSound, playFullDisplayAlert } from '../utils/audio';

interface OfflineTextTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  myCode: string;
  myName: string;
  recipientCode?: string;
  initialText?: string;
  onReceiveMessage: (msg: ChatMessage) => void;
}

export const OfflineTextTransferModal: React.FC<OfflineTextTransferModalProps> = ({
  isOpen,
  onClose,
  myCode,
  myName,
  recipientCode,
  initialText = '',
  onReceiveMessage,
}) => {
  const [activeTab, setActiveTab] = useState<'send' | 'receive' | 'guide'>('send');
  const [text, setText] = useState(initialText);
  const [theme, setTheme] = useState<DisplayTheme>('neon');
  const [qrUrl, setQrUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Camera & Scanner State
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [scannedSuccess, setScannedSuccess] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Sync initialText when modal opens
  useEffect(() => {
    if (isOpen && initialText) {
      setText(initialText);
    }
  }, [isOpen, initialText]);

  // Generate QR Code when text or theme changes
  useEffect(() => {
    if (!isOpen || activeTab !== 'send') return;

    const messageContent = text.trim() || 'হ্যালো! এটি একটি অফলাইন ফুল ডিসপ্লে বার্তা।';
    const payloadStr = encodeOfflineMessage(
      messageContent,
      myCode,
      myName,
      theme,
      recipientCode
    );

    setIsGenerating(true);
    generateQrDataUrl(payloadStr)
      .then((url) => {
        setQrUrl(url);
        setIsGenerating(false);
      })
      .catch((err) => {
        console.error('QR code generation failed:', err);
        setIsGenerating(false);
      });
  }, [isOpen, activeTab, text, theme, myCode, myName, recipientCode]);

  // Stop camera stream helper
  const stopCamera = useCallback(() => {
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  // Camera QR Scanner loop
  const startCamera = useCallback(async () => {
    stopCamera();
    setCameraError(null);
    setScannedSuccess(false);

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setCameraActive(true);
      }
    } catch (err) {
      console.warn('Camera error:', err);
      setCameraError('ক্যামেরা চালু করা সম্ভব হয়নি। ক্যামেরা পারমিশন দেওয়া আছে কিনা পরীক্ষা করুন।');
      setCameraActive(false);
    }
  }, [facingMode, stopCamera]);

  // Scan frame by frame with jsQR
  useEffect(() => {
    if (activeTab === 'receive' && isOpen) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [activeTab, isOpen, startCamera, stopCamera]);

  // Continuous frame scanning
  useEffect(() => {
    if (!cameraActive) return;

    let isScanning = true;

    const scanFrame = () => {
      if (!isScanning) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert',
          });

          if (code && code.data) {
            const decoded = decodeOfflineMessage(code.data);
            if (decoded) {
              isScanning = false;
              setScannedSuccess(true);
              stopCamera();

              // Sound and alert
              playFullDisplayAlert(decoded.theme);
              if (navigator.vibrate) {
                navigator.vibrate([150, 80, 200]);
              }

              // Pass message to parent app
              setTimeout(() => {
                onReceiveMessage(decoded);
                onClose();
              }, 600);
              return;
            }
          }
        }
      }

      animFrameIdRef.current = requestAnimationFrame(scanFrame);
    };

    animFrameIdRef.current = requestAnimationFrame(scanFrame);

    return () => {
      isScanning = false;
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [cameraActive, onClose, onReceiveMessage, stopCamera]);

  if (!isOpen) return null;

  const handleCopyPayload = () => {
    const payloadStr = encodeOfflineMessage(
      text || 'হ্যালো!',
      myCode,
      myName,
      theme,
      recipientCode
    );
    navigator.clipboard.writeText(payloadStr).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <div
      id="offline-text-transfer-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/60 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20 text-white">
              <WifiOff className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white font-['Hind_Siliguri',sans-serif]">
                  অফলাইন টেক্সট মেসেঞ্জার
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
                  ১০০% ইন্টারনেট ছাড়া
                </span>
              </div>
              <p className="text-xs text-slate-400 font-['Hind_Siliguri',sans-serif]">
                ছবি ও ভিডিওর জন্য নেট প্রয়োজন হলেও, টেক্সট সম্পূর্ণ অফলাইনে কাজ করে
              </p>
            </div>
          </div>

          <button
            id="close-offline-modal-btn"
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 p-1.5 gap-1 font-['Hind_Siliguri',sans-serif]">
          <button
            type="button"
            onClick={() => setActiveTab('send')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'send'
                ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md shadow-orange-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>বার্তা পাঠান (QR)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('receive')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'receive'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <Scan className="w-4 h-4" />
            <span>স্ক্যান ও রিসিভ</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('guide')}
            className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'guide'
                ? 'bg-slate-800 text-white'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
            title="লোকাল হটস্পট ও ওয়াইফাই নির্দেশিকা"
          >
            <Info className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">নির্দেশিকা</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 font-['Hind_Siliguri',sans-serif]">
          {/* TAB 1: SEND OFFLINE QR */}
          {activeTab === 'send' && (
            <div className="flex flex-col items-center gap-4">
              {/* Text Input */}
              <div className="w-full">
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  অফলাইন বার্তা লিখুন:
                </label>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="আপনার বার্তাটি এখানে লিখুন... (অফলাইনে সরাসরি ফুল ডিসপ্লেতে যাবে)"
                  rows={2}
                  className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-2xl text-white text-sm focus:outline-none focus:border-amber-500 transition-all resize-none"
                />
              </div>

              {/* Theme Picker */}
              <div className="w-full">
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 flex items-center justify-between">
                  <span>ডিসপ্লে থিম নির্বাচন করুন:</span>
                  <span className="text-[11px] text-amber-400 capitalize">{theme}</span>
                </label>
                <ThemeSelector selectedTheme={theme} onSelectTheme={setTheme} />
              </div>

              {/* QR Code Container */}
              <div className="mt-2 flex flex-col items-center justify-center p-4 bg-slate-950 border border-slate-800 rounded-3xl shadow-inner relative group">
                <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-mono font-bold">
                  কানেক্ট কোড: {myCode}
                </div>

                {isGenerating ? (
                  <div className="w-64 h-64 flex flex-col items-center justify-center text-slate-500 gap-2">
                    <RefreshCw className="w-6 h-6 animate-spin text-amber-400" />
                    <span className="text-xs">QR কোড তৈরি হচ্ছে...</span>
                  </div>
                ) : qrUrl ? (
                  <div className="p-3 bg-white rounded-2xl shadow-xl border-4 border-amber-500/30">
                    <img
                      src={qrUrl}
                      alt="Offline Message QR Code"
                      className="w-56 h-56 sm:w-64 sm:h-64 object-contain"
                    />
                  </div>
                ) : (
                  <div className="w-64 h-64 flex items-center justify-center text-slate-500 text-xs">
                    QR কোড প্রদর্শনে সমস্যা হয়েছে
                  </div>
                )}

                <p className="text-xs text-slate-400 text-center mt-3 max-w-xs leading-relaxed">
                  📱 অপর প্রান্তের ফোন দিয়ে <strong>"স্ক্যান ও রিসিভ"</strong> অপশন খুলে এই QR কোডটি স্ক্যান
                  করুন — ইন্টারনেট ছাড়াই বার্তাটি সরাসরি ফুল ডিসপ্লেতে ওপেন হবে!
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 w-full max-w-sm mt-1">
                <button
                  type="button"
                  onClick={handleCopyPayload}
                  className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all border border-slate-700"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">কপি হয়েছে!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>অফলাইন টেক্সট কপি</span>
                    </>
                  )}
                </button>

                {qrUrl && (
                  <a
                    href={qrUrl}
                    download={`flashcast-offline-${Date.now()}.png`}
                    className="inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-all border border-slate-700"
                  >
                    <span>ছবি সেভ</span>
                  </a>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: RECEIVE VIA CAMERA SCAN */}
          {activeTab === 'receive' && (
            <div className="flex flex-col items-center gap-4">
              <div className="text-center max-w-md">
                <h4 className="text-sm font-bold text-white mb-1">
                  ক্যামেরা দিয়ে বন্ধুর অফলাইন QR কোড স্ক্যান করুন
                </h4>
                <p className="text-xs text-slate-400">
                  স্ক্যান হওয়া মাত্রই আপনার মোবাইলে ফুল ডিসপ্লে অ্যানিমেশন ও সাউন্ডসহ বার্তাটি ফুটে উঠবে।
                </p>
              </div>

              {/* Video Scanner Box */}
              <div className="relative w-full max-w-sm aspect-square bg-black rounded-3xl overflow-hidden border-2 border-cyan-500/40 shadow-2xl flex items-center justify-center">
                {cameraError ? (
                  <div className="p-6 text-center text-rose-400 text-xs flex flex-col items-center gap-3">
                    <Camera className="w-8 h-8 text-rose-500" />
                    <span>{cameraError}</span>
                    <button
                      type="button"
                      onClick={startCamera}
                      className="px-4 py-2 rounded-xl bg-slate-800 text-white font-semibold text-xs border border-slate-700 hover:bg-slate-700"
                    >
                      পুনরায় চেষ্টা করুন
                    </button>
                  </div>
                ) : (
                  <>
                    <video
                      ref={videoRef}
                      className="w-full h-full object-cover"
                      playsInline
                      muted
                    />
                    <canvas ref={canvasRef} className="hidden" />

                    {/* Laser Scanner animation overlay */}
                    {cameraActive && !scannedSuccess && (
                      <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                        {/* Target reticle */}
                        <div className="w-52 h-52 sm:w-60 sm:h-60 border-2 border-cyan-400/80 rounded-2xl relative shadow-lg shadow-cyan-500/20">
                          {/* Corner brackets */}
                          <div className="absolute -top-1 -left-1 w-5 h-5 border-t-4 border-l-4 border-cyan-400 rounded-tl-lg" />
                          <div className="absolute -top-1 -right-1 w-5 h-5 border-t-4 border-r-4 border-cyan-400 rounded-tr-lg" />
                          <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-4 border-l-4 border-cyan-400 rounded-bl-lg" />
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-4 border-r-4 border-cyan-400 rounded-br-lg" />

                          {/* Laser line animated */}
                          <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent absolute top-1/2 -translate-y-1/2 animate-pulse shadow-md shadow-cyan-400" />
                        </div>
                      </div>
                    )}

                    {/* Scanned Success Overlay */}
                    {scannedSuccess && (
                      <div className="absolute inset-0 bg-emerald-950/80 backdrop-blur-sm flex flex-col items-center justify-center gap-2 animate-in zoom-in-95 duration-200">
                        <div className="w-14 h-14 rounded-2xl bg-emerald-500 flex items-center justify-center text-white shadow-xl shadow-emerald-500/40">
                          <Check className="w-8 h-8" />
                        </div>
                        <span className="text-white font-bold text-sm">সফলভাবে স্ক্যান হয়েছে!</span>
                        <span className="text-xs text-emerald-200">ফুল ডিসপ্লে ওপেন হচ্ছে...</span>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Flip camera toggle button */}
              <button
                type="button"
                onClick={() => {
                  setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all border border-slate-700"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>ক্যামেরা পরিবর্তন করুন ({facingMode === 'environment' ? 'ব্যাক' : 'ফ্রন্ট'})</span>
              </button>
            </div>
          )}

          {/* TAB 3: OFFLINE GUIDE & LOCAL HOTSPOT */}
          {activeTab === 'guide' && (
            <div className="space-y-4 text-left">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                <h4 className="text-sm font-bold text-amber-400 flex items-center gap-2 mb-2">
                  <Zap className="w-4 h-4" />
                  <span>ইন্টারনেট ছাড়া অফলাইন টেক্সট কীভাবে কাজ করে?</span>
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  আপনার অনুরোধ অনুযায়ী — <strong>ছবি ও ভিডিওর জন্য অনলাইন প্রয়োজন হলেও টেক্সট বার্তা সম্পূর্ণ অফলাইনে কাজ করবে</strong>।
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800">
                  <div className="w-8 h-8 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center mb-2">
                    <QrCode className="w-4 h-4" />
                  </div>
                  <h5 className="text-xs font-bold text-white mb-1">পদ্ধতি ১: অফলাইন QR ট্রান্সফার</h5>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    যেকোনো জায়গায় সিম কার্ড বা ওয়াইফাই ছাড়া টেক্সট লিখুন। অপর প্রান্ত ক্যামেরা দিয়ে স্ক্যান করলেই তাৎক্ষণিক ফুল ডিসপ্লেতে ফুটে উঠবে।
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800">
                  <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center mb-2">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <h5 className="text-xs font-bold text-white mb-1">পদ্ধতি ২: লোকাল হটস্পট মোড</h5>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    একটি ফোনের 'Portable Hotspot' অন করে অন্য ফোনটি কানেক্ট করুন (কোনো ডাটা বা ইন্টারনেটের দরকার নেই)। লোকাল নেটওয়ার্কে অফলাইনে কথা বলা যায়।
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-2">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <h5 className="text-xs font-bold text-white mb-1">পদ্ধতি ৩: অফলাইন অটো-সিঙ্ক কিউ</h5>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    অফলাইনে পাঠানো যেকোনো মেসেজ লোকাল IndexedDB স্টোরেজে জমা থাকে। যখনই ইন্টারনেট পাবেন, স্বয়ংক্রিয়ভাবে পার্টনারের ফোনে চলে যাবে।
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800">
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-2">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <h5 className="text-xs font-bold text-white mb-1">মিডিয়া কনস্ট্রেইন্ট</h5>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    ফটো এবং বড় ভিডিও স্ট্রিমিংয়ের জন্য অনলাইন থাকা দরকার, কিন্তু টেক্সট বার্তা সর্বাবস্থায় উন্মুক্ত ও অফলাইন সুরক্ষিত।
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 font-['Hind_Siliguri',sans-serif]">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>আপনার কোড: <strong className="font-mono text-white">{myCode}</strong></span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold transition-all"
          >
            বন্ধ করুন
          </button>
        </div>
      </div>
    </div>
  );
};
