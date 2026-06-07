import { Heart, Flame, Bed, Bath, Shield, ChefHat, MapPin, Cpu, Car, Eye } from "lucide-react";
import { Room } from "../types";
import { useState } from "react";

interface RoomCardProps {
  room: Room;
  onViewDetails: (room: Room) => void;
  onLikeChange?: (id: string, isLiked: boolean) => void;
  isInitiallyLiked?: boolean;
}

export default function RoomCard({
  room,
  onViewDetails,
  onLikeChange,
  isInitiallyLiked = false,
}: RoomCardProps) {
  const [isLiked, setIsLiked] = useState(isInitiallyLiked);

  const formatPrice = (price: number) => {
    return price.toLocaleString("vi-VN") + "đ";
  };

  const reviewsCount = room.reviews?.length || 0;
  const avgRating = reviewsCount > 0
    ? (room.reviews!.reduce((acc, rev) => acc + rev.rating, 0) / reviewsCount).toFixed(1)
    : null;

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newLiked = !isLiked;
    setIsLiked(newLiked);
    if (onLikeChange) {
      onLikeChange(room.id, newLiked);
    }
  };

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
      className="group bg-white rounded-[24px] overflow-hidden border border-gray-100 cursor-pointer shadow-[0_10px_30px_rgba(15,23,42,0.04)] hover:shadow-[0_20px_40px_rgba(15,23,42,0.08)] hover:-translate-y-1.5 transition-all duration-300 flex flex-col h-full"
    >
      {/* Room Image Container */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-50">
        <img
          src={room.images[0]}
          alt={room.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          referrerPolicy="no-referrer"
        />

        {/* Room Top Left Badges */}
        <div className="absolute top-4 left-4 z-10 flex flex-col gap-1.5 items-start">
          {/* Availability Status Badge */}
          {room.status === "hết phòng" ? (
            <div className="bg-red-600/90 text-white backdrop-blur-sm px-3 py-1 rounded-full text-[11px] font-black shadow-sm flex items-center gap-1 border border-red-500">
              <span>● Hết phòng</span>
            </div>
          ) : (
            <div className="bg-emerald-600/90 text-white backdrop-blur-sm px-3 py-1 rounded-full text-[11px] font-black shadow-sm flex items-center gap-1 border border-emerald-500">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
              <span>● Đang tìm người</span>
            </div>
          )}
        </div>

        {/* Hot Badge */}
        {room.isHot && (
          <div className="absolute bottom-4 left-4 z-10 bg-red-500 text-white px-3.5 py-1 rounded-full text-[12px] font-extrabold flex items-center gap-1 shadow-md">
            <Flame className="h-3.5 w-3.5 fill-white animate-bounce" />
            HOT
          </div>
        )}

        {/* Saved Like Button */}
        <button
          onClick={handleLike}
          className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/95 backdrop-blur-sm flex items-center justify-center text-slate-400 hover:text-red-500 hover:scale-110 active:scale-90 transition-all duration-200 border border-slate-100/50 shadow-md"
        >
          <Heart className={`h-5 w-5 ${isLiked ? "fill-red-500 text-red-500" : ""}`} />
        </button>
      </div>

      {/* Room Content */}
      <div className="p-6 flex flex-col flex-grow justify-between">
        <div>
          {/* Price Tag & Rating */}
          <div className="flex items-baseline justify-between gap-1 mb-2">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-extrabold text-[#006590] tracking-tight">
                {formatPrice(room.price).replace("đ", "")}
              </span>
              <span className="text-xs text-slate-500 font-bold">
                {room.type.toLowerCase().includes("ký túc xá") || room.type.toLowerCase().includes("kí túc xá") || room.type.toLowerCase().includes("homestay") ? "đ / người / tháng" : "đ / phòng / tháng"}
              </span>
            </div>
            {avgRating && (
              <div className="flex items-center gap-1.5 bg-amber-500 text-white px-2 py-0.5 rounded-lg text-xs font-black shadow-sm shrink-0">
                <span>★ {avgRating}</span>
                <span className="text-[10px] font-semibold text-white/90">({reviewsCount})</span>
              </div>
            )}
          </div>

          {/* Title & Proximity indicator */}
          <h4 className="text-[17px] font-bold text-slate-700 leading-snug tracking-tight mb-2 group-hover:text-[#006590] duration-200">
            {room.title}
          </h4>

          {/* Location & Proximity line */}
          <div className="flex flex-col gap-1.5 mb-3">
            <div className="flex items-center gap-1 text-xs font-semibold text-slate-500">
              <MapPin className="h-3.5 w-3.5 text-[#006590] shrink-0" />
              <span className="truncate">{room.location}</span>
            </div>
            {room.proximity && (
              <span className="text-[11px] text-[#006590] font-black bg-[#dff6ff] px-2.5 py-1 rounded-lg self-start">
                📍 {room.proximity}
              </span>
            )}
          </div>

          {/* Utilities Row: electricity, water, parking */}
          <div className="flex items-center gap-2 text-[10px] font-extrabold text-slate-500 bg-slate-50 border border-slate-100 rounded-xl px-2.5 py-2 mb-3.5 select-none justify-between">
            {room.electricity && <span className="flex items-center gap-0.5">{room.electricity}</span>}
            <span className="text-slate-200">|</span>
            {room.water && <span className="flex items-center gap-0.5">{room.water}</span>}
            <span className="text-slate-200">|</span>
            {room.parking && <span className="flex items-center gap-0.5">{room.parking}</span>}
          </div>

          {/* Badges for Gender & Pets & Habits */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            {room.gender && (
              <span className="text-[10px] uppercase tracking-wider font-extrabold bg-[#006590]/10 text-[#006590] px-2.5 py-0.5 rounded-md">
                👥 {room.gender}
              </span>
            )}
            {room.habits && room.habits.length > 0 && (
              <span className="text-[10px] uppercase tracking-wider font-extrabold bg-purple-50 text-purple-700 border border-purple-100 px-2.5 py-0.5 rounded-md">
                🍳 {room.habits[0]}
              </span>
            )}
            {room.pets && (
              <span className={`text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-0.5 rounded-md ${
                room.pets === "thoải mái"
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                  : "bg-amber-50 text-amber-700 border border-amber-100"
              }`}>
                🐾 {room.pets === "thoải mái" ? "Nuôi Pet" : "Không Pet"}
              </span>
            )}
          </div>
        </div>

        {/* Host footer info line instead of standard slice */}
        <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] font-bold text-slate-500">
          <span className="flex items-center gap-1">
            <span className="text-slate-400">Chủ:</span>
            <span className="text-slate-800 font-extrabold">{room.hostName}</span>
            {room.hostRole && (
              <span className="text-slate-400 font-medium">({room.hostRole})</span>
            )}
          </span>
          <span className="text-[#006590] text-[10px] font-black uppercase tracking-wider">Xem Chi Tiết ➔</span>
        </div>
      </div>
    </div>
  );
}
