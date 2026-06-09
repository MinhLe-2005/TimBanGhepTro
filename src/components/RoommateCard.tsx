import { Heart, Star, Trash2 } from "lucide-react";
import { Roommate } from "../types";
import { useState } from "react";
import { useConfirmDialog } from "../hooks/useConfirmDialog";
import { getAverageRating } from "../utils/scoring";

interface RoommateCardProps {
  roommate: Roommate;
  onViewDetails: (roommate: Roommate) => void;
  onLikeChange?: (id: string, isLiked: boolean) => boolean | void;
  isInitiallyLiked?: boolean;
  onStartChat?: (id: string) => void;
  onEdit?: (roommate: Roommate) => void;
  onDelete?: (id: string) => void;
  onClearSelectedRoommate?: () => void;
  currentUserId?: string;
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
  currentUserId,
}: RoommateCardProps) {
  const [isLiked, setIsLiked] = useState(isInitiallyLiked);
  const { confirm, Dialog: ConfirmDialogComponent } = useConfirmDialog();

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onLikeChange) {
      const newLiked = !isLiked;
      const success = onLikeChange(roommate.id, newLiked);
      if (success !== false) {
        setIsLiked(newLiked);
      }
    } else {
      setIsLiked(!isLiked);
    }
  };

  const reviewsCount = roommate.reviews ? roommate.reviews.length : 0;
  const averageRating = getAverageRating(roommate.reviews);

  return (
    <div
      onClick={() => onViewDetails(roommate)}
      className="group relative flex flex-col h-full bg-white rounded-[24px] overflow-hidden border border-slate-100 cursor-pointer shadow-[0_4px_20px_rgba(15,23,42,0.04)] hover:shadow-[0_15px_35px_rgba(15,23,42,0.08)] hover:-translate-y-1 transition-all duration-300"
    >
      {/* Profile Image & Top Badges */}
      <div className="relative aspect-[4/5] overflow-hidden bg-slate-50 shrink-0">
        <img
          src={roommate.avatar}
          alt={roommate.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          referrerPolicy="no-referrer"
        />

        {/* Saved Like Button - hidden for admin */}
        {onLikeChange && (
          <button
            onClick={handleLike}
            className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-white/95 backdrop-blur-sm flex items-center justify-center text-slate-400 hover:text-red-500 hover:scale-110 active:scale-90 transition-all duration-200 shadow-sm"
          >
            <Heart className={`h-4 w-4 ${isLiked ? "fill-red-500 text-red-500" : ""}`} />
          </button>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/10 via-transparent to-transparent opacity-60 pointer-events-none" />
      </div>

      {/* Owner actions - centered below image */}
      {currentUserId && (roommate.postedBy === currentUserId || roommate.user_id === currentUserId) && (
        <div className="flex justify-center gap-2 px-3 py-3 bg-slate-50 border-b border-slate-100" onClick={(e) => e.stopPropagation()}>
          {onEdit && (
            <button
              onClick={(e) => { 
                e.stopPropagation(); 
                onEdit(roommate); 
              }}
              className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-full bg-white hover:bg-blue-50 text-[#006590] text-[12px] font-bold shadow-sm border border-blue-200 transition-all duration-200"
            >
              Sửa tin
            </button>
          )}
          {onDelete && (
            <button
              onClick={async (e) => { 
                e.stopPropagation(); 
                console.log('[RoommateCard] Delete button clicked for:', roommate.id);
                const confirmed = await confirm({
                  title: "Xóa tin đăng",
                  message: "Bạn có chắc chắn muốn xóa tin đăng này không?",
                  confirmText: "Xóa",
                  cancelText: "Hủy",
                  type: "danger"
                });
                console.log('[RoommateCard] Delete confirmed:', confirmed);
                if (confirmed) {
                  console.log('[RoommateCard] Calling onDelete for:', roommate.id);
                  onClearSelectedRoommate && onClearSelectedRoommate();
                  onDelete(roommate.id);
                }
              }}
              className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-full bg-red-50 hover:bg-red-100 text-red-600 text-[12px] font-bold shadow-sm border border-red-200 transition-all duration-200"
            >
              <Trash2 className="h-4 w-4" />
              Xóa tin
            </button>
          )}
        </div>
      )}

      {/* Profile Metadata */}
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1.5 overflow-hidden">
            <h3 className="text-xl font-bold text-slate-900 tracking-tight truncate">
              {roommate.name}, {roommate.age}
            </h3>
          </div>
          {reviewsCount > 0 && averageRating !== null ? (
            <div className="flex items-center gap-1 text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md shrink-0">
              <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
              <span>{averageRating.toFixed(1)} ({reviewsCount})</span>
            </div>
          ) : (
            <div className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md shrink-0">
              Chưa đánh giá
            </div>
          )}
        </div>

        <div className="text-[13px] text-slate-500 mb-2 truncate" title={`${roommate.role} tại ${roommate.district || roommate.location.split(',')[0]}`}>
          <span className="font-semibold text-slate-700">{roommate.role}</span> <span className="mx-1.5 text-slate-300">•</span> {roommate.district || roommate.location.split(',')[0]}
        </div>

        {/* Detailed Info Grid */}
        <div className="grid grid-cols-2 gap-y-1.5 gap-x-2 text-[12px] mb-3">
          <div className="flex items-center gap-1.5 text-slate-600 truncate">
            <span className="font-semibold text-slate-400 shrink-0">Giới tính:</span> {roommate.gender}
          </div>
          <div className="flex items-start gap-1.5 text-slate-600">
            <span className="font-semibold text-slate-400 shrink-0">Trường:</span> <span className="line-clamp-2">{roommate.school || (roommate as any).majorKhoidoi || "Không rõ"}</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-600 truncate">
            <span className="font-semibold text-slate-400 shrink-0">Ngân sách:</span> <span className="font-bold text-[#006590]">{(roommate.budget / 1000000).toFixed(1)}tr</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-600 truncate">
            <span className="font-semibold text-slate-400 shrink-0">Loại hình:</span> {roommate.type}
          </div>
          <div className="flex items-center gap-1.5 text-slate-600 truncate col-span-2">
            <span className="font-semibold text-slate-400 shrink-0">SĐT:</span> 
            <span className="bg-slate-100 px-1.5 rounded text-slate-500 font-mono text-[10px] tracking-widest">{roommate.phoneNumber ? roommate.phoneNumber.replace(/\d{3}\s?\d{3}$/, '*** ***') : '09** *** ***'}</span>
          </div>
        </div>

        {/* Short Bio */}
        <div className="text-[11px] text-slate-500 italic line-clamp-2 mb-3 bg-slate-50 p-2 rounded-lg border border-slate-100 leading-relaxed">
          "{roommate.bio}"
        </div>

        {/* Status Box */}
        <div className={`mb-3 w-fit text-[11px] font-bold px-2.5 py-1 rounded-md flex items-center gap-2 ${
          roommate.status === "Đã tìm được"
            ? "bg-red-50/80 text-red-700 border border-red-100/50"
            : roommate.status === "Đang trao đổi"
            ? "bg-amber-50/80 text-amber-700 border border-amber-100/50"
            : "bg-emerald-50/80 text-emerald-700 border border-emerald-100/50"
        }`}>
          <span className="relative flex h-2 w-2 shrink-0">
            <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 ${
              roommate.status === "Đã tìm được"
                ? "bg-red-400"
                : roommate.status === "Đang trao đổi"
                  ? "bg-amber-400"
                  : "bg-emerald-400"
            }`} />
            <span className={`relative inline-flex h-2 w-2 rounded-full ${
              roommate.status === "Đã tìm được"
                ? "bg-red-500"
                : roommate.status === "Đang trao đổi"
                  ? "bg-amber-500"
                  : "bg-emerald-500"
            }`} />
          </span>
          {roommate.status === "Đã tìm được" ? "Đã tìm được roommate" : roommate.status === "Đang trao đổi" ? "Đang trao đổi" : "Đang tìm roommate"}
        </div>

        {/* Lifestyle Tags - Compact */}
        <div className="mt-auto border-t border-slate-100 pt-3 flex items-center justify-between">
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
        </div>
      </div>
      
      {/* Confirm Dialog */}
      <ConfirmDialogComponent />
    </div>
  );
}
