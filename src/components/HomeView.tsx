import { IMAGES } from "../data";
import { Sparkles, Users, Building, ShieldCheck, HeartHandshake, Eye, ArrowRight, ArrowUpRight, Clock, Trash2, Coins, FileText } from "lucide-react";
import { Roommate, Room } from "../types";
import RoommateCard from "./RoommateCard";
import RoomCard from "./RoomCard";

interface HomeViewProps {
  roommates: Roommate[];
  rooms: Room[];
  likedRoommateIds: string[];
  likedRoomIds: string[];
  onLikeRoommate: (id: string, isLiked: boolean) => void;
  onLikeRoom: (id: string, isLiked: boolean) => void;
  onViewRoommate: (roommate: Roommate) => void;
  onViewRoom: (room: Room) => void;
  onNavigateToTab: (tabId: string) => void;
  onStartChat: (id: string) => void;
}

export default function HomeView({
  roommates,
  rooms,
  likedRoommateIds,
  likedRoomIds,
  onLikeRoommate,
  onLikeRoom,
  onViewRoommate,
  onViewRoom,
  onNavigateToTab,
  onStartChat,
}: HomeViewProps) {
  return (
    <div className="space-y-16 animate-fade-in relative">
      {/* 1. Hero / Banner Section */}
      <section className="bg-gradient-to-br from-white via-[#f6fafe] to-sky-100/30 rounded-[32px] overflow-hidden p-8 sm:p-12 lg:p-16 border border-sky-100/50 relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Text content */}
          <div className="lg:col-span-7 space-y-6">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-800 tracking-tight leading-[1.1]">
              Nền Tảng Tìm Roommate Đà Nẵng{" "}
              <span className="text-[#006590] relative inline-block font-black">
                Match Đúng Người - Sống Đúng Vibe
                <span className="absolute bottom-1.5 left-0 w-full h-2.5 bg-[#6ec6ff]/30 -z-10 rounded-full" />
              </span>
            </h1>

            <p className="text-slate-600 text-base sm:text-lg leading-relaxed max-w-xl font-medium">
              Tìm đúng roommate phù hợp với bạn — từ giờ giấc sinh hoạt, sở thích đến ngân sách sống chung.
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                onClick={() => onNavigateToTab("roommates")}
                className="bg-[#006590] hover:bg-[#005176] text-white px-8 py-4 rounded-full text-[15px] font-bold shadow-md hover:shadow-lg active:scale-95 duration-200 flex items-center gap-2 cursor-pointer"
              >
                Khám Phá Ngay
                <ArrowRight className="h-4.5 w-4.5" />
              </button>

              <button
                onClick={() => onNavigateToTab("rooms")}
                className="bg-[#dff6ff] hover:bg-sky-200/80 text-[#006590] px-8 py-4 rounded-full text-[15px] font-bold active:scale-95 duration-200 cursor-pointer"
              >
                Đăng Tin Cho Thuê
              </button>
            </div>
          </div>

          {/* Right Image Layout with Match float badge */}
          <div className="lg:col-span-5 relative flex justify-center">
            <div className="relative w-full max-w-[400px]">
              {/* Outer Glow behind the image */}
              <div className="absolute -inset-1 bg-gradient-to-r from-sky-400 to-indigo-500 rounded-[32px] blur-xl opacity-20 pointer-events-none" />

              <div className="relative rounded-[32px] overflow-hidden shadow-xl border border-white/60 aspect-square">
                <img
                  src={IMAGES.couchRoommates}
                  alt="Happy Roommates"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Float Glassmorphic Badge */}
              <div className="absolute -bottom-4 -left-4 sm:-left-8 bg-white/75 backdrop-blur-md px-5 py-3.5 rounded-2xl border border-white/40 shadow-xl flex items-center gap-3 animate-bounce">
                <span className="w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center text-[#006590]">
                  <Sparkles className="h-5 w-5 fill-sky-200" />
                </span>
                <div>
                  <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Độ tương thích</p>
                  <p className="text-xl font-extrabold text-[#006590] leading-none mt-1">98%</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Mục Đã Yêu Thích (Liked Roommates & Rooms) */}
      <section className="space-y-8 bg-gradient-to-r from-red-50/20 via-pink-50/10 to-transparent p-6 sm:p-8 rounded-[28px] border border-pink-100/30">
        <div className="flex items-center gap-2">
          <span className="text-2xl">💖</span>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Danh Sách Yêu Thích</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Người đã yêu thích */}
          <div className="space-y-4">
            <h3 className="text-base font-extrabold text-slate-700 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-pink-500 animate-pulse shrink-0" />
              Người đã yêu thích ({likedRoommateIds.length})
            </h3>

            {likedRoommateIds.length === 0 ? (
              <div className="bg-white/60 backdrop-blur-sm border border-slate-100 p-8 rounded-[20px] text-center h-[280px] flex flex-col items-center justify-center">
                <HeartHandshake className="h-8 w-8 text-pink-300 mb-2 animate-bounce" />
                <p className="text-xs text-slate-400 font-semibold italic max-w-xs leading-normal">
                  Chưa có bạn ở ghép nào được thả tim. Hãy xem qua danh sách tiềm năng ở dưới nhé!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-1 scrollbar-thin">
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
          <div className="space-y-4">
            <h3 className="text-base font-extrabold text-slate-700 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500 animate-pulse shrink-0" />
              Trọ đã yêu thích ({likedRoomIds.length})
            </h3>

            {likedRoomIds.length === 0 ? (
              <div className="bg-white/60 backdrop-blur-sm border border-slate-100 p-8 rounded-[20px] text-center h-[280px] flex flex-col items-center justify-center">
                <Building className="h-8 w-8 text-sky-300 mb-2" />
                <p className="text-xs text-slate-400 font-semibold italic max-w-xs leading-normal">
                  Chưa có phòng trọ nào được bạn lưu lại. Hãy thả tim phòng phù hợp nhé!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 max-h-[500px] overflow-y-auto pr-1 scrollbar-thin">
                {rooms
                  .filter((r) => likedRoomIds.includes(r.id))
                  .map((room) => (
                    <RoomCard
                      key={room.id}
                      room={room}
                      onViewDetails={onViewRoom}
                      onLikeChange={onLikeRoom}
                      isInitiallyLiked={true}
                    />
                  ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 3. Roommate Tiềm Năng */}
      <section className="space-y-6">
        <div className="flex justify-between items-baseline">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">Roommate Tiềm Năng</h2>
            <p className="text-sm text-slate-500 mt-1">Những hồ sơ nổi bật đang tìm bạn ở chung ngay lúc này.</p>
          </div>
          <button
            onClick={() => onNavigateToTab("roommates")}
            className="text-sm font-bold text-[#006590] hover:text-[#005176] flex items-center gap-1 group duration-150 cursor-pointer"
          >
            Xem tất cả
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 duration-150" />
          </button>
        </div>

        {/* Roommates Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {roommates.slice(0, 5).map((roommate) => (
            <RoommateCard
              key={roommate.id}
              roommate={roommate}
              onViewDetails={onViewRoommate}
              onLikeChange={onLikeRoommate}
              isInitiallyLiked={likedRoommateIds.includes(roommate.id)}
              onStartChat={onStartChat}
            />
          ))}
        </div>
      </section>

      {/* 4. Không Gian Sống Lý Tưởng */}
      <section className="space-y-6">
        <div className="flex justify-between items-baseline">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">Không Gian Sống Lý Tưởng</h2>
            <p className="text-sm text-slate-500 mt-1">Khám phá các căn hộ và phòng trọ đang tìm người chia sẻ.</p>
          </div>
          <button
            onClick={() => onNavigateToTab("rooms")}
            className="text-sm font-bold text-[#006590] hover:text-[#005176] flex items-center gap-1 group duration-150 cursor-pointer"
          >
            Xem tất cả phòng
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 duration-150" />
          </button>
        </div>

        {/* Rooms Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-6">
          {rooms.slice(0, 4).map((room) => (
            <RoomCard
              key={room.id}
              room={room}
              onViewDetails={onViewRoom}
              onLikeChange={onLikeRoom}
              isInitiallyLiked={likedRoomIds.includes(room.id)}
            />
          ))}
        </div>
      </section>

      {/* 5. Vì sao nên lập thỏa thuận sống chung */}
      <section className="bg-gradient-to-br from-sky-50/50 via-[#f0f9ff]/70 to-blue-50/30 rounded-[32px] p-8 sm:p-10 border border-sky-100 flex flex-col lg:flex-row gap-8 items-center">
        <div className="space-y-4 lg:w-1/2">
          <div className="inline-flex items-center gap-1.5 bg-[#dff6ff] text-[#006590] px-3.5 py-1.5 rounded-full text-xs font-bold border border-sky-100">
            <FileText className="h-3.5 w-3.5 animate-pulse" />
            Bản Thỏa Thuận Sống Chung
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight leading-tight">
            Vì sao RoomieMatch khuyên bạn nên thiết lập bản Thỏa thuận sống chung?
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed font-semibold">
            Phần lớn các mâu thuẫn khi ở ghép phát sinh không phải vì tính cách ghét nhau, mà vì thiếu đi sự thống nhất rõ ràng ngay từ ngày đầu về giờ giấc, dọn dẹp vệ sinh chung và phân bổ tài chính.
          </p>
          <div className="pt-2">
            <button
              onClick={() => onNavigateToTab("agreement")}
              className="bg-[#006590] hover:bg-[#005176] text-white px-6 py-3.5 rounded-full text-xs font-extrabold duration-200 cursor-pointer shadow-sm hover:shadow-md active:scale-95 flex items-center gap-1.5"
            >
              Thiết lập bản thỏa thuận ngay
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:w-1/2 w-full animate-fade-in-up">
          <div className="bg-white p-5 rounded-2xl border border-sky-100/50 hover:border-sky-200 hover:shadow-md duration-200 flex items-start gap-4">
            <div className="p-3 rounded-xl bg-amber-50 text-amber-600 shrink-0">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-slate-800 mb-1">
                Đồng thuận về giờ giấc giữ yên tĩnh (Quiet Hours)
              </h4>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                Tôn trọng giấc ngủ của nhau, duy trì không gian nghỉ ngơi thư thái để học tập và làm việc hiệu quả.
              </p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-sky-100/50 hover:border-sky-200 hover:shadow-md duration-200 flex items-start gap-4">
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 shrink-0">
              <Trash2 className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-slate-800 mb-1">
                Bảng phân chia việc nhà cụ thể
              </h4>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                Phòng tránh tình trạng tị nạnh đổ rác, dọn dẹp nhà bếp, vệ sinh phòng khách và giữ gìn không gian chung luôn sạch sẽ.
              </p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-sky-100/50 hover:border-sky-200 hover:shadow-md duration-200 flex items-start gap-4">
            <div className="p-3 rounded-xl bg-sky-50 text-[#006590] shrink-0">
              <Coins className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-slate-800 mb-1">
                Minh bạch dòng tiền chung rõ ràng
              </h4>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                Thống nhất phân bổ sòng phẳng phí mạng wifi, tiền điện kWh và tiền nước sinh hoạt chung cuối tháng một cách văn minh.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
