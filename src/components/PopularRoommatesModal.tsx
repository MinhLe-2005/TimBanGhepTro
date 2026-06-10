import { X, Heart, TrendingUp } from "lucide-react";
import { Roommate } from "../types";
import RoommateCard from "./RoommateCard";

interface PopularRoommatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  popularRoommates: Roommate[];
  roommateLikeCounts: Record<string, number>;
  likedRoommateIds: string[];
  onLikeRoommate?: (id: string, isLiked: boolean) => void | Promise<boolean>;
  onViewRoommate: (roommate: Roommate) => void;
  onStartChat?: (id: string) => void;
}

export default function PopularRoommatesModal({
  isOpen,
  onClose,
  popularRoommates,
  roommateLikeCounts,
  likedRoommateIds,
  onLikeRoommate,
  onViewRoommate,
  onStartChat,
}: PopularRoommatesModalProps) {
  if (!isOpen) return null;

  if (popularRoommates.length === 0) {
    return (
      <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
        <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 text-center">
          <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Heart className="w-10 h-10 text-rose-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">Chưa có người nổi bật</h3>
          <p className="text-slate-500 mb-6">
            Chưa có profile nào được nhiều người quan tâm. Hãy thả tym để ủng hộ các bạn nhé!
          </p>
          <button
            onClick={onClose}
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md flex items-center justify-center animate-fade-in p-4 sm:p-6 lg:p-8"
      onClick={onClose}
    >
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 sm:top-6 sm:right-6 w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-all z-10 group"
      >
        <X className="w-6 h-6 group-hover:rotate-90 transition-transform" />
      </button>

      {/* Content Container */}
      <div
        className="relative w-full max-w-7xl h-[90vh] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 sm:p-8 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-rose-100 rounded-xl flex items-center justify-center text-rose-500">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-800">Được Cộng Đồng Quan Tâm</h2>
              <p className="text-slate-500 text-sm mt-1">Danh sách những người dùng nổi bật nhất trên hệ thống</p>
            </div>
          </div>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rose-50 border border-rose-100 text-rose-600 font-bold text-sm shadow-sm">
            <Heart className="w-4 h-4 fill-current" />
            {popularRoommates.length} hồ sơ nổi bật
          </div>
        </div>

        {/* Scrollable Grid Container */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 scrollbar-thin">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {popularRoommates.map((roommate) => (
              <RoommateCard
                key={roommate.id}
                roommate={roommate}
                compact
                likeCount={roommateLikeCounts[roommate.id] || 0}
                showLikeCount
                onViewDetails={onViewRoommate}
                onLikeChange={onLikeRoommate}
                isInitiallyLiked={likedRoommateIds.includes(roommate.id)}
                onStartChat={onStartChat}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
