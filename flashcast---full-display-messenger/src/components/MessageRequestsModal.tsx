import React, { useState } from 'react';
import {
  Bell,
  Check,
  X,
  Clock,
  ArrowUpRight,
  Inbox,
  ShieldCheck,
  UserCheck,
  Sparkles,
  PhoneCall,
  Trash2,
} from 'lucide-react';
import { ConnectionRequest } from '../types';
import { formatCode } from '../utils/codeGenerator';

interface MessageRequestsModalProps {
  isOpen: boolean;
  onClose: () => void;
  incomingRequests: ConnectionRequest[];
  outgoingRequests: ConnectionRequest[];
  onAccept: (fromCode: string) => void;
  onReject: (fromCode: string) => void;
  onCancelSent: (toCode: string) => void;
}

export const MessageRequestsModal: React.FC<MessageRequestsModalProps> = ({
  isOpen,
  onClose,
  incomingRequests,
  outgoingRequests,
  onAccept,
  onReject,
  onCancelSent,
}) => {
  const [activeTab, setActiveTab] = useState<'incoming' | 'outgoing'>('incoming');

  if (!isOpen) return null;

  const formatTimestamp = (ts: number) => {
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'এইমাত্র';
    if (mins < 60) return `${mins} মিনিট আগে`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} ঘণ্টা আগে`;
    return new Date(ts).toLocaleDateString('bn-BD');
  };

  return (
    <div
      id="message-requests-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-lg bg-slate-950 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Top Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-cyan-500/20">
              <Inbox className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white font-['Hind_Siliguri',sans-serif] leading-tight">
                মেসেজ ও কানেকশন রিকোয়েস্ট
              </h3>
              <p className="text-[11px] text-slate-400 font-['Hind_Siliguri',sans-serif]">
                রিকোয়েস্ট গ্রহণ (Accept) বা বাতিল (Cancel) করুন
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="বন্ধ করুন"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-5 pt-3 border-b border-slate-800/80 flex items-center gap-2 bg-slate-950/40">
          <button
            type="button"
            onClick={() => setActiveTab('incoming')}
            className={`pb-2.5 px-3 text-xs sm:text-sm font-semibold flex items-center gap-2 border-b-2 transition-all font-['Hind_Siliguri',sans-serif] ${
              activeTab === 'incoming'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>প্রাপ্ত রিকোয়েস্ট (ইনকামিং)</span>
            {incomingRequests.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white animate-pulse">
                {incomingRequests.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('outgoing')}
            className={`pb-2.5 px-3 text-xs sm:text-sm font-semibold flex items-center gap-2 border-b-2 transition-all font-['Hind_Siliguri',sans-serif] ${
              activeTab === 'outgoing'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>পাঠানো রিকোয়েস্ট (আউটগোয়িং)</span>
            {outgoingRequests.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {outgoingRequests.length}
              </span>
            )}
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-3">
          {activeTab === 'incoming' ? (
            incomingRequests.length === 0 ? (
              <div className="text-center py-10 px-4">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 mb-3">
                  <UserCheck className="w-7 h-7" />
                </div>
                <h4 className="text-sm font-bold text-slate-200 mb-1 font-['Hind_Siliguri',sans-serif]">
                  কোনো ইনকামিং রিকোয়েস্ট নেই
                </h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto font-['Hind_Siliguri',sans-serif] leading-relaxed">
                  কেউ আপনার ৯-ডিজিট কোড দিয়ে চ্যাট রিকোয়েস্ট পাঠালে তা এখানে প্রদর্শিত হবে এবং আপনি এক ক্লিকেই গ্রহণ বা বাতিল করতে পারবেন।
                </p>
              </div>
            ) : (
              incomingRequests.map((req, index) => {
                const formattedCode = formatCode(req.fromCode);
                return (
                  <div
                    key={req.id || `${req.fromCode}_${index}`}
                    className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-slate-900/90 to-slate-950 border border-emerald-500/40 shadow-lg shadow-emerald-500/5 space-y-3 transition-all"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center font-bold text-white text-sm shadow-md shrink-0">
                          {req.fromName ? req.fromName.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-base sm:text-lg font-extrabold text-cyan-300 tracking-wider">
                              {formattedCode}
                            </span>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800/60">
                              নতুন
                            </span>
                          </div>
                          <div className="text-xs text-slate-300 font-medium">
                            {req.fromName || 'অপরিচিত ব্যবহারকারী'}
                          </div>
                        </div>
                      </div>

                      <div className="text-[10px] text-slate-400 flex items-center gap-1 shrink-0">
                        <Clock className="w-3 h-3" />
                        <span>{formatTimestamp(req.timestamp)}</span>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-400 bg-slate-950/60 border border-slate-800/80 rounded-xl p-2.5 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span className="leading-snug">
                        অনুমোদন দিলে উভয় প্রান্তেই নিরাপদ চ্যাট ও ফুল ডিসপ্লে মোড চালু হবে।
                      </span>
                    </div>

                    {/* Action Buttons: Accept & Cancel */}
                    <div className="grid grid-cols-2 gap-2.5 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          onReject(req.fromCode);
                        }}
                        className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-rose-950/80 border border-slate-700 hover:border-rose-500 text-slate-300 hover:text-rose-200 text-xs font-bold transition-all active:scale-95"
                      >
                        <X className="w-4 h-4 text-rose-400" />
                        <span>বাতিল করুন</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          onAccept(req.fromCode);
                          onClose();
                        }}
                        className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-xs font-bold shadow-md shadow-emerald-500/25 transition-all active:scale-95"
                      >
                        <Check className="w-4 h-4" />
                        <span>অনুরোধ গ্রহণ (Accept)</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )
          ) : outgoingRequests.length === 0 ? (
            <div className="text-center py-10 px-4">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 mb-3">
                <ArrowUpRight className="w-7 h-7" />
              </div>
              <h4 className="text-sm font-bold text-slate-200 mb-1 font-['Hind_Siliguri',sans-serif]">
                কোনো পেন্ডিং পাঠানো রিকোয়েস্ট নেই
              </h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto font-['Hind_Siliguri',sans-serif] leading-relaxed">
                আপনি কারও কোড দিয়ে রিকোয়েস্ট পাঠালে তা এখানে থাকবে এবং অপর পাশের ব্যক্তি অনুমোদন না করা পর্যন্ত আপনি চাইলে বাতিল করতে পারবেন।
              </p>
            </div>
          ) : (
            outgoingRequests.map((req, index) => {
              const targetCode = req.toCode || req.fromCode;
              const formattedCode = formatCode(targetCode);
              return (
                <div
                  key={req.id || `${targetCode}_${index}`}
                  className="p-3.5 sm:p-4 rounded-2xl bg-slate-900/80 border border-amber-500/30 space-y-2.5 shadow-md"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0">
                        <Clock className="w-4 h-4 animate-spin" />
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase tracking-wider">
                          পাঠানো কোড:
                        </div>
                        <span className="font-mono text-base font-bold text-cyan-300 tracking-wider">
                          {formattedCode}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800/60 inline-block mb-1">
                        অনুমোদনের অপেক্ষায়
                      </span>
                      <div className="text-[10px] text-slate-400">
                        {formatTimestamp(req.timestamp)}
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 font-['Hind_Siliguri',sans-serif]">
                    অপর পাশের ব্যবহারকারী রিকোয়েস্ট গ্রহণ (Accept) করলেই লাইভ চ্যাট শুরু হবে।
                  </p>

                  <button
                    type="button"
                    onClick={() => onCancelSent(targetCode)}
                    className="w-full py-2 px-3 rounded-xl bg-slate-950 hover:bg-rose-950/70 border border-slate-800 hover:border-rose-500/50 text-slate-300 hover:text-rose-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-95"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                    <span>অনুরোধ বাতিল করুন</span>
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="p-3.5 bg-slate-900/80 border-t border-slate-800/80 text-center">
          <p className="text-[11px] text-slate-400 font-['Hind_Siliguri',sans-serif] flex items-center justify-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span>কোনো ফোন নম্বর ছাড়াই ৯-ডিজিট ইউনিক কোড দিয়ে সম্পূর্ণ গোপনীয় ও সুরক্ষিত মেসেজিং</span>
          </p>
        </div>
      </div>
    </div>
  );
};
