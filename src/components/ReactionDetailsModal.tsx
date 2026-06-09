import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

interface ReactionDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  reactions: Record<string, string[]>;
  currentUserId: string;
  currentUserName?: string;
  currentUserAvatar?: string;
  partnerName?: string;
  partnerId?: string;
  partnerAvatar?: string;
  onRemoveReaction: (emoji: string) => void;
}

export default function ReactionDetailsModal({
  isOpen,
  onClose,
  reactions,
  currentUserId,
  currentUserName = 'Bạn',
  currentUserAvatar,
  partnerName = 'Đối phương',
  partnerId,
  partnerAvatar,
  onRemoveReaction,
}: ReactionDetailsModalProps) {
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setSelectedEmoji(null);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Get all reactions with counts
  const reactionTabs = Object.entries(reactions)
    .filter(([_, users]) => users.length > 0)
    .sort(([, a], [, b]) => b.length - a.length);

  const totalReactions = reactionTabs.reduce((sum, [_, users]) => sum + users.length, 0);

  const visibleUsers = reactionTabs
    .filter(([emoji]) => selectedEmoji === null || emoji === selectedEmoji)
    .flatMap(([emoji, users]) =>
    users.map(userId => ({ userId, emoji }))
  );

  return createPortal(
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[2px]"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-[0_24px_80px_rgba(15,23,42,0.30)] animate-fade-in"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="reaction-details-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <h3 id="reaction-details-title" className="text-lg font-bold text-slate-800">Cảm xúc về tin nhắn</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-200 overflow-x-auto">
          <button
            onClick={() => setSelectedEmoji(null)}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold transition-colors ${
              selectedEmoji === null
                ? "border-2 border-sky-400 bg-sky-100 text-sky-700"
                : "border-2 border-transparent bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <span>Tất cả</span>
            <span className="text-xs">{totalReactions}</span>
          </button>
          {reactionTabs.map(([emoji, users]) => (
            <button
              key={emoji}
              onClick={() => setSelectedEmoji(emoji)}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold transition-colors ${
                selectedEmoji === emoji
                  ? "border-2 border-sky-400 bg-sky-100 text-sky-700"
                  : "border-2 border-transparent bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              <span className="text-base">{emoji}</span>
              <span className="text-xs">{users.length}</span>
            </button>
          ))}
        </div>

        {/* User list */}
        <div className="max-h-96 overflow-y-auto p-4">
          {visibleUsers.map(({ userId, emoji }, idx) => {
            const isCurrentUser = userId === currentUserId;
            // Check if this is the partner by comparing userId with partnerId
            const isPartner = partnerId && userId === partnerId;
            
            // Use real names for current user and partner only
            const displayName = isCurrentUser 
              ? (currentUserName || 'Bạn')
              : (isPartner ? (partnerName || 'Đối phương') : `Người dùng ${idx + 1}`);
            const avatarUrl = isCurrentUser
              ? currentUserAvatar
              : (isPartner ? partnerAvatar : undefined);
            
            return (
              <div
                key={`${userId}-${idx}`}
                className="flex items-center justify-between py-3 hover:bg-slate-50 rounded-lg px-2 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={displayName}
                      className="h-10 w-10 rounded-full border border-slate-200 object-cover shadow-sm"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 to-blue-500 font-bold text-white">
                      {displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div className="font-semibold text-slate-800">
                      {displayName}
                    </div>
                    {isCurrentUser && (
                      <div className="text-xs text-slate-500 cursor-pointer hover:underline" onClick={() => {
                        onRemoveReaction(emoji);
                        onClose();
                      }}>
                        Nhấp để gỡ
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-2xl">{emoji}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>,
    document.body
  );
}
