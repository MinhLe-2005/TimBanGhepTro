import { X, Heart, ChevronLeft, ChevronRight, TrendingUp } from "lucide-react";
import { Roommate } from "../types";
import { useState } from "react";
import RoommateCard from "./RoommateCard";

interface PopularRoommatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  popularRoommates: Roommate[];
  roommateLikeCounts: Record<string, number>;
  likedRoommateIds: string[];
  onLikeRoommate: (id: string, isLiked: boolean) => void | Promise<boolean>;
  onViewRoommate: (roommate: Roommate) => void;
  onStartChat: (id: string) => void;
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
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  if (!isOpen) return null;

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? popularRoommates.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === popularRoommates.length - 1 ? 0 : prev + 1));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") handlePrev();
    if (e.key === "ArrowRight") handleNext();
    if (e.key === "Escape") onClose();
  };

  // Touch swipe handling

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (touchStart - touchEnd > 75) {
      // Swipe left
      handleNext();
    }
    if (touchStart - touchEnd < -75) {
      // Swipe right
      handlePrev();
    }
  };

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

  const currentRoommate = popularRoommates[currentIndex];
  const likeCount = roommateLikeCounts[currentRoommate.id] || 0;

  return (
    <div
      className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md flex items-center justify-center animate-fade-in"
      onClick={onClose}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-6 right-6 w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-all z-10 group"
      >
        <X className="w-6 h-6 group-hover:rotate-90 transition-transform" />
      </button>

      {/* Content Container */}
      <div
        className="relative max-w-2xl w-full mx-4"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 mb-3">
            <TrendingUp className="w-5 h-5 text-rose-400" />
            <span className="text-white font-bold text-sm">Được Cộng Đồng Quan Tâm</span>
          </div>
          <p className="text-white/80 text-sm">
            {currentIndex + 1} / {popularRoommates.length}
          </p>
        </div>

        {/* Card Container with Navigation */}
        <div className="relative">
          {/* Previous Button */}
          {popularRoommates.length > 1 && (
            <button
              onClick={handlePrev}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-16 w-12 h-12 bg-white hover:bg-slate-50 rounded-full shadow-xl flex items-center justify-center text-slate-700 transition-all hover:scale-110 z-10"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          {/* Card */}
          <div className="bg-white rounded-3xl shadow-2xl p-6 animate-scale-in">
            {/* Like Badge */}
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-lg">
                <Heart className="w-5 h-5 fill-current" />
                <span className="font-bold">{likeCount} lượt quan tâm</span>
              </div>
            </div>

            {/* Roommate Card */}
            <RoommateCard
              roommate={currentRoommate}
              onViewDetails={onViewRoommate}
              onLikeChange={onLikeRoommate}
              isInitiallyLiked={likedRoommateIds.includes(currentRoommate.id)}
              onStartChat={onStartChat}
            />

            {/* Swipe Hint */}
            {popularRoommates.length > 1 && (
              <div className="text-center mt-4 text-slate-400 text-sm">
                <span className="hidden sm:inline">Dùng phím ← → hoặc </span>
                Vuốt để xem thêm
              </div>
            )}
          </div>

          {/* Next Button */}
          {popularRoommates.length > 1 && (
            <button
              onClick={handleNext}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-16 w-12 h-12 bg-white hover:bg-slate-50 rounded-full shadow-xl flex items-center justify-center text-slate-700 transition-all hover:scale-110 z-10"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}
        </div>

        {/* Dots Indicator */}
        {popularRoommates.length > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            {popularRoommates.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentIndex
                    ? "bg-white w-8"
                    : "bg-white/30 hover:bg-white/50"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
