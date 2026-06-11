import { useState, useEffect } from "react";
import { Search, SlidersHorizontal, ArrowDownWideNarrow, ListFilter, MapPin, Sparkles, Building, GraduationCap, User, Moon, Cat, Info, DollarSign, CheckSquare } from "lucide-react";
import { useDialog } from "./ui/DialogProvider";
import { Roommate } from "../types";
import { SCHOOLS_BY_DISTRICT } from "../data";
import RoommateCard from "./RoommateCard";

interface RoommatesViewProps {
  roommates: Roommate[];
  isLoading?: boolean; // Add loading prop
  onViewRoommate: (roommate: Roommate) => void;
  currentUserProfile: any;
  likedRoommateIds: string[];
  onLikeRoommate: (id: string, isLiked: boolean) => void | Promise<boolean>;
  onStartChat: (id: string) => void;
  onOpenPostModal?: () => void;
  onRequireAuth?: () => void;
  onEditRoommate?: (roommate: Roommate) => void;
  onDeleteRoommate?: (id: string) => void;
  onClearSelectedRoommate?: () => void;
  currentUserId?: string;
  initialFilters?: any;
  isAdmin?: boolean;
}

export default function RoommatesView({
  roommates,
  isLoading = false, // Default to false
  onViewRoommate,
  currentUserProfile,
  likedRoommateIds,
  onLikeRoommate,
  onStartChat,
  onOpenPostModal,
  onRequireAuth,
  onEditRoommate,
  onDeleteRoommate,
  onClearSelectedRoommate,
  currentUserId,
  initialFilters,
  isAdmin = false,
}: RoommatesViewProps) {
  const { toast } = useDialog();
  const [searchTerm, setSearchTerm] = useState("");
  const [genderFilter, setGenderFilter] = useState<"Tất cả" | "Nam" | "Nữ" | "Khác">("Tất cả");
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
  const [showMyPostsOnly, setShowMyPostsOnly] = useState(false);

  useEffect(() => {
    if (initialFilters) {
      if (initialFilters.location && initialFilters.location !== "Tất cả Đà Nẵng") {
        setDistrictFilter(initialFilters.location);
      }
      
      if (initialFilters.budget && initialFilters.budget !== "Tất cả mức giá") {
        if (initialFilters.budget === "Dưới 2 triệu") {
            setMinBudget(0); setMaxBudget(2000000); setBudgetTag("Dưới 2tr");
        } else if (initialFilters.budget === "2 - 3 triệu") {
            setMinBudget(2000000); setMaxBudget(3000000); setBudgetTag("2-3tr");
        } else if (initialFilters.budget === "3 - 5 triệu") {
            setMinBudget(3000000); setMaxBudget(5000000); setBudgetTag("3-5tr");
        } else if (initialFilters.budget === "Trên 5 triệu") {
            setMinBudget(5000000); setMaxBudget(20000000); setBudgetTag("trên 5tr");
        }
      }

      if (initialFilters.lifestyle && initialFilters.lifestyle !== "Mọi phong cách") {
        if (initialFilters.lifestyle === "Ngủ sớm" || initialFilters.lifestyle === "Cú đêm") {
           setSleepFilter(initialFilters.lifestyle);
        } else if (initialFilters.lifestyle === "Yêu động vật") {
           setPetsFilter("Thoải mái");
        } else {
           setSearchTerm(initialFilters.lifestyle);
        }
      }
    }
  }, [initialFilters]);

  // When district changes, verify if the currently selected school is valid for the new district
  useEffect(() => {
    if (districtFilter !== "Tất cả" && roleFilter !== "Tất cả") {
      const allowedSchools = SCHOOLS_BY_DISTRICT[districtFilter] || [];
      if (!allowedSchools.find(s => s.value === roleFilter)) {
        setRoleFilter("Tất cả");
      }
    }
  }, [districtFilter]);

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
  // Legacy listings may not have is_listing yet. Only hide explicit profile rows.
  const listingsOnly = roommates.filter(
    (roommate) =>
      (roommate as any).is_listing !== false &&
      String((roommate as any).is_listing) !== "false"
  );
  
  // Apply filters on top of listings-only data
  const filteredRoommates = listingsOnly.filter((roommate) => {
    // Search by name, role, bio, location
    const matchesSearch =
      roommate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      roommate.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      roommate.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      roommate.bio.toLowerCase().includes(searchTerm.toLowerCase());

    if (showMyPostsOnly && roommate.postedBy !== currentUserId) {
      return false;
    }

    const matchesGender = genderFilter === "Tất cả" || roommate.gender === genderFilter;
    const matchesSleep = sleepFilter === "Tất cả" || roommate.lifestyle?.sleep === sleepFilter;
    const matchesPets = petsFilter === "Tất cả" || roommate.lifestyle?.pets === petsFilter;
    const matchesDistrict = districtFilter === "Tất cả" || (roommate.district && roommate.district === districtFilter);
    const matchesType = typeFilter === "Tất cả" || (roommate.type && roommate.type === typeFilter);
    const budgetMax = budgetTag === "Tất cả" ? Infinity : maxBudget;
    const matchesBudget = (roommate.budget || 0) >= minBudget && (roommate.budget || 0) <= budgetMax;

    const matchesStatus = () => {
      if (statusFilter === "Tất cả") return true;
      const currentStatus = roommate.status || "Đang tìm";
      return currentStatus === statusFilter;
    };

    const matchesRole = () => {
      if (roleFilter === "Tất cả") return true;
      return roommate.school === roleFilter;
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
    <div className="space-y-6">
      {/* Page Title Banner */}
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
              Nền tảng tìm bạn ở ghép
            </p>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight mb-3">
              Tìm Kiếm Bạn Ở Ghép
            </h1>
            <p className="text-sky-100/90 text-[15px] sm:text-base font-medium leading-relaxed max-w-xl">
              Khám phá danh sách những người bạn đồng hành lý tưởng, được chọn lọc dựa trên phong cách sống, sở thích và ngân sách của riêng bạn.
            </p>
          </div>
          
          {!isAdmin && (
            <button
              onClick={() => {
                if (currentUserId) {
                  const hasPostedRoommate = roommates.some(r => 
                    (r.postedBy === currentUserId || r.user_id === currentUserId) && 
                    r.is_listing !== false
                  );
                  if (hasPostedRoommate) {
                    toast('Bạn đã đăng 1 bài tìm bạn ghép phòng. Mỗi người chỉ được phép đăng tối đa 1 bài. Vui lòng xóa bài cũ nếu muốn tạo bài mới!', 'warning', 6000);
                    return;
                  }
                }
                onOpenPostModal && onOpenPostModal();
              }}
              className="group flex items-center justify-center gap-2.5 px-8 py-4 bg-white hover:bg-sky-50 text-[#004e70] font-black text-[15px] rounded-2xl cursor-pointer duration-300 shadow-[0_10px_25px_rgba(0,0,0,0.15)] hover:shadow-[0_15px_35px_rgba(0,0,0,0.2)] hover:-translate-y-1 active:scale-95 shrink-0 w-full md:w-auto"
            >
              <Sparkles className="h-5 w-5 text-[#006590] group-hover:scale-110 transition-transform duration-300" />
              <span>Đăng tin tìm bạn ở ghép</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Layout Grid */}
      <div className="bg-white rounded-[24px] border border-slate-200 shadow-[0_8px_30px_rgba(0,0,0,0.06)] overflow-hidden">
        {/* Top search + gender row */}
        <div className="p-6 sm:p-7">
          <div className="flex flex-col xl:flex-row gap-4 items-stretch xl:items-center">
            {/* Keyword Search Input */}
            <div className="flex-1 w-full relative group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5 group-focus-within:text-[#006590] transition-colors" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm theo tên, vai trò, khu vực, bài giới thiệu..."
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
              <span className={`text-sm font-bold ${showMyPostsOnly ? 'text-[#006590]' : 'text-slate-600'}`}>Bài của tôi</span>
            </div>

            {/* Gender Filter Tab group */}
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

        {/* Detailed Criteria Filters */}
        <div className="px-6 sm:px-7 py-6 border-t border-slate-100 bg-slate-50/50">
          <p className="text-[12px] font-black text-slate-700 uppercase tracking-widest mb-5 flex items-center gap-2">
            <ListFilter className="h-4 w-4 text-[#006590]" />
            Bộ lọc nâng cao
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {/* Khu vực */}
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

            {/* Loại hình */}
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

            {/* Trường học */}
            <div className="space-y-2.5">
              <label className="flex items-center gap-1.5 text-[11px] font-extrabold text-slate-600 uppercase tracking-wider">
                <GraduationCap className="h-3.5 w-3.5" /> Trường học
              </label>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full bg-white rounded-xl px-4 py-3 text-sm font-bold text-slate-800 border border-slate-200 shadow-sm outline-none hover:border-slate-300 focus:border-[#006590] focus:ring-4 focus:ring-sky-100 transition-all cursor-pointer"
              >
                <option value="Tất cả">Tất cả</option>
                {districtFilter === "Tất cả" ? (
                  // Show all grouped if "Tất cả" is selected
                  Object.entries(SCHOOLS_BY_DISTRICT).map(([district, schools]) => (
                    <optgroup key={district} label={`Quận ${district}`}>
                      {schools.map(s => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </optgroup>
                  ))
                ) : (
                  // Show only schools in the selected district without optgroup
                  (SCHOOLS_BY_DISTRICT[districtFilter] || []).map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))
                )}
              </select>
            </div>

            {/* Độ tuổi */}
            <div className="space-y-2.5">
              <label className="flex items-center gap-1.5 text-[11px] font-extrabold text-slate-600 uppercase tracking-wider">
                <User className="h-3.5 w-3.5" /> Độ tuổi
              </label>
              <select
                value={ageFilter}
                onChange={(e) => setAgeFilter(e.target.value)}
                className="w-full bg-white rounded-xl px-4 py-3 text-sm font-bold text-slate-800 border border-slate-200 shadow-sm outline-none hover:border-slate-300 focus:border-[#006590] focus:ring-4 focus:ring-sky-100 transition-all cursor-pointer"
              >
                <option value="Tất cả">Tất cả</option>
                <option value="<18">&lt;18</option>
                <option value="18–22">18–22</option>
                <option value="22–27">22–27</option>
                <option value="25–35">25–35</option>
                <option value="trên 35">&gt;35</option>
              </select>
            </div>

            {/* Giấc ngủ */}
            <div className="space-y-2.5">
              <label className="flex items-center gap-1.5 text-[11px] font-extrabold text-slate-600 uppercase tracking-wider">
                <Moon className="h-3.5 w-3.5" /> Giấc ngủ
              </label>
              <select
                value={sleepFilter}
                onChange={(e) => setSleepFilter(e.target.value)}
                className="w-full bg-white rounded-xl px-4 py-3 text-sm font-bold text-slate-800 border border-slate-200 shadow-sm outline-none hover:border-slate-300 focus:border-[#006590] focus:ring-4 focus:ring-sky-100 transition-all cursor-pointer"
              >
                <option value="Tất cả">Tất cả</option>
                <option value="Ngủ sớm">Ngủ sớm</option>
                <option value="Cú đêm">Cú đêm</option>
                <option value="Bình thường">Bình thường</option>
              </select>
            </div>

            {/* Thú cưng */}
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
                <option value="Thoải mái">Thoải mái</option>
                <option value="Yêu mèo">Yêu mèo</option>
                <option value="Yêu chó">Yêu chó</option>
                <option value="Không tiện nuôi">Không nuôi</option>
              </select>
            </div>

            {/* Trạng thái */}
            <div className="space-y-2.5">
              <label className="flex items-center gap-1.5 text-[11px] font-extrabold text-slate-600 uppercase tracking-wider">
                <Info className="h-3.5 w-3.5" /> Trạng thái
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full bg-white rounded-xl px-4 py-3 text-sm font-bold text-slate-800 border border-slate-200 shadow-sm outline-none hover:border-slate-300 focus:border-[#006590] focus:ring-4 focus:ring-sky-100 transition-all cursor-pointer"
              >
                <option value="Tất cả">Tất cả</option>
                <option value="Đang tìm">🟢 Đang tìm</option>
                <option value="Đang trao đổi">🟡 Đang trao đổi</option>
                <option value="Đã tìm được">🔴 Đã tìm được</option>
              </select>
            </div>
          </div>
        </div>

        {/* Budget Range */}
        <div className="px-6 sm:px-7 py-5 border-t border-slate-100 bg-slate-50/50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-sky-100 flex items-center justify-center text-[#006590] shrink-0">
                <DollarSign className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Khoảng giá thuê / người</p>
                <p className="text-[15px] font-black text-[#006590]">
                  {minBudget === 0 && maxBudget === 20000000 ? "Tất cả mức giá" : `${(minBudget/1000000).toFixed(0)}tr – ${maxBudget === 20000000 ? "không giới hạn" : `${(maxBudget/1000000).toFixed(0)}tr`}`}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {(["Tất cả", "Dưới 1tr", "1-2tr", "2-3tr", "3-5tr", "trên 5tr"] as const).map((tag) => (
                <button
                  key={tag}
                  onClick={() => handleBudgetTagClick(tag)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer ${
                    budgetTag === tag
                      ? "bg-[#006590] text-white shadow-md shadow-[#006590]/20 scale-105"
                      : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Roommates Grid Results */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24">
          <div className="relative">
            {/* Animated gradient spinner */}
            <div className="w-20 h-20 border-4 border-slate-200 border-t-rose-500 rounded-full animate-spin"></div>
            {/* Inner pulsing circle */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-rose-100 rounded-full animate-pulse"></div>
          </div>
          <p className="mt-6 text-lg font-bold text-slate-600">Đang tải danh sách...</p>
          <p className="mt-2 text-sm text-slate-400">Vui lòng chờ trong giây lát</p>
        </div>
      ) : filteredRoommates.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-6 [contain:layout_style_paint]">
          {filteredRoommates.map((roommate) => (
            <RoommateCard
              key={`roommate-${roommate.id}`}
              roommate={roommate}
              compact
              onViewDetails={onViewRoommate}
              onLikeChange={isAdmin ? undefined : onLikeRoommate}
              isInitiallyLiked={likedRoommateIds.includes(roommate.id)}
              onStartChat={isAdmin ? undefined : onStartChat}
              onEdit={isAdmin ? undefined : onEditRoommate}
              onDelete={isAdmin ? undefined : onDeleteRoommate}
              onClearSelectedRoommate={isAdmin ? undefined : onClearSelectedRoommate}
              currentUserId={isAdmin ? undefined : currentUserId}
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
