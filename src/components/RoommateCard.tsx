import { CheckCircle2, Heart, HeartOff } from "lucide-react";
import { Roommate } from "../types";
import { useState } from "react";

interface RoommateCardProps {
  roommate: Roommate;
  onViewDetails: (roommate: Roommate) => void;
  onLikeChange?: (id: string, isLiked: boolean) => void;
  isInitiallyLiked?: boolean;
  onStartChat?: (id: string) => void;
}

export default function RoommateCard({
  roommate,
  onViewDetails,
  onLikeChange,
  isInitiallyLiked = false,
  onStartChat,
}: RoommateCardProps) {
  const [isLiked, setIsLiked] = useState(isInitiallyLiked);

  // Set tag distinct colors
  const getTagColor = (tag: string) => {
    switch (tag) {
      case "Cú đêm":
        return "bg-purple-50 text-purple-700 border-purple-100";
      case "Ngủ sớm":
        return "bg-emerald-50 text-emerald-700 border-emerald-100";
      case "Yêu mèo":
      case "Yêu chó":
        return "bg-amber-50 text-amber-700 border-amber-100";
      case "Không hút thuốc":
        return "bg-sky-50 text-sky-700 border-sky-100";
      case "Thích nấu ăn":
        return "bg-orange-50 text-orange-700 border-orange-100";
      case "Ngăn nắp":
      case "Sạch sẽ":
        return "bg-blue-50 text-blue-700 border-blue-100";
      case "Hướng nội":
        return "bg-indigo-50 text-indigo-700 border-indigo-100";
      case "Hướng ngoại":
        return "bg-pink-50 text-pink-700 border-pink-100";
      default:
        return "bg-slate-50 text-slate-700 border-slate-100";
    }
  };

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newLiked = !isLiked;
    setIsLiked(newLiked);
    if (onLikeChange) {
      onLikeChange(roommate.id, newLiked);
    }
  };

  const averageRating = roommate.reviews && roommate.reviews.length > 0 
    ? (roommate.reviews.reduce((acc, curr) => acc + curr.rating, 0) / roommate.reviews.length).toFixed(1)
    : "5.0";
  const reviewsCount = roommate.reviews ? roommate.reviews.length : 0;

  return (
    <div
      onClick={() => onViewDetails(roommate)}
      className="group bg-white rounded-[24px] overflow-hidden border border-gray-100 cursor-pointer shadow-[0_10px_30px_rgba(15,23,42,0.04)] hover:shadow-[0_20px_40px_rgba(15,23,42,0.08)] hover:-translate-y-1.5 transition-all duration-300"
    >
      {/* Profile Image & Top Badges */}
      <div className="relative aspect-[3/4] overflow-hidden bg-slate-50">
        <img
          src={roommate.avatar}
          alt={roommate.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          referrerPolicy="no-referrer"
        />

        {/* Compatibility Match Badge */}
        <div className="absolute top-4 left-4 z-10 flex flex-col gap-1.5 items-start">
          <div className="bg-white/95 backdrop-blur-sm px-3.5 py-1.5 rounded-full shadow-sm flex items-center gap-1.5 border border-sky-100/50">
            <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
            <span className="text-[12px] font-bold text-[#006590]">Match {roommate.matchScore}%</span>
          </div>
        </div>

        {/* Saved Like Button */}
        <button
          onClick={handleLike}
          className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/95 backdrop-blur-sm flex items-center justify-center text-slate-400 hover:text-red-500 hover:scale-110 active:scale-90 transition-all duration-200 border border-slate-100/50"
        >
          <Heart className={`h-5 w-5 ${isLiked ? "fill-red-500 text-red-500" : ""}`} />
        </button>

        {/* Gradient Overlay for name readability (if any text sits on card image, but here it's below. Still, adds beautiful depth) */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/10 via-transparent to-transparent opacity-60 pointer-events-none" />
      </div>

      {/* Profile Metadata */}
      <div className="p-6 flex flex-col justify-between h-[230px]">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <h3 className="text-xl font-bold text-slate-800 tracking-tight">
              {roommate.name}, {roommate.age}
            </h3>
          </div>

          {/* Trust & Rating row */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <div className="flex items-center gap-1 text-[11px] font-extrabold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-[6px]">
              <span>⭐</span>
              <span>{averageRating}</span>
              <span className="text-amber-500/80 font-bold">({reviewsCount})</span>
            </div>
            <div className={`text-[11px] font-bold px-2.5 py-0.5 rounded-[6px] border ${
              roommate.status === "Đã có phòng"
                ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                : "bg-purple-50 text-purple-700 border-purple-100"
            }`}>
              {roommate.status === "Đã có phòng" ? "🏠 Đã có phòng" : "🔍 Chưa có phòng"}
            </div>
          </div>

          <p className="text-xs text-slate-500 font-medium mb-4 line-clamp-1">
            {roommate.role} • {roommate.location}
          </p>

          {/* Lifestyle Tags */}
          <div className="flex flex-wrap gap-2">
            {roommate.tags.slice(0, 3).map((tag, idx) => (
              <span
                key={idx}
                className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${getTagColor(tag)}`}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Nhắn tin ngay button - spacious and high usability */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (onStartChat) {
              onStartChat(roommate.id);
            }
          }}
          className="w-full bg-[#006590] hover:bg-[#005176] text-white py-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-sm active:scale-95 duration-100 transition-all select-none uppercase cursor-pointer"
        >
          <span>Nhắn tin ngay</span>
        </button>
      </div>
    </div>
  );
}
