import { useState } from "react";
import { Search, MapPin, Building, Sparkles, Users, Cat, DollarSign, CheckSquare } from "lucide-react";
import { useDialog } from "./ui/DialogProvider";
import { Room } from "../types";
import RoomCard from "./RoomCard";
import { supabase } from "../lib/supabase";
import { CHAT_REPORT_PREFIX } from "../lib/moderation";
import ReportModal from "./ReportModal";

interface RoomsViewProps {
  rooms: Room[];
  onViewRoom: (room: Room) => void;
  likedRoomIds: string[];
  onLikeRoom: (id: string, isLiked: boolean) => void;
  onOpenPostModal?: () => void;
  onDeleteRoom?: (id: string) => void;
  currentUserId?: string;
  currentUserProfile?: any;
  onRequireAuth?: () => void;
  onEditRoom?: (room: Room) => void;
  isAdmin?: boolean;
  isLoading?: boolean;
}

export default function RoomsView({
  rooms,
  onViewRoom,
  likedRoomIds,
  onLikeRoom,
  onOpenPostModal,
  onDeleteRoom,
  currentUserId,
  currentUserProfile,
  onRequireAuth,
  onEditRoom,
  isAdmin = false,
  isLoading = false,
}: RoomsViewProps) {
  const { toast } = useDialog();
  const [searchTerm, setSearchTerm] = useState("");
  const [districtFilter, setDistrictFilter] = useState("Tất cả");
  const [typeFilter, setTypeFilter] = useState("Tất cả");
  const [capacityFilter, setCapacityFilter] = useState("Tất cả");
  const [petsFilter, setPetsFilter] = useState("Tất cả");
  const [genderFilter, setGenderFilter] = useState("Tất cả");
  const [minPrice, setMinPrice] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(Number.MAX_SAFE_INTEGER); // unlimited default max
  const [priceTag, setPriceTag] = useState<string>("Tất cả");
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [showMyPostsOnly, setShowMyPostsOnly] = useState(false);
  const [reportingRoom, setReportingRoom] = useState<Room | null>(null);

  const handlePriceTagClick = (tag: string) => {
    setPriceTag(tag);
    switch (tag) {
      case "Dưới 1tr":
        setMinPrice(0);
        setMaxPrice(1000000);
        break;
      case "1-2tr":
        setMinPrice(1000000);
        setMaxPrice(2000000);
        break;
      case "2-3tr":
        setMinPrice(2000000);
        setMaxPrice(3000000);
        break;
      case "3-5tr":
        setMinPrice(3000000);
        setMaxPrice(5000000);
        break;
      case "trên 5tr":
        setMinPrice(5000000);
        setMaxPrice(Number.MAX_SAFE_INTEGER);
        break;
      default:
        setMinPrice(0);
        setMaxPrice(Number.MAX_SAFE_INTEGER);
        break;
    }
  };

  // Requested facilities definition
  const AMENITIES_LIST = [
    { id: "dieuhoa", label: "Điều hòa", keywords: ["điều hòa", "điều hoa", "máy lạnh", "điều hoà"] },
    { id: "maygiat", label: "Máy giặt", keywords: ["máy giặt", "giặt"] },
    { id: "nhabep", label: "Nhà bếp", keywords: ["nhà bếp", "bếp", "nấu ăn"] },
    { id: "wifi", label: "Wifi", keywords: ["wifi", "internet", "mạng"] },
    { id: "tulanh", label: "Tủ lạnh", keywords: ["tủ lạnh", "fridge"] },
    { id: "tv", label: "TV", keywords: ["tv", "tivi"] },
    { id: "baove", label: "Có bảo vệ", keywords: ["bảo vệ", "an ninh", "an toàn"] },
    { id: "baigieuxe", label: "Bãi giữ xe", keywords: ["bãi giữ xe", "bãi xe", "chỗ để xe", "gửi xe", "để xe", "đỗ xe"] },
  ];

  const handleReportRoomClick = (room: Room) => {
    if (!currentUserId) {
      if (onRequireAuth) onRequireAuth();
      return;
    }
    setReportingRoom(room);
  };

  const handleSubmitReport = async (reason: string) => {
    if (!reportingRoom || !currentUserId) return;

    const targetId = reportingRoom.user_id || reportingRoom.postedBy || reportingRoom.id;

    // Check if already reported in user_reports or legacy messages
    const { data: existingTableReports } = await supabase
      .from('user_reports')
      .select('id')
      .eq('reporter_id', currentUserId)
      .eq('reported_id', targetId);

    const { data: existingReports } = await supabase
      .from('messages')
      .select('id')
      .eq('chat_id', CHAT_REPORT_PREFIX + currentUserId)
      .eq('sender_id', currentUserId)
      .like('text', `%[REPORT]%`)
      .like('text', `%"target_id":"${targetId}"%`);
      
    if ((existingTableReports && existingTableReports.length > 0) || (existingReports && existingReports.length > 0)) {
      toast("Bạn đã báo cáo nội dung này rồi.", "warning");
      setReportingRoom(null);
      return;
    }

    const payload = {
      target_id: targetId,
      reason: reason,
      source: 'room_listing',
      room_id: reportingRoom.id,
      room_title: reportingRoom.title
    };

    // 1. Insert into legacy messages channel
    await supabase.from('messages').insert({
      chat_id: CHAT_REPORT_PREFIX + currentUserId,
      sender_id: currentUserId,
      text: `[REPORT] ${JSON.stringify(payload)}`
    });

    // 2. Insert into new user_reports table
    const { error } = await supabase.from('user_reports').insert({
      reporter_id: currentUserId,
      reported_id: targetId,
      reason: reason
    });

    if (error) {
      toast("Không thể gửi báo cáo, vui lòng thử lại sau.", "error");
    } else {
      toast("Cảm ơn bạn đã báo cáo. Quản trị viên sẽ xem xét.", "success");
    }
    
    setReportingRoom(null);
  };

  // Filter listings
  const filteredRooms = rooms.filter((room) => {
    const matchesSearch =
      room.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      room.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      room.description.toLowerCase().includes(searchTerm.toLowerCase());

    if (showMyPostsOnly && room.postedBy !== currentUserId) {
      return false;
    }

    const matchesDistrict = districtFilter === "Tất cả" || room.district === districtFilter;
    const matchesType = typeFilter === "Tất cả" || (room.type && room.type === typeFilter);
    let targetTenants = 0;
    if (room.features) {
      room.features.forEach(f => {
        if (f.startsWith("TARGET_TENANTS:")) targetTenants = parseInt(f.split(":")[1]);
      });
    }

    const matchesCapacity =
      capacityFilter === "Tất cả" ||
      (capacityFilter === "1" && targetTenants === 1) ||
      (capacityFilter === "2" && targetTenants === 2) ||
      (capacityFilter === "3" && targetTenants === 3) ||
      (capacityFilter === "4" && targetTenants === 4) ||
      (capacityFilter === "5+" && targetTenants >= 5);

    const matchesPets =
      petsFilter === "Tất cả" || room.pets === petsFilter;

    const matchesGender =
      genderFilter === "Tất cả" || room.gender === genderFilter;

    const matchesPrice = room.price >= minPrice && room.price <= maxPrice;

    // Check if room offers all selected amenities
    const matchesAmenities = selectedAmenities.every((amenityId) => {
      const amenity = AMENITIES_LIST.find((a) => a.id === amenityId);
      if (!amenity) return true;
      return amenity.keywords.some((keyword) => {
        const inFeatures = (room.features || []).some((f: string) => f.toLowerCase().includes(keyword));
        const inDescription = (room.description || "").toLowerCase().includes(keyword);
        const inTitle = (room.title || "").toLowerCase().includes(keyword);
        const inKitchen = room.kitchen && room.kitchen.toLowerCase().includes(keyword);
        return inFeatures || inDescription || inTitle || inKitchen;
      });
    });

    const matchesMyPosts = !showMyPostsOnly || (currentUserId && (room.postedBy === currentUserId || room.user_id === currentUserId));

    return matchesSearch && matchesDistrict && matchesType && matchesCapacity && matchesPets && matchesGender && matchesPrice && matchesAmenities && matchesMyPosts;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Title Banner */}
      <div className="relative bg-gradient-to-r from-[#003855] via-[#004e70] to-[#006590] rounded-[32px] p-8 sm:p-10 overflow-hidden shadow-2xl shadow-[#004e70]/20 border border-[#004e70]/50 mb-8">
        {/* Decorative background shapes */}
        <div className="absolute top-0 right-0 opacity-10 pointer-events-none transform translate-x-1/4 -translate-y-1/4">
          <svg width="404" height="404" fill="none" viewBox="0 0 404 404"><defs><pattern id="85737c0e-0916-41d7-917f-596dc7edfa27" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse"><rect x="0" y="0" width="4" height="4" fill="currentColor"></rect></pattern></defs><rect width="404" height="404" fill="url(#85737c0e-0916-41d7-917f-596dc7edfa27)"></rect></svg>
        </div>
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-sky-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
        <div className="absolute -top-24 right-12 w-64 h-64 bg-cyan-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="text-white max-w-2xl">
            <p className="text-sky-200 text-[11px] font-bold uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-sky-300" />
              Phòng trọ & căn hộ tại Đà Nẵng
            </p>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight mb-3">
              Phòng Trọ Đang Tìm Bạn
            </h1>
            <p className="text-sky-100/90 text-[15px] sm:text-base font-medium leading-relaxed max-w-xl">
              Duyệt danh sách căn hộ, phòng trọ, ký túc xá và homestay đang tuyển roommate ở ghép ngay hôm nay.
            </p>
          </div>
          
          {!isAdmin && (
            <button
              onClick={() => {
                if (currentUserId || currentUserProfile) {
                  const currentName = String(currentUserProfile?.name || "").trim().toLowerCase();
                  const hasPostedRoom = rooms.some(r => {
                    if (currentUserId && (r.postedBy === currentUserId || r.user_id === currentUserId)) return true;
                    if (!currentUserId && currentUserProfile?.id && (r.postedBy === currentUserProfile.id || r.user_id === currentUserProfile.id)) return true;
                    const ownerName = String(r.hostName || "").trim().toLowerCase();
                    if (!currentUserId && currentName && ownerName === currentName) return true;
                    return false;
                  });
                  if (hasPostedRoom) {
                    toast('Bạn đã đăng 1 bài phòng trọ. Mỗi người chỉ được phép đăng tối đa 1 bài. Vui lòng xóa bài cũ nếu muốn tạo bài mới!', 'warning', 6000);
                    return;
                  }
                }
                onOpenPostModal && onOpenPostModal();
              }}
              className="group flex items-center justify-center gap-2.5 px-8 py-4 bg-white hover:bg-sky-50 text-[#004e70] font-black text-[15px] rounded-2xl cursor-pointer duration-300 shadow-[0_10px_25px_rgba(0,0,0,0.15)] hover:shadow-[0_15px_35px_rgba(0,0,0,0.2)] hover:-translate-y-1 active:scale-95 shrink-0 w-full md:w-auto"
            >
              <Sparkles className="h-5 w-5 text-[#006590] group-hover:scale-110 transition-transform duration-300" />
              <span>Đăng tin cho thuê / ghép phòng</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter layout wrapper */}
      <div className="bg-white rounded-[24px] border border-slate-200 shadow-[0_8px_30px_rgba(0,0,0,0.06)] overflow-hidden">
        
        {/* Search + Gender row */}
        <div className="p-6 sm:p-7">
          <div className="flex flex-col xl:flex-row gap-4 items-stretch xl:items-center">
            <div className="flex-1 w-full relative group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5 group-focus-within:text-[#006590] transition-colors" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm theo tên dự án, đường phố, quận huyện, tiện nghi..."
                className="w-full bg-white border-2 border-slate-100 rounded-2xl pl-13 pr-5 py-4 text-[15px] outline-none hover:border-slate-200 focus:border-sky-300 focus:ring-4 focus:ring-sky-100 focus:bg-white transition-all font-medium text-slate-700 placeholder:text-slate-400 placeholder:font-normal shadow-sm"
              />
            </div>

            {/* My Posts Toggle */}
            <div 
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 rounded-2xl border border-slate-200/60 shrink-0 cursor-pointer hover:bg-slate-200/50 transition-colors" 
              onClick={() => {
                if (!currentUserProfile) {
                  onRequireAuth && onRequireAuth();
                } else {
                  setShowMyPostsOnly(!showMyPostsOnly);
                }
              }}
            >
              <div className={`w-5 h-5 rounded flex items-center justify-center border ${showMyPostsOnly ? 'bg-[#006590] border-[#006590]' : 'bg-white border-slate-300'}`}>
                {showMyPostsOnly && <CheckSquare className="w-3 h-3 text-white" />}
              </div>
              <span className={`text-sm font-bold ${showMyPostsOnly ? 'text-[#006590]' : 'text-slate-600'}`}>Phòng của tôi</span>
            </div>

            <div className="flex bg-slate-100 border border-slate-200/60 rounded-2xl p-1.5 gap-1 overflow-x-auto shrink-0">
              {(["Tất cả", "Nam", "Nữ", "Khác"] as const).map((genderVal) => (
                <button
                  key={genderVal}
                  onClick={() => setGenderFilter(genderVal)}
                  className={`flex-1 xl:flex-none whitespace-nowrap px-5 py-2.5 rounded-[12px] text-sm font-bold transition-all duration-200 cursor-pointer ${
                    genderFilter === genderVal
                      ? "bg-white text-[#006590] shadow-sm border border-slate-200/60"
                      : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                  }`}
                >
                  {genderVal === "Tất cả" ? "Tất cả" : genderVal}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Dropdown filters */}
        <div className="px-6 sm:px-7 py-6 border-t border-slate-100 bg-slate-50/50">
          <p className="text-[12px] font-black text-slate-700 uppercase tracking-widest mb-5 flex items-center gap-2">
            <Building className="h-4 w-4 text-[#006590]" />
            Bộ lọc phòng trọ
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
            <div className="space-y-2.5">
              <label className="flex items-center gap-1.5 text-[11px] font-extrabold text-slate-600 uppercase tracking-wider">
                <MapPin className="h-3.5 w-3.5" /> Khu vực
              </label>
              <select
                value={districtFilter}
                onChange={(e) => setDistrictFilter(e.target.value)}
                className="w-full bg-white rounded-xl px-4 py-3 text-sm font-bold text-slate-800 border border-slate-200 shadow-sm outline-none hover:border-slate-300 focus:border-[#006590] focus:ring-4 focus:ring-sky-100 transition-all cursor-pointer"
              >
                <option value="Tất cả">Tất cả</option>
                <option value="Hải Châu">Hải Châu</option>
                <option value="Thanh Khê">Thanh Khê</option>
                <option value="Liên Chiểu">Liên Chiểu</option>
                <option value="Sơn Trà">Sơn Trà</option>
                <option value="Ngũ Hành Sơn">Ngũ Hành Sơn</option>
                <option value="Cẩm Lệ">Cẩm Lệ</option>
                <option value="Hòa Vang">Hòa Vang</option>
              </select>
            </div>

            <div className="space-y-2.5">
              <label className="flex items-center gap-1.5 text-[11px] font-extrabold text-slate-600 uppercase tracking-wider">
                <Building className="h-3.5 w-3.5" /> Loại hình
              </label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full bg-white rounded-xl px-4 py-3 text-sm font-bold text-slate-800 border border-slate-200 shadow-sm outline-none hover:border-slate-300 focus:border-[#006590] focus:ring-4 focus:ring-sky-100 transition-all cursor-pointer"
              >
                <option value="Tất cả">Tất cả</option>
                <option value="Phòng trọ">Phòng trọ</option>
                <option value="Ký túc xá">Ký túc xá</option>
                <option value="Căn hộ">Căn hộ</option>
                <option value="Chung cư">Chung cư</option>
                <option value="Homestay">Homestay</option>
              </select>
            </div>

            <div className="space-y-2.5">
              <label className="flex items-center gap-1.5 text-[11px] font-extrabold text-slate-600 uppercase tracking-wider">
                <Users className="h-3.5 w-3.5" /> Sức chứa
              </label>
              <select
                value={capacityFilter}
                onChange={(e) => setCapacityFilter(e.target.value)}
                className="w-full bg-white rounded-xl px-4 py-3 text-sm font-bold text-slate-800 border border-slate-200 shadow-sm outline-none hover:border-slate-300 focus:border-[#006590] focus:ring-4 focus:ring-sky-100 transition-all cursor-pointer"
              >
                <option value="Tất cả">Tất cả</option>
                <option value="1">1 người</option>
                <option value="2">2 người</option>
                <option value="3">3 người</option>
                <option value="4">4 người</option>
                <option value="5+">5+ người</option>
              </select>
            </div>

            <div className="space-y-2.5">
              <label className="flex items-center gap-1.5 text-[11px] font-extrabold text-slate-600 uppercase tracking-wider">
                <Cat className="h-3.5 w-3.5" /> Thú cưng
              </label>
              <select
                value={petsFilter}
                onChange={(e) => setPetsFilter(e.target.value)}
                className="w-full bg-white rounded-xl px-4 py-3 text-sm font-bold text-slate-800 border border-slate-200 shadow-sm outline-none hover:border-slate-300 focus:border-[#006590] focus:ring-4 focus:ring-sky-100 transition-all cursor-pointer"
              >
                <option value="Tất cả">Tất cả</option>
                <option value="thoải mái">Cho phép</option>
                <option value="không cho nuôi">Không cho nuôi</option>
              </select>
            </div>
          </div>
        </div>

        {/* Budget + Amenities */}
        <div className="px-6 sm:px-7 py-5 space-y-5 border-t border-slate-100 bg-slate-50/50">
          {/* Budget */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-sky-100 flex items-center justify-center text-[#006590] shrink-0">
                <DollarSign className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[11px] font-extrabold text-slate-500 uppercase tracking-widest">Giá thuê / tháng</p>
                <p className="text-[15px] font-black text-[#006590]">
                  {minPrice === 0 && maxPrice === Number.MAX_SAFE_INTEGER ? "Tất cả mức giá" : `${(minPrice/1000000).toFixed(0)}tr – ${maxPrice === Number.MAX_SAFE_INTEGER ? "không giới hạn" : `${(maxPrice/1000000).toFixed(0)}tr`}`}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {(["Tất cả", "Dưới 1tr", "1-2tr", "2-3tr", "3-5tr", "trên 5tr"] as const).map((tag) => (
                <button
                  key={tag}
                  onClick={() => handlePriceTagClick(tag)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer ${
                    priceTag === tag
                      ? "bg-[#006590] text-white shadow-md shadow-[#006590]/20 scale-105"
                      : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Amenities */}
          <div className="border-t border-slate-100 pt-5">
            <p className="text-[11px] font-extrabold text-slate-500 uppercase tracking-widest mb-3">Tiện ích đi kèm — bấm để lọc</p>
            <div className="flex flex-wrap gap-2">
              {AMENITIES_LIST.map((amenity) => {
                const isSelected = selectedAmenities.includes(amenity.id);
                return (
                  <label
                    key={amenity.id}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 text-sm font-semibold cursor-pointer transition-all duration-150 select-none ${
                      isSelected
                        ? "bg-[#006590] border-[#006590] text-white shadow-md"
                        : "bg-white border-slate-200 text-slate-600 hover:border-[#006590]/40 hover:text-[#006590]"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {
                        if (isSelected) {
                          setSelectedAmenities(selectedAmenities.filter((id) => id !== amenity.id));
                        } else {
                          setSelectedAmenities([...selectedAmenities, amenity.id]);
                        }
                      }}
                      className="hidden"
                    />
                    <span>{amenity.label}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Rooms Card rendering grid */}
      {isLoading && filteredRooms.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white rounded-[24px] border border-gray-100 overflow-hidden animate-pulse">
              <div className="w-full aspect-[4/3] bg-slate-200" />
              <div className="p-4 space-y-3">
                <div className="h-5 bg-slate-200 rounded-lg w-3/4" />
                <div className="h-4 bg-slate-100 rounded-lg w-1/2" />
                <div className="grid grid-cols-2 gap-2">
                  <div className="h-8 bg-slate-100 rounded-lg" />
                  <div className="h-8 bg-slate-100 rounded-lg" />
                  <div className="h-8 bg-slate-100 rounded-lg" />
                  <div className="h-8 bg-slate-100 rounded-lg" />
                </div>
                <div className="flex gap-2 pt-1">
                  <div className="h-6 bg-slate-100 rounded-full w-16" />
                  <div className="h-6 bg-slate-100 rounded-full w-20" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredRooms.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredRooms.map((room) => (
            <RoomCard
              key={room.id}
              room={room}
              onViewDetails={onViewRoom}
              onLikeChange={isAdmin ? undefined : onLikeRoom}
              isInitiallyLiked={likedRoomIds.includes(room.id)}
              onReport={() => handleReportRoomClick(room)}
              onEdit={isAdmin || currentUserId === room.user_id || currentUserId === room.postedBy ? onEditRoom : undefined}
              onDelete={isAdmin || currentUserId === room.user_id || currentUserId === room.postedBy ? onDeleteRoom : undefined}
              currentUserId={currentUserId}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-[24px] border border-gray-100 p-12 text-center max-w-md mx-auto">
          <p className="text-slate-400 text-lg font-bold mb-2">Không tìm thấy phòng trọ trống</p>
          <p className="text-sm text-slate-500 leading-normal mb-4">
            Vui lòng thay đổi lại tiêu chí lọc hoặc điều chỉnh khoảng tiền thuê để khám phá nhiều tin đăng lý tưởng khác nhé.
          </p>
          <button
            onClick={() => {
              setSearchTerm("");
              setDistrictFilter("Tất cả");
              setTypeFilter("Tất cả");
              setCapacityFilter("Tất cả");
              setPetsFilter("Tất cả");
              setGenderFilter("Tất cả");
              setMinPrice(0);
              setMaxPrice(Number.MAX_SAFE_INTEGER);
              setPriceTag("Tất cả");
              setSelectedAmenities([]);
            }}
            className="bg-[#006590] text-white font-bold py-2.5 px-6 rounded-full text-sm hover:bg-[#005176] duration-150 cursor-pointer"
          >
            Xóa bộ lọc
          </button>
        </div>
      )}
      
      {/* Modals */}
      <ReportModal
        isOpen={!!reportingRoom}
        onClose={() => setReportingRoom(null)}
        onSubmit={handleSubmitReport}
        targetName={reportingRoom?.title || ""}
      />
    </div>
  );
}
