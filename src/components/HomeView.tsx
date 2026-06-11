import { useState, useRef, useEffect } from "react";
import { Sparkles, Users, Building, ShieldCheck, HeartHandshake, Eye, ArrowRight, ArrowUpRight, Clock, Trash2, Coins, FileText, Search, MapPin, DollarSign, UserCheck, ChevronDown, Heart, Home, ChevronLeft, ChevronRight } from "lucide-react";
import { Roommate, Room } from "../types";
import RoommateCard from "./RoommateCard";
import RoomCard from "./RoomCard";
import PopularRoommatesModal from "./PopularRoommatesModal";

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
  const [isPopularModalOpen, setIsPopularModalOpen] = useState(false);

  // Carousel Logic
  const carouselRef = useRef<HTMLDivElement>(null);
  const roomCarouselRef = useRef<HTMLDivElement>(null);

  const getScrollAmount = (ref: React.RefObject<HTMLDivElement | null>) => {
    if (!ref.current) return 304;
    const firstChild = ref.current.children[0] as HTMLElement;
    return firstChild ? firstChild.clientWidth + 16 : 304;
  };

  const handleScrollNext = (ref: React.RefObject<HTMLDivElement | null>, originalItemCount: number) => {
    if (ref.current) {
      const { scrollLeft, scrollWidth, clientWidth } = ref.current;
      const scrollAmount = getScrollAmount(ref);
      
      // If we don't have enough items to duplicate, just scroll to start when reaching the end
      if (originalItemCount < 4) {
        if (scrollLeft + clientWidth >= scrollWidth - 10) {
          ref.current.scrollTo({ left: 0, behavior: "smooth" });
        } else {
          ref.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
        }
        return;
      }

      const originalWidth = scrollWidth / 3;
      
      // Seamlessly jump back by one copy if we reach the third copy
      if (scrollLeft >= originalWidth * 2 - clientWidth) {
        ref.current.scrollTo({ left: scrollLeft - originalWidth, behavior: "auto" });
        setTimeout(() => {
          if (ref.current) ref.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
        }, 10);
      } else {
        ref.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
      }
    }
  };

  const handleScrollPrev = (ref: React.RefObject<HTMLDivElement | null>, originalItemCount: number) => {
    if (ref.current) {
      const { scrollLeft, scrollWidth } = ref.current;
      const scrollAmount = getScrollAmount(ref);
      
      if (originalItemCount < 4) {
        if (scrollLeft <= 0) return;
        ref.current.scrollBy({ left: -scrollAmount, behavior: "smooth" });
        return;
      }

      const originalWidth = scrollWidth / 3;
      
      // Seamlessly jump forward by one copy if we are in the first copy
      if (scrollLeft <= originalWidth) {
        ref.current.scrollTo({ left: scrollLeft + originalWidth, behavior: "auto" });
        setTimeout(() => {
          if (ref.current) ref.current.scrollBy({ left: -scrollAmount, behavior: "smooth" });
        }, 10);
      } else {
        ref.current.scrollBy({ left: -scrollAmount, behavior: "smooth" });
      }
    }
  };

  useEffect(() => {
    const listedRoommatesLength = roommates.filter(r => r.is_listing === true).length;
    const listedRoomsLength = rooms.length; // assuming all rooms are listed

    const roommateInterval = setInterval(() => {
      if (!isRoommateCarouselPaused) {
        handleScrollNext(carouselRef, listedRoommatesLength);
      }
    }, 2500);

    const roomInterval = setInterval(() => {
      if (!isRoomCarouselPaused) {
        handleScrollNext(roomCarouselRef, listedRoomsLength);
      }
    }, 2500);

    return () => {
      clearInterval(roommateInterval);
      clearInterval(roomInterval);
    };
  }, [isRoommateCarouselPaused, isRoomCarouselPaused, roommates, rooms]);

  const scrollPrev = () => handleScrollPrev(carouselRef, roommates.filter(r => r.is_listing === true).length);
  const scrollNext = () => handleScrollNext(carouselRef, roommates.filter(r => r.is_listing === true).length);
  const scrollRoomPrev = () => handleScrollPrev(roomCarouselRef, rooms.length);
  const scrollRoomNext = () => handleScrollNext(roomCarouselRef, rooms.length);

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
      {/* 1. Hero Section */}
      <section className="relative rounded-[32px] sm:rounded-[40px] overflow-hidden min-h-[560px] lg:min-h-[620px] flex flex-col justify-end border-[6px] border-white shadow-2xl shadow-slate-300/40">
        {/* Background image */}
        <img
          src="https://images.unsplash.com/photo-1555854877-bab0e564b8d5?q=80&w=1600&auto=format&fit=crop"
          alt="Căn hộ Đà Nẵng"
          className="absolute inset-0 w-full h-full object-cover scale-105"
        />
        {/* Lighter gradient — let the photo breathe */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-900/50 to-transparent" />
        {/* Subtle left-side vignette to make text readable */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/60 via-transparent to-transparent" />

        {/* Floating animated badges - Grouped on Top Left */}
        <div className="absolute top-8 left-8 lg:left-16 hidden lg:flex flex-wrap items-center gap-4 z-20">
          <div className="flex items-center gap-3 bg-slate-900/60 backdrop-blur-md border border-white/20 px-4 py-3 rounded-2xl text-white shadow-2xl" style={{animation: 'float 4s ease-in-out infinite'}}>
            <span className="w-9 h-9 rounded-full bg-emerald-500/30 flex items-center justify-center border border-emerald-400/30">
              <ShieldCheck className="w-4.5 h-4.5 text-emerald-300 drop-shadow-md" />
            </span>
            <div>
              <p className="text-[10px] text-emerald-200/80 font-bold uppercase tracking-widest leading-none mb-0.5">Uy tín</p>
              <p className="text-[15px] font-black leading-none text-white drop-shadow-md">100% An Toàn</p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-slate-900/60 backdrop-blur-md border border-white/20 px-4 py-3 rounded-2xl text-white shadow-2xl" style={{animation: 'float 4s ease-in-out infinite 0.5s'}}>
            <span className="w-9 h-9 rounded-full bg-sky-500/30 flex items-center justify-center border border-sky-400/30">
              <Users className="w-4.5 h-4.5 text-sky-300 drop-shadow-md" />
            </span>
            <div>
              <p className="text-[10px] text-sky-200/80 font-bold uppercase tracking-widest leading-none mb-0.5">Người dùng</p>
              <p className="text-[15px] font-black leading-none text-white drop-shadow-md">{roommates.length} Thành viên</p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-slate-900/60 backdrop-blur-md border border-white/20 px-4 py-3 rounded-2xl text-white shadow-2xl" style={{animation: 'float 4s ease-in-out infinite 1s'}}>
            <span className="w-9 h-9 rounded-full bg-rose-500/30 flex items-center justify-center border border-rose-400/30">
              <Home className="w-4.5 h-4.5 text-rose-300 drop-shadow-md" />
            </span>
            <div>
              <p className="text-[10px] text-rose-200/80 font-bold uppercase tracking-widest leading-none mb-0.5">Phòng cho thuê</p>
              <p className="text-[15px] font-black leading-none text-white drop-shadow-md">{rooms.length} Tin đăng</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="relative z-10 px-8 sm:px-12 lg:px-16 pb-12 pt-36 lg:pt-44 flex flex-col lg:flex-row items-center justify-between h-full min-h-[620px] gap-12 w-full">
          {/* Top/Left Text Content */}
          <div className="max-w-xl w-full flex flex-col justify-end mt-12 lg:mt-0">
            {/* Tag */}
            <div className="inline-flex items-center gap-2 mb-5 px-3.5 py-1.5 rounded-full bg-rose-500/30 border border-rose-400/50 text-rose-200 text-[12px] font-bold uppercase tracking-[0.12em] w-fit shadow-lg">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
              Nền tảng ghép phòng số 1 Đà Nẵng
            </div>

            <h1 className="text-[42px] sm:text-5xl lg:text-[64px] font-black text-white tracking-tight leading-[1.08] mb-5 drop-shadow-lg">
              Tìm Roommate<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-orange-300 to-amber-300">
                Đúng Người,
              </span>{" "}
              <span className="text-white">Đúng Vibe.</span>
            </h1>

            <p className="text-white/80 text-[16px] leading-relaxed max-w-md mb-8 font-medium drop-shadow-md">
              Kết nối với người ở ghép phù hợp tại Đà Nẵng — từ giờ giấc sinh hoạt, ngân sách đến phong cách sống.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => onNavigateToTab("roommates")}
                className="inline-flex items-center gap-2.5 bg-white text-slate-900 hover:bg-amber-50 px-8 py-3.5 rounded-full text-[15px] font-black shadow-2xl shadow-black/30 active:scale-95 transition-all duration-200 cursor-pointer"
              >
                Tìm Bạn Ghép
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => onNavigateToTab("rooms")}
                className="inline-flex items-center gap-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-xl border border-white/40 text-white px-8 py-3.5 rounded-full text-[15px] font-bold shadow-2xl shadow-black/20 active:scale-95 transition-all duration-200 cursor-pointer"
              >
                Xem Phòng Cho Thuê
              </button>
            </div>

            {/* Bottom stats strip */}
            <div className="flex gap-6 mt-8 flex-wrap">
              {[
                { icon: <MapPin className="w-4 h-4" />, value: "7 Quận", label: "Toàn Đà Nẵng" },
                { icon: <UserCheck className="w-4 h-4" />, value: "Miễn phí", label: "Không mất phí" },
                { icon: <ShieldCheck className="w-4 h-4" />, value: "Bảo mật", label: "Thông tin riêng tư" },
              ].map(({ icon, value, label }, i) => (
                <div key={i} className="flex items-center gap-2.5 text-white">
                  <span className="text-white/80">{icon}</span>
                  <div>
                    <p className="text-[14px] font-black leading-none drop-shadow-sm">{value}</p>
                    <p className="text-[12px] text-white/70 mt-1 font-medium drop-shadow-sm">{label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Vertical Search Card on the Right */}
          <div 
            className="w-full lg:w-[380px] shrink-0 bg-white/10 backdrop-blur-3xl border border-white/30 rounded-[2.5rem] p-6 sm:p-8 shadow-[0_30px_60px_rgba(0,0,0,0.3)] relative z-30 lg:-mt-6"
            style={{animation: 'float 6s ease-in-out infinite 0.5s'}}
          >
            <h3 className="text-white font-black text-[24px] mb-6 flex items-center gap-2.5 drop-shadow-lg">
              <Search className="w-6 h-6 text-sky-400" />
              Tìm Bạn Ở Ghép
            </h3>
            
            <div className="flex flex-col gap-4">
              {/* Item 1: Khu Vực */}
              <div className="relative w-full">
                <div 
                  onClick={() => setActiveDropdown(activeDropdown === 'location' ? null : 'location')}
                  className="flex items-center justify-between px-5 py-4 w-full bg-white/95 hover:bg-white rounded-2xl cursor-pointer transition-colors group shadow-sm"
                >
                  <div className="flex items-center gap-3.5">
                    <MapPin className="text-[#006590]/70 h-5 w-5 group-hover:text-[#006590] transition-colors" />
                    <div className="flex flex-col items-start">
                      <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider mb-0.5">Khu vực</span>
                      <span className="text-[14px] font-black text-slate-800 truncate max-w-[200px]">{selectedLocation}</span>
                    </div>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${activeDropdown === 'location' ? 'rotate-180' : ''}`} />
                </div>
                
                {activeDropdown === 'location' && (
                  <div className="absolute top-full left-0 mt-2 w-full bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-fade-in-up">
                    {locations.map(loc => (
                      <div 
                        key={loc}
                        onClick={() => { setSelectedLocation(loc); setActiveDropdown(null); }}
                        className="px-5 py-3 hover:bg-slate-50 text-sm font-semibold text-slate-700 cursor-pointer flex items-center justify-between"
                      >
                        {loc}
                        {selectedLocation === loc && <Sparkles className="h-4 w-4 text-[#004e70]" />}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Item 2: Ngân Sách */}
              <div className="relative w-full">
                <div 
                  onClick={() => setActiveDropdown(activeDropdown === 'budget' ? null : 'budget')}
                  className="flex items-center justify-between px-5 py-4 w-full bg-white/95 hover:bg-white rounded-2xl cursor-pointer transition-colors group shadow-sm"
                >
                  <div className="flex items-center gap-3.5">
                    <DollarSign className="text-[#006590]/70 h-5 w-5 group-hover:text-[#006590] transition-colors" />
                    <div className="flex flex-col items-start">
                      <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider mb-0.5">Ngân sách</span>
                      <span className="text-[14px] font-black text-slate-800 truncate max-w-[200px]">{selectedBudget}</span>
                    </div>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${activeDropdown === 'budget' ? 'rotate-180' : ''}`} />
                </div>

                {activeDropdown === 'budget' && (
                  <div className="absolute top-full left-0 mt-2 w-full bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-fade-in-up">
                    {budgets.map(budget => (
                      <div 
                        key={budget}
                        onClick={() => { setSelectedBudget(budget); setActiveDropdown(null); }}
                        className="px-5 py-3 hover:bg-slate-50 text-sm font-semibold text-slate-700 cursor-pointer flex items-center justify-between"
                      >
                        {budget}
                        {selectedBudget === budget && <Sparkles className="h-4 w-4 text-[#004e70]" />}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Item 3: Lối Sống */}
              <div className="relative w-full">
                <div 
                  onClick={() => setActiveDropdown(activeDropdown === 'lifestyle' ? null : 'lifestyle')}
                  className="flex items-center justify-between px-5 py-4 w-full bg-white/95 hover:bg-white rounded-2xl cursor-pointer transition-colors group shadow-sm"
                >
                  <div className="flex items-center gap-3.5">
                    <UserCheck className="text-[#006590]/70 h-5 w-5 group-hover:text-[#006590] transition-colors" />
                    <div className="flex flex-col items-start">
                      <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider mb-0.5">Lối sống</span>
                      <span className="text-[14px] font-black text-slate-800 truncate max-w-[200px]">{selectedLifestyle}</span>
                    </div>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${activeDropdown === 'lifestyle' ? 'rotate-180' : ''}`} />
                </div>

                {activeDropdown === 'lifestyle' && (
                  <div className="absolute top-full left-0 mt-2 w-full bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-fade-in-up">
                    {lifestyles.map(life => (
                      <div 
                        key={life}
                        onClick={() => { setSelectedLifestyle(life); setActiveDropdown(null); }}
                        className="px-5 py-3 hover:bg-slate-50 text-sm font-semibold text-slate-700 cursor-pointer flex items-center justify-between"
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
                className="mt-2 w-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white px-8 py-4.5 rounded-2xl text-[16px] font-black flex items-center justify-center gap-2.5 transition-all shadow-xl shadow-blue-500/30 active:scale-95 cursor-pointer"
              >
                <Search className="h-5 w-5" />
                Tìm Kiếm Ngay
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
        </div>
      </section>

      {/* 2. Mục Đã Yêu Thích (Liked Roommates & Rooms) */}
      {currentUserProfile && (
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
                {(() => {
                  // Debug logging
                  console.log('[HomeView] likedRoommateIds:', likedRoommateIds);
                  console.log('[HomeView] roommates sample IDs:', roommates.slice(0, 3).map(r => ({ id: r.id, user_id: r.user_id, name: r.name })));
                  
                  // Filter with flexible ID matching (id, user_id, or auth_id)
                  const likedRoommates = roommates.filter((r) => 
                    likedRoommateIds.includes(r.id) || 
                    likedRoommateIds.includes(r.user_id) ||
                    likedRoommateIds.includes(r.auth_id)
                  );
                  
                  console.log('[HomeView] Filtered likedRoommates:', likedRoommates.length, likedRoommates.map(r => r.name));
                  
                  return likedRoommates.map((roommate) => (
                    <RoommateCard
                      key={roommate.id}
                      roommate={roommate}
                      onViewDetails={onViewRoommate}
                      onLikeChange={onLikeRoommate}
                      isInitiallyLiked={true}
                      onStartChat={onStartChat}
                    />
                  ));
                })()}
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

      {/* Section "Được Quan Tâm" - Always show, with empty state */}
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
              onClick={() => setIsPopularModalOpen(true)}
              className="flex shrink-0 items-center gap-2 text-sm font-bold text-[#006590] transition-colors hover:text-rose-600"
            >
              Xem thêm
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          {popularRoommates.length === 0 ? (
            <div className="bg-white/50 border-2 border-dashed border-rose-200 p-12 rounded-[24px] text-center">
              <div className="w-20 h-20 rounded-full bg-white shadow-md flex items-center justify-center mx-auto mb-4">
                <Heart className="h-10 w-10 text-rose-300" />
              </div>
              <h3 className="text-lg font-bold text-slate-700 mb-2">Chưa có hồ sơ nổi bật</h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto">
                Những profile được nhiều người yêu thích nhất sẽ xuất hiện ở đây. Hãy thả tym để ủng hộ các bạn nhé!
              </p>
            </div>
          ) : (
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
          )}
        </section>

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
            {/* Chỉ hiển thị listings (is_listing=true), không hiển thị profiles. */}
            {(() => {
              const listedRoommates = roommates.filter(r => r.is_listing === true);
              const items = listedRoommates.length >= 4 
                ? [...listedRoommates, ...listedRoommates, ...listedRoommates]
                : listedRoommates;
              return items.map((rm, index) => (
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
              ));
            })()}
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
            {(() => {
              const items = rooms.length >= 4
                ? [...rooms, ...rooms, ...rooms]
                : rooms;
              return items.map((room, index) => (
                <div key={`${room.id}-${index}`} className="shrink-0 snap-start w-[82%] sm:w-[calc(50%-8px)] md:w-[calc(33.333%-11px)] lg:w-[calc(25%-12px)] xl:w-[calc(20%-13px)]">
                  <RoomCard
                    room={room}
                    onViewDetails={onViewRoom}
                    onLikeChange={isAdmin ? undefined : onLikeRoom}
                    isInitiallyLiked={likedRoomIds.includes(room.id)}
                  />
                </div>
              ));
            })()}
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

      {/* 5. Vì sao nên lập thỏa thuận sống chung - Redesigned Premium Bento Grid */}
      <section className="mt-32">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-xs font-bold uppercase tracking-wider mb-4">
            <ShieldCheck className="w-4 h-4" />
            Bảo vệ quyền lợi
          </div>
          <h2 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight leading-[1.15] mb-6">
            Lý do thiết lập <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-sky-500">
              Thỏa thuận sống chung
            </span>
          </h2>
          <p className="text-[16px] text-slate-500 leading-relaxed font-medium">
            Mâu thuẫn thường bắt nguồn từ sự thiếu minh bạch. Giải quyết triệt để ngay từ ngày đầu tiên.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main big card */}
          <div className="md:col-span-2 bg-slate-900 rounded-[32px] p-8 sm:p-12 relative overflow-hidden group hover:shadow-2xl hover:shadow-indigo-500/20 transition-all duration-500">
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-indigo-500/30 blur-[80px] rounded-full pointer-events-none group-hover:bg-indigo-500/50 transition-all duration-700"></div>
            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-sky-500/20 blur-[80px] rounded-full pointer-events-none group-hover:bg-sky-500/40 transition-all duration-700"></div>
            
            <div className="relative z-10 flex flex-col h-full justify-between gap-12">
              <div>
                <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center mb-6 shadow-inner backdrop-blur-md">
                  <Clock className="w-7 h-7 text-indigo-300" />
                </div>
                <h3 className="text-3xl font-black text-white mb-4 leading-tight">Đồng thuận <br/> giờ giấc tĩnh</h3>
                <p className="text-slate-300/80 font-medium leading-relaxed max-w-sm text-lg">
                  Tôn trọng giấc ngủ của nhau, duy trì không gian nghỉ ngơi thư thái để học tập và làm việc hiệu quả.
                </p>
              </div>
              
              <button onClick={() => onNavigateToTab("agreement")} className="inline-flex items-center gap-2 text-indigo-300 font-bold hover:text-white transition-colors w-fit group/btn">
                Tạo thỏa thuận ngay <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          {/* Secondary vertical card */}
          <div className="bg-gradient-to-b from-amber-50 to-orange-50/50 rounded-[32px] p-8 sm:p-12 border border-amber-100/50 hover:shadow-xl hover:shadow-amber-500/10 transition-all duration-500 group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-200/40 blur-[40px] rounded-full pointer-events-none"></div>
            
            <div className="w-14 h-14 rounded-2xl bg-amber-100 border border-amber-200 flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform duration-500">
              <Coins className="w-7 h-7 text-amber-600" />
            </div>
            <h3 className="text-2xl font-black text-slate-800 mb-4 leading-tight">Minh bạch <br/> dòng tiền</h3>
            <p className="text-slate-600 font-medium leading-relaxed">
              Thống nhất phân bổ sòng phẳng phí mạng wifi, điện nước sinh hoạt chung cuối tháng.
            </p>
          </div>

          {/* Third horizontal card */}
          <div className="md:col-span-3 bg-emerald-50/50 rounded-[32px] p-8 sm:p-10 border border-emerald-100 flex flex-col sm:flex-row items-center gap-8 hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-500 group">
            <div className="w-20 h-20 shrink-0 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center shadow-sm group-hover:rotate-12 transition-transform duration-500">
              <Sparkles className="w-10 h-10 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-800 mb-3">Phân chia việc nhà rạch ròi</h3>
              <p className="text-slate-600 font-medium leading-relaxed max-w-3xl text-[15px]">
                Tránh tình trạng đùn đẩy đổ rác, dọn dẹp nhà bếp, vệ sinh phòng khách. Giữ gìn không gian chung luôn sạch sẽ và tạo thói quen tốt cho tất cả mọi người trong phòng.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5.5. Testimonials - Redesigned Dynamic Cards */}
      <section className="mt-32 relative">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rose-50 border border-rose-100 text-rose-600 text-xs font-bold uppercase tracking-wider mb-4">
            <Heart className="w-4 h-4" />
            Cộng Đồng
          </div>
          <h2 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight pb-2">
            Khách hàng nói gì về <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-orange-400">RoomieMatch?</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 px-4 sm:px-0">
          {[
            {
              name: "Hoàng Oanh",
              role: "Sinh viên Kinh Tế",
              text: "Nhờ hồ sơ lối sống và phần đánh giá rõ ràng mà mình tìm được một bạn chung phòng khá hợp cạ. Tụi mình lập thỏa thuận sống chung trên web luôn, giờ sống rất thoải mái!",
              rating: 5,
              color: "bg-gradient-to-br from-rose-400 to-pink-500",
              theme: "light"
            },
            {
              name: "Thành Đạt",
              role: "Nhân viên IT",
              text: "Mình làm đêm nên tìm bạn ghép cực khó. Lên RoomieMatch lọc tiêu chí 'Cú đêm' cái là ra ngay vài hồ sơ tiềm năng. Nền tảng quá xịn xò và trực quan.",
              rating: 5,
              color: "bg-slate-800",
              theme: "dark"
            },
            {
              name: "Minh Anh",
              role: "Sinh viên FPT",
              text: "Giao diện chat tiện lợi, mình vừa trò chuyện thương lượng vừa chốt luôn các điều khoản chia tiền điện nước. Trải nghiệm rất an toàn và chuyên nghiệp!",
              rating: 5,
              color: "bg-gradient-to-br from-emerald-400 to-teal-500",
              theme: "light"
            }
          ].map((item, idx) => (
            <div 
              key={idx} 
              className={`relative p-8 sm:p-10 rounded-[2.5rem] border transition-all duration-500 hover:-translate-y-2 group ${
                item.theme === 'dark' 
                  ? 'bg-slate-900 border-slate-800 text-white shadow-2xl shadow-slate-900/20' 
                  : 'bg-white border-slate-100 text-slate-800 shadow-xl shadow-slate-200/50'
              }`}
            >
              {/* Decorative Quote Icon */}
              <div className={`absolute top-8 right-8 text-7xl font-serif opacity-10 leading-none ${item.theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                "
              </div>
              
              <div className="flex gap-1 mb-6">
                {[...Array(item.rating)].map((_, i) => (
                  <Sparkles key={i} className="w-5 h-5 text-amber-400 fill-amber-400" />
                ))}
              </div>
              
              <p className={`text-[15px] font-medium leading-relaxed mb-10 ${item.theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                "{item.text}"
              </p>
              
              <div className="flex items-center gap-4 mt-auto">
                <div className={`w-14 h-14 rounded-full ${item.color} flex items-center justify-center font-black text-xl text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  {item.name.charAt(0)}
                </div>
                <div>
                  <p className={`text-[16px] font-black ${item.theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{item.name}</p>
                  <p className={`text-[12px] font-bold uppercase tracking-widest mt-0.5 ${item.theme === 'dark' ? 'text-slate-400' : 'text-slate-400'}`}>{item.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. CTA Section - Photo Background Glassmorphism */}
      <section className="relative overflow-hidden rounded-[3rem] mt-32 shadow-2xl">
        {/* Background Image */}
        <img 
          src="https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=1600&auto=format&fit=crop" 
          alt="Căn hộ cao cấp"
          className="absolute inset-0 w-full h-full object-cover scale-105 group-hover:scale-100 transition-transform duration-[10s]"
        />
        {/* Gradients to ensure text readability */}
        <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-[2px]"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#006590]/80 via-transparent to-slate-900/50"></div>

        <div className="relative z-10 px-8 py-24 sm:py-32 text-center max-w-4xl mx-auto flex flex-col items-center">
          <div className="w-20 h-20 bg-white/10 backdrop-blur-xl rounded-full border border-white/20 flex items-center justify-center mb-8 shadow-2xl shadow-sky-500/20">
            <Home className="w-10 h-10 text-sky-300" />
          </div>
          
          <h2 className="text-4xl sm:text-5xl lg:text-7xl font-black text-white tracking-tight leading-[1.1] mb-6 drop-shadow-xl">
            Sẵn sàng bắt đầu <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-300 to-emerald-300">
              hành trình mới?
            </span>
          </h2>
          
          <p className="text-sky-50/80 text-lg sm:text-xl font-medium max-w-2xl mx-auto leading-relaxed mb-12 drop-shadow-md">
            Chỉ mất 2 phút để tạo hồ sơ và kết nối với hàng nghìn bạn ở ghép tiềm năng tại Đà Nẵng. Hệ thống thuật toán thông minh sẽ lo phần còn lại.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-5 w-full sm:w-auto">
            <button 
              onClick={() => {
                if (!currentUserProfile) {
                  onRequireAuth && onRequireAuth();
                } else {
                  onOpenCreateProfile && onOpenCreateProfile();
                }
              }}
              className="group relative flex items-center justify-center gap-3 bg-white text-slate-900 hover:bg-sky-50 px-10 py-5 w-full sm:w-auto rounded-full text-[16px] font-black shadow-[0_0_40px_rgba(255,255,255,0.2)] hover:shadow-[0_0_60px_rgba(255,255,255,0.4)] hover:-translate-y-1 transition-all duration-300 active:scale-95"
            >
              Tạo hồ sơ miễn phí
              <ArrowUpRight className="h-5 w-5 text-slate-400 group-hover:text-slate-900 transition-colors" />
            </button>
            <button 
              onClick={() => onNavigateToTab("roommates")}
              className="group flex items-center justify-center gap-3 bg-white/10 backdrop-blur-md border-2 border-white/30 text-white hover:bg-white/20 hover:border-white/50 px-10 py-4.5 w-full sm:w-auto rounded-full text-[16px] font-bold transition-all duration-300 active:scale-95 hover:-translate-y-1"
            >
              Khám phá người dùng
            </button>
          </div>
        </div>
      </section>

      {/* Popular Roommates Modal */}
      <PopularRoommatesModal
        isOpen={isPopularModalOpen}
        onClose={() => setIsPopularModalOpen(false)}
        popularRoommates={roommates
          .filter(
            (roommate) =>
              roommate.is_listing === true &&
              roommate.status !== "Đã tìm được" &&
              (roommateLikeCounts[roommate.id] || 0) > 0
          )
          .sort(
            (a, b) =>
              (roommateLikeCounts[b.id] || 0) - (roommateLikeCounts[a.id] || 0)
          )}
        roommateLikeCounts={roommateLikeCounts}
        likedRoommateIds={likedRoommateIds}
        onLikeRoommate={onLikeRoommate}
        onViewRoommate={onViewRoommate}
        onStartChat={onStartChat}
      />

    </div>
  );
}
