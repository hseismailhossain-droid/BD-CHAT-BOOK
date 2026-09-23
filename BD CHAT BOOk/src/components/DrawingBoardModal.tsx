import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  X,
  Send,
  RotateCcw,
  Trash2,
  Maximize2,
  Sparkles,
  Palette,
  Check,
} from 'lucide-react';
import { DisplayTheme } from '../types';

interface DrawingBoardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendDrawing: (dataUrl: string, caption: string, theme: DisplayTheme) => void;
  recipientCode: string;
}

const COLORS = [
  '#06b6d4', // Cyan
  '#a855f7', // Purple
  '#f43f5e', // Rose
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#eab308', // Yellow
  '#ffffff', // White
  '#38bdf8', // Sky
  '#ec4899', // Pink
];

const STROKE_WIDTHS = [
  { label: 'সূক্ষ্ম', value: 3 },
  { label: 'মাঝারি', value: 6 },
  { label: 'মোটা', value: 12 },
  { label: 'বোল্ড', value: 24 },
];

export const DrawingBoardModal: React.FC<DrawingBoardModalProps> = ({
  isOpen,
  onClose,
  onSendDrawing,
  recipientCode,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentColor, setCurrentColor] = useState(COLORS[0]);
  const [currentWidth, setCurrentWidth] = useState(6);
  const [isEraser, setIsEraser] = useState(false);
  const [glowEffect, setGlowEffect] = useState(true);
  const [caption, setCaption] = useState('');
  const [history, setHistory] = useState<ImageData[]>([]);
  const [hasContent, setHasContent] = useState(false);

  // Initialize canvas
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
        // Fill canvas with dark chalkboard slate
        ctx.fillStyle = '#090d16';
        ctx.fillRect(0, 0, rect.width, rect.height);
        // Save initial blank state
        const initial = ctx.getImageData(0, 0, canvas.width, canvas.height);
        setHistory([initial]);
        setHasContent(false);
      }
    }, 50);

    return () => clearTimeout(timer);
  }, [isOpen]);

  const saveHistoryStep = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory((prev) => [...prev.slice(-15), imgData]);
    setHasContent(true);
  }, []);

  const undo = () => {
    const canvas = canvasRef.current;
    if (!canvas || history.length <= 1) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const newHistory = [...history];
    newHistory.pop(); // remove current
    const previous = newHistory[newHistory.length - 1];
    ctx.putImageData(previous, 0, 0);
    setHistory(newHistory);
    if (newHistory.length <= 1) {
      setHasContent(false);
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, rect.width, rect.height);
    const blank = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory([blank]);
    setHasContent(false);
  };

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    if ('touches' in e) {
      const touch = e.touches[0];
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = currentWidth;

    if (isEraser) {
      ctx.strokeStyle = '#090d16';
      ctx.shadowBlur = 0;
    } else {
      ctx.strokeStyle = currentColor;
      if (glowEffect) {
        ctx.shadowColor = currentColor;
        ctx.shadowBlur = currentWidth * 1.5;
      } else {
        ctx.shadowBlur = 0;
      }
    }

    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    saveHistoryStep();
  };

  const handleSend = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasContent) return;

    const dataUrl = canvas.toDataURL('image/png');
    // Select theme matching the active drawing color
    let theme: DisplayTheme = 'neon';
    if (currentColor === '#a855f7') theme = 'midnight';
    else if (currentColor === '#f43f5e' || currentColor === '#ec4899') theme = 'crimson';
    else if (currentColor === '#10b981') theme = 'emerald';
    else if (currentColor === '#f59e0b') theme = 'sunset';
    else if (currentColor === '#eab308') theme = 'cyberpunk';
    else if (currentColor === '#ffffff') theme = 'monochrome';

    onSendDrawing(dataUrl, caption.trim() || 'চিত্র অঙ্কন বার্তা 🎨', theme);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        {/* Top Header */}
        <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-pink-500 to-indigo-500 flex items-center justify-center text-white">
              <Palette className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-white flex items-center gap-2">
                <span>ড্রয়িং ক্যানভাস</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-950 border border-indigo-500/40 text-indigo-300 font-mono">
                  {recipientCode}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                স্কেচ করুন বা লিখে পাঠান — অপর পাশের ফুল ডিসপ্লেতে ভেসে উঠবে!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="drawing-undo-btn"
              type="button"
              onClick={undo}
              disabled={history.length <= 1}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 transition-all"
              title="পূর্বাবস্থায় ফিরুন (Undo)"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              id="drawing-clear-btn"
              type="button"
              onClick={clearCanvas}
              disabled={!hasContent}
              className="p-2 rounded-lg bg-slate-800 hover:bg-rose-950 hover:text-rose-300 text-slate-300 disabled:opacity-40 transition-all"
              title="ক্যানভাস মুছুন"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              id="drawing-close-btn"
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="relative flex-1 bg-slate-950 p-2 sm:p-4 min-h-[320px] sm:min-h-[420px] flex items-center justify-center overflow-hidden">
          <canvas
            ref={canvasRef}
            id="drawing-board-canvas"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            className="w-full h-full rounded-xl border border-slate-800 touch-none cursor-crosshair shadow-inner"
          />

          {!hasContent && (
            <div className="absolute pointer-events-none text-center text-slate-600">
              <Sparkles className="w-8 h-8 mx-auto mb-1 text-slate-600" />
              <p className="text-xs sm:text-sm font-medium">আঙ্গুল বা মাউস দিয়ে এখানে আঁকুন...</p>
            </div>
          )}
        </div>

        {/* Bottom Toolbar & Send Bar */}
        <div className="p-3 sm:p-4 bg-slate-950 border-t border-slate-800 flex flex-col gap-3">
          {/* Controls row */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Color Palette */}
            <div className="flex items-center gap-1.5 overflow-x-auto py-1">
              <span className="text-[11px] font-medium text-slate-400 mr-1">রঙ:</span>
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => {
                    setCurrentColor(c);
                    setIsEraser(false);
                  }}
                  style={{ backgroundColor: c }}
                  className={`w-6 h-6 rounded-full transition-transform flex items-center justify-center shrink-0 ${
                    currentColor === c && !isEraser
                      ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-slate-950'
                      : 'hover:scale-110 opacity-90'
                  }`}
                >
                  {currentColor === c && !isEraser && (
                    <Check className="w-3 h-3 text-slate-950 stroke-[3]" />
                  )}
                </button>
              ))}

              {/* Eraser Button */}
              <button
                type="button"
                onClick={() => setIsEraser(!isEraser)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold ml-2 border transition-all ${
                  isEraser
                    ? 'bg-rose-950/80 border-rose-500 text-rose-300'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                ইরেজার
              </button>

              {/* Glow Toggle */}
              <button
                type="button"
                onClick={() => setGlowEffect(!glowEffect)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                  glowEffect
                    ? 'bg-cyan-950/80 border-cyan-500 text-cyan-300'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                গ্লো এফেক্ট
              </button>
            </div>

            {/* Stroke Widths */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-medium text-slate-400">সাইজ:</span>
              {STROKE_WIDTHS.map((sw) => (
                <button
                  key={sw.value}
                  type="button"
                  onClick={() => setCurrentWidth(sw.value)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                    currentWidth === sw.value
                      ? 'bg-indigo-600 border-indigo-400 text-white'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  {sw.label}
                </button>
              ))}
            </div>
          </div>

          {/* Caption & Send */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="ক্যাপশন লিখুন (ঐচ্ছিক)..."
              className="flex-1 bg-slate-900 border border-slate-700 focus:border-cyan-400 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none"
            />
            <button
              id="send-drawing-submit-btn"
              type="button"
              onClick={handleSend}
              disabled={!hasContent}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 hover:from-pink-400 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-purple-500/20 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <span>ফুল ডিসপ্লেতে পাঠান</span>
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
