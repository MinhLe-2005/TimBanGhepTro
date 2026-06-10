import { useState, useRef, useEffect } from "react";
import { Sparkles, Users, Building, ShieldCheck, HeartHandshake, Eye, ArrowRight, ArrowUpRight, Clock, Trash2, Coins, FileText, Search, MapPin, DollarSign, UserCheck, ChevronDown, Heart, Home, ChevronLeft, ChevronRight } from "lucide-react";
import { Roommate, Room } from "../types";
import RoommateCard from "./RoommateCard";
import RoomCard from "./RoomCard";

interface HomeViewProps {
  roommates: Roommate[];
  rooms: Room[];
  likedRoommateIds: string[];
  roommateLikeCounts: Record<string, number>;
  likedRoomIds: string[];
  onLikeRoommate: (id: string, isLiked: boolean) => void | Promise<boolean>;
  onLikeRoom: (id: string, isLiked: boolean) => void;
  onViewRoommate: (roommate: Roommate) => void;
  onViewRoom: (room: Room) => void;
  onNavigateToTab: (tabId: string, filters?: any) => void;
  onStartChat: (id: string) => void;
  currentUserProfile?: any;
  onRequireAuth?: () => void;
  onOpenCreateProfile?: () => void;
  isAdmin?: boolean;
}

export default function HomeView({
  roommates,
  rooms,
  likedRoommateIds,
  roommateLikeCounts,
  likedRoomIds,
  onLikeRoommate,
  onLikeRoom,
  onViewRoommate,
  onViewRoom,
  onNavigateToTab,
  onStartChat,
  currentUserProfile,
  onRequireAuth,
  onOpenCreateProfile,
  isAdmin = false
}: HomeViewProps) {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState("Tất cả Đà Nẵng");
  const [selectedBudget, setSelectedBudget] = useState("Tất cả mức giá");
  const [selectedLifestyle, setSelectedLifestyle] = useState("Mọi phong cách");
  const [isRoommateCarouselPaused, setIsRoommateCarouselPaused] = useState(false);
  const [isRoomCarouselPaused, setIsRoomCarouselPaused] = useState(false);

  // Carousel Logic
  const carouselRef = useRef<HTMLDivElement>(null);
  const roomCarouselRef = useRef<HTMLDivElement>(null);

  const getScrollAmount = (ref: React.RefObject<HTMLDivElement | null>) => {
    if (!ref.current) return 304;
    const firstChild = ref.current.children[0] as HTMLElement;
    return firstChild ? firstChild.clientWidth + 16 : 304;
  };

  useEffect(() => {
    const roommateInterval = setInterval(() => {
      if (carouselRef.current && !isRoommateCarouselPaused) {
        const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
        if (scrollLeft + clientWidth >= scrollWidth - 10) {
          carouselRef.current.scrollTo({ left: 0, behavior: "auto" });
        } else {
          carouselRef.current.scrollBy({ left: getScrollAmount(carouselRef), behavior: "smooth" });
        }
      }
    }, 2500);

    const roomInterval = setInterval(() => {
      if (roomCarouselRef.current && !isRoomCarouselPaused) {
        const { scrollLeft, scrollWidth, clientWidth } = roomCarouselRef.current;
        if (scrollLeft + clientWidth >= scrollWidth - 10) {
          roomCarouselRef.current.scrollTo({ left: 0, behavior: "auto" });
        } else {
          roomCarouselRef.current.scrollBy({ left: getScrollAmount(roomCarouselRef), behavior: "smooth" });
        }
      }
    }, 2500);

    return () => {
      clearInterval(roommateInterval);
      clearInterval(roomInterval);
    };
  }, [isRoommateCarouselPaused, isRoomCarouselPaused]);

  const scrollPrev = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: -getScrollAmount(carouselRef), behavior: "smooth" });
    }
  };

  const scrollNext = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: getScrollAmount(carouselRef), behavior: "smooth" });
    }
  };

  const scrollRoomPrev = () => {
    if (roomCarouselRef.current) {
      roomCarouselRef.current.scrollBy({ left: -getScrollAmount(roomCarouselRef), behavior: "smooth" });
    }
  };

  const scrollRoomNext = () => {
    if (roomCarouselRef.current) {
      roomCarouselRef.current.scrollBy({ left: getScrollAmount(roomCarouselRef), behavior: "smooth" });
    }
  };

  const locations = ["Tất cả Đà Nẵng", "Hải Châu", "Sơn Trà", "Ngũ Hành Sơn", "Liên Chiểu", "Thanh Khê", "Cẩm Lệ"];
  const budgets = ["Tất cả mức giá", "Dưới 2 triệu", "2 - 3 triệu", "3 - 5 triệu", "Trên 5 triệu"];
  const lifestyles = ["Mọi phong cách", "Ngăn nắp", "Yêu động vật", "Không hút thuốc", "Cú đêm", "Thích nấu ăn"];
  const popularRoommates = roommates
    .filter(
      (roommate) =>
        roommate.is_listing === true &&
        roommate.status !== "Đã tìm được" &&
        (roommateLikeCounts[roommate.id] || 0) > 0
    )
    .sort(
      (a, b) =>
        (roommateLikeCounts[b.id] || 0) - (roommateLikeCounts[a.id] || 0)
    )
    .slice(0, 5);

  return (
    <div className="space-y-20 animate-fade-in relative pt-20 lg:pt-28 px-4 lg:px-8 max-w-[1350px] mx-auto">
      {/* 1. Hero / Banner Section */}
      <section className="bg-[#f8fafc] rounded-[32px] sm:rounded-[40px] px-6 sm:px-10 lg:px-16 pt-12 lg:pt-16 pb-28 lg:pb-36 relative border-[8px] border-white shadow-2xl shadow-slate-200/50 overflow-hidden">
        {/* Subtle Dotted Pattern Background */}
        <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px] opacity-60" />
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center relative z-10">
          {/* Left Text content */}
          <div className="lg:col-span-6 space-y-7 lg:pr-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rose-50 border border-rose-100 text-rose-600 text-[13px] font-bold uppercase tracking-widest shadow-sm">
              <Sparkles className="w-4 h-4" />
              Trải nghiệm ghép phòng hoàn hảo
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-[64px] font-black text-slate-900 tracking-tight leading-[1.15]">
              Nền Tảng Tìm<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-orange-400">
                Roommate
              </span> Đà Nẵng
            </h1>

            <p className="text-slate-500 text-base lg:text-lg leading-relaxed max-w-lg font-medium">
              Tìm đúng roommate phù hợp với bạn — từ giờ giấc sinh hoạt, sở thích đến ngân sách sống chung. <span className="font-bold text-slate-700">Match Đúng Người - Sống Đúng Vibe!</span>
            </p>

            <div className="flex flex-wrap gap-4 pt-4">
              <button
                onClick={() => onNavigateToTab("roommates")}
                className="bg-[#004e70] hover:bg-[#003852] text-white px-9 py-4.5 rounded-full text-[15px] font-bold shadow-xl shadow-[#004e70]/20 active:scale-95 transition-all duration-200 flex items-center gap-2.5 cursor-pointer"
              >
                Khám Phá Ngay
                <ArrowRight className="h-5 w-5" />
              </button>

              <button
                onClick={() => onNavigateToTab("rooms")}
                className="bg-white hover:bg-slate-50 text-slate-700 px-9 py-4.5 rounded-full text-[15px] font-bold shadow-sm border border-slate-200 active:scale-95 transition-all duration-200 cursor-pointer"
              >
                Đăng Tin Cho Thuê
              </button>
            </div>
          </div>

          {/* Right Image content */}
          <div className="lg:col-span-6 relative mt-10 lg:mt-0">
            
            {/* Decorative Glowing Backdrop */}
            <div className="absolute inset-0 translate-x-3 translate-y-3 bg-gradient-to-br from-rose-200/80 to-sky-200/80 rounded-[2.5rem] -z-10 blur-xl" />

            {/* Main Image with Tight Frame */}
            <div className="relative z-10 w-full aspect-[4/3] rounded-[2rem] overflow-hidden bg-white border-[6px] lg:border-[8px] border-white shadow-2xl shadow-slate-200/60">
              <img 
                src="https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?q=80&w=800&auto=format&fit=crop" 
                alt="Roommates having fun" 
                className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                referrerPolicy="no-referrer"
              />
            </div>

              {/* Float Glassmorphic Badge 1 - Main */}
              <div className="absolute bottom-6 -left-6 lg:-left-12 bg-white/95 backdrop-blur-md px-5 py-4 rounded-[20px] border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.08)] flex items-center gap-3.5 animate-bounce [animation-duration:3s] z-20">
                <div className="w-11 h-11 rounded-full bg-blue-50/50 flex items-center justify-center text-[#004e70]">
                  <HeartHandshake className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Ghép Phòng</p>
                  <p className="text-xl font-black text-slate-800 leading-none tracking-tight">Nhanh Chóng</p>
                </div>
              </div>

              {/* Decorative Elements */}
              <div className="absolute top-10 -left-8 lg:-left-16 bg-white px-4 py-3 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-3 animate-bounce [animation-duration:4s] [animation-delay:1s] z-20">
                <span className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <ShieldCheck className="w-4 h-4" />
                </span>
                <span className="text-sm font-bold text-slate-700">An Toàn 100%</span>
              </div>

              <div className="absolute -bottom-8 right-6 lg:right-10 bg-white px-4 py-3 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-3 animate-bounce [animation-duration:3.5s] [animation-delay:0.5s] z-20">
                <span className="w-8 h-8 rounded-full bg-sky-50 flex items-center justify-center text-sky-600">
                  <Sparkles className="w-4 h-4" />
                </span>
                <span className="text-sm font-bold text-slate-700">Tiết Kiệm Chi Phí</span>
              </div>
            </div>
          </div>
      </section>

      {/* Floating Search Bar */}
      <div className="relative z-20 max-w-5xl mx-auto -mt-24 lg:-mt-32 px-4 mb-16 lg:mb-20">
        <div className="bg-white rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.06)] p-2 border border-slate-100 flex flex-col sm:flex-row items-center">
          {/* Item 1: Khu Vực */}
          <div className="relative flex-1 w-full">
            <div 
              onClick={() => setActiveDropdown(activeDropdown === 'location' ? null : 'location')}
              className="flex items-center justify-between px-6 py-3 w-full hover:bg-slate-50/80 rounded-full cursor-pointer transition-colors group"
            >
              <div className="flex items-center gap-3.5">
                <MapPin className="text-[#006590]/70 h-5 w-5 group-hover:text-[#006590] transition-colors" />
                <div className="flex flex-col items-start">
                  <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider mb-0.5">Khu vực</span>
                  <span className="text-[14px] font-black text-slate-800 truncate max-w-[120px]">{selectedLocation}</span>
                </div>
              </div>
              <ChevronDown className={`h-4 w-4 text-slate-300 transition-transform duration-200 ${activeDropdown === 'location' ? 'rotate-180' : ''}`} />
            </div>
            
            {activeDropdown === 'location' && (
              <div className="absolute top-full left-0 mt-3 w-full sm:w-[240px] bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-fade-in-up">
                {locations.map(loc => (
                  <div 
                    key={loc}
                    onClick={() => { setSelectedLocation(loc); setActiveDropdown(null); }}
                    className="px-6 py-2.5 hover:bg-slate-50 text-sm font-semibold text-slate-700 cursor-pointer flex items-center justify-between"
                  >
                    {loc}
                    {selectedLocation === loc && <Sparkles className="h-4 w-4 text-[#004e70]" />}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="hidden sm:block w-[1px] h-10 bg-slate-200"></div>

          {/* Item 2: Ngân Sách */}
          <div className="relative flex-1 w-full">
            <div 
              onClick={() => setActiveDropdown(activeDropdown === 'budget' ? null : 'budget')}
              className="flex items-center justify-between px-6 py-3 w-full hover:bg-slate-50/80 rounded-full cursor-pointer transition-colors group"
            >
              <div className="flex items-center gap-3.5">
                <DollarSign className="text-[#006590]/70 h-5 w-5 group-hover:text-[#006590] transition-colors" />
                <div className="flex flex-col items-start">
                  <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider mb-0.5">Ngân sách</span>
                  <span className="text-[14px] font-black text-slate-800 truncate max-w-[120px]">{selectedBudget}</span>
                </div>
              </div>
              <ChevronDown className={`h-4 w-4 text-slate-300 transition-transform duration-200 ${activeDropdown === 'budget' ? 'rotate-180' : ''}`} />
            </div>

            {activeDropdown === 'budget' && (
              <div className="absolute top-full left-0 mt-3 w-full sm:w-[240px] bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-fade-in-up">
                {budgets.map(budget => (
                  <div 
                    key={budget}
                    onClick={() => { setSelectedBudget(budget); setActiveDropdown(null); }}
                    className="px-6 py-2.5 hover:bg-slate-50 text-sm font-semibold text-slate-700 cursor-pointer flex items-center justify-between"
                  >
                    {budget}
                    {selectedBudget === budget && <Sparkles className="h-4 w-4 text-[#004e70]" />}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="hidden sm:block w-[1px] h-10 bg-slate-200"></div>

          {/* Item 3: Lối Sống */}
          <div className="relative flex-1 w-full">
            <div 
              onClick={() => setActiveDropdown(activeDropdown === 'lifestyle' ? null : 'lifestyle')}
              className="flex items-center justify-between px-6 py-3 w-full hover:bg-slate-50/80 rounded-full cursor-pointer transition-colors group"
            >
              <div className="flex items-center gap-3.5">
                <UserCheck className="text-[#006590]/70 h-5 w-5 group-hover:text-[#006590] transition-colors" />
                <div className="flex flex-col items-start">
                  <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider mb-0.5">Lối sống</span>
                  <span className="text-[14px] font-black text-slate-800 truncate max-w-[120px]">{selectedLifestyle}</span>
                </div>
              </div>
              <ChevronDown className={`h-4 w-4 text-slate-300 transition-transform duration-200 ${activeDropdown === 'lifestyle' ? 'rotate-180' : ''}`} />
            </div>

            {activeDropdown === 'lifestyle' && (
              <div className="absolute top-full left-0 sm:-left-8 mt-3 w-full sm:w-[240px] bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-fade-in-up">
                {lifestyles.map(life => (
                  <div 
                    key={life}
                    onClick={() => { setSelectedLifestyle(life); setActiveDropdown(null); }}
                    className="px-6 py-2.5 hover:bg-slate-50 text-sm font-semibold text-slate-700 cursor-pointer flex items-center justify-between"
                  >
                    {life}
                    {selectedLifestyle === life && <Sparkles className="h-4 w-4 text-[#004e70]" />}
                  </div>
                ))}
              </div>
            )}
          </div>

          <button 
            onClick={() => onNavigateToTab("roommates", { location: selectedLocation, budget: selectedBudget, lifestyle: selectedLifestyle })}
            className="w-full sm:w-auto bg-[#006590] hover:bg-[#004e70] text-white px-8 py-3.5 rounded-full text-[14px] font-bold flex items-center justify-center gap-2 transition-all shrink-0 shadow-[0_4px_15px_rgba(0,101,144,0.3)] active:scale-95 ml-2 cursor-pointer"
          >
            <Search className="h-4.5 w-4.5" />
            Tìm Kiếm Bạn Ở Ghép
          </button>
        </div>
        
        {/* Backdrop to close dropdown when clicking outside */}
        {activeDropdown && (
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setActiveDropdown(null)} 
          />
        )}
      </div>

      {/* 2. Mục Đã Yêu Thích (Liked Roommates & Rooms) */}
      {currentUserProfile && (likedRoommateIds.length > 0 || likedRoomIds.length > 0) && (
        <section className="bg-white rounded-[32px] sm:rounded-[40px] p-6 sm:p-10 lg:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100/60 relative overflow-hidden mb-16">
        {/* Subtle background decoration */}
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-br from-rose-50 to-transparent rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-gradient-to-tr from-sky-50 to-transparent rounded-full blur-3xl -z-10 -translate-x-1/2 translate-y-1/2" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-10">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center shadow-lg shadow-pink-500/20 shrink-0">
            <Heart className="w-7 h-7 text-white fill-white/20" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">Yêu Thích</h2>
            <p className="text-slate-500 text-xs mt-0.5 font-medium">Lưu trữ lựa chọn của bạn</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Người đã yêu thích */}
          <div className="space-y-5">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 pb-3 border-b border-slate-100">
              <UserCheck className="w-5 h-5 text-rose-500" />
              Bạn Ở Ghép Tiềm Năng 
              <span className="ml-2 bg-rose-100 text-rose-600 text-xs py-0.5 px-2.5 rounded-full font-black">{likedRoommateIds.length}</span>
            </h3>

            {likedRoommateIds.length === 0 ? (
              <div className="bg-slate-50/50 border-2 border-dashed border-slate-200 p-8 rounded-[24px] text-center h-[280px] flex flex-col items-center justify-center group hover:bg-slate-50 transition-colors">
                <div className="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <HeartHandshake className="h-8 w-8 text-rose-300" />
                </div>
                <p className="text-sm text-slate-500 font-medium max-w-[200px] leading-relaxed">
                  Chưa có hồ sơ nào được lưu. Hãy lướt xem và thả tim nhé!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin">
                {roommates
                  .filter((r) => likedRoommateIds.includes(r.id))
                  .map((roommate) => (
                    <RoommateCard
                      key={roommate.id}
                      roommate={roommate}
                      onViewDetails={onViewRoommate}
                      onLikeChange={onLikeRoommate}
                      isInitiallyLiked={true}
                      onStartChat={onStartChat}
                    />
                  ))}
              </div>
            )}
          </div>

          {/* Trọ đã yêu thích */}
          <div className="space-y-5">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 pb-3 border-b border-slate-100">
              <Building className="w-5 h-5 text-sky-500" />
              Phòng Trọ Yêu Thích 
              <span className="ml-2 bg-sky-100 text-sky-600 text-xs py-0.5 px-2.5 rounded-full font-black">{likedRoomIds.length}</span>
            </h3>

            {likedRoomIds.length === 0 ? (
              <div className="bg-slate-50/50 border-2 border-dashed border-slate-200 p-8 rounded-[24px] text-center h-[280px] flex flex-col items-center justify-center group hover:bg-slate-50 transition-colors">
                <div className="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Home className="h-8 w-8 text-sky-300" />
                </div>
                <p className="text-sm text-slate-500 font-medium max-w-[200px] leading-relaxed">
                  Bạn chưa lưu phòng trọ nào. Bắt đầu tìm kiếm ngay thôi!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin">
                {rooms
                  .filter((r) => likedRoomIds.includes(r.id))
                  .map((room) => (
                    <RoomCard
                      key={room.id}
                      room={room}
                      onViewDetails={onViewRoom}
                      onLikeChange={isAdmin ? undefined : onLikeRoom}
                      isInitiallyLiked={true}
                    />
                  ))}
              </div>
            )}
          </div>
        </div>
      </section>
      )}

      {popularRoommates.length > 0 && (
        <section className="relative overflow-hidden rounded-[28px] border border-rose-100 bg-gradient-to-br from-white via-rose-50/60 to-sky-50/50 p-5 sm:p-7 shadow-[0_12px_35px_rgba(15,23,42,0.05)]">
          <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-rose-100 bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-rose-600">
                <Heart className="h-3.5 w-3.5 fill-rose-500 text-rose-500" />
                Được cộng đồng quan tâm
              </div>
              <h2 className="text-xl font-black tracking-tight text-slate-900 sm:text-2xl">
                Được Quan Tâm
              </h2>
              <p className="mt-0.5 max-w-2xl text-xs text-slate-500">
                Những hồ sơ đang được nhiều người lưu để xem lại nhất.
              </p>
            </div>
            <button
              onClick={() => onNavigateToTab("roommates")}
              className="flex shrink-0 items-center gap-2 text-sm font-bold text-[#006590] transition-colors hover:text-rose-600"
            >
              Xem thêm
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {popularRoommates.map((roommate) => (
              <RoommateCard
                key={`popular-${roommate.id}`}
                roommate={roommate}
                compact
                likeCount={roommateLikeCounts[roommate.id] || 0}
                showLikeCount
                onViewDetails={onViewRoommate}
                onLikeChange={isAdmin ? undefined : onLikeRoommate}
                isInitiallyLiked={likedRoommateIds.includes(roommate.id)}
                onStartChat={isAdmin ? undefined : onStartChat}
              />
            ))}
          </div>
        </section>
      )}

      {/* 3. Roommate Tiềm Năng */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-xs font-bold uppercase tracking-wider mb-3">
              <Sparkles className="w-4 h-4" />
              Gợi ý cho bạn
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-800 via-blue-900 to-slate-800 tracking-tight pb-1">
              Roommate Tiềm Năng
            </h2>
            <p className="text-slate-500 mt-2 text-base max-w-xl">
              Những hồ sơ nổi bật và phù hợp nhất đang tìm bạn ở chung ngay lúc này. Hãy thả tim để lưu lại nhé!
            </p>
          </div>
          <button
            onClick={() => onNavigateToTab("roommates")}
            className="shrink-0 text-sm font-bold text-white bg-slate-900 hover:bg-blue-600 px-6 py-3 rounded-full flex items-center gap-2 group transition-all duration-300 shadow-md hover:shadow-lg"
          >
            Xem tất cả
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 duration-150" />
          </button>
        </div>

        {/* Roommates Carousel */}
        <div
          className="relative group"
          onMouseEnter={() => setIsRoommateCarouselPaused(true)}
          onMouseLeave={() => setIsRoommateCarouselPaused(false)}
          onTouchStart={() => setIsRoommateCarouselPaused(true)}
          onTouchEnd={() => setIsRoommateCarouselPaused(false)}
        >
          {/* Nút Prev */}
          <button 
            onClick={scrollPrev}
            className="absolute left-0 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 backdrop-blur-md rounded-full shadow-xl border border-slate-100 flex items-center justify-center text-slate-500 hover:text-[#004e70] hover:bg-white z-10 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 cursor-pointer"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          
          <div 
            ref={carouselRef}
            className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-8 pt-3"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {/* Chỉ hiển thị listings (is_listing=true), không hiển thị profiles */}
            {roommates.filter(r => r.is_listing === true).map((rm, index) => (
              <div key={`${rm.id}-${index}`} className="shrink-0 snap-start w-[82%] sm:w-[calc(50%-8px)] md:w-[calc(33.333%-11px)] lg:w-[calc(25%-12px)] xl:w-[calc(20%-13px)]">
                <RoommateCard
                  roommate={rm}
                  compact
                  onViewDetails={onViewRoommate}
                  onLikeChange={isAdmin ? undefined : onLikeRoommate}
                  isInitiallyLiked={likedRoommateIds.includes(rm.id)}
                  onStartChat={isAdmin ? undefined : onStartChat}
                />
              </div>
            ))}
          </div>

          {/* Nút Next */}
          <button 
            onClick={scrollNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 backdrop-blur-md rounded-full shadow-xl border border-slate-100 flex items-center justify-center text-slate-500 hover:text-[#004e70] hover:bg-white z-10 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 cursor-pointer"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </section>

      {/* 4. Không Gian Sống Lý Tưởng */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs font-bold uppercase tracking-wider mb-3">
              <Building className="w-4 h-4" />
              Lựa chọn hàng đầu
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-800 via-emerald-900 to-slate-800 tracking-tight pb-1">
              Không Gian Sống
            </h2>
            <p className="text-slate-500 mt-0.5 text-xs max-w-xl">
              Khám phá phòng trọ chất lượng đang tìm người chia sẻ
            </p>
          </div>
          <button
            onClick={() => onNavigateToTab("rooms")}
            className="shrink-0 text-sm font-bold text-white bg-slate-900 hover:bg-emerald-600 px-6 py-3 rounded-full flex items-center gap-2 group transition-all duration-300 shadow-md hover:shadow-lg cursor-pointer"
          >
            Xem tất cả phòng
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Rooms Carousel */}
        <div
          className="relative group"
          onMouseEnter={() => setIsRoomCarouselPaused(true)}
          onMouseLeave={() => setIsRoomCarouselPaused(false)}
          onTouchStart={() => setIsRoomCarouselPaused(true)}
          onTouchEnd={() => setIsRoomCarouselPaused(false)}
        >
          {/* Nút Prev */}
          <button 
            onClick={scrollRoomPrev}
            className="absolute left-0 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 backdrop-blur-md rounded-full shadow-xl border border-slate-100 flex items-center justify-center text-slate-500 hover:text-[#004e70] hover:bg-white z-10 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 cursor-pointer"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          
          <div 
            ref={roomCarouselRef}
            className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-8 pt-3"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {[...rooms, ...rooms, ...rooms].map((room, index) => (
              <div key={`${room.id}-${index}`} className="shrink-0 snap-start w-[82%] sm:w-[calc(50%-8px)] md:w-[calc(33.333%-11px)] lg:w-[calc(25%-12px)] xl:w-[calc(20%-13px)]">
                <RoomCard
                  room={room}
                  onViewDetails={onViewRoom}
                  onLikeChange={isAdmin ? undefined : onLikeRoom}
                  isInitiallyLiked={likedRoomIds.includes(room.id)}
                />
              </div>
            ))}
          </div>

          {/* Nút Next */}
          <button 
            onClick={scrollRoomNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 backdrop-blur-md rounded-full shadow-xl border border-slate-100 flex items-center justify-center text-slate-500 hover:text-[#004e70] hover:bg-white z-10 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 cursor-pointer"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </section>

      {/* 5. Vì sao nên lập thỏa thuận sống chung - Redesigned Premium Section */}
      <section className="relative overflow-hidden bg-white rounded-[40px] p-8 sm:p-12 lg:p-16 shadow-xl border-2 border-slate-100 flex flex-col lg:flex-row gap-12 lg:gap-20 items-center">
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-[400px] h-[400px] bg-gradient-to-br from-sky-50 to-indigo-50/50 rounded-full blur-3xl opacity-60 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-[300px] h-[300px] bg-gradient-to-tr from-blue-50/50 to-sky-50/30 rounded-full blur-3xl opacity-60 pointer-events-none"></div>

        <div className="relative z-10 lg:w-[45%] space-y-6">
          <div className="inline-flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-full text-xs font-bold shadow-md">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            Bảo vệ quyền lợi chung
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-[1.15]">
            Vì sao bạn nên thiết lập <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#006590] to-sky-500">Thỏa thuận sống chung?</span>
          </h2>
          <p className="text-[15px] text-slate-500 leading-relaxed font-medium">
            Phần lớn các mâu thuẫn khi ở ghép không xuất phát từ tính cách, mà do thiếu đi sự minh bạch ngay từ ngày đầu tiên về tài chính, giờ giấc và trách nhiệm chung.
          </p>
          <div className="pt-4">
            <button
              onClick={() => onNavigateToTab("agreement")}
              className="group relative inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-8 py-4 rounded-full text-[14px] font-bold transition-all duration-300 shadow-[0_8px_20px_rgba(0,0,0,0.12)] hover:shadow-[0_12px_25px_rgba(0,0,0,0.18)] hover:-translate-y-0.5 active:scale-95"
            >
              Thiết lập bản thỏa thuận ngay
              <ArrowRight className="h-4.5 w-4.5 group-hover:translate-x-1 duration-300" />
            </button>
          </div>
        </div>

        <div className="relative z-10 lg:w-[55%] w-full grid gap-5">
          {[
            {
              title: "Đồng thuận giờ giấc tĩnh (Quiet Hours)",
              desc: "Tôn trọng giấc ngủ của nhau, duy trì không gian nghỉ ngơi thư thái để học tập và làm việc hiệu quả.",
              icon: <Clock className="h-6 w-6 text-indigo-500" />,
              color: "indigo"
            },
            {
              title: "Phân chia việc nhà rạch ròi",
              desc: "Tránh tình trạng đùn đẩy đổ rác, dọn dẹp nhà bếp, vệ sinh phòng khách và giữ gìn không gian chung luôn sạch sẽ.",
              icon: <Sparkles className="h-6 w-6 text-emerald-500" />,
              color: "emerald"
            },
            {
              title: "Minh bạch dòng tiền chung",
              desc: "Thống nhất phân bổ sòng phẳng phí mạng wifi, tiền điện kWh và tiền nước sinh hoạt chung cuối tháng một cách văn minh.",
              icon: <Coins className="h-6 w-6 text-amber-500" />,
              color: "amber"
            }
          ].map((item, idx) => (
            <div key={idx} className={`group bg-white p-5 sm:p-6 rounded-3xl border-2 border-slate-100 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-${item.color}-200 flex items-start gap-5`}>
              <div className={`p-4 rounded-2xl bg-${item.color}-50 shrink-0 transition-transform duration-300 group-hover:scale-110`}>
                {item.icon}
              </div>
              <div>
                <h4 className="text-[16px] font-extrabold text-slate-800 mb-1.5 tracking-tight group-hover:text-slate-900 transition-colors">
                  {item.title}
                </h4>
                <p className="text-[13px] text-slate-500 font-medium leading-relaxed">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
      {/* 5.5. Testimonials - Community Feedback */}
      <section className="space-y-10 mt-20">
        <div className="text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-100 text-amber-600 text-xs font-bold uppercase tracking-wider mb-3">
            <Heart className="w-4 h-4" />
            Cộng Đồng
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight pb-1">
            Khách hàng nói gì về <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-400">RoomieMatch?</span>
          </h2>
          <p className="text-slate-500 mt-3 text-base">
            Hàng ngàn sinh viên và người đi làm đã tìm được người bạn cùng phòng lý tưởng thông qua nền tảng của chúng tôi.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              name: "Hoàng Oanh",
              role: "Sinh viên Kinh Tế",
              text: "Nhờ hồ sơ lối sống và phần đánh giá rõ ràng mà mình tìm được một bạn chung phòng khá hợp cạ. Tụi mình lập thỏa thuận sống chung trên web luôn, giờ sống rất thoải mái!",
              rating: 5,
              color: "bg-rose-100 text-rose-600"
            },
            {
              name: "Thành Đạt",
              role: "Nhân viên IT",
              text: "Mình làm đêm nên tìm bạn ghép cực khó. Lên RoomieMatch lọc tiêu chí 'Cú đêm' cái là ra ngay vài hồ sơ tiềm năng. Nền tảng quá xịn xò và trực quan.",
              rating: 5,
              color: "bg-sky-100 text-sky-600"
            },
            {
              name: "Minh Anh",
              role: "Sinh viên FPT",
              text: "Giao diện chat tiện lợi, mình vừa trò chuyện thương lượng vừa chốt luôn các điều khoản chia tiền điện nước. Trải nghiệm rất an toàn và chuyên nghiệp!",
              rating: 5,
              color: "bg-emerald-100 text-emerald-600"
            }
          ].map((item, idx) => (
            <div key={idx} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_12px_40px_rgb(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-1 relative group">
              <div className="flex gap-1 mb-5">
                {[...Array(item.rating)].map((_, i) => (
                  <Sparkles key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
                ))}
              </div>
              <p className="text-slate-600 font-medium leading-relaxed mb-6">
                "{item.text}"
              </p>
              <div className="flex items-center gap-3 mt-auto">
                <div className={`w-11 h-11 rounded-full ${item.color} flex items-center justify-center font-black text-lg shadow-sm group-hover:scale-110 transition-transform`}>
                  {item.name.charAt(0)}
                </div>
                <div>
                  <p className="text-[14px] font-black text-slate-900">{item.name}</p>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{item.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. CTA Section - Redesigned */}
      <section className="relative overflow-hidden bg-slate-900 rounded-[40px] p-12 lg:p-24 text-center mt-12 shadow-[0_20px_60px_rgba(15,23,42,0.15)] border border-slate-800">
        {/* Animated Background Gradients & Ornaments */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 mix-blend-overlay"></div>
        <div className="absolute -top-[30%] -left-[10%] w-[60%] h-[60%] bg-[#006590] rounded-full blur-[120px] opacity-70 pointer-events-none"></div>
        <div className="absolute -bottom-[30%] -right-[10%] w-[60%] h-[60%] bg-sky-600 rounded-full blur-[120px] opacity-40 pointer-events-none"></div>
        
        {/* Floating Icons (Optional decorative) */}
        <div className="absolute top-[25%] left-[12%] hidden lg:flex animate-[bounce_4s_infinite] pointer-events-none">
          <div className="w-14 h-14 bg-white/5 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/10 rotate-[15deg] shadow-2xl">
            <Heart className="h-6 w-6 text-pink-400 fill-pink-400/20" />
          </div>
        </div>
        <div className="absolute bottom-[25%] right-[12%] hidden lg:flex animate-[bounce_5s_infinite] pointer-events-none" style={{ animationDelay: "1s" }}>
          <div className="w-14 h-14 bg-white/5 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/10 -rotate-[15deg] shadow-2xl">
            <Home className="h-6 w-6 text-emerald-400" />
          </div>
        </div>

        <div className="relative z-10 max-w-3xl mx-auto space-y-8">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/10 text-sky-200 px-5 py-2 rounded-full text-[11px] font-black tracking-widest uppercase mb-2 shadow-xl">
            <Sparkles className="h-4 w-4 text-sky-300" /> Bắt đầu ngay hôm nay
          </div>
          
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.15]">
            Sẵn sàng bắt đầu <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-cyan-300 to-sky-200">
              hành trình mới?
            </span>
          </h2>
          
          <p className="text-sky-100/70 text-lg sm:text-xl font-medium max-w-xl mx-auto leading-relaxed">
            Chỉ mất 2 phút để tạo hồ sơ và kết nối với hàng nghìn bạn ở ghép tiềm năng tại Đà Nẵng.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
            <button 
              onClick={() => {
                if (!currentUserProfile) {
                  onRequireAuth && onRequireAuth();
                } else {
                  onOpenCreateProfile && onOpenCreateProfile();
                }
              }}
              className="group relative flex items-center justify-center gap-2 bg-white text-slate-900 hover:bg-sky-50 px-8 py-4.5 w-full sm:w-auto rounded-full text-[15px] font-black shadow-[0_0_40px_rgba(255,255,255,0.15)] hover:shadow-[0_0_60px_rgba(255,255,255,0.3)] hover:-translate-y-1 transition-all duration-300 active:scale-95"
            >
              Tạo hồ sơ ngay
              <ArrowUpRight className="h-5 w-5 text-slate-400 group-hover:text-slate-900 transition-colors" />
            </button>
            <button 
              onClick={() => onNavigateToTab("roommates")}
              className="group flex items-center justify-center gap-2 bg-transparent border-2 border-white/20 text-white hover:bg-white/10 hover:border-white/40 px-8 py-4 w-full sm:w-auto rounded-full text-[15px] font-bold transition-all duration-300 active:scale-95 hover:-translate-y-1"
            >
              Khám phá thêm
            </button>
          </div>
        </div>
      </section>


    </div>
  );
}
