import { useState, useEffect } from "react";
import {
  Sparkles,
  User,
  Clock,
  CheckSquare,
  Users,
  CreditCard,
  FileText,
  BadgeCheck,
  Calendar,
  AlertCircle,
  Check,
  RotateCcw,
  Heart
} from "lucide-react";
import { Roommate } from "../types";

interface AgreementViewProps {
  roommates: Roommate[];
  currentUserProfile: any;
  preSelectedRoommateId?: string | null;
}

export const QUIET_OPTIONS = [
  { id: "chuan", label: "Khung giờ chuẩn: Yên tĩnh từ 23:00 đến 6:00 sáng hôm sau (Phù hợp học tập, ngủ nghỉ cơ bản)." },
  { id: "cudemo", label: "Khung giờ cú đêm: Yên tĩnh muộn từ 01:00 đến 7:00 sáng hôm sau (Phù hợp với team chạy deadline, học khối kỹ thuật/IT)." },
  { id: "tudo", label: "Tự do hoàn toàn: Không cố định giờ yên tĩnh, chỉ cần tôn trọng không gian riêng khi người kia ngủ." },
  { id: "khac", label: "Quy định khác..." }
];

export const CLEANING_OPTIONS = [
  { id: "tuan", label: "Chia lịch theo tuần: Tuần này người A dọn, tuần sau người B dọn (Toàn bộ phòng + nhà vệ sinh)." },
  { id: "co_dinh", label: "Chia việc cố định: Người A chuyên lau sàn + đổ rác | Người B chuyên cọ nhà vệ sinh + lau bếp." },
  { id: "tu_giac", label: "Tự giác cá nhân: Bày ra đâu dọn sạch ở đó, không chia lịch cố định." },
  { id: "lao_cong", label: "Quỹ thuê lao công: Cả phòng góp tiền gọi người dọn dẹp định kỳ (1-2 tuần/lần)." },
  { id: "khac", label: "Quy định khác..." }
];

export const VISITORS_OPTIONS = [
  { id: "khong_dan", label: "Không dẫn bạn về phòng: Phòng chỉ để ở và học tập cá nhân." },
  { id: "ban_ngay", label: "Được dẫn bạn về ban ngày: Chỉ được dẫn bạn về chơi/học nhóm ban ngày, không được ở lại qua đêm." },
  { id: "qua_dem_co_han", label: "Được ở lại qua đêm (Có giới hạn): Được dẫn bạn/người yêu về ngủ lại qua đêm nhưng phải báo trước ít nhất 3 tiếng và không quá 2 lần/tuần." },
  { id: "cung_gioi", label: "Chỉ dẫn bạn cùng giới về qua đêm: Tuyệt đối không dẫn người yêu/bạn khác giới về ngủ lại." },
  { id: "khac", label: "Quy định khác..." }
];

export const BILL_OPTIONS = [
  { id: "chia_deu", label: "Chia đều 100%: Tất cả tiền phòng, điện, nước, wifi, phí dịch vụ chia đôi (hoặc chia đều theo đầu người)." },
  { id: "thuc_te", label: "Chia theo thực tế ngày ở: Tiền phòng chia đều, tiền điện nước tính theo số ngày có mặt thực tế tại phòng (Tránh trường hợp một bạn nghỉ hè về quê 1 tháng vẫn phải gánh tiền điện nước của bạn ở lại)." },
  { id: "thiet_bi", label: "Chia theo thiết bị sử dụng: Bạn nào dùng điều hòa, máy tính bàn công suất lớn thì gánh nhiều tiền điện hơn." },
  { id: "khac", label: "Quy định khác..." }
];

export const PET_OPTIONS = [
  { id: "nghiem_cam", label: "Nghiêm cấm nuôi thú cưng: Không nuôi bất kỳ con gì (kể cả bò sát, hamster)." },
  { id: "cho_phep", label: "Cho phép nuôi (Được sự đồng ý): Được nuôi nếu người kia không dị ứng, chủ nuôi phải tự dọn vệ sinh, khử mùi hàng ngày." },
  { id: "thu_nho", label: "Chỉ nuôi thú nhỏ: Chỉ nuôi cá cảnh, thủy sinh hoặc cây cảnh." },
  { id: "khac", label: "Quy định khác..." }
];

export default function AgreementView({
  roommates,
  currentUserProfile,
  preSelectedRoommateId = null,
}: AgreementViewProps) {
  const [roommateName, setRoommateName] = useState("");
  const [quietHours, setQuietHours] = useState("");
  const [cleaningText, setCleaningText] = useState("");
  const [visitorsText, setVisitorsText] = useState("");
  const [billsText, setBillsText] = useState("");
  const [petsText, setPetsText] = useState("");
  const [otherNotesText, setOtherNotesText] = useState("");

  // Radioactive option ids and local input states
  const [quietOption, setQuietOption] = useState("chuan");
  const [quietOther, setQuietOther] = useState("");

  const [cleaningOption, setCleaningOption] = useState("tuan");
  const [cleaningOther, setCleaningOther] = useState("");

  const [visitorsOption, setVisitorsOption] = useState("khong_dan");
  const [visitorsOther, setVisitorsOther] = useState("");

  const [billsOption, setBillsOption] = useState("chia_deu");
  const [billsOther, setBillsOther] = useState("");

  const [petsOption, setPetsOption] = useState("nghiem_cam");
  const [petsOther, setPetsOther] = useState("");

  // Sync state values hooks
  useEffect(() => {
    if (quietOption === "khac") {
      setQuietHours(quietOther);
    } else {
      const selected = QUIET_OPTIONS.find(o => o.id === quietOption);
      setQuietHours(selected ? selected.label : "");
    }
  }, [quietOption, quietOther]);

  useEffect(() => {
    if (cleaningOption === "khac") {
      setCleaningText(cleaningOther);
    } else {
      const selected = CLEANING_OPTIONS.find(o => o.id === cleaningOption);
      setCleaningText(selected ? selected.label : "");
    }
  }, [cleaningOption, cleaningOther]);

  useEffect(() => {
    if (visitorsOption === "khac") {
      setVisitorsText(visitorsOther);
    } else {
      const selected = VISITORS_OPTIONS.find(o => o.id === visitorsOption);
      setVisitorsText(selected ? selected.label : "");
    }
  }, [visitorsOption, visitorsOther]);

  useEffect(() => {
    if (billsOption === "khac") {
      setBillsText(billsOther);
    } else {
      const selected = BILL_OPTIONS.find(o => o.id === billsOption);
      setBillsText(selected ? selected.label : "");
    }
  }, [billsOption, billsOther]);

  useEffect(() => {
    if (petsOption === "khac") {
      setPetsText(petsOther);
    } else {
      const selected = PET_OPTIONS.find(o => o.id === petsOption);
      setPetsText(selected ? selected.label : "");
    }
  }, [petsOption, petsOther]);

  // Sign states
  const [isAgreed, setIsAgreed] = useState(false);
  const [fullName, setFullName] = useState("");
  const [isAutoFilling, setIsAutoFilling] = useState(false);
  const [isSigned, setIsSigned] = useState(false);
  const [signedDate, setSignedDate] = useState<string>("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Dynamic templates matching each roommate's lifestyle or the default requested requirements
  const getRoommateAgreementFields = (roommate: Roommate) => {
    // Determine custom hours depending on sleep profile
    let quiet = QUIET_OPTIONS[0].label;
    if (roommate.lifestyle?.sleep === "Cú đêm") {
      quiet = QUIET_OPTIONS[1].label;
    }

    // Determine cleaning schedule based on neatness
    let cleaning = CLEANING_OPTIONS[0].label;
    if (roommate.lifestyle?.neatness === "Ngăn nắp") {
      cleaning = CLEANING_OPTIONS[1].label;
    }

    // Determine visitors rule depending on interaction preference
    let visitors = VISITORS_OPTIONS[0].label;
    if (roommate.lifestyle?.interaction === "Hướng ngoại") {
      visitors = VISITORS_OPTIONS[1].label;
    }

    // Determine pets rule depending on pet preference
    let pets = PET_OPTIONS[0].label;
    const petPref = roommate.lifestyle?.pets?.toLowerCase() || "";
    if (petPref.includes("mèo") || petPref.includes("chó") || petPref.includes("thoải mái")) {
      pets = PET_OPTIONS[1].label;
    }

    return {
      quiet,
      cleaning,
      visitors,
      bills: BILL_OPTIONS[0].label,
      pets,
    };
  };

  const applyLoadedFields = (fields: { quiet: string; cleaning: string; visitors: string; bills: string; pets: string; }) => {
    // 1. Quiet
    const matchedQuiet = QUIET_OPTIONS.find(o => o.label === fields.quiet);
    if (matchedQuiet) {
      setQuietOption(matchedQuiet.id);
    } else {
      setQuietOption("khac");
      setQuietOther(fields.quiet);
    }

    // 2. Cleaning
    const matchedCleaning = CLEANING_OPTIONS.find(o => o.label === fields.cleaning);
    if (matchedCleaning) {
      setCleaningOption(matchedCleaning.id);
    } else {
      setCleaningOption("khac");
      setCleaningOther(fields.cleaning);
    }

    // 3. Visitors
    const matchedVisitors = VISITORS_OPTIONS.find(o => o.label === fields.visitors);
    if (matchedVisitors) {
      setVisitorsOption(matchedVisitors.id);
    } else {
      setVisitorsOption("khac");
      setVisitorsOther(fields.visitors);
    }

    // 4. Bills
    const matchedBills = BILL_OPTIONS.find(o => o.label === fields.bills);
    if (matchedBills) {
      setBillsOption(matchedBills.id);
    } else {
      setBillsOption("khac");
      setBillsOther(fields.bills);
    }

    // 5. Pets
    const matchedPets = PET_OPTIONS.find(o => o.label === fields.pets);
    if (matchedPets) {
      setPetsOption(matchedPets.id);
    } else {
      setPetsOption("khac");
      setPetsOther(fields.pets);
    }
  };

  // Pre-load default or pre-selected roommate
  useEffect(() => {
    let idealId = preSelectedRoommateId;
    if (!idealId && roommates.length > 0) {
      idealId = roommates[0].id;
    }

    if (idealId) {
      const roommate = roommates.find((r) => r.id === idealId);
      if (roommate) {
        setRoommateName(roommate.name);
        const fields = getRoommateAgreementFields(roommate);
        applyLoadedFields(fields);
      }
    } else if (roommates.length > 0) {
      setRoommateName(roommates[0].name);
    } else {
      setRoommateName("Khánh Vy");
    }
  }, [preSelectedRoommateId, roommates]);

  const handleRoommateNameChange = (val: string) => {
    setRoommateName(val);
    
    // Auto-fill based on matched name in roommates list if they typed something matching
    const matched = roommates.find((r) => r.name.toLowerCase() === val.toLowerCase()) ||
                    roommates.find((r) => r.name.toLowerCase().includes(val.toLowerCase() || "__NOMATCH__"));
    if (matched) {
      const fields = getRoommateAgreementFields(matched);
      applyLoadedFields(fields);
    }
  };

  const handleSignAgreement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAgreed) {
      alert("Vui lòng tích chọn đồng ý với các quy định sống chung!");
      return;
    }
    if (!fullName.trim()) {
      alert("Vui lòng nhập họ và tên đầy đủ để tiến hành ký kết!");
      return;
    }

    setSignedDate(new Date().toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    }));
    setIsSigned(true);
  };

  const handleReset = () => {
    setIsSigned(false);
    setIsAgreed(false);
    setFullName("");
    setSignedDate("");
    setOtherNotesText("");
  };

  const matchedRoommate = roommates.find((r) => r.name.toLowerCase() === roommateName.toLowerCase()) || 
                          roommates.find((r) => r.name.toLowerCase().includes(roommateName.toLowerCase() || "__NOMATCH__")) ||
                          (roommates.length > 0 ? roommates[0] : null);

  const selectedRoommate = {
    name: roommateName || "Chưa nhập tên",
    avatar: (matchedRoommate && roommateName) ? matchedRoommate.avatar : "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop",
    role: (matchedRoommate && roommateName) ? matchedRoommate.role : "Bạn cùng phòng",
  };

  return (
    <div className="space-y-8 animate-fade-in pb-16 relative">
      {/* 2 Column Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: Main Form */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-[24px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] p-6 sm:p-8 space-y-6">
            
            {/* Header Title and Badge */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-100">
              <div>
                <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                  Bản Cam Kết Sống Chung
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  Thỏa thuận nếp sống, trật tự và tài chính minh bạch cho cuộc sống hài hòa.
                </p>
              </div>
              <div className="self-start sm:self-center">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-[#006590]/10 text-[#006590] border border-[#006590]/15">
                  <BadgeCheck className="h-4 w-4" />
                  Tiêu chuẩn RoomieMatch
                </span>
              </div>
            </div>

            {/* Roommate selector block */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-700">
                Chọn bạn cùng phòng để lập thỏa thuận
              </label>
              <input
                type="text"
                value={roommateName}
                onChange={(e) => handleRoommateNameChange(e.target.value)}
                disabled={isSigned}
                placeholder="Nhập tên bạn cùng phòng..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-[#006590] focus:ring-1 focus:ring-[#006590] focus:bg-white duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>

            {/* Form Fields - Grid of 2 columns */}
            <div className="relative">
              {isAutoFilling && (
                <div className="absolute inset-0 bg-white/70 backdrop-blur-sm z-10 flex flex-col items-center justify-center gap-2.5 rounded-2xl animate-fade-in">
                  <div className="relative flex items-center justify-center">
                    <div className="h-10 w-10 border-4 border-slate-200 border-t-[#006590] rounded-full animate-spin" />
                    <Sparkles className="h-4 w-4 text-[#006590] absolute animate-pulse" />
                  </div>
                  <span className="text-xs font-bold text-[#006590] tracking-wide animate-pulse">
                    Đang phân tích thói quen và tự động điền...
                  </span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* 1. Giờ giấc yên tĩnh chung */}
                <div className="space-y-3 bg-slate-50/50 border border-slate-100 rounded-2xl p-4.5">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                    <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg shrink-0">
                      <Clock className="h-4 w-4" />
                    </span>
                    <span className="text-xs font-extrabold uppercase tracking-wider text-[#006590]">
                      🕒 Giờ giấc yên tĩnh chung
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    {QUIET_OPTIONS.map((opt) => (
                      <label
                        key={opt.id}
                        className={`flex items-start gap-3 p-3 rounded-xl border transition-all duration-150 cursor-pointer text-xs leading-relaxed font-semibold transition-all ${
                          quietOption === opt.id
                            ? "bg-blue-50/40 border-blue-200 text-slate-800 shadow-xs font-bold"
                            : "bg-white border-slate-200/60 hover:border-slate-300 text-slate-500"
                        }`}
                      >
                        <input
                          type="radio"
                          name="quietOptionRadio"
                          checked={quietOption === opt.id}
                          onChange={() => setQuietOption(opt.id)}
                          disabled={isSigned}
                          className="mt-0.5 accent-[#006590] h-4 w-4 shrink-0"
                        />
                        <span>{opt.label}</span>
                      </label>
                    ))}
                  </div>

                  {quietOption === "khac" && (
                    <textarea
                      rows={2}
                      value={quietOther}
                      onChange={(e) => setQuietOther(e.target.value)}
                      disabled={isSigned}
                      className="w-full bg-white border border-slate-200 focus:border-[#006590] focus:ring-1 focus:ring-[#006590] rounded-xl px-3 py-2 text-xs text-slate-700 outline-none resize-none duration-150 mt-2 font-medium"
                      placeholder="Quy định khác..."
                    />
                  )}
                </div>

                {/* 2. Phân chia ca dọn vệ sinh */}
                <div className="space-y-3 bg-slate-50/50 border border-slate-100 rounded-2xl p-4.5">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                    <span className="p-1.5 bg-purple-50 text-purple-600 rounded-lg shrink-0">
                      <CheckSquare className="h-4 w-4" />
                    </span>
                    <span className="text-xs font-extrabold uppercase tracking-wider text-purple-700">
                      🧹 Phân chia ca dọn vệ sinh
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    {CLEANING_OPTIONS.map((opt) => (
                      <label
                        key={opt.id}
                        className={`flex items-start gap-3 p-3 rounded-xl border transition-all duration-150 cursor-pointer text-xs leading-relaxed font-semibold transition-all ${
                          cleaningOption === opt.id
                            ? "bg-purple-50/40 border-purple-200 text-slate-800 shadow-xs font-bold"
                            : "bg-white border-slate-200/60 hover:border-slate-300 text-slate-500"
                        }`}
                      >
                        <input
                          type="radio"
                          name="cleaningOptionRadio"
                          checked={cleaningOption === opt.id}
                          onChange={() => setCleaningOption(opt.id)}
                          disabled={isSigned}
                          className="mt-0.5 accent-[#006590] h-4 w-4 shrink-0"
                        />
                        <span>{opt.label}</span>
                      </label>
                    ))}
                  </div>

                  {cleaningOption === "khac" && (
                    <textarea
                      rows={2}
                      value={cleaningOther}
                      onChange={(e) => setCleaningOther(e.target.value)}
                      disabled={isSigned}
                      className="w-full bg-white border border-slate-200 focus:border-[#006590] focus:ring-1 focus:ring-[#006590] rounded-xl px-3 py-2 text-xs text-slate-700 outline-none resize-none duration-150 mt-2 font-medium"
                      placeholder="Quy định khác..."
                    />
                  )}
                </div>

                {/* 3. Nội quy đón khách và bạn bè */}
                <div className="space-y-3 bg-slate-50/50 border border-slate-100 rounded-2xl p-4.5">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                    <span className="p-1.5 bg-amber-50 text-amber-600 rounded-lg shrink-0">
                      <Users className="h-4 w-4" />
                    </span>
                    <span className="text-xs font-extrabold uppercase tracking-wider text-amber-700">
                      👥 Nội quy đón khách và bạn bè
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    {VISITORS_OPTIONS.map((opt) => (
                      <label
                        key={opt.id}
                        className={`flex items-start gap-3 p-3 rounded-xl border transition-all duration-150 cursor-pointer text-xs leading-relaxed font-semibold transition-all ${
                          visitorsOption === opt.id
                            ? "bg-amber-50/40 border-amber-200 text-slate-800 shadow-xs font-bold"
                            : "bg-white border-slate-200/60 hover:border-slate-300 text-slate-500"
                        }`}
                      >
                        <input
                          type="radio"
                          name="visitorsOptionRadio"
                          checked={visitorsOption === opt.id}
                          onChange={() => setVisitorsOption(opt.id)}
                          disabled={isSigned}
                          className="mt-0.5 accent-[#006590] h-4 w-4 shrink-0"
                        />
                        <span>{opt.label}</span>
                      </label>
                    ))}
                  </div>

                  {visitorsOption === "khac" && (
                    <textarea
                      rows={2}
                      value={visitorsOther}
                      onChange={(e) => setVisitorsOther(e.target.value)}
                      disabled={isSigned}
                      className="w-full bg-white border border-slate-200/80 focus:border-[#006590] focus:ring-1 focus:ring-[#006590] rounded-xl px-3 py-2 text-xs text-slate-700 outline-none resize-none duration-150 mt-2 font-medium"
                      placeholder="Quy định khác..."
                    />
                  )}
                </div>

                {/* 4. Công thức chia hóa đơn */}
                <div className="space-y-3 bg-slate-50/50 border border-slate-100 rounded-2xl p-4.5">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                    <span className="p-1.5 bg-sky-50 text-sky-600 rounded-lg shrink-0">
                      <CreditCard className="h-4 w-4" />
                    </span>
                    <span className="text-xs font-extrabold uppercase tracking-wider text-sky-700">
                      💰 Công thức chia hóa đơn
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    {BILL_OPTIONS.map((opt) => (
                      <label
                        key={opt.id}
                        className={`flex items-start gap-3 p-3 rounded-xl border transition-all duration-150 cursor-pointer text-xs leading-relaxed font-semibold transition-all ${
                          billsOption === opt.id
                            ? "bg-sky-50/40 border-sky-200 text-slate-800 shadow-xs font-bold"
                            : "bg-white border-slate-200/60 hover:border-slate-300 text-slate-500"
                        }`}
                      >
                        <input
                          type="radio"
                          name="billsOptionRadio"
                          checked={billsOption === opt.id}
                          onChange={() => setBillsOption(opt.id)}
                          disabled={isSigned}
                          className="mt-0.5 accent-[#006590] h-4 w-4 shrink-0"
                        />
                        <span>{opt.label}</span>
                      </label>
                    ))}
                  </div>

                  {billsOption === "khac" && (
                    <textarea
                      rows={2}
                      value={billsOther}
                      onChange={(e) => setBillsOther(e.target.value)}
                      disabled={isSigned}
                      className="w-full bg-white border border-slate-200/80 focus:border-[#006590] focus:ring-1 focus:ring-[#006590] rounded-xl px-3 py-2 text-xs text-slate-700 outline-none resize-none duration-150 mt-2 font-medium"
                      placeholder="Quy định khác..."
                    />
                  )}
                </div>

                {/* 5. Quy chế vật nuôi trong phòng - Full width */}
                <div className="md:col-span-2 space-y-3 bg-slate-50/50 border border-slate-100 rounded-2xl p-4.5">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                    <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg shrink-0">
                      <Heart className="h-4 w-4" />
                    </span>
                    <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-700">
                      🐾 Quy chế vật nuôi trong phòng
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {PET_OPTIONS.map((opt) => (
                      <label
                        key={opt.id}
                        className={`flex items-start gap-3 p-3 rounded-xl border transition-all duration-150 cursor-pointer text-xs leading-relaxed font-semibold transition-all ${
                          petsOption === opt.id
                            ? "bg-emerald-50/40 border-emerald-200 text-slate-800 shadow-xs font-bold animate-pulse-once"
                            : "bg-white border-slate-200/60 hover:border-slate-300 text-slate-500"
                        }`}
                      >
                        <input
                          type="radio"
                          name="petsOptionRadio"
                          checked={petsOption === opt.id}
                          onChange={() => setPetsOption(opt.id)}
                          disabled={isSigned}
                          className="mt-0.5 accent-[#006590] h-4 w-4 shrink-0"
                        />
                        <span>{opt.label}</span>
                      </label>
                    ))}
                  </div>

                  {petsOption === "khac" && (
                    <textarea
                      rows={2}
                      value={petsOther}
                      onChange={(e) => setPetsOther(e.target.value)}
                      disabled={isSigned}
                      className="w-full bg-white border border-slate-200/80 focus:border-[#006590] focus:ring-1 focus:ring-[#006590] rounded-xl px-3 py-2 text-xs text-slate-700 outline-none resize-none duration-150 mt-2 font-medium"
                      placeholder="Quy định khác..."
                    />
                  )}
                </div>

                {/* 6. Thỏa thuận khác - Full width */}
                <div className="md:col-span-2 space-y-3 bg-slate-50/50 border border-slate-100 rounded-2xl p-4.5">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                    <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg shrink-0">
                      <FileText className="h-4 w-4" />
                    </span>
                    <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-700">
                      📝 Thỏa thuận khác
                    </span>
                  </div>
                  
                  <textarea
                    rows={4}
                    value={otherNotesText}
                    onChange={(e) => setOtherNotesText(e.target.value)}
                    disabled={isSigned}
                    className="w-full bg-white border border-slate-200 focus:border-[#006590] focus:ring-1 focus:ring-[#006590] rounded-xl px-4 py-3 text-xs text-slate-700 outline-none resize-none duration-150 font-medium"
                    placeholder="Nhập các thỏa thuận hoặc quy định bổ sung khác tại đây..."
                  />
                </div>
              </div>
            </div>

            {/* Signature Block (card nhỏ nền tím nhạt) */}
            <form onSubmit={handleSignAgreement} className="bg-purple-50/50 border border-purple-100/80 rounded-2xl p-5 space-y-4">
              <h4 className="text-sm font-extrabold text-[#5b21b6] flex items-center gap-1.5 uppercase tracking-wide">
                ✒️ Phần ký xác nhận cam kết
              </h4>
              
              <div className="flex items-start gap-2.5">
                <input
                  type="checkbox"
                  id="agreeCheckbox"
                  checked={isAgreed}
                  onChange={(e) => setIsAgreed(e.target.checked)}
                  disabled={isSigned}
                  className="mt-1 accent-purple-600 h-4.5 w-4.5 cursor-pointer rounded border-purple-300 focus:ring-purple-300 disabled:opacity-60"
                />
                <label htmlFor="agreeCheckbox" className="text-xs text-slate-600 font-medium leading-relaxed select-none cursor-pointer">
                  Tôi đồng ý với các quy định sống chung đã liệt kê ở trên và tự nguyện hợp tác để tạo môi trường tích cực.
                </label>
              </div>

              <div className="space-y-1.5">
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={isSigned}
                  placeholder="Nhập họ tên đầy đủ để ký số..."
                  className="w-full bg-white border border-purple-200 rounded-xl px-4 py-3 text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none w-full text-slate-800 font-semibold placeholder-purple-300 disabled:opacity-70 disabled:bg-slate-50"
                />
              </div>

              {!isSigned ? (
                <button
                  type="submit"
                  disabled={!isAgreed || !fullName.trim()}
                  className="w-full py-4 text-sm font-black uppercase tracking-wider text-white bg-gradient-to-r from-purple-600 via-indigo-600 to-sky-600 hover:from-purple-700 hover:to-sky-700 rounded-xl shadow-lg shadow-purple-200/50 transition-all duration-300 active:scale-[0.99] cursor-pointer disabled:opacity-40 disabled:shadow-none disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <BadgeCheck className="h-5 w-5" />
                  Ký kết & Đăng tải bản thỏa thuận
                </button>
              ) : (
                <div className="bg-white border border-dashed border-emerald-250 p-3 rounded-xl flex items-center justify-between gap-3 animate-fade-in">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-700">
                    <span className="p-1 bg-emerald-100 rounded-full">
                      <Check className="h-3.5 w-3.5" />
                    </span>
                    Đã ký điện tử thành công!
                  </div>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="text-xs font-semibold text-purple-700 hover:text-purple-900 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-50"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Ký lại
                  </button>
                </div>
              )}
            </form>

          </div>
        </div>

        {/* RIGHT COLUMN: Active Agreement Card */}
        <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-8">
          <div className="bg-white rounded-[24px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] overflow-hidden">
            
            {/* Gradient Header */}
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-6 text-white text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <FileText className="h-32 w-32 rotate-12" />
              </div>
              <h3 className="text-base font-black tracking-tight uppercase">
                Thỏa Thuận Có Hiệu Lực
              </h3>
              <p className="text-[11px] text-slate-400 mt-1">
                Chứng thư điện tử RoomieMatch
              </p>
            </div>

            {/* Roommate details & status badge */}
            <div className="p-6 space-y-6">
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100/60">
                <img
                  src={selectedRoommate.avatar}
                  alt={selectedRoommate.name}
                  referrerPolicy="no-referrer"
                  className="h-14 w-14 rounded-full object-cover border-2 border-white ring-4 ring-[#006590]/15"
                />
                <div className="space-y-1">
                  <p className="font-extrabold text-slate-800 leading-tight">
                    {selectedRoommate.name}
                  </p>
                  <p className="text-[11px] text-slate-400 font-semibold">
                    {selectedRoommate.role}
                  </p>

                  <div className="pt-1">
                    {isSigned ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                        <Check className="h-3 w-3" />
                        Đã ký kết
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-100">
                        <Clock className="h-3 w-3" />
                        Chưa ký kết
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Signing info */}
              <div className="text-xs space-y-1 bg-slate-50/50 p-4 rounded-xl border border-dashed border-slate-200">
                <div className="flex justify-between text-slate-500">
                  <span className="font-medium">Họ tên của bạn:</span>
                  <span className="font-bold text-slate-800 text-right">{fullName || "—"}</span>
                </div>
                <div className="flex justify-between text-slate-500 pt-1">
                  <span className="font-medium">Đối tác ký:</span>
                  <span className="font-bold text-[#006590] text-right">{selectedRoommate.name}</span>
                </div>
                <div className="flex justify-between text-slate-500 pt-1">
                  <span className="font-medium">Ngày ký:</span>
                  <span className="font-bold text-slate-700 text-right">{signedDate || "—"}</span>
                </div>
              </div>

              {/* Lists of rules with small icons */}
              <div className="space-y-4 pt-2">
                <p className="text-xs font-extrabold uppercase tracking-wide text-slate-400">
                  📋 Danh mục quản lý quy định
                </p>

                <div className="space-y-3.5">
                  {/* Rule 1 */}
                  <div className="flex items-start gap-3">
                    <span className="p-2 bg-blue-50 text-blue-600 rounded-xl shrink-0">
                      <Clock className="h-4 w-4" />
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-slate-700">Giờ sinh hoạt</h4>
                      <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{quietHours}</p>
                    </div>
                  </div>

                  {/* Rule 2 */}
                  <div className="flex items-start gap-3">
                    <span className="p-2 bg-purple-50 text-purple-600 rounded-xl shrink-0">
                      <CheckSquare className="h-4 w-4" />
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-slate-700">Phân chia việc nhà</h4>
                      <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{cleaningText}</p>
                    </div>
                  </div>

                  {/* Rule 3 */}
                  <div className="flex items-start gap-3">
                    <span className="p-2 bg-amber-50 text-amber-600 rounded-xl shrink-0">
                      <Users className="h-4 w-4" />
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-slate-700">Quy định khách đến chơi</h4>
                      <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{visitorsText}</p>
                    </div>
                  </div>

                  {/* Rule 4 */}
                  <div className="flex items-start gap-3">
                    <span className="p-2 bg-sky-50 text-sky-600 rounded-xl shrink-0">
                      <CreditCard className="h-4 w-4" />
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-slate-700">Chia chi phí</h4>
                      <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{billsText}</p>
                    </div>
                  </div>

                  {/* Rule 5 */}
                  <div className="flex items-start gap-3">
                    <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
                      <Heart className="h-4 w-4" />
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-slate-700">Nuôi thú cưng</h4>
                      <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{petsText}</p>
                    </div>
                  </div>

                  {/* Rule 6 */}
                  <div className="flex items-start gap-3">
                    <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl shrink-0">
                      <FileText className="h-4 w-4" />
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-slate-700">Thỏa thuận khác</h4>
                      <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">{otherNotesText || "Chưa thiết lập"}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Hoàn thành */}
              <button
                type="button"
                onClick={() => {
                  if (!isSigned) {
                    alert("Hãy ký tên & lập bản cam kết trước khi nhấn Hoàn thành!");
                    return;
                  }
                  setShowSuccessModal(true);
                }}
                className="w-full py-4 bg-[#006590] hover:bg-[#005176] text-white font-bold rounded-xl text-sm transition-all duration-200 hover:shadow-lg shadow-sky-100 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Check className="h-4.5 w-4.5" />
                Hoàn thành
              </button>
            </div>

          </div>
        </div>

      </div>

      {/* SUCCESS POPUP MODAL */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-[#020617]/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-8 text-center space-y-6 shadow-2xl animate-fade-in relative overflow-hidden">
            {/* Celebration sparkles background decorator */}
            <div className="absolute -top-10 -left-10 h-32 w-32 bg-purple-100 rounded-full blur-3xl opacity-60" />
            <div className="absolute -bottom-10 -right-10 h-32 w-32 bg-sky-100 rounded-full blur-3xl opacity-60" />

            <div className="relative flex justify-center">
              <div className="h-20 w-20 bg-emerald-50 border-4 border-emerald-100 rounded-full flex items-center justify-center text-emerald-600 shadow-inner">
                <BadgeCheck className="h-10 w-10 animate-bounce" />
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-black text-slate-800">
                Thỏa Thuận Thành Công! 🎉
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Biểu quyết sống chung hòa hợp đã chính thức có đầy đủ chữ ký điện tử và được lưu giữ an toàn trên hệ thống <b>RoomieMatch</b>.
              </p>
            </div>

            {/* Contract Summary Recap grid details */}
            <div className="bg-slate-50 border border-slate-100 text-left p-4 rounded-2xl text-xs space-y-2.5">
              <p className="font-bold text-slate-700 pb-1.5 border-b border-slate-200 flex items-center justify-between">
                <span>Thông tin thỏa thuận</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-1.5 py-0.5 rounded uppercase">Đã chứng thực</span>
              </p>
              <div className="flex justify-between">
                <span className="text-slate-400">Bạn ở ghép:</span>
                <span className="font-extrabold text-slate-800">{fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Bạn ở cùng phòng:</span>
                <span className="font-extrabold text-slate-800">{selectedRoommate.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Giời yên tĩnh:</span>
                <span className="font-semibold text-slate-700 truncate max-w-[200px]">{quietHours}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Giờ kích hoạt:</span>
                <span className="font-semibold text-slate-600">{signedDate}</span>
              </div>
              {otherNotesText.trim() && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Thỏa thuận khác:</span>
                  <span className="font-semibold text-slate-700 truncate max-w-[200px]">{otherNotesText}</span>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowSuccessModal(false);
                  handleReset();
                }}
                className="flex-1 py-3 text-xs font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-xl transition duration-150 cursor-pointer"
              >
                Tạo thỏa thuận khác
              </button>
              <button
                type="button"
                onClick={() => setShowSuccessModal(false)}
                className="flex-1 py-3 text-xs font-extrabold text-white bg-[#006590] hover:bg-[#005176] rounded-xl transition duration-150 shadow-md cursor-pointer"
              >
                Đóng
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
