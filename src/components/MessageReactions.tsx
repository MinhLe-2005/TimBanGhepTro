import { useState } from "react";
import { Smile } from "lucide-react";
import ReactionDetailsModal from "./ReactionDetailsModal";

interface MessageReactionsProps {
  messageId?: string;
  reactions?: Record<string, string[]>; // { "❤️": ["user1", "user2"], "😂": ["user3"] }
  currentUserId: string;
  onAddReaction: (emoji: string) => void;
  onRemoveReaction: (emoji: string) => void;
  isMyMessage: boolean;
}

const REACTION_EMOJIS = ["❤️", "😂", "😮", "😢", "😠", "👍"];

export default function MessageReactions({
  reactions = {},
  currentUserId,
  onAddReaction,
  onRemoveReaction,
  isMyMessage,
}: MessageReactionsProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Check if current user has reacted (with any emoji)
  const getUserReaction = (): string | null => {
    for (const [emoji, users] of Object.entries(reactions)) {
      if (users.includes(currentUserId)) {
        return emoji;
      }
    }
    return null;
  };

  const currentUserReaction = getUserReaction();

  const handleEmojiClick = (emoji: string) => {
    // If user already reacted with this emoji, remove it
    if (currentUserReaction === emoji) {
      onRemoveReaction(emoji);
    } else {
      // If user reacted with different emoji, remove old one first
      if (currentUserReaction) {
        onRemoveReaction(currentUserReaction);
      }
      // Add new reaction
      onAddReaction(emoji);
    }
    setShowPicker(false);
  };

  // Get sorted reactions (by count, descending)
  const sortedReactions = Object.entries(reactions)
    .filter(([_, users]) => users.length > 0)
    .sort(([, a], [, b]) => b.length - a.length);

  return (
    <>
      <div className="flex items-center gap-1">
        {/* Reaction bubbles - horizontal */}
        {sortedReactions.length > 0 && (
          <div className="flex items-center gap-1 relative">
            {sortedReactions.slice(0, 1).map(([emoji, users]) => (
              <button
                key={emoji}
                onClick={() => setShowDetailsModal(true)}
                className={`inline-flex items-center gap-0.5 px-2 py-1 rounded-full text-sm transition-all cursor-pointer shadow-md ${
                  currentUserReaction === emoji
                    ? "bg-sky-100 border-2 border-sky-400"
                    : "bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <span>{emoji}</span>
                {users.length > 1 && <span className="text-[10px] font-bold">{users.length}</span>}
              </button>
            ))}
          </div>
        )}

        {/* Add reaction button (only show for partner's messages) */}
        {!isMyMessage && (
          <div className="relative">
            <button
              onClick={() => setShowPicker(!showPicker)}
              className="w-6 h-6 rounded-full bg-white border border-slate-200 hover:border-sky-300 hover:bg-sky-50 flex items-center justify-center transition-all cursor-pointer shadow-sm"
              title="Thêm reaction"
            >
              <Smile className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Emoji picker popup */}
            {showPicker && (
              <>
                {/* Backdrop */}
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowPicker(false)}
                />
                {/* Popup - horizontal */}
                <div className="absolute bottom-full right-0 mb-2 bg-white border border-slate-200 rounded-2xl shadow-xl p-2 flex gap-1 z-50 animate-fade-in">
                  {REACTION_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => handleEmojiClick(emoji)}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center text-2xl transition-all hover:bg-sky-50 hover:scale-125 cursor-pointer ${
                        currentUserReaction === emoji ? "bg-sky-100 scale-110" : ""
                      }`}
                      title={emoji}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Reaction Details Modal */}
      <ReactionDetailsModal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        reactions={reactions}
        currentUserId={currentUserId}
        onRemoveReaction={onRemoveReaction}
      />
    </>
  );
}
