import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  Square,
  Play,
  Pause,
  Send,
  X,
  RotateCcw,
  Volume2,
  Sparkles,
} from 'lucide-react';
import { DisplayTheme } from '../types';

interface VoiceRecorderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendVoice: (
    audioDataUrl: string,
    duration: number,
    caption: string,
    theme: DisplayTheme
  ) => void;
  recipientCode: string;
}

export const VoiceRecorderModal: React.FC<VoiceRecorderModalProps> = ({
  isOpen,
  onClose,
  onSendVoice,
  recipientCode,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [caption, setCaption] = useState('');
  const [selectedTheme, setSelectedTheme] = useState<DisplayTheme>('midnight');
  const [micError, setMicError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Cleanup on close
  useEffect(() => {
    if (!isOpen) {
      stopRecordingCleanup();
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
        setAudioUrl(null);
      }
      setRecordedBlob(null);
      setRecordingTime(0);
      setIsRecording(false);
      setIsPlayingPreview(false);
      setMicError(null);
    }
  }, [isOpen]);

  const stopRecordingCleanup = () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
    }
  };

  const startRecording = async () => {
    setMicError(null);
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Setup audio analyzer for waveform visualizer
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);
      analyserRef.current = analyser;

      drawWaveform();

      // Setup MediaRecorder
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/mp4';
      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        setRecordedBlob(audioBlob);
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
      };

      recorder.start(100);
      setIsRecording(true);
      setRecordingTime(0);

      timerIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err: unknown) {
      console.error('Microphone error:', err);
      setMicError('মাইক্রোফোন চালু করা যায়নি। অনুগ্রহ করে ব্রাউজার পারমিশন দিন।');
    }
  };

  const stopRecording = () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const drawWaveform = () => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const render = () => {
      animFrameRef.current = requestAnimationFrame(render);
      analyser.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const barWidth = (canvas.width / bufferLength) * 2;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height * 0.85;
        ctx.fillStyle = `rgb(99, 102, 241)`;
        ctx.fillRect(x, (canvas.height - barHeight) / 2, barWidth - 1, barHeight + 2);
        x += barWidth;
      }
    };

    render();
  };

  const togglePlayPreview = () => {
    if (!previewAudioRef.current && audioUrl) {
      const audio = new Audio(audioUrl);
      previewAudioRef.current = audio;
      audio.onended = () => setIsPlayingPreview(false);
    }

    if (previewAudioRef.current) {
      if (isPlayingPreview) {
        previewAudioRef.current.pause();
        setIsPlayingPreview(false);
      } else {
        previewAudioRef.current.play();
        setIsPlayingPreview(true);
      }
    }
  };

  const handleSend = () => {
    if (!recordedBlob) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Data = reader.result as string;
      onSendVoice(
        base64Data,
        recordingTime || 1,
        caption.trim() || 'ভয়েস ম্যাসেজ 🎙️',
        selectedTheme
      );
      onClose();
    };
    reader.readAsDataURL(recordedBlob);
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white">
              <Mic className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-white flex items-center gap-2">
                <span>ভয়েস রেকর্ডার</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-950 border border-indigo-500/40 text-indigo-300 font-mono">
                  {recipientCode}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                ভয়েস রেকর্ড করে ফুল ডিসপ্লেতে পাঠান
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Record / Waveform Center */}
        <div className="p-6 flex flex-col items-center justify-center text-center space-y-5">
          {micError ? (
            <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs sm:text-sm">
              {micError}
            </div>
          ) : (
            <>
              {/* Waveform visualizer */}
              <div className="w-full h-24 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-center overflow-hidden px-2 relative">
                {isRecording ? (
                  <canvas
                    ref={canvasRef}
                    width={340}
                    height={80}
                    className="w-full h-full"
                  />
                ) : audioUrl ? (
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={togglePlayPreview}
                      className="p-3 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg transition-transform active:scale-95"
                    >
                      {isPlayingPreview ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                    </button>
                    <span className="text-sm font-mono text-slate-300">
                      রেকর্ডিং সম্পন্ন ({formatSeconds(recordingTime)})
                    </span>
                  </div>
                ) : (
                  <span className="text-xs text-slate-500">
                    রেকর্ড শুরু করতে নিচের লাল বাটনে চাপ দিন
                  </span>
                )}
              </div>

              {/* Timer Display */}
              <div className="flex items-center gap-2">
                <span
                  className={`w-3 h-3 rounded-full ${
                    isRecording ? 'bg-rose-500 animate-pulse' : 'bg-slate-600'
                  }`}
                />
                <span className="font-mono text-xl sm:text-2xl font-extrabold text-white tracking-wider">
                  {formatSeconds(recordingTime)}
                </span>
              </div>

              {/* Recording Controls */}
              <div className="flex items-center gap-4">
                {!isRecording && !audioUrl && (
                  <button
                    id="start-voice-recording-btn"
                    type="button"
                    onClick={startRecording}
                    className="w-16 h-16 rounded-full bg-gradient-to-tr from-rose-500 to-pink-600 hover:from-rose-400 hover:to-pink-500 text-white flex items-center justify-center shadow-lg shadow-rose-500/30 active:scale-95 transition-all"
                  >
                    <Mic className="w-8 h-8" />
                  </button>
                )}

                {isRecording && (
                  <button
                    id="stop-voice-recording-btn"
                    type="button"
                    onClick={stopRecording}
                    className="w-16 h-16 rounded-full bg-slate-800 hover:bg-slate-700 text-rose-400 border-2 border-rose-500 flex items-center justify-center shadow-lg active:scale-95 transition-all animate-pulse"
                  >
                    <Square className="w-6 h-6 fill-current" />
                  </button>
                )}

                {audioUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      if (previewAudioRef.current) previewAudioRef.current.pause();
                      setAudioUrl(null);
                      setRecordedBlob(null);
                      setRecordingTime(0);
                    }}
                    className="p-3 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                    title="পুনরায় রেকর্ড করুন"
                  >
                    <RotateCcw className="w-5 h-5" />
                  </button>
                )}
              </div>
            </>
          )}

          {/* Caption */}
          {audioUrl && (
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="ভয়েসের সাথে বার্তা বা ক্যাপশন (ঐচ্ছিক)..."
              className="w-full bg-slate-950 border border-slate-700 focus:border-indigo-400 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none"
            />
          )}
        </div>

        {/* Footer */}
        {audioUrl && (
          <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
            >
              বাতিল
            </button>

            <button
              id="send-voice-submit-btn"
              type="button"
              onClick={handleSend}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-400 hover:to-cyan-400 text-white font-bold text-xs sm:text-sm shadow-lg shadow-indigo-500/25 active:scale-95 transition-all"
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
