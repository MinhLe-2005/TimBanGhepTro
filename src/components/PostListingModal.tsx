import React, { useState } from "react";
import { X, Sparkles, User, Home, Plus, Briefcase, GraduationCap, DollarSign, Phone, MapPin, Hash, CheckSquare, Settings, Heart, Image, Check, Upload } from "lucide-react";
import { Roommate, Room } from "../types";

interface PostListingModalProps {
  onClose: () => void;
  onAddRoom: (room: Room) => void;
  onAddRoommate: (roommate: Roommate) => void;
  initialTab?: "roommate" | "room";
}

export default function PostListingModal({
  onClose,
  onAddRoom,
  onAddRoommate,
  initialTab = "roommate"
}: PostListingModalProps) {
  const [activeTab, setActiveTab] = useState<"roommate" | "room">(initialTab);
  const [isSuccess, setIsSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const handleRmAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Dung lượng ảnh tối đa là 2MB để đảm bảo hiệu suất lưu trữ và tải trang tốt nhất!");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          setRmAvatar(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        alert("Dung lượng ảnh tối đa là 3MB để đảm bảo hiệu suất lưu trữ và tải trang tốt nhất!");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          setRImage(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Roommate stock avatars preset 
  const AVATAR_PRESETS = [
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=150&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=150&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150&auto=format&fit=crop",
  ];

  // Room stock image presets
  const ROOM_IMAGE_PRESETS = [
    "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?q=80&w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?q=80&w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1505691938895-1758d7feb511?q=80&w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1536376072261-38c75010e6c9?q=80&w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=600&auto=format&fit=crop"
  ];

  // ==========================================
  // Form State: SEEKING ROOMMATE (TÌM BẠN Ở GHÉP)
  // ==========================================
  const [rmName, setRmName] = useState("");
  const [rmAge, setRmAge] = useState(21);
  const [rmGender, setRmGender] = useState<"Nam" | "Nữ" | "LGBT" | "Khác">("Nữ");
  const [rmRole, setRmRole] = useState("Sinh viên");
  const [rmMajor, setRmMajor] = useState<"Khối Kinh tế" | "Khối Kỹ thuật" | "Khối Sư phạm" | "Khối Y Dược" | "Khối Nghệ thuật">("Khối Kinh tế");
  const [rmDistrict, setRmDistrict] = useState("Hải Châu");
  const [rmAddress, setRmAddress] = useState("");
  const [rmBudget, setRmBudget] = useState("");
  const [rmPhone, setRmPhone] = useState("");
  const [rmBio, setRmBio] = useState("");
  const [rmStatus, setRmStatus] = useState<"Đã có phòng" | "Chưa có phòng">("Chưa có phòng");
  const [rmAvatar, setRmAvatar] = useState(AVATAR_PRESETS[0]);
  const [rmType, setRmType] = useState("Phòng trọ");

  // Lifestyle selections
  const [rmSleep, setRmSleep] = useState<"Ngủ sớm" | "Cú đêm" | "Bình thường">("Bình thường");
  const [rmPets, setRmPets] = useState<"Yêu mèo" | "Yêu chó" | "Không tiện nuôi" | "Thoải mái">("Thoải mái");
  const [rmSmoke, setRmSmoke] = useState<"Không hút thuốc" | "Hút thuốc ngoài ban công" | "Không quan trọng">("Không hút thuốc");
  const [rmCook, setRmCook] = useState<"Thích nấu ăn" | "Ăn ngoài" | "Đôi khi nấu">("Đôi khi nấu");
  const [rmInteraction, setRmInteraction] = useState<"Hướng nội" | "Hướng ngoại" | "Cân bằng">("Cân bằng");
  const [rmNeatness, setRmNeatness] = useState<"Ngăn nắp" | "Sạch sẽ" | "Thoải mái">("Sạch sẽ");

  // Roommate Tags (Custom quick labels)
  const [customTags, setCustomTags] = useState<string>("Sạch sẽ, Tự giác, Thân thiện");

  // ==========================================
  // Form State: ROOM FOR RENT (PHÒNG TRỌ GHÉP)
  // ==========================================
  const [rTitle, setRTitle] = useState("");
  const [rPrice, setRPrice] = useState("");
  const [rDistrict, setRDistrict] = useState("Hải Châu");
  const [rAddress, setRAddress] = useState("");
  const [rType, setRType] = useState("Phòng trọ");
  const [rBedrooms, setRBedrooms] = useState("1");
  const [rWc, setRWc] = useState("Khép kín");
  const [rKitchen, setRKitchen] = useState("Bếp riêng");
  const [rPriceElectricity, setRPriceElectricity] = useState("3.500đ/kWh");
  const [rPriceWater, setRPriceWater] = useState("10.000đ/m3");
  const [rPets, setRPets] = useState<"thoải mái" | "không cho nuôi">("thoải mái");
  const [rGenderTarget, setRGenderTarget] = useState<"Nam" | "Nữ" | "LGBT" | "Khác" | "Tất cả">("Tất cả");
  const [rPhone, setRPhone] = useState("");
  const [rDescription, setRDescription] = useState("");
  const [rHostName, setRHostName] = useState("");
  const [rHostRole, setRHostRole] = useState("Giảng viên / Sinh viên");
  const [rRoommateInfo, setRRoommateInfo] = useState("");
  const [rImage, setRImage] = useState(ROOM_IMAGE_PRESETS[0]);
  
  // Amenities checklist
  const [rAmenities, setRAmenities] = useState({
    dieuhoa: true,
    maygiat: true,
    nhabep: true,
    wifi: true,
    tulanh: false,
    tv: false,
    baove: false,
    baigieuxe: true
  });

  const handleAmenityChange = (key: keyof typeof rAmenities) => {
    setRAmenities(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleRoommateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rmName.trim() || !rmBudget || !rmPhone.trim()) {
      alert("Vui lòng nhập đầy đủ các trường thông tin bắt buộc!");
      return;
    }

    const processedTags = customTags
      .split(",")
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);

    const newRoommate: Roommate = {
      id: `rm-${Date.now()}`,
      name: rmName,
      age: Number(rmAge),
      role: rmRole,
      avatar: rmAvatar,
      location: `${rmAddress ? rmAddress + ", " : ""}Quận ${rmDistrict}, Đà Nẵng`,
      district: rmDistrict,
      type: rmType,
      matchScore: 90,
      reputationScore: 100, // 100% reputation default for new registered roommate
      tags: processedTags.length > 0 ? processedTags : ["Học tập tốt", "Thân thiện"],
      isVerified: true,
      status: rmStatus,
      bio: rmBio || `Chào cả nhà! Mình tên là ${rmName}. Mình đang hoạt động tại khu vực ${rmDistrict} Đà Nẵng và rất mong muốn tìm được một người bạn ở ghép chia sẻ chi phí, có lối sống lành mạnh, sạch sẽ.`,
      budget: Number(rmBudget),
      gender: rmGender,
      majorKhoidoi: rmMajor,
      phoneNumber: rmPhone,
      lifestyle: {
        sleep: rmSleep,
        pets: rmPets,
        smoke: rmSmoke,
        cook: rmCook,
        interaction: rmInteraction,
        neatness: rmNeatness,
      },
      reviews: []
    };

    onAddRoommate(newRoommate);
    setSuccessMessage(`Đã đăng bài Tìm bạn ở ghép cho ${rmName} thành công lên cộng đồng RoomieMatch!`);
    setIsSuccess(true);
  };

  const handleRoomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rTitle.trim() || !rPrice || !rAddress.trim() || !rHostName.trim() || !rPhone.trim()) {
      alert("Vui lòng điền đầy đủ các thông tin quan trọng!");
      return;
    }

    // Convert amenities state to array of features string
    const selectedFeatures: string[] = [];
    if (rAmenities.dieuhoa) selectedFeatures.push("Điều hòa");
    if (rAmenities.maygiat) selectedFeatures.push("Máy giặt");
    if (rAmenities.nhabep) selectedFeatures.push("Nhà bếp riêng");
    if (rAmenities.wifi) selectedFeatures.push("Wifi cáp quang");
    if (rAmenities.tulanh) selectedFeatures.push("Tủ lạnh riêng");
    if (rAmenities.tv) selectedFeatures.push("Tivi");
    if (rAmenities.baove) selectedFeatures.push("Bảo vệ 24/7");
    if (rAmenities.baigieuxe) selectedFeatures.push("Bãi xe rộng rãi");

    const newRoom: Room = {
      id: `room-${Date.now()}`,
      title: rTitle,
      price: Number(rPrice),
      location: `${rAddress}, Quận ${rDistrict}, Đà Nẵng`,
      district: rDistrict,
      type: rType,
      images: [rImage],
      features: selectedFeatures,
      isHot: true,
      status: "còn phòng",
      isVerifiedRoom: true,
      bedrooms: Number(rBedrooms),
      wc: rWc,
      kitchen: rKitchen,
      hostName: rHostName,
      hostAvatar: AVATAR_PRESETS[Math.floor(Math.random() * AVATAR_PRESETS.length)],
      hostRole: rHostRole,
      description: rDescription || `Phòng cho thuê rộng rãi, đầy đủ ánh sáng, nội thất tiện nghi căn bản. Tọa lạc tại khu vực an ninh gần các trường học và khu mua sắm tiện ích.`,
      phoneNumber: rPhone,
      pets: rPets,
      gender: rGenderTarget,
      electricity: rPriceElectricity,
      water: rPriceWater,
      parking: "Đỗ xe tầng hầm miễn phí",
      proximity: "Gần trường đại học & siêu thị tiện lợi",
      roommateInfo: rRoommateInfo || "Tìm người sạch sẽ, không quấy rầy, chia sẻ tiền bạc đúng kỳ hẹn.",
      habits: ["Yêu sạch sẽ", "Giữ yên tĩnh chung"],
      reviews: []
    };

    onAddRoom(newRoom);
    setSuccessMessage(`Đã đăng bài cho thuê / ghép phòng "${rTitle}" thành công!`);
    setIsSuccess(true);
  };

  return (
    <div className="fixed inset-0 z-55 flex items-center justify-center p-4">
      {/* Backdrop with blur opacity */}
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={onClose} />

      {/* Main Container */}
      <div className="relative bg-white rounded-[32px] shadow-2xl border border-gray-100 w-full max-w-2xl max-h-[90vh] overflow-y-auto z-10 p-6 sm:p-8 scrollbar-thin animate-fade-in">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 w-10 h-10 rounded-full bg-slate-50 border border-slate-150 flex items-center justify-center text-slate-500 hover:text-slate-800 duration-150 cursor-pointer shadow-xs"
        >
          <X className="h-4.5 w-4.5" />
        </button>

        {/* Dynamic Screens logic */}
        {isSuccess ? (
          <div className="py-10 text-center space-y-6">
            <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-sm border border-emerald-100">
              <Check className="h-10 w-10 stroke-[3px]" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-slate-800">Đăng Tin Hoàn Tất!</h3>
              <p className="text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
                {successMessage}
              </p>
            </div>

            <button
              onClick={() => {
                setIsSuccess(false);
                onClose();
              }}
              className="bg-[#006590] text-white hover:bg-[#005176] px-8 py-3.5 rounded-full font-extrabold text-sm shadow-md duration-150 cursor-pointer"
            >
              Quay lại danh sách
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* Header Text */}
            <div className="flex items-start gap-3">
              <span className="p-2.5 bg-gradient-to-br from-[#006590]/10 to-indigo-50 text-[#006590] rounded-xl shrink-0">
                <Sparkles className="h-6 w-6 stroke-[2px]" />
              </span>
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Đăng bài tin mới</h3>
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mt-0.5">Cổng kết nối Đà Nẵng</p>
              </div>
            </div>

            {/* Selecting Posting Modes */}
            <div className="flex bg-slate-100 rounded-2xl p-1.5 border border-slate-200/50">
              <button
                type="button"
                onClick={() => setActiveTab("roommate")}
                className={`flex-1 flex items-center justify-center gap-2.5 py-3 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer transition-all duration-150 ${
                  activeTab === "roommate"
                    ? "bg-white text-[#006590] shadow-sm font-black"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <User className="h-4 w-4" />
                Tìm Bạn Ở Ghép
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("room")}
                className={`flex-1 flex items-center justify-center gap-2.5 py-3 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer transition-all duration-150 ${
                  activeTab === "room"
                    ? "bg-white text-[#006590] shadow-sm font-black"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <Home className="h-4 w-4" />
                Có Phòng / Phòng Tìm Bạn
              </button>
            </div>

            {/* TAB CONTENT: 1. SEEKING ROOMMATE FORM */}
            {activeTab === "roommate" && (
              <form onSubmit={handleRoommateSubmit} className="space-y-6">
                
                {/* Section 1: Avatar select */}
                <div className="bg-slate-50/50 rounded-2xl border border-slate-100 p-4.5 space-y-3.5">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-extrabold uppercase tracking-wider text-slate-400 block">👤 Ảnh đại diện của bạn</label>
                    <label className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-[#006590] hover:text-[#005176] rounded-full text-[11px] font-black shadow-xs duration-150">
                      <Upload className="h-3.5 w-3.5" />
                      <span>Tự tải ảnh cá nhân</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleRmAvatarUpload}
                      />
                    </label>
                  </div>
                  <div className="flex gap-4 items-center">
                    <div className="w-16 h-16 rounded-full border-2 border-[#006590] overflow-hidden shadow-inner bg-white shrink-0">
                      <img src={rmAvatar} alt="Selected" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                    <div className="text-xs text-slate-400 leading-relaxed font-medium">
                      <span className="font-extrabold text-[#006590]">Ảnh cá nhân hiện tại</span>. Vui lòng bấm nút phía trên "Tự tải ảnh cá nhân" để tải lên ảnh đại diện thực tế của bạn (định dạng JPG, PNG dưới 2MB).
                    </div>
                  </div>
                </div>

                {/* Section 2: Personal details */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-[#006590] uppercase tracking-wider border-b border-sky-100 pb-2">💼 THÔNG TIN CÁ NHÂN</h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-extrabold text-slate-500 mb-1.5">Họ & Tên <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        required
                        value={rmName}
                        onChange={(e) => setRmName(e.target.value)}
                        placeholder="Ví dụ: Nguyễn Minh Thảo"
                        className="w-full bg-slate-50 border border-slate-200 focus:border-[#006590] focus:ring-1 focus:ring-[#006590] rounded-xl px-4 py-2.5 text-xs outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-extrabold text-slate-500 mb-1.5">Giới tính</label>
                        <select
                          value={rmGender}
                          onChange={(e) => setRmGender(e.target.value as any)}
                          className="w-full bg-slate-50 border border-slate-200 focus:border-[#006590] focus:ring-1 focus:ring-[#006590] rounded-xl px-3 py-2.5 text-xs outline-none"
                        >
                          <option value="Nam">Nam</option>
                          <option value="Nữ">Nữ</option>
                          <option value="LGBT">LGBT</option>
                          <option value="Khác">Khác</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-xs font-extrabold text-slate-500 mb-1.5">Tuổi</label>
                        <input
                          type="number"
                          value={rmAge}
                          onChange={(e) => setRmAge(Number(e.target.value))}
                          placeholder="21"
                          className="w-full bg-slate-50 border border-slate-200 focus:border-[#006590] focus:ring-1 focus:ring-[#006590] rounded-xl px-3 py-2.5 text-xs outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-extrabold text-slate-500 mb-1.5">Nghề nghiệp / Vai trò</label>
                      <input
                        type="text"
                        value={rmRole}
                        onChange={(e) => setRmRole(e.target.value)}
                        placeholder="Ví dụ: Sinh viên, Chuyên viên IT"
                        className="w-full bg-slate-50 border border-slate-200 focus:border-[#006590] focus:ring-1 focus:ring-[#006590] rounded-xl px-4 py-2.5 text-xs outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-extrabold text-slate-500 mb-1.5">Khối ngành hoạt động</label>
                      <select
                        value={rmMajor}
                        onChange={(e) => setRmMajor(e.target.value as any)}
                        className="w-full bg-slate-50 border border-slate-200 focus:border-[#006590] focus:ring-1 focus:ring-[#006590] rounded-xl px-4 py-2.5 text-xs outline-none"
                      >
                        <option value="Khối Kinh tế">Khối Kinh tế</option>
                        <option value="Khối Kỹ thuật">Khối Kỹ thuật</option>
                        <option value="Khối Sư phạm">Khối Sư phạm</option>
                        <option value="Khối Y Dược">Khối Y Dược</option>
                        <option value="Khối Nghệ thuật">Khối Nghệ thuật</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Section 3: Roommate Location & Budget */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-[#006590] uppercase tracking-wider border-b border-sky-100 pb-2">📍 ĐỊA ĐIỂM & ĐIỀU KIỆN TÀI CHÍNH</h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-extrabold text-slate-500 mb-1.5">Khu vực Đà Nẵng</label>
                      <select
                        value={rmDistrict}
                        onChange={(e) => setRmDistrict(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 focus:border-[#006590] focus:ring-1 focus:ring-[#006590] rounded-xl px-4 py-2.5 text-xs outline-none"
                      >
                        <option value="Hải Châu">Quận Hải Châu</option>
                        <option value="Thanh Khê">Quận Thanh Khê</option>
                        <option value="Liên Chiểu">Quận Liên Chiểu</option>
                        <option value="Sơn Trà">Quận Sơn Trà</option>
                        <option value="Ngũ Hành Sơn">Quận Ngũ Hành Sơn</option>
                        <option value="Cẩm Lệ">Quận Cẩm Lệ</option>
                        <option value="Hòa Vang">Huyện Hòa Vang</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-extrabold text-slate-500 mb-1.5">Ngân sách tối đa (VND / tháng) <span className="text-red-500">*</span></label>
                      <input
                        type="number"
                        required
                        value={rmBudget}
                        onChange={(e) => setRmBudget(e.target.value)}
                        placeholder="Ví dụ: 2500000"
                        className="w-full bg-slate-50 border border-slate-200 focus:border-[#006590] focus:ring-1 focus:ring-[#006590] rounded-xl px-4 py-2.5 text-xs outline-none font-semibold text-[#006590]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-extrabold text-slate-500 mb-1.5">Địa chỉ cụ thể / Dự kiến ở loại hình nào</label>
                      <input
                        type="text"
                        value={rmAddress}
                        onChange={(e) => setRmAddress(e.target.value)}
                        placeholder="Ví dụ: Gần ĐH Duy Tân, 120 Điện Biên Phủ"
                        className="w-full bg-slate-50 border border-slate-200 focus:border-[#006590] focus:ring-1 focus:ring-[#006590] rounded-xl px-4 py-2.5 text-xs outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-extrabold text-slate-500 mb-1.5">Loại hình</label>
                        <select
                          value={rmType}
                          onChange={(e) => setRmType(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 focus:border-[#006590] focus:ring-1 focus:ring-[#006590] rounded-xl px-3 py-2.5 text-xs outline-none"
                        >
                          <option value="Phòng trọ">Phòng trọ</option>
                          <option value="Ký túc xá">Ký túc xá</option>
                          <option value="Căn hộ">Căn hộ</option>
                          <option value="Chung cư">Chung cư</option>
                          <option value="Homestay">Homestay</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-extrabold text-slate-500 mb-1.5">Tình trạng</label>
                        <select
                          value={rmStatus}
                          onChange={(e) => setRmStatus(e.target.value as any)}
                          className="w-full bg-slate-50 border border-slate-200 focus:border-[#006590] focus:ring-1 focus:ring-[#006590] rounded-xl px-3 py-2.5 text-xs outline-none"
                        >
                          <option value="Chưa có phòng">Chưa có phòng</option>
                          <option value="Đã có phòng">Đã có phòng</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 4: Contact details & Bio */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-[#006590] uppercase tracking-wider border-b border-sky-100 pb-2">📞 THÔNG TIN LIÊN HỆ & GIỚI THIỆU</h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-extrabold text-slate-500 mb-1.5">Số điện thoại <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        required
                        value={rmPhone}
                        onChange={(e) => setRmPhone(e.target.value)}
                        placeholder="Số zalo/SĐT liên hệ: 09xx xxx xxx"
                        className="w-full bg-slate-50 border border-slate-200 focus:border-[#006590] focus:ring-1 focus:ring-[#006590] rounded-xl px-4 py-2.5 text-xs outline-none font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-extrabold text-slate-500 mb-1.5">Thói quen nhanh (cách nhau bằng dấu phẩy)</label>
                      <input
                        type="text"
                        value={customTags}
                        onChange={(e) => setCustomTags(e.target.value)}
                        placeholder="Ví dụ: Không hút thuốc, Yêu mèo, Ngủ sớm"
                        className="w-full bg-slate-50 border border-slate-200 focus:border-[#006590] focus:ring-1 focus:ring-[#006590] rounded-xl px-4 py-2.5 text-xs outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-slate-500 mb-1.5">Mô tả bản thân & yêu cầu về roommate chung phòng</label>
                    <textarea
                      rows={4}
                      value={rmBio}
                      onChange={(e) => setRmBio(e.target.value)}
                      placeholder="Hãy kể một chút về bản thân như: Tần suất dọn vệ sinh, bạn có chấp nhận tụ tập bạn bè không, tính cách thích làm quen hay riêng tư..."
                      className="w-full bg-slate-50 border border-slate-200 focus:border-[#006590] focus:ring-1 focus:ring-[#006590] rounded-xl px-4 py-3 text-xs outline-none resize-none"
                    />
                  </div>
                </div>

                {/* Section 5: Lifestyle Detail metrics */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-[#006590] uppercase tracking-wider border-b border-sky-100 pb-2">⚡ THÓI QUEN SINH HOẠT THỜI GIAN BIỂU</h4>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 mb-1.5">🕐 GIỜ GIẤC</label>
                      <select
                        value={rmSleep}
                        onChange={(e) => setRmSleep(e.target.value as any)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs outline-none"
                      >
                        <option value="Bình thường">Bình thường</option>
                        <option value="Ngủ sớm">Ngủ sớm</option>
                        <option value="Cú đêm">Cú đêm</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-400 mb-1.5">🐶 THÚ CƯNG</label>
                      <select
                        value={rmPets}
                        onChange={(e) => setRmPets(e.target.value as any)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs outline-none"
                      >
                        <option value="Thoải mái">Thoải mái</option>
                        <option value="Yêu mèo">Yêu mèo</option>
                        <option value="Yêu chó">Yêu chó</option>
                        <option value="Không tiện nuôi">Không nuôi</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-400 mb-1.5">🚭 HÚT THUỐC</label>
                      <select
                        value={rmSmoke}
                        onChange={(e) => setRmSmoke(e.target.value as any)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs outline-none"
                      >
                        <option value="Không hút thuốc">Không hút</option>
                        <option value="Hút thuốc ngoài ban công">Ban công</option>
                        <option value="Không quan trọng">Bất kì</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-400 mb-1.5">🍳 NẤU ĂN</label>
                      <select
                        value={rmCook}
                        onChange={(e) => setRmCook(e.target.value as any)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs outline-none"
                      >
                        <option value="Đôi khi nấu">Đôi khi nấu</option>
                        <option value="Thích nấu ăn">Thích nấu</option>
                        <option value="Ăn ngoài">Ăn ngoài</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-400 mb-1.5">✨ VỆ SINH</label>
                      <select
                        value={rmNeatness}
                        onChange={(e) => setRmNeatness(e.target.value as any)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs outline-none"
                      >
                        <option value="Sạch sẽ">Sạch sẽ</option>
                        <option value="Ngăn nắp">Ngăn nắp</option>
                        <option value="Thoải mái">Thoải mái</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-400 mb-1.5">🧩 GIAO TIẾP</label>
                      <select
                        value={rmInteraction}
                        onChange={(e) => setRmInteraction(e.target.value as any)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs outline-none"
                      >
                        <option value="Cân bằng">Cân bằng</option>
                        <option value="Hướng nội">Hướng nội</option>
                        <option value="Hướng ngoại">Hướng ngoại</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-6 py-3 border border-slate-200 hover:bg-slate-50 font-bold rounded-full text-xs text-slate-500 duration-150 cursor-pointer"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    className="px-8 py-3 bg-[#006590] hover:bg-[#005176] font-extrabold rounded-full text-xs text-white duration-150 cursor-pointer shadow-md flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Đăng tin ngay
                  </button>
                </div>
              </form>
            )}

            {/* TAB CONTENT: 2. ROOM FOR RENT FORM */}
            {activeTab === "room" && (
              <form onSubmit={handleRoomSubmit} className="space-y-6">
                
                {/* Section 1: Choose stock Room images */}
                <div className="bg-slate-50/50 rounded-2xl border border-slate-100 p-4.5 space-y-3">
                  <div className="flex justify-between items-center flex-wrap gap-2">
                    <label className="text-xs font-extrabold uppercase tracking-wider text-slate-400 block">📸 Hình ảnh căn phòng</label>
                    <label className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-[#006590] hover:text-[#005176] rounded-full text-[11px] font-black shadow-xs duration-150">
                      <Upload className="h-3.5 w-3.5" />
                      <span>Tự tải ảnh thực tế căn phòng</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleRImageUpload}
                      />
                    </label>
                  </div>
                  <div className="flex flex-col gap-3">
                    <div className="w-full h-44 rounded-2xl border border-slate-200 overflow-hidden shadow-inner bg-white relative">
                      <img src={rImage} alt="Current Room preset" className="w-full h-full object-cover" />
                    </div>
                    <p className="text-[11px] text-slate-400 font-medium leading-normal">
                      Vui lòng bấm nút <strong className="text-[#006590]">"Tự tải ảnh thực tế căn phòng"</strong> bên trên để tải lên hình ảnh chân thật của căn phòng đang tìm bạn ở ghép.
                    </p>
                  </div>
                </div>

                {/* Section 2: Room specification details */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-[#006590] uppercase tracking-wider border-b border-sky-100 pb-2">🏠 THÔNG TIN CHI TIẾT PHÒNG TRỌ</h4>

                  <div>
                    <label className="block text-xs font-extrabold text-slate-500 mb-1.5">Tiêu đề tin đăng cho phòng trọ <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      required
                      value={rTitle}
                      onChange={(e) => setRTitle(e.target.value)}
                      placeholder="Ví dụ: Phòng trọ khép kín mới xây gần Đại học Bách Khoa, có điều hòa..."
                      className="w-full bg-slate-50 border border-slate-200 focus:border-[#006590] focus:ring-1 focus:ring-[#006590] rounded-xl px-4 py-2.5 text-xs outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-extrabold text-slate-500 mb-1.5">Giá phòng thuê / Tháng (VNĐ) <span className="text-red-500">*</span></label>
                      <input
                        type="number"
                        required
                        value={rPrice}
                        onChange={(e) => setRPrice(e.target.value)}
                        placeholder="Ví dụ: 3000000"
                        className="w-full bg-slate-50 border border-slate-200 focus:border-[#006590] focus:ring-1 focus:ring-[#006590] rounded-xl px-4 py-2.5 text-xs outline-none font-bold text-[#006590]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-extrabold text-slate-500 mb-1.5">Quận / Huyện Đà Nẵng</label>
                      <select
                        value={rDistrict}
                        onChange={(e) => setRDistrict(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 focus:border-[#006590] focus:ring-1 focus:ring-[#006590] rounded-xl px-4 py-2.5 text-xs outline-none"
                      >
                        <option value="Hải Châu">Quận Hải Châu</option>
                        <option value="Thanh Khê">Quận Thanh Khê</option>
                        <option value="Liên Chiểu">Quận Liên Chiểu</option>
                        <option value="Sơn Trà">Quận Sơn Trà</option>
                        <option value="Ngũ Hành Sơn">Quận Ngũ Hành Sơn</option>
                        <option value="Cẩm Lệ">Quận Cẩm Lệ</option>
                        <option value="Hòa Vang">Huyện Hòa Vang</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-extrabold text-slate-500 mb-1.5">Địa chỉ số nhà / Tên đường cụ thể <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        required
                        value={rAddress}
                        onChange={(e) => setRAddress(e.target.value)}
                        placeholder="Ví dụ: K34/12 Lê Duẩn"
                        className="w-full bg-slate-50 border border-slate-200 focus:border-[#006590] focus:ring-1 focus:ring-[#006590] rounded-xl px-4 py-2.5 text-xs outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-extrabold text-slate-500 mb-1.5">Loại hình</label>
                        <select
                          value={rType}
                          onChange={(e) => setRType(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 focus:border-[#006590] focus:ring-1 focus:ring-[#006590] rounded-xl px-3 py-2.5 text-xs outline-none"
                        >
                          <option value="Phòng trọ">Phòng trọ</option>
                          <option value="Ký túc xá">Ký túc xá</option>
                          <option value="Căn hộ">Căn hộ</option>
                          <option value="Chung cư">Chung cư</option>
                          <option value="Homestay">Homestay</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-extrabold text-slate-500 mb-1.5">Phòng ngủ</label>
                        <select
                          value={rBedrooms}
                          onChange={(e) => setRBedrooms(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 focus:border-[#006590] focus:ring-1 focus:ring-[#006590] rounded-xl px-3 py-2.5 text-xs outline-none"
                        >
                          <option value="1">1 phòng</option>
                          <option value="2">2 phòng</option>
                          <option value="3">3 phòng+</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-extrabold text-slate-500 mb-1.5">Mô tả phòng tắm & WC</label>
                      <input
                        type="text"
                        value={rWc}
                        onChange={(e) => setRWc(e.target.value)}
                        placeholder="Ví dụ: WC riêng khép kín, sạch sẽ"
                        className="w-full bg-slate-50 border border-slate-200 focus:border-[#006590] focus:ring-1 focus:ring-[#006590] rounded-xl px-4 py-2.5 text-xs outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-extrabold text-slate-500 mb-1.5">Mô tả khu vực nấu ăn</label>
                      <input
                        type="text"
                        value={rKitchen}
                        onChange={(e) => setRKitchen(e.target.value)}
                        placeholder="Phần nấu ăn: Bếp riêng, Bếp chung biệt lập..."
                        className="w-full bg-slate-50 border border-slate-200 focus:border-[#006590] focus:ring-1 focus:ring-[#006590] rounded-xl px-4 py-2.5 text-xs outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-extrabold text-slate-500 mb-1.5">Giá điện sinh hoạt</label>
                      <input
                        type="text"
                        value={rPriceElectricity}
                        onChange={(e) => setRPriceElectricity(e.target.value)}
                        placeholder="Ví dụ: 3.500d/kWh hoặc giá nhà nước"
                        className="w-full bg-slate-50 border border-slate-200 focus:border-[#006590] focus:ring-1 focus:ring-[#006590] rounded-xl px-4 py-2.5 text-xs outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-extrabold text-slate-500 mb-1.5">Giá nước sinh hoạt</label>
                      <input
                        type="text"
                        value={rPriceWater}
                        onChange={(e) => setRPriceWater(e.target.value)}
                        placeholder="Ví dụ: 10.000d/khối hoặc 50.000đ/tháng/người"
                        className="w-full bg-slate-50 border border-slate-200 focus:border-[#006590] focus:ring-1 focus:ring-[#006590] rounded-xl px-4 py-2.5 text-xs outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 3: Target Roommate requirements */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-[#006590] uppercase tracking-wider border-b border-sky-100 pb-2">👥 TIÊU CHUẨN TÌM BẠN Ở GHÉP CÙNG</h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-extrabold text-slate-500 mb-1.5">Giới tính bạn ở ghép mong muốn</label>
                      <select
                        value={rGenderTarget}
                        onChange={(e) => setRGenderTarget(e.target.value as any)}
                        className="w-full bg-slate-50 border border-slate-200 focus:border-[#006590] focus:ring-1 focus:ring-[#006590] rounded-xl px-4 py-2.5 text-xs outline-none"
                      >
                        <option value="Tất cả">Mọi giới tính (Tất cả)</option>
                        <option value="Nam">Nam</option>
                        <option value="Nữ">Nữ</option>
                        <option value="LGBT">LGBT</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-extrabold text-slate-500 mb-1.5">Quy định nuôi thú cưng</label>
                      <select
                        value={rPets}
                        onChange={(e) => setRPets(e.target.value as any)}
                        className="w-full bg-slate-50 border border-slate-200 focus:border-[#006590] focus:ring-1 focus:ring-[#006590] rounded-xl px-4 py-2.5 text-xs outline-none"
                      >
                        <option value="thoải mái">Cho nuôi thú cưng (Thoải mái)</option>
                        <option value="không cho nuôi">Nghiêm cấm cấm nuôi thú cưng</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-slate-500 mb-1.5">Mô tả cụ thể thói quen/yêu cầu roommate mong muốn</label>
                    <textarea
                      rows={3}
                      value={rRoommateInfo}
                      onChange={(e) => setRRoommateInfo(e.target.value)}
                      placeholder="Ý kiến của bạn về roommate của mình (Ví dụ: Thích gọn gàng, sòng phẳng, thấu hiểu, tôn trọng giấc ngủ của người còn lại)."
                      className="w-full bg-slate-50 border border-slate-200 focus:border-[#006590] focus:ring-1 focus:ring-[#006590] rounded-xl px-4 py-3 text-xs outline-none resize-none"
                    />
                  </div>

                  {/* Amenities switches */}
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black tracking-wide text-slate-400 uppercase">⚡️ TRANG BỊ TIỆN NGHI SẴN CÓ</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {Object.keys(rAmenities).map((key) => {
                        const amKey = key as keyof typeof rAmenities;
                        const labelsMap: Record<string, string> = {
                          dieuhoa: "Điều hòa lạnh",
                          maygiat: "Máy giặt dùng",
                          nhabep: "Khu vực bếp",
                          wifi: "Mạng internet wifi",
                          tulanh: "Bình tủ lạnh",
                          tv: "Có tivi",
                          baove: "Bảo an trực 24h",
                          baigieuxe: "Nhà để xe"
                        };
                        const active = rAmenities[amKey];
                        return (
                          <button
                            key={amKey}
                            type="button"
                            onClick={() => handleAmenityChange(amKey)}
                            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-[11px] font-extrabold duration-150 cursor-pointer ${
                              active
                                ? "bg-[#006590]/15 border-[#006590] text-[#006590]"
                                : "bg-slate-50 border-slate-150 text-slate-500 hover:bg-slate-100"
                            }`}
                          >
                            <span className={`w-3.5 h-3.5 rounded flex items-center justify-center border text-white ${
                              active ? "bg-[#006590] border-[#006590]" : "bg-white border-slate-300"
                            }`}>
                              {active && <Check className="h-2 w-2 stroke-[4px]" />}
                            </span>
                            {labelsMap[amKey]}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Section 4: Host profile info & Description */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-[#006590] uppercase tracking-wider border-b border-sky-100 pb-2">✏️ THÔNG TIN NGƯỜI ĐĂNG & MÔ TẢ PHÒNG</h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-extrabold text-slate-500 mb-1.5">Tên người đăng tin phòng trọ <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        required
                        value={rHostName}
                        onChange={(e) => setRHostName(e.target.value)}
                        placeholder="Họ tên của bạn (Ví dụ: Khánh Linh)"
                        className="w-full bg-slate-50 border border-slate-200 focus:border-[#006590] focus:ring-1 focus:ring-[#006590] rounded-xl px-4 py-2.5 text-xs outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-extrabold text-slate-500 mb-1.5">Họ tên/Vai trò</label>
                      <input
                        type="text"
                        value={rHostRole}
                        onChange={(e) => setRHostRole(e.target.value)}
                        placeholder="Ví dụ: Sinh viên Đại học / Chủ phòng trọ"
                        className="w-full bg-slate-50 border border-slate-200 focus:border-[#006590] focus:ring-1 focus:ring-[#006590] rounded-xl px-4 py-2.5 text-xs outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-extrabold text-slate-500 mb-1.5">Số điện thoại liên hệ trực tiếp <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        required
                        value={rPhone}
                        onChange={(e) => setRPhone(e.target.value)}
                        placeholder="Số zalo/SĐT liên lạc: 09xx xxx xxx"
                        className="w-full bg-slate-50 border border-slate-200 focus:border-[#006590] focus:ring-1 focus:ring-[#006590] rounded-xl px-4 py-2.5 text-xs outline-none font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-slate-500 mb-1.5">Mô tả đầy đủ chi tiết hơn về căn phòng</label>
                    <textarea
                      rows={3}
                      value={rDescription}
                      onChange={(e) => setRDescription(e.target.value)}
                      placeholder="Chúng mình cho thuê căn phòng rộng 25m2, có cửa sổ lớn đón gió, giờ giấc tự do không chung chủ, có kho giữ xe máy, tiền điện tính theo công tơ..."
                      className="w-full bg-slate-50 border border-slate-200 focus:border-[#006590] focus:ring-1 focus:ring-[#006590] rounded-xl px-4 py-3 text-xs outline-none resize-none"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-6 py-3 border border-slate-200 hover:bg-slate-50 font-bold rounded-full text-xs text-slate-500 duration-150 cursor-pointer"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    className="px-8 py-3 bg-[#006590] hover:bg-[#005176] font-extrabold rounded-full text-xs text-white duration-150 cursor-pointer shadow-md flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Đăng tin phòng trọ
                  </button>
                </div>
              </form>
            )}

          </div>
        )}

      </div>
    </div>
  );
}
