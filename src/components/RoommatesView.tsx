import { useState } from "react";
import { Search, SlidersHorizontal, ArrowDownWideNarrow, ListFilter, MapPin, Sparkles } from "lucide-react";
import { Roommate } from "../types";
import RoommateCard from "./RoommateCard";

interface RoommatesViewProps {
  roommates: Roommate[];
  onViewRoommate: (roommate: Roommate) => void;
  currentUserProfile: any;
  likedRoommateIds: string[];
  onLikeRoommate: (id: string, isLiked: boolean) => void;
  onStartChat: (id: string) => void;
  onOpenPostModal?: () => void;
}

export default function RoommatesView({
  roommates,
  onViewRoommate,
  currentUserProfile,
  likedRoommateIds,
  onLikeRoommate,
  onStartChat,
  onOpenPostModal,
}: RoommatesViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [genderFilter, setGenderFilter] = useState<"Tất cả" | "Nam" | "Nữ" | "LGBT" | "Khác">("Tất cả");
  const [sleepFilter, setSleepFilter] = useState("Tất cả");
  const [petsFilter, setPetsFilter] = useState("Tất cả");
  const [districtFilter, setDistrictFilter] = useState("Tất cả");
  const [typeFilter, setTypeFilter] = useState("Tất cả");
  const [roleFilter, setRoleFilter] = useState("Tất cả");
  const [ageFilter, setAgeFilter] = useState("Tất cả");
  const [statusFilter, setStatusFilter] = useState("Tất cả");
  const [minBudget, setMinBudget] = useState<number>(0);
  const [maxBudget, setMaxBudget] = useState<number>(20000000);
  const [budgetTag, setBudgetTag] = useState<string>("Tất cả");

  const handleBudgetTagClick = (tag: string) => {
    setBudgetTag(tag);
    switch (tag) {
      case "Dưới 1tr":
        setMinBudget(0);
        setMaxBudget(1000000);
        break;
      case "1-2tr":
        setMinBudget(1000000);
        setMaxBudget(2000000);
        break;
      case "2-3tr":
        setMinBudget(2000000);
        setMaxBudget(3000000);
        break;
      case "3-5tr":
        setMinBudget(3000000);
        setMaxBudget(5000000);
        break;
      case "trên 5tr":
        setMinBudget(5000000);
        setMaxBudget(20000000);
        break;
      default:
        setMinBudget(0);
        setMaxBudget(20000000);
        break;
    }
  };

  // Filter roommates list
  const filteredRoommates = roommates.filter((roommate) => {
    // Search by name, role, bio, location
    const matchesSearch =
      roommate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      roommate.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      roommate.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      roommate.bio.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesGender = genderFilter === "Tất cả" || roommate.gender === genderFilter;
    const matchesSleep = sleepFilter === "Tất cả" || roommate.lifestyle.sleep === sleepFilter;
    const matchesPets = petsFilter === "Tất cả" || roommate.lifestyle.pets === petsFilter;
    const matchesDistrict = districtFilter === "Tất cả" || (roommate.district && roommate.district === districtFilter);
    const matchesType = typeFilter === "Tất cả" || (roommate.type && roommate.type === typeFilter);
    const matchesBudget = roommate.budget >= minBudget && roommate.budget <= maxBudget;

    const matchesStatus = () => {
      if (statusFilter === "Tất cả") return true;
      const currentStatus = roommate.status || "Chưa có phòng";
      return currentStatus === statusFilter;
    };

    const matchesRole = () => {
      if (roleFilter === "Tất cả") return true;
      return roommate.majorKhoidoi === roleFilter;
    };

    const matchesAge = () => {
      if (ageFilter === "Tất cả") return true;
      const age = roommate.age;
      // Standardizing en-dash, hyphens or spaces
      const formattedFilter = ageFilter.replace("–", "-");
      
      if (formattedFilter === "<18") {
        return age < 18;
      }
      if (formattedFilter === "18-22") {
        return age >= 18 && age <= 22;
      }
      if (formattedFilter === "22-27") {
        return age >= 22 && age <= 27;
      }
      if (formattedFilter === "25-35") {
        return age >= 25 && age <= 35;
      }
      if (formattedFilter === "trên 35") {
        return age > 35;
      }
      return true;
    };

    return matchesSearch && matchesGender && matchesSleep && matchesPets && matchesDistrict && matchesType && matchesBudget && matchesRole() && matchesAge() && matchesStatus();
  });

  const getMatchScoreColor = (score: number) => {
    if (score >= 90) return "text-emerald-600";
    if (score >= 80) return "text-sky-600";
    return "text-slate-600";
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Title Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[#0f172a] tracking-tight">Tìm Kiếm Bạn Ở Ghép</h1>
          <p className="text-sm text-slate-500 mt-1">
            Lọc danh sách các bạn đang tìm roommate phù hợp với tính cách, mức ngân sách và lối sống của bạn.
          </p>
        </div>
        <button
          onClick={onOpenPostModal}
          className="flex items-center gap-2 px-5 py-3 bg-[#006590] hover:bg-[#005176] text-white font-extrabold text-xs rounded-full cursor-pointer duration-150 shadow-md transform hover:-translate-y-0.5 active:translate-y-0 shrink-0 border border-slate-100"
        >
          <Sparkles className="h-4.5 w-4.5 fill-white/10" />
          <span>Đăng tin tìm bạn ở ghép</span>
        </button>
      </div>

      {/* Filter and Search Layout Grid */}
      <div className="bg-white rounded-[24px] border border-gray-100 p-6 shadow-[0_10px_30px_rgba(15,23,42,0.02)] space-y-5">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Keyword Search Input */}
          <div className="flex-1 relative flex items-center">
            <Search className="absolute left-4.5 text-slate-400 h-5 w-5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo tên, vai trò học tập, khu vực chung hoặc bài viết giới thiệu..."
              className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-12 pr-4 py-3.5 text-sm outline-none focus:border-[#006590] focus:ring-1 focus:ring-[#006590] focus:bg-white duration-200"
            />
          </div>

          {/* Gender Filter Tab group */}
          <div className="flex border border-slate-100 rounded-xl p-1 bg-slate-50 overflow-x-auto max-w-full">
            {(["Tất cả", "Nam", "Nữ", "LGBT", "Khác"] as const).map((genderVal) => (
              <button
                key={genderVal}
                onClick={() => setGenderFilter(genderVal)}
                className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-150 cursor-pointer ${
                  genderFilter === genderVal
                    ? "bg-white text-[#006590] shadow-sm font-bold"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {genderVal === "Tất cả" ? "Tất cả giới" : genderVal}
              </button>
            ))}
          </div>
        </div>

        {/* Detailed Criteria Filters Dropdown rows */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 pt-2">
          {/* Địa chỉ (chỉ tại Đà Nẵng) */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5">📍 ĐỊA CHỈ (ĐÀ NẴNG)</label>
            <select
              value={districtFilter}
              onChange={(e) => setDistrictFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#006590] focus:bg-white duration-200"
            >
              <option value="Tất cả">Tất cả địa chỉ</option>
              <option value="Hải Châu">Hải Châu</option>
              <option value="Thanh Khê">Thanh Khê</option>
              <option value="Liên Chiểu">Liên Chiểu</option>
              <option value="Sơn Trà">Sơn Trà</option>
              <option value="Ngũ Hành Sơn">Ngũ Hành Sơn</option>
              <option value="Cẩm Lệ">Cẩm Lệ</option>
              <option value="Hòa Vang">Hòa Vang</option>
            </select>
          </div>

          {/* Loại hình */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5">🏠 LOẠI HÌNH PHÒNG</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#006590] focus:bg-white duration-200"
            >
              <option value="Tất cả">Tất cả loại hình</option>
              <option value="Phòng trọ">Phòng trọ</option>
              <option value="Ký túc xá">Ký túc xá</option>
              <option value="Căn hộ">Căn hộ</option>
              <option value="Chung cư">Chung cư</option>
              <option value="Homestay">Homestay</option>
            </select>
          </div>

          {/* Ngành học */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5">🎓 NGÀNH HỌC</label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#006590] focus:bg-white duration-200"
            >
              <option value="Tất cả">Tất cả ngành học</option>
              <option value="Khối Kinh tế">Khối Kinh tế</option>
              <option value="Khối Kỹ thuật">Khối Kỹ thuật</option>
              <option value="Khối Sư phạm">Khối Sư phạm</option>
              <option value="Khối Y Dược">Khối Y Dược</option>
              <option value="Khối Nghệ thuật">Khối Nghệ thuật</option>
            </select>
          </div>

          {/* Độ tuổi */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5">🎂 ĐỘ TUỔI</label>
            <select
              value={ageFilter}
              onChange={(e) => setAgeFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#006590] focus:bg-white duration-200"
            >
              <option value="Tất cả">Tất cả độ tuổi</option>
              <option value="<18">&lt;18</option>
              <option value="18–22">18–22</option>
              <option value="22–27">22–27</option>
              <option value="25–35">25–35</option>
              <option value="trên 35">trên 35</option>
            </select>
          </div>

          {/* Sleep schedule selector */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5">⏰ THÓI QUEN NGỦ</label>
            <select
              value={sleepFilter}
              onChange={(e) => setSleepFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#006590] focus:bg-white duration-200"
            >
              <option value="Tất cả">Tất cả thói quen</option>
              <option value="Ngủ sớm">Ngủ sớm (Sáng kiến)</option>
              <option value="Cú đêm">Cú đêm (Khuya thức)</option>
              <option value="Bình thường">Bình thường</option>
            </select>
          </div>

          {/* Pets attitude selector */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5">🐾 THÚ CƯNG</label>
            <select
              value={petsFilter}
              onChange={(e) => setPetsFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#006590] focus:bg-white duration-200"
            >
              <option value="Tất cả">Tất cả ý kiến</option>
              <option value="Thoải mái">Thoải mái</option>
              <option value="Yêu mèo">Yêu mèo</option>
              <option value="Yêu chó">Yêu chó</option>
              <option value="Không tiện nuôi">Không dắt thú cưng về</option>
            </select>
          </div>

          {/* Trạng thái tìm kiếm */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5">🔍 TRẠNG THÁI</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#006590] focus:bg-white duration-200"
            >
              <option value="Tất cả">Tất cả trạng thái</option>
              <option value="Chưa có phòng">🔍 Chưa có phòng</option>
              <option value="Đã có phòng">🔒 Đã có phòng</option>
            </select>
          </div>

        </div>

        {/* Budget Range Sizing */}
        <div className="pt-4 border-t border-slate-100">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="shrink-0">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">💵 Khoảng giá thuê (đầu người):</label>
              <div className="text-sm font-extrabold text-[#006590]">
                {minBudget === 0 && maxBudget === 20000000 
                  ? "Tất cả ngân sách" 
                  : `${minBudget === 0 ? "Under 1" : (minBudget / 1000000).toFixed(0)}tr - ${maxBudget === 20000000 ? "Không giới hạn" : `${(maxBudget / 1000000).toFixed(0)}tr`}`}
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 flex-1 max-w-xl">
              {(["Tất cả", "Dưới 1tr", "1-2tr", "2-3tr", "3-5tr", "trên 5tr"] as const).map((tag) => (
                <button
                  key={tag}
                  onClick={() => handleBudgetTagClick(tag)}
                  className={`px-4.5 py-2.5 rounded-full text-xs font-bold transition-all duration-150 cursor-pointer border ${
                    budgetTag === tag
                      ? "bg-[#dff6ff] border-[#006590]/30 text-[#006590] scale-[1.02] shadow-sm font-extrabold"
                      : "bg-slate-50 border-slate-100 text-slate-500 hover:text-[#006590] hover:bg-slate-100"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* AI Matching alert if customized profile is set up */}
      {currentUserProfile ? (
        <div className="bg-gradient-to-r from-sky-550 from-[#006590]/5 to-sky-400/10 border border-sky-100 rounded-2xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-[#dff6ff] rounded-xl text-[#006590]">
              <Sparkles className="h-5 w-5 animate-pulse" />
            </span>
            <div>
              <p className="text-sm font-extrabold text-slate-700">Chế độ hiển thị Ghép Đôi AI đang BẬT</p>
              <p className="text-xs text-slate-500">Chỉ số tương thích được thuật toán tính toán thời gian thực theo hồ sơ cá nhân của bạn!</p>
            </div>
          </div>
          <p className="text-xs font-semibold text-[#006590] bg-white border border-sky-100/60 px-3 py-1.5 rounded-full shadow-sm">
            Tài khoản: {currentUserProfile.name}
          </p>
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-center justify-between gap-4 text-xs">
          <p className="text-amber-800 font-semibold leading-relaxed">
            💡 **Mẹo**: Hãy nhấn nút **Tạo Hồ Sơ Roommate** góc trên cùng để thiết lập thói quen sinh hoạt và dễ dàng hơn trong việc tìm kiếm bạn đồng hành ưng ý nhất!
          </p>
        </div>
      )}

      {/* Roommates Grid Results */}
      {filteredRoommates.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {filteredRoommates.map((roommate) => (
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
      ) : (
        <div className="bg-white rounded-[24px] border border-gray-100 p-12 text-center max-w-md mx-auto">
          <p className="text-slate-400 text-lg font-bold mb-2">Không tìm thấy kết quả phù hợp</p>
          <p className="text-sm text-slate-500 leading-normal mb-4">
            Vui lòng điều chỉnh lại bộ lọc hoặc nhập từ khóa tìm kiếm khác của bạn để khám phá nhiều roommate tiềm năng hơn.
          </p>
          <button
            onClick={() => {
              setSearchTerm("");
              setGenderFilter("Tất cả");
              setSleepFilter("Tất cả");
              setPetsFilter("Tất cả");
              setDistrictFilter("Tất cả");
              setTypeFilter("Tất cả");
              setRoleFilter("Tất cả");
              setAgeFilter("Tất cả");
              setStatusFilter("Tất cả");
              setMinBudget(0);
              setMaxBudget(20000000);
              setBudgetTag("Tất cả");
            }}
            className="bg-[#006590] text-white font-bold py-2.5 px-6 rounded-full text-sm hover:bg-[#005176] duration-150 cursor-pointer"
          >
            Reset bộ lọc
          </button>
        </div>
      )}
    </div>
  );
}
