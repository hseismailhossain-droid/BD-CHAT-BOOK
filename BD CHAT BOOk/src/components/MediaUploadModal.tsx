import React, { useState, useRef } from 'react';
import {
  Image as ImageIcon,
  Video as VideoIcon,
  X,
  UploadCloud,
  Send,
  Sparkles,
  Play,
  Film,
} from 'lucide-react';
import { DisplayTheme } from '../types';

interface MediaUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendMedia: (
    type: 'image' | 'video',
    mediaUrl: string,
    caption: string,
    mediaInfo: {
      name?: string;
      size?: number;
      width?: number;
      height?: number;
      duration?: number;
    },
    theme: DisplayTheme
  ) => void;
  recipientCode: string;
}

export const MediaUploadModal: React.FC<MediaUploadModalProps> = ({
  isOpen,
  onClose,
  onSendMedia,
  recipientCode,
}) => {
  const [fileType, setFileType] = useState<'image' | 'video' | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileInfo, setFileInfo] = useState<{
    name: string;
    size: number;
    width?: number;
    height?: number;
    duration?: number;
  } | null>(null);
  const [caption, setCaption] = useState('');
  const [selectedTheme, setSelectedTheme] = useState<DisplayTheme>('neon');
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleClose = () => {
    setFileType(null);
    setPreviewUrl(null);
    setFileInfo(null);
    setCaption('');
    setIsProcessing(false);
    onClose();
  };

  const processFile = (file: File) => {
    if (!file) return;

    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    if (!isImage && !isVideo) {
      alert('অনুগ্রহ করে শুধুমাত্র ছবি বা ভিডিও ফাইল নির্বাচন করুন।');
      return;
    }

    setIsProcessing(true);

    if (isImage) {
      setFileType('image');
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        // Optimize image if large
        const img = new Image();
        img.onload = () => {
          let targetWidth = img.width;
          let targetHeight = img.height;
          const maxDim = 1600;

          if (targetWidth > maxDim || targetHeight > maxDim) {
            if (targetWidth > targetHeight) {
              targetHeight = Math.round((targetHeight * maxDim) / targetWidth);
              targetWidth = maxDim;
            } else {
              targetWidth = Math.round((targetWidth * maxDim) / targetHeight);
              targetHeight = maxDim;
            }
            const canvas = document.createElement('canvas');
            canvas.width = targetWidth;
            canvas.height = targetHeight;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, targetWidth, targetHeight);
            const optimized = canvas.toDataURL('image/jpeg', 0.85);
            setPreviewUrl(optimized);
          } else {
            setPreviewUrl(dataUrl);
          }

          setFileInfo({
            name: file.name,
            size: file.size,
            width: targetWidth,
            height: targetHeight,
          });
          setIsProcessing(false);
        };
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);
    } else if (isVideo) {
      setFileType('video');
      // For videos, check size (< 25MB recommended for instant WebSocket transmission)
      if (file.size > 30 * 1024 * 1024) {
        alert('ভিডিওর সাইজ সর্বোচ্চ 30MB হতে পারবে।');
        setIsProcessing(false);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        setPreviewUrl(dataUrl);

        // Get video metadata
        const tempVideo = document.createElement('video');
        tempVideo.preload = 'metadata';
        tempVideo.onloadedmetadata = () => {
          setFileInfo({
            name: file.name,
            size: file.size,
            width: tempVideo.videoWidth,
            height: tempVideo.videoHeight,
            duration: Math.round(tempVideo.duration),
          });
          setIsProcessing(false);
        };
        tempVideo.src = dataUrl;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleSend = () => {
    if (!previewUrl || !fileType) return;
    onSendMedia(
      fileType,
      previewUrl,
      caption.trim() || (fileType === 'image' ? 'ছবি 📷' : 'ভিডিও 🎬'),
      fileInfo || {},
      selectedTheme
    );
    handleClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-700/90 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-4 py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white">
              <UploadCloud className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-white flex items-center gap-2">
                <span>ছবি ও ভিডিও পাঠান</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-mono">
                  {recipientCode}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                ছবি ও ভিডিওর জন্য অনলাইন সংযোগ প্রযোজ্য (টেক্সট অফলাইনেও পাঠানো যায়)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 flex-1 overflow-y-auto space-y-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                processFile(e.target.files[0]);
              }
            }}
          />

          {!previewUrl ? (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all flex flex-col items-center justify-center ${
                dragOver
                  ? 'border-cyan-400 bg-cyan-950/30 scale-[0.99]'
                  : 'border-slate-700 hover:border-slate-500 bg-slate-950/60'
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <ImageIcon className="w-6 h-6" />
                </div>
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <VideoIcon className="w-6 h-6" />
                </div>
              </div>
              <p className="text-sm sm:text-base font-semibold text-white mb-1">
                ছবি বা ভিডিও এখানে ড্র্যাগ করুন অথবা ক্লিক করুন
              </p>
              <p className="text-xs text-slate-400 max-w-xs">
                JPG, PNG, GIF, WebP, MP4, WebM (ফুল ডিসপ্লে এইচডি প্রিভিউ সাপোর্ট)
              </p>
              {isProcessing && (
                <div className="mt-4 flex items-center gap-2 text-xs text-cyan-400 animate-pulse">
                  <Sparkles className="w-4 h-4" />
                  <span>প্রসেসিং হচ্ছে...</span>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {/* Preview Box */}
              <div className="relative rounded-xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center max-h-[300px]">
                {fileType === 'image' && (
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="max-h-[300px] w-auto object-contain"
                  />
                )}
                {fileType === 'video' && (
                  <video
                    src={previewUrl}
                    controls
                    className="max-h-[300px] w-full object-contain"
                  />
                )}
                <button
                  type="button"
                  onClick={() => {
                    setPreviewUrl(null);
                    setFileType(null);
                    setFileInfo(null);
                  }}
                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-slate-900/80 hover:bg-rose-600 text-white backdrop-blur transition-colors"
                  title="ফাইল পরিবর্তন করুন"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* File Info badge */}
              {fileInfo && (
                <div className="flex items-center justify-between text-xs text-slate-400 bg-slate-950/80 px-3 py-2 rounded-lg border border-slate-800">
                  <span className="truncate max-w-[200px]">{fileInfo.name}</span>
                  <span>
                    {(fileInfo.size / (1024 * 1024)).toFixed(2)} MB
                    {fileInfo.duration ? ` • ${fileInfo.duration} সে.` : ''}
                  </span>
                </div>
              )}

              {/* Caption */}
              <div>
                <input
                  type="text"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="ক্যাপশন অথবা বার্তা লিখুন..."
                  className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none"
                />
              </div>

              {/* Theme selector */}
              <div>
                <span className="text-xs font-semibold text-slate-400 mb-1.5 block">
                  ফুল ডিসপ্লে ব্যাকড্রপ থিম:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {(
                    ['neon', 'midnight', 'crimson', 'emerald', 'sunset', 'cyberpunk'] as DisplayTheme[]
                  ).map((theme) => (
                    <button
                      key={theme}
                      type="button"
                      onClick={() => setSelectedTheme(theme)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium border capitalize transition-all ${
                        selectedTheme === theme
                          ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {theme}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {previewUrl && (
          <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
            >
              বাতিল
            </button>
            <button
              id="send-media-submit-btn"
              type="button"
              onClick={handleSend}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-sm shadow-lg shadow-cyan-500/25 active:scale-95 transition-all"
            >
              <span>ফুল ডিসপ্লেতে পাঠান</span>
              <Send className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
