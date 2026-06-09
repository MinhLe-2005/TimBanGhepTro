import { X } from "lucide-react";

interface ReactionDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  reactions: Record<string, string[]>;
  currentUserId: string;
  currentUserName?: string;
  partnerName?: string;
  partnerId?: string;
  onRemoveReaction: (emoji: string) => void;
}

export default function ReactionDetailsModal({
  isOpen,
  onClose,
  reactions,
  currentUserId,
  currentUserName = 'Bạn',
  partnerName = 'Đối phương',
  partnerId,
  onRemoveReaction,
}: ReactionDetailsModalProps) {
  if (!isOpen) return null;

  // Get all reactions with counts
  const reactionTabs = Object.entries(reactions)
    .filter(([_, users]) => users.length > 0)
    .sort(([, a], [, b]) => b.length - a.length);

  const totalReactions = reactionTabs.reduce((sum, [_, users]) => sum + users.length, 0);

  // For now, just show "Tất cả" tab
  const allUsers = reactionTabs.flatMap(([emoji, users]) =>
    users.map(userId => ({ userId, emoji }))
  );

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50 animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-2xl shadow-2xl z-50 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <h3 className="text-lg font-bold text-slate-800">Cảm xúc về tin nhắn</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-200 overflow-x-auto">
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sky-100 border-2 border-sky-400 text-sky-700 font-bold text-sm cursor-pointer">
            <span>Tất cả</span>
            <span className="text-xs">{totalReactions}</span>
          </button>
          {reactionTabs.map(([emoji, users]) => (
            <button
              key={emoji}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm transition-colors cursor-pointer"
            >
              <span className="text-base">{emoji}</span>
              <span className="text-xs">{users.length}</span>
            </button>
          ))}
        </div>

        {/* User list */}
        <div className="max-h-96 overflow-y-auto p-4">
          {allUsers.map(({ userId, emoji }, idx) => {
            const isCurrentUser = userId === currentUserId;
            // Check if this is the partner by comparing userId with partnerId
            const isPartner = partnerId && userId === partnerId;
            
            // Use real names for current user and partner only
            const displayName = isCurrentUser 
              ? (currentUserName || 'Bạn')
              : (isPartner ? (partnerName || 'Đối phương') : `Người dùng ${idx + 1}`);
            
            return (
              <div
                key={`${userId}-${idx}`}
                className="flex items-center justify-between py-3 hover:bg-slate-50 rounded-lg px-2 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {/* Avatar placeholder */}
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center text-white font-bold">
                    {isCurrentUser ? 'B' : (isPartner && partnerName ? partnerName.charAt(0).toUpperCase() : 'U')}
                  </div>
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
    </>
  );
}
