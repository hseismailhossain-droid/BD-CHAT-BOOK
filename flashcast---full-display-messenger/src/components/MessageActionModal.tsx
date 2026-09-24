import React, { useState, useEffect } from 'react';
import {
  Clock,
  Trash2,
  Edit3,
  Users,
  User,
  AlertTriangle,
  Check,
  X,
  Sparkles,
} from 'lucide-react';
import { ChatMessage } from '../types';

interface MessageActionModalProps {
  isOpen: boolean;
  message: ChatMessage | null;
  isMyMessage: boolean;
  onClose: () => void;
  onEditMessage: (messageId: string, newContent: string) => void;
  onDeleteMessage: (messageId: string, deleteForEveryone: boolean) => void;
}

export const MessageActionModal: React.FC<MessageActionModalProps> = ({
  isOpen,
  message,
  isMyMessage,
  onClose,
  onEditMessage,
  onDeleteMessage,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState('');
  const [confirmDeleteEveryone, setConfirmDeleteEveryone] = useState(false);

  useEffect(() => {
    if (message) {
      setEditText(message.content || '');
      setIsEditing(false);
      setConfirmDeleteEveryone(false);
    }
  }, [message]);

  if (!isOpen || !message) return null;

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editText.trim()) return;
    onEditMessage(message.id, editText.trim());
    onClose();
  };

  const handleDeleteForMe = () => {
    onDeleteMessage(message.id, false);
    onClose();
  };

  const handleDeleteForEveryone = () => {
    onDeleteMessage(message.id, true);
    onClose();
  };

  return (
    <div
      id="message-action-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        id="message-action-modal"
        className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-5 overflow-hidden text-slate-100 animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white font-['Hind_Siliguri',sans-serif]">
                {isEditing ? 'বার্তা সম্পাদনা (Edit Message)' : 'বার্তা অপশন (Message Options)'}
              </h3>
              <p className="text-[11px] text-slate-400">
                {isMyMessage ? 'আপনার প্রেরিত বার্তা' : 'গৃহীত বার্তা'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        {isEditing ? (
          <form onSubmit={handleSaveEdit} className="mt-4 space-y-3">
            <label className="block text-xs font-semibold text-slate-300">
              নতুন বার্তা লিখুন:
            </label>
            <textarea
              id="edit-message-textarea"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              rows={3}
              className="w-full bg-slate-950 border border-cyan-500/50 focus:border-cyan-400 rounded-xl p-3 text-sm text-white focus:outline-none font-['Hind_Siliguri',sans-serif] resize-none"
              placeholder="সম্পাদনা করুন..."
              autoFocus
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
              >
                বাতিল
              </button>
              <button
                id="save-edit-message-btn"
                type="submit"
                disabled={!editText.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-md shadow-cyan-600/30 disabled:opacity-40 transition-all"
              >
                <Check className="w-3.5 h-3.5" />
                <span>সংরক্ষণ করুন</span>
              </button>
            </div>
          </form>
        ) : confirmDeleteEveryone ? (
          <div className="mt-4 space-y-4">
            <div className="p-3 bg-rose-950/40 border border-rose-500/40 rounded-xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <p className="font-bold text-rose-200">
                  Delete for Everyone নিশ্চিত করতে চান?
                </p>
                <p className="text-rose-300/80">
                  এই বার্তাটি আপনার এবং অপর পাশের ব্যবহারকারীর স্ক্রিন ও চ্যাট থেকে স্থায়ীভাবে মুছে যাবে।
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteEveryone(false)}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
              >
                ফিরে যান
              </button>
              <button
                id="confirm-delete-everyone-btn"
                type="button"
                onClick={handleDeleteForEveryone}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-600/30 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete for Everyone</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-4 space-y-2">
            {/* Current Message Preview */}
            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl mb-3">
              <p className="text-xs text-slate-400 mb-1 font-mono">বার্তার বিষয়বস্তু:</p>
              <p className="text-sm text-slate-200 font-['Hind_Siliguri',sans-serif] line-clamp-2">
                {message.content || '[ছবি/মিডিয়া/ড্রয়িং]'}
              </p>
              {message.expiresAt && (
                <div className="mt-2 flex items-center gap-1.5 text-[11px] text-amber-400 font-mono">
                  <Clock className="w-3 h-3" />
                  <span>
                    স্বয়ংক্রিয়ভাবে মুছে যাবে (TTL: {message.ttlSeconds} সেকেন্ড)
                  </span>
                </div>
              )}
            </div>

            {/* Actions */}
            {isMyMessage && !message.isDeletedForEveryone && (
              <button
                id="modal-edit-message-btn"
                type="button"
                onClick={() => setIsEditing(true)}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-800/60 hover:bg-cyan-950/60 border border-slate-700/60 hover:border-cyan-500/40 text-slate-200 hover:text-cyan-300 transition-all group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                    <Edit3 className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-bold text-white group-hover:text-cyan-200">
                      বার্তা এডিট করুন (Edit)
                    </div>
                    <div className="text-[10px] text-slate-400">
                      ভুল হলে বার্তাটি পুনরায় লিখে পরিবর্তন করুন
                    </div>
                  </div>
                </div>
              </button>
            )}

            {/* Delete for Me */}
            <button
              id="modal-delete-for-me-btn"
              type="button"
              onClick={handleDeleteForMe}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-slate-600 text-slate-200 transition-all group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-slate-700/50 text-slate-300 flex items-center justify-center">
                  <User className="w-3.5 h-3.5" />
                </div>
                <div className="text-left">
                  <div className="text-xs font-bold text-white">
                    আমার স্ক্রিন থেকে মুছুন (Delete for Me)
                  </div>
                  <div className="text-[10px] text-slate-400">
                    শুধু আপনার ডিভাইস থেকে এটি ডিলিট হবে
                  </div>
                </div>
              </div>
            </button>

            {/* Delete for Everyone */}
            {isMyMessage && !message.isDeletedForEveryone && (
              <button
                id="modal-delete-for-everyone-trigger-btn"
                type="button"
                onClick={() => setConfirmDeleteEveryone(true)}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-rose-950/30 hover:bg-rose-950/60 border border-rose-500/30 hover:border-rose-500 text-rose-200 transition-all group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center">
                    <Users className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-bold text-rose-300 group-hover:text-white">
                      সবার জন্য মুছুন (Delete for Everyone)
                    </div>
                    <div className="text-[10px] text-rose-400/80">
                      আপনার ও অপর পাশের দুই স্ক্রিন থেকেই বার্তাটি ডিলিট হবে
                    </div>
                  </div>
                </div>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
