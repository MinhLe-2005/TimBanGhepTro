import { X, Heart, TrendingUp } from "lucide-react";
import { createPortal } from "react-dom";
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
    return createPortal(
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
        {/* Backdrop */}
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={onClose} />
        
        <div className="relative w-full max-w-md z-10 animate-fade-in bg-white rounded-[32px] shadow-2xl p-8 text-center border border-white/80">
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
      </div>,
      document.body
    );
  }

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={onClose} />

      {/* Modal Wrapper */}
      <div className="relative w-full max-w-7xl z-10 animate-fade-in">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-10 h-10 rounded-xl bg-white/90 shadow-md border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-white active:scale-95 duration-200 cursor-pointer z-50"
          aria-label="Đóng"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Scrollable Container */}
        <div className="bg-[#fbfdff] rounded-[32px] shadow-2xl border border-white/80 w-full max-h-[90vh] flex flex-col overflow-hidden">
          {/* Header */}
          <section className="relative overflow-hidden border-b border-sky-100 bg-white shadow-[0_4px_20px_rgba(15,80,110,0.05)] shrink-0">
            <div className="absolute inset-x-0 top-0 h-full bg-gradient-to-br from-[#ccefff] via-[#e3f7fb] to-[#d8f6e9] opacity-40" />
            <div className="absolute -left-8 top-5 h-32 w-32 rounded-full bg-sky-400/20 blur-2xl" />
            <div className="absolute right-12 top-0 h-28 w-28 rounded-full bg-emerald-400/15 blur-2xl" />

            <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 sm:p-8 pr-14">
              <div className="flex items-center gap-4">
                <div className="relative h-14 w-14 overflow-hidden rounded-2xl border-2 border-white bg-white shadow-md flex items-center justify-center shrink-0">
                  <div className="absolute inset-0 bg-rose-50" />
                  <TrendingUp className="w-7 h-7 text-rose-500 relative z-10" />
                </div>
                <div>
                  <h2 className="text-2xl sm:text-3xl font-black text-[#07132d] tracking-tight">Được Cộng Đồng Quan Tâm</h2>
                  <p className="text-slate-500 text-sm mt-1 font-medium">Danh sách những người dùng nổi bật nhất trên hệ thống</p>
                </div>
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-rose-100 text-rose-600 font-bold text-sm shadow-sm backdrop-blur-md">
                <Heart className="w-4 h-4 fill-current" />
                {popularRoommates.length} hồ sơ nổi bật
              </div>
            </div>
          </section>

          {/* Scrollable Grid Container */}
          <div className="overflow-y-auto w-full h-full p-4 sm:p-6 lg:p-8 scrollbar-thin scrollbar-thumb-slate-200 hover:scrollbar-thumb-slate-300">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5 sm:gap-6">
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
    </div>,
    document.body
  );
}
