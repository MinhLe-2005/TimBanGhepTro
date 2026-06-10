import { Heart, Flame, Bed, Bath, Shield, ChefHat, MapPin, Cpu, Car, Eye, Star, Trash2, Ban, Users, AlertCircle } from "lucide-react";
import { Room } from "../types";
import { useState } from "react";

interface RoomCardProps {
  room: Room;
  onViewDetails: (room: Room) => void;
  onLikeChange?: (id: string, isLiked: boolean) => boolean | void;
  isInitiallyLiked?: boolean;
  onDelete?: (id: string) => void;
  onEdit?: (room: Room) => void;
  currentUserId?: string;
}

export default function RoomCard({
  room,
  onViewDetails,
  onLikeChange,
  isInitiallyLiked = false,
  onDelete,
  onEdit,
  currentUserId,
}: RoomCardProps) {
  const [isLiked, setIsLiked] = useState(isInitiallyLiked);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const formatPrice = (price: number) => {
    return price.toLocaleString("vi-VN") + "đ";
  };

  const reviewsCount = room.reviews?.length || 0;
  const avgRating = reviewsCount > 0
    ? (room.reviews!.reduce((acc, rev) => acc + rev.rating, 0) / reviewsCount).toFixed(1)
    : null;

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onLikeChange) {
      const newLiked = !isLiked;
      const success = onLikeChange(room.id, newLiked);
      if (success !== false) {
        setIsLiked(newLiked);
      }
    } else {
      setIsLiked(!isLiked);
    }
  };
  
  let targetTenants = 0;
  let currentTenants = 0;
  const filteredFeatures: string[] = [];

  if (room.features) {
    room.features.forEach(f => {
      if (f.startsWith("TARGET_TENANTS:")) targetTenants = parseInt(f.split(":")[1]);
      else if (f.startsWith("CURRENT_TENANTS:")) currentTenants = parseInt(f.split(":")[1]);
      else filteredFeatures.push(f);
    });
  }

  const getFeatureIcon = (feature: string) => {
    const text = feature.toLowerCase();
    if (text.includes("phòng ngủ") || text.includes("giường") || text.includes("phòng")) {
      return <Bed className="h-4 w-4 text-sky-600" />;
    }
    if (text.includes("wc") || text.includes("tắm") || text.includes("khép kín")) {
      return <Bath className="h-4 w-4 text-sky-600" />;
    }
    if (text.includes("bếp") || text.includes("nấu") || text.includes("ăn")) {
      return <ChefHat className="h-4 w-4 text-sky-600" />;
    }
    if (text.includes("máy lạnh") || text.includes("điều hòa")) {
      return <Cpu className="h-4 w-4 text-sky-600" />;
    }
    if (text.includes("xe") || text.includes("đỗ") || text.includes("gửi xe")) {
      return <Car className="h-4 w-4 text-sky-600" />;
    }
    return <Shield className="h-4 w-4 text-sky-600" />;
  };

  return (
    <div
      onClick={() => onViewDetails(room)}
      className="group relative bg-white rounded-[24px] overflow-hidden border border-gray-100 cursor-pointer shadow-[0_10px_30px_rgba(15,23,42,0.04)] hover:shadow-[0_20px_40px_rgba(15,23,42,0.08)] hover:-translate-y-1.5 transition-all duration-300 flex flex-col h-full"
    >
      {/* Room Image Container */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-50">
        <img
          src={room.images[0] || "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=500&auto=format&fit=crop"}
          alt={room.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          referrerPolicy="no-referrer"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=500&auto=format&fit=crop";
          }}
        />

        {/* Room Top Left Badges */}
        <div className="absolute top-4 left-4 z-10 flex flex-col gap-1.5 items-start">
          {/* Availability Status Badge */}
          {room.status === "hết phòng" || (targetTenants > 0 && currentTenants >= targetTenants) ? (
            <div className="bg-red-600/90 text-white backdrop-blur-sm px-3 py-1 rounded-full text-[11px] font-black shadow-sm flex items-center gap-1 border border-red-500">
              <span>Hết phòng</span>
            </div>
          ) : (
            <div className="bg-emerald-600/90 text-white backdrop-blur-sm px-3 py-1 rounded-full text-[11px] font-black shadow-sm flex items-center gap-1 border border-emerald-500">
              <span>Đang tìm người</span>
            </div>
          )}
          
          {/* Capacity Badge */}
          {targetTenants > 0 && (
            <div className={`bg-white/95 text-slate-700 backdrop-blur-sm px-2.5 py-1 rounded-full text-[10px] font-black shadow-sm flex items-center gap-1.5 border ${currentTenants >= targetTenants ? 'border-red-200 text-red-600' : 'border-slate-200'}`}>
              <Users className={`w-3 h-3 ${currentTenants >= targetTenants ? 'text-red-500' : 'text-[#006590]'}`} />
              {currentTenants >= targetTenants ? (
                `Đã đủ (${currentTenants}/${targetTenants})`
              ) : (
                `Còn ${Math.max(0, targetTenants - currentTenants)} chỗ (${currentTenants}/${targetTenants})`
              )}
            </div>
          )}
        </div>

        {/* Bottom Left Badges: Hot / Full / Rating */}
        <div className="absolute bottom-4 left-4 z-10 flex flex-wrap gap-2 items-center">
          {room.status === "hết phòng" || (targetTenants > 0 && currentTenants >= targetTenants) ? (
            <div className="bg-slate-800 text-white px-3.5 py-1 rounded-full text-[12px] font-extrabold flex items-center gap-1 shadow-md">
              <Ban className="h-3.5 w-3.5 text-slate-300" />
              FULL
            </div>
          ) : room.isHot ? (
            <div className="bg-red-500 text-white px-3.5 py-1 rounded-full text-[12px] font-extrabold flex items-center gap-1 shadow-md">
              <Flame className="h-3.5 w-3.5 fill-white animate-bounce" />
              HOT
            </div>
          ) : null}

          {avgRating && (
            <div className="flex items-center gap-1.5 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-full border border-amber-200/60 animate-trust-badge">
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 animate-trust-star" />
              <span className="text-[12px] font-black text-slate-800 tracking-tight">{avgRating}</span>
              <span className="text-[10px] font-bold text-slate-400">({reviewsCount})</span>
            </div>
          )}
        </div>

        {/* Saved Like Button - hidden for admin */}
        {onLikeChange && (
          <button
            onClick={handleLike}
            className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/95 backdrop-blur-sm flex items-center justify-center text-slate-400 hover:text-red-500 hover:scale-110 active:scale-90 transition-all duration-200 border border-slate-100/50 shadow-md"
          >
            <Heart className={`h-5 w-5 ${isLiked ? "fill-red-500 text-red-500" : ""}`} />
          </button>
        )}

        {/* Owner Actions */}
        {currentUserId && (room.postedBy === currentUserId || room.user_id === currentUserId) && (
          <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-2">
            {onEdit && (
              <button
                onClick={(e) => { e.stopPropagation(); onEdit(room); }}
                className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full bg-white/95 hover:bg-white text-[#006590] text-[11px] font-bold shadow-md transition-all duration-200"
              >
                Sửa tin
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => { 
                  e.stopPropagation(); 
                  setIsConfirmingDelete(true);
                }}
                className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500 hover:bg-red-600 text-white text-[11px] font-bold shadow-md transition-all duration-200"
              >
                <Trash2 className="h-3 w-3" />
                Xóa tin
              </button>
            )}
          </div>
        )}
      </div>

      {/* Room Content */}
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-baseline gap-1 overflow-hidden w-full">
            <span className="text-xl font-bold text-slate-900 tracking-tight truncate">
              {formatPrice(room.price).replace("đ", "")}
            </span>
            <span className="text-[11px] text-slate-500 font-bold shrink-0">
              {room.type.toLowerCase().includes("ký túc") || room.type.toLowerCase().includes("homestay") ? "đ / người" : "đ / phòng"}
            </span>
          </div>
        </div>

        {/* Title */}
        <h4 className="text-[14px] font-bold text-slate-700 leading-snug tracking-tight mb-2 group-hover:text-blue-600 transition-colors duration-200 line-clamp-2">
          {room.title}
        </h4>

        {/* Location & Proximity */}
        <div className="flex flex-col gap-1.5 mb-4">
          <div className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-500">
            <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{room.location}</span>
          </div>
          {room.proximity && (
            <div className="flex items-center gap-1 text-[11px] font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md w-fit">
              <span className="text-slate-400">📍</span>
              {room.proximity}
            </div>
          )}
        </div>

        {/* Detailed Info Grid */}
        <div className="grid grid-cols-2 gap-2 text-[12px] mb-4">
          <div className="flex flex-col bg-slate-50 p-2 rounded-lg border border-slate-100/50">
            <span className="text-[10px] uppercase font-bold text-slate-400 mb-0.5 tracking-wider">Loại phòng</span>
            <span className="font-semibold text-slate-700 truncate">{room.type}</span>
          </div>
          <div className="flex flex-col bg-slate-50 p-2 rounded-lg border border-slate-100/50">
            <span className="text-[10px] uppercase font-bold text-slate-400 mb-0.5 tracking-wider">Phòng ngủ</span>
            <span className="font-semibold text-slate-700 truncate">{room.bedrooms} PN</span>
          </div>
          <div className="flex flex-col bg-slate-50 p-2 rounded-lg border border-slate-100/50">
            <span className="text-[10px] uppercase font-bold text-slate-400 mb-0.5 tracking-wider">Tiền điện</span>
            <span className="font-semibold text-slate-700 truncate">{room.electricity || 'Giá NN'}</span>
          </div>
          <div className="flex flex-col bg-slate-50 p-2 rounded-lg border border-slate-100/50">
            <span className="text-[10px] uppercase font-bold text-slate-400 mb-0.5 tracking-wider">Tiền nước</span>
            <span className="font-semibold text-slate-700 truncate">{room.water || 'Giá NN'}</span>
          </div>
        </div>

        {/* Feature Tags - Compact */}
        <div className="flex items-center flex-wrap gap-1.5 mb-4 text-[11px] font-medium text-slate-600">
          {room.gender && <span className="px-2 py-1 bg-slate-100 rounded-md">{room.gender}</span>}
          {filteredFeatures.slice(0, 2).map((f, i) => (
             <span key={i} className="px-2 py-1 bg-slate-100 rounded-md">{f}</span>
          ))}
          {room.pets && <span className="px-2 py-1 bg-slate-100 rounded-md">{room.pets === "thoải mái" ? "Pet OK" : "No Pet"}</span>}
        </div>

        {/* Host Info */}
        <div className="mt-auto border-t border-slate-100 pt-3">
          <div className="flex items-center justify-between text-[12px] font-bold text-slate-600">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-[10px] text-blue-700 uppercase">
                {room.hostName.charAt(0)}
              </div>
              <span className="truncate">{room.hostName}</span>
            </div>
            <span className="text-[10px] text-slate-400 font-medium">Nhấn xem chi tiết</span>
          </div>
        </div>
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
                if (onDelete) onDelete(room.id);
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
