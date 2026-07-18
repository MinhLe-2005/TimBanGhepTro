import { Heart, Pencil, Star, Trash2, ShieldCheck, AlertCircle } from "lucide-react";
import { Roommate } from "../types";
import { useEffect, useState } from "react";
import { getAverageRating, calculateReputationScore, getReputationLabel } from "../utils/scoring";

interface RoommateCardProps {
  roommate: Roommate;
  onViewDetails: (roommate: Roommate) => void;
  onLikeChange?: (id: string, isLiked: boolean) => boolean | void | Promise<boolean>;
  isInitiallyLiked?: boolean;
  onStartChat?: (id: string) => void;
  onEdit?: (roommate: Roommate) => void;
  onDelete?: (id: string) => void;
  onClearSelectedRoommate?: () => void;
  onReport?: (roommate: Roommate) => void;
  currentUserId?: string;
  compact?: boolean;
  likeCount?: number;
  showLikeCount?: boolean;
}

export default function RoommateCard({
  roommate,
  onViewDetails,
  onLikeChange,
  isInitiallyLiked = false,
  onStartChat,
  onEdit,
  onDelete,
  onClearSelectedRoommate,
  onReport,
  currentUserId,
  compact = false,
  likeCount = 0,
  showLikeCount = false,
}: RoommateCardProps) {
  const [isLiked, setIsLiked] = useState(isInitiallyLiked);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  useEffect(() => {
    setIsLiked(isInitiallyLiked);
  }, [isInitiallyLiked]);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onLikeChange) {
      const newLiked = !isLiked;
      const success = await onLikeChange(roommate.id, newLiked);
      if (success !== false) {
        setIsLiked(newLiked);
      }
    } else {
      setIsLiked(!isLiked);
    }
  };

  const reviewsCount = roommate.reviews ? roommate.reviews.length : 0;
  const averageRating = getAverageRating(roommate.reviews);
  const reputationScore = calculateReputationScore(roommate);

  return (
    <div
      onClick={() => onViewDetails(roommate)}
      className="group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-[24px] bg-white text-left transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_12px_40px_rgba(15,23,42,0.12)] border border-slate-200/60"
    >
      {/* Profile Image & Top Badges */}
      <div className={`relative overflow-hidden bg-slate-50 shrink-0 ${compact ? "aspect-[4/3]" : "aspect-[4/5]"}`}>
        <img
          src={roommate.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300&auto=format&fit=crop"}
          alt={roommate.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          referrerPolicy="no-referrer"
        />

        {/* Trust Score Badge */}
        <div className="absolute top-4 left-4 z-10">
          <div className={`flex items-center gap-1.5 backdrop-blur-md px-2.5 py-1 rounded-full shadow-sm border ${
            reputationScore !== null
              ? reputationScore >= 70
                ? "bg-emerald-50/95 border-emerald-200/60 text-emerald-700"
                : reputationScore >= 50
                ? "bg-amber-50/95 border-amber-200/60 text-amber-700"
                : "bg-rose-50/95 border-rose-200/60 text-rose-700"
              : "bg-white/90 border-slate-200/60 text-slate-500"
          }`}>
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="text-[10px] font-black uppercase tracking-wide">
              {reputationScore !== null ? `Uy tín ${reputationScore}%` : "Chưa có điểm"}
            </span>
          </div>
          {roommate.isVerified === false && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/95 backdrop-blur-md border border-amber-400 text-white shadow-sm self-start">
              <span className="text-[10px] font-black uppercase tracking-wide">Chờ duyệt</span>
            </div>
          )}
        </div>

        {/* Action buttons: Like + Report grouped */}
        <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
          {onLikeChange && (
            <button
              onClick={handleLike}
              className="w-8 h-8 rounded-full bg-white/95 backdrop-blur-sm flex items-center justify-center text-slate-400 hover:text-red-500 hover:scale-110 active:scale-90 transition-all duration-200 shadow-sm"
            >
              <Heart className={`h-4 w-4 ${isLiked ? "fill-red-500 text-red-500" : ""}`} />
            </button>
          )}
          {onReport && (
            <button
              onClick={(e) => { e.stopPropagation(); onReport(roommate); }}
              className="w-8 h-8 rounded-full bg-white/95 backdrop-blur-sm flex items-center justify-center text-slate-400 hover:text-amber-500 hover:scale-110 active:scale-90 transition-all duration-200 shadow-sm"
              title="Báo cáo hồ sơ này"
            >
              <AlertCircle className="h-4 w-4" />
            </button>
          )}
        </div>

        {showLikeCount && likeCount > 0 && (
          <div className="absolute bottom-3 left-3 z-10 flex items-center gap-1.5 rounded-full border border-white/70 bg-white/95 px-2.5 py-1 text-[10px] font-bold text-rose-600 shadow-sm backdrop-blur-sm">
            <Heart className="h-3 w-3 fill-rose-500 text-rose-500" />
            <span>{likeCount} lượt quan tâm</span>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/10 via-transparent to-transparent opacity-60 pointer-events-none" />

        {/* Owner actions - floating over the image to keep the card visually continuous */}
        {currentUserId && (roommate.postedBy === currentUserId || roommate.user_id === currentUserId) && (
          <div
            className="absolute bottom-3 right-3 z-20 flex items-center gap-0.5 rounded-xl border border-white/70 bg-white/92 p-1 shadow-[0_6px_18px_rgba(15,23,42,0.16)] backdrop-blur-md"
            onClick={(e) => e.stopPropagation()}
          >
            {onEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(roommate);
                }}
                className="flex h-8 items-center gap-1 rounded-lg px-2.5 text-[10px] font-bold text-[#006590] transition-all hover:bg-sky-50 active:scale-95"
                title="Chỉnh sửa tin đăng"
              >
                <Pencil className="h-3 w-3" />
                <span>Sửa</span>
              </button>
            )}
            {onEdit && onDelete && <span className="h-4 w-px bg-slate-200" />}
            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsConfirmingDelete(true);
                }}
                className="flex h-8 items-center gap-1 rounded-lg px-2.5 text-[10px] font-bold text-red-600 transition-all hover:bg-red-50 active:scale-95"
                title="Xóa tin đăng"
              >
                <Trash2 className="h-3 w-3" />
                <span>Xóa</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Profile Metadata */}
      <div className={`${compact ? "p-4" : "p-5"} flex flex-col flex-1`}>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1.5 overflow-hidden w-full">
            <h3 className={`${compact ? "text-[17px]" : "text-xl"} font-bold text-slate-900 tracking-tight truncate w-full`}>
              {roommate.name}, {roommate.age}
            </h3>
          </div>
        </div>

        <div className="text-[13px] text-slate-500 mb-1 truncate" title={`${roommate.role} tại ${roommate.district || roommate.location.split(',')[0]}`}>
          <span className="font-semibold text-slate-700">{roommate.role}</span> <span className="mx-1.5 text-slate-300">•</span> {roommate.district || roommate.location.split(',')[0]}
        </div>

        {/* Removed redundant body trust score */}

        {/* Detailed Info Grid */}
        <div className={`grid grid-cols-2 gap-2 text-[12px] ${compact ? "mb-2" : "mb-3"}`}>
          <div className="flex flex-col bg-slate-50 p-2 rounded-lg border border-slate-100/50">
            <span className="text-[10px] uppercase font-bold text-slate-400 mb-0.5 tracking-wider">Giới tính</span>
            <span className="font-semibold text-slate-700 truncate">{roommate.gender}</span>
          </div>
          <div className="flex flex-col bg-slate-50 p-2 rounded-lg border border-slate-100/50">
            <span className="text-[10px] uppercase font-bold text-slate-400 mb-0.5 tracking-wider">Trường</span>
            <span className="font-semibold text-slate-700 truncate">{roommate.school || (roommate as any).majorKhoidoi || "Không rõ"}</span>
          </div>
          <div className="flex flex-col bg-slate-50 p-2 rounded-lg border border-slate-100/50">
            <span className="text-[10px] uppercase font-bold text-slate-400 mb-0.5 tracking-wider">Ngân sách</span>
            <span className="font-bold text-[#006590] truncate">{(roommate.budget / 1000000).toFixed(1)} tr</span>
          </div>
          <div className="flex flex-col bg-slate-50 p-2 rounded-lg border border-slate-100/50">
            <span className="text-[10px] uppercase font-bold text-slate-400 mb-0.5 tracking-wider">Loại hình</span>
            <span className="font-semibold text-slate-700 truncate">{roommate.type}</span>
          </div>
        </div>

        {/* Short Bio */}
        {!compact && (
          <div className="text-[11px] text-slate-500 italic line-clamp-2 mb-3 bg-slate-50 p-2 rounded-lg border border-slate-100 leading-relaxed">
            "{roommate.bio}"
          </div>
        )}

        {/* Status Box */}
        <div className={`${compact ? "mb-0 mt-1" : "mb-3"} w-fit text-[11px] font-bold px-2.5 py-1 rounded-md flex items-center gap-2 ${
          roommate.status === "Đã tìm được"
            ? "bg-red-50/80 text-red-700 border border-red-100/50"
            : "bg-emerald-50/80 text-emerald-700 border border-emerald-100/50"
        }`}>
          <span className="relative flex h-2 w-2 shrink-0">
            <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 ${
              roommate.status === "Đã tìm được"
                ? "bg-red-400"
                : "bg-emerald-400"
            }`} />
            <span className={`relative inline-flex h-2 w-2 rounded-full ${
              roommate.status === "Đã tìm được"
                ? "bg-red-500"
                : "bg-emerald-500"
            }`} />
          </span>
          {roommate.status === "Đã tìm được" ? "Đã tìm được roommate" : "Đang tìm roommate"}
        </div>

        {/* Lifestyle Tags - Compact */}
        {!compact && <div className="mt-auto border-t border-slate-100 pt-3 flex items-center justify-between">
          <div className="flex items-center flex-wrap gap-1.5">
            {roommate.tags.slice(0, 2).map((tag, idx) => (
              <span
                key={idx}
                className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded-md"
              >
                {tag}
              </span>
            ))}
          </div>
          <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">Nhấn xem chi tiết</span>
        </div>}
      </div>
      
      {/* Inline Delete Confirmation Overlay */}
      {isConfirmingDelete && (
        <div 
          className="absolute inset-0 z-50 bg-white/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mb-4 border border-red-100 shadow-sm">
            <AlertCircle className="w-7 h-7 text-red-500" />
          </div>
          <h4 className="text-lg font-black text-slate-800 mb-2">Xóa bài đăng này?</h4>
          <p className="text-xs text-slate-500 mb-6 font-medium px-2">
            Hành động này không thể hoàn tác. Bài đăng sẽ bị xóa vĩnh viễn khỏi hệ thống.
          </p>
          <div className="flex gap-3 w-full">
            <button
              onClick={() => setIsConfirmingDelete(false)}
              className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-all duration-200"
            >
              Hủy
            </button>
            <button
              onClick={() => {
                setIsConfirmingDelete(false);
                if (onClearSelectedRoommate) onClearSelectedRoommate();
                if (onDelete) onDelete(roommate.id);
              }}
              className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-sm shadow-md shadow-red-500/20 transition-all duration-200"
            >
              Xóa ngay
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
