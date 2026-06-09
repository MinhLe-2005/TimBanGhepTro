import { useState } from "react";
import { Smile } from "lucide-react";

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

  // Check if current user reacted with specific emoji
  const hasUserReacted = (emoji: string) => {
    return reactions[emoji]?.includes(currentUserId) || false;
  };

  const handleEmojiClick = (emoji: string) => {
    if (hasUserReacted(emoji)) {
      onRemoveReaction(emoji);
    } else {
      onAddReaction(emoji);
    }
    setShowPicker(false);
  };

  // Get sorted reactions (by count, descending)
  const sortedReactions = Object.entries(reactions)
    .filter(([_, users]) => users.length > 0)
    .sort(([, a], [, b]) => b.length - a.length);

  return (
    <div className={`flex items-center gap-1 ${isMyMessage ? 'justify-end' : 'justify-start'}`}>
      {/* Reaction bubbles */}
      {sortedReactions.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {sortedReactions.map(([emoji, users]) => (
            <button
              key={emoji}
              onClick={() => handleEmojiClick(emoji)}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold transition-all ${
                hasUserReacted(emoji)
                  ? "bg-sky-100 border-2 border-sky-400 text-sky-700"
                  : "bg-white border border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
              }`}
              title={`${users.length} người`}
            >
              <span className="text-sm">{emoji}</span>
              {users.length > 1 && <span className="text-[10px]">{users.length}</span>}
            </button>
          ))}
        </div>
      )}

      {/* Add reaction button (only show for partner's messages) */}
      {!isMyMessage && (
        <div className="relative">
          <button
            onClick={() => setShowPicker(!showPicker)}
            className="w-6 h-6 rounded-full bg-white border border-slate-200 hover:border-sky-300 hover:bg-sky-50 flex items-center justify-center transition-all"
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
              {/* Popup */}
              <div className="absolute bottom-full left-0 mb-2 bg-white border border-slate-200 rounded-2xl shadow-xl p-2 flex gap-1 z-50 animate-fade-in">
                {REACTION_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => handleEmojiClick(emoji)}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-2xl transition-all hover:bg-sky-50 hover:scale-125 ${
                      hasUserReacted(emoji) ? "bg-sky-100 scale-110" : ""
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
  );
}
