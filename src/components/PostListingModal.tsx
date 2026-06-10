import React, { useState, useEffect } from "react";
import { X, User, Home, Plus, Briefcase, GraduationCap, DollarSign, Phone, MapPin, Hash, CheckSquare, Settings, Heart, Image, Check, Upload } from "lucide-react";
import { Roommate, Room } from "../types";
import { SCHOOLS_BY_DISTRICT } from "../data";

interface PostListingModalProps {
  onClose: () => void;
  isOpen?: boolean;
  onSubmitRoom?: (room: Room) => void;
  onSubmitRoommate?: (roommate: Roommate) => void;
  initialTab?: "roommate" | "room";
  currentProfile?: any;
  editingData?: any;
}

export default function PostListingModal({
  onClose,
  onSubmitRoom,
  onSubmitRoommate,
  initialTab = "roommate",
  currentProfile,
  editingData
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
  const [rmGender, setRmGender] = useState<"Nam" | "Nữ" | "Khác">("Nữ");
  const [rmRole, setRmRole] = useState("Sinh viên");
  const [rmSchool, setRmSchool] = useState<string>("ĐH Kinh tế (Ngũ Hành Sơn)");
  const [rmDistrict, setRmDistrict] = useState("Hải Châu");
  const [rmAddress, setRmAddress] = useState("");
  const [rmBudget, setRmBudget] = useState("");
  const [rmPhone, setRmPhone] = useState("");
  const [rmBio, setRmBio] = useState("");
  const [rmStatus, setRmStatus] = useState<"Đang tìm" | "Đang trao đổi" | "Đã tìm được">("Đang tìm");
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
  const [rStatus, setRStatus] = useState<"còn phòng" | "hết phòng">("còn phòng");
  const [rBedrooms, setRBedrooms] = useState("1");
  const [rWc, setRWc] = useState("Khép kín");
  const [rKitchen, setRKitchen] = useState("Bếp riêng");
  const [rPriceElectricity, setRPriceElectricity] = useState("3.500đ/kWh");
  const [rPriceWater, setRPriceWater] = useState("10.000đ/m3");
  const [rPets, setRPets] = useState<"thoải mái" | "không cho nuôi">("thoải mái");
  const [rGenderTarget, setRGenderTarget] = useState<"Nam" | "Nữ" | "Khác" | "Tất cả">("Tất cả");
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

  React.useEffect(() => {
    if (editingData) {
      if (initialTab === "roommate" || editingData.name) {
        setActiveTab("roommate");
        setRmName(editingData.name || "");
        setRmAge(editingData.age || 21);
        setRmGender(editingData.gender || "Nữ");
        setRmRole(editingData.role || "Sinh viên");
        setRmSchool(editingData.school || "ĐH Kinh tế (Ngũ Hành Sơn)");
        setRmDistrict(editingData.district || "Hải Châu");
        setRmAddress(editingData.location ? editingData.location.split(", Quận")[0] : "");
        setRmBudget(editingData.budget?.toString() || "");
        setRmPhone(editingData.phoneNumber || "");
        setRmBio(editingData.bio || "");
        setRmStatus(editingData.status || "Đang tìm");
        setRmAvatar(editingData.avatar || AVATAR_PRESETS[0]);
        setRmType(editingData.type || "Phòng trọ");
        if (editingData.lifestyle) {
          setRmSleep(editingData.lifestyle.sleep || "Bình thường");
          setRmPets(editingData.lifestyle.pets || "Thoải mái");
          setRmSmoke(editingData.lifestyle.smoke || "Không hút thuốc");
          setRmCook(editingData.lifestyle.cook || "Đôi khi nấu");
          setRmInteraction(editingData.lifestyle.interaction || "Cân bằng");
          setRmNeatness(editingData.lifestyle.neatness || "Sạch sẽ");
        }
        if (editingData.tags) {
          setCustomTags(editingData.tags.join(", "));
        }
      } else {
        setActiveTab("room");
        setRTitle(editingData.title || "");
        setRPrice(editingData.price?.toString() || "");
        setRDistrict(editingData.district || "Hải Châu");
        setRAddress(editingData.location ? editingData.location.split(", Quận")[0] : "");
        setRType(editingData.type || "Phòng trọ");
        setRStatus(editingData.status || "còn phòng");
        setRBedrooms(editingData.bedrooms?.toString() || "1");
        setRWc(editingData.wc || "Khép kín");
        setRKitchen(editingData.kitchen || "Bếp riêng");
        setRPriceElectricity(editingData.electricity || "3.500đ/kWh");
        setRPriceWater(editingData.water || "10.000đ/m3");
        setRPets(editingData.pets || "thoải mái");
        setRGenderTarget(editingData.gender || "Tất cả");
        setRPhone(editingData.phoneNumber || "");
        setRDescription(editingData.description || "");
        setRHostName(editingData.hostName || "");
        setRHostRole(editingData.hostRole || "Giảng viên / Sinh viên");
        setRRoommateInfo(editingData.roommateInfo || "");
        if (editingData.images && editingData.images.length > 0) {
          setRImage(editingData.images[0]);
        }
        if (editingData.features) {
          const feats = editingData.features as string[];
          setRAmenities({
            dieuhoa: feats.includes("Điều hòa"),
            maygiat: feats.includes("Máy giặt"),
            nhabep: feats.includes("Nhà bếp riêng"),
            wifi: feats.includes("Wifi cáp quang"),
            tulanh: feats.includes("Tủ lạnh riêng"),
            tv: feats.includes("Tivi"),
            baove: feats.includes("Bảo vệ 24/7"),
            baigieuxe: feats.includes("Bãi xe rộng rãi")
          });
        }
      }
    } else if (currentProfile) {
      setRmName(currentProfile.name || "");
      setRmGender(currentProfile.gender || "Nữ");
      setRmAvatar(currentProfile.avatar || AVATAR_PRESETS[0]);
      setRHostName(currentProfile.name || "");
      setRImage(currentProfile.avatar || ROOM_IMAGE_PRESETS[0]); // Use profile avatar as default room host avatar
    }
  }, [editingData, currentProfile, initialTab]);

  // When rmDistrict changes, default the school to the first one in the new district if the current school is not valid
  useEffect(() => {
    const allowedSchools = SCHOOLS_BY_DISTRICT[rmDistrict] || [];
    if (!allowedSchools.find(s => s.value === rmSchool)) {
      if (allowedSchools.length > 0) {
        setRmSchool(allowedSchools[0].value);
      }
    }
  }, [rmDistrict, rmSchool]);

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
      matchScore: 0,
      reputationScore: 0,
      tags: processedTags.length > 0 ? processedTags : ["Học tập tốt", "Thân thiện"],
      isVerified: false,
      status: rmStatus,
      bio: rmBio || `Chào cả nhà! Mình tên là ${rmName}. Mình đang hoạt động tại khu vực ${rmDistrict} Đà Nẵng và rất mong muốn tìm được một người bạn ở ghép chia sẻ chi phí, có lối sống lành mạnh, sạch sẽ.`,
      budget: Number(String(rmBudget).replace(/\D/g, "")),
      gender: rmGender,
      school: rmSchool,
      phoneNumber: rmPhone,
      is_listing: true, // ✅ CRITICAL: Mark as listing (can be deleted), not profile
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

    if (onSubmitRoommate) onSubmitRoommate(newRoommate);
    setSuccessMessage(editingData ? `Đã cập nhật bài Tìm bạn ở ghép cho ${rmName} thành công!` : `Đã đăng bài Tìm bạn ở ghép cho ${rmName} thành công lên cộng đồng RoomieMatch!`);
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
      price: Number(String(rPrice).replace(/\D/g, "")),
      location: `${rAddress}, Quận ${rDistrict}, Đà Nẵng`,
      district: rDistrict,
      type: rType,
      images: [rImage],
      features: selectedFeatures,
      isHot: true,
      status: rStatus,
      isVerifiedRoom: false,
      bedrooms: Number(rBedrooms),
      wc: rWc,
      kitchen: rKitchen,
      hostName: rHostName,
      hostAvatar: currentProfile?.avatar || AVATAR_PRESETS[0], // Use current user's avatar
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

    if (onSubmitRoom) onSubmitRoom(newRoom);
    setSuccessMessage(editingData ? `Đã cập nhật bài cho thuê / ghép phòng "${rTitle}" thành công!` : `Đã đăng bài cho thuê / ghép phòng "${rTitle}" thành công!`);
    setIsSuccess(true);
  };

  return (
    <div className="fixed inset-0 z-55 flex items-center justify-center p-4">
      {/* Backdrop with blur opacity */}
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={onClose} />

      {/* Main Container */}
      <div className="relative bg-white rounded-[32px] shadow-2xl border border-gray-100 w-full max-w-2xl max-h-[90vh] flex flex-col z-10 overflow-hidden animate-fade-in">
        
        {/* Close Button - Sticky at top right */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 w-10 h-10 rounded-full bg-slate-50 border border-slate-150 flex items-center justify-center text-slate-500 hover:text-slate-800 duration-150 cursor-pointer shadow-xs z-50"
        >
          <X className="h-4.5 w-4.5" />
        </button>

        {/* Scrollable Content */}
        <div className="overflow-y-auto scrollbar-thin p-6 sm:p-8 flex-1">

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
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">{editingData ? "Cập nhật bài viết" : "Đăng bài tin mới"}</h3>
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
              <form onSubmit={handleRoommateSubmit} className="space-y-5">
                
                {/* Section 1: Avatar */}
                <div className="rounded-2xl border border-slate-150 bg-slate-50/50 p-5">
                  <div className="flex justify-between items-center mb-4">
                    <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Ảnh đại diện</p>
                    <label className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-[#006590] hover:text-[#005176] rounded-full text-[11px] font-black shadow-sm duration-150">
                      <Upload className="h-3.5 w-3.5" />
                      <span>Tải ảnh cá nhân</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleRmAvatarUpload} />
                    </label>
                  </div>
                  <div className="flex gap-4 items-center">
                    <div className="w-16 h-16 rounded-full border-2 border-[#006590]/30 overflow-hidden shadow-sm bg-white shrink-0">
                      <img src={rmAvatar} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                    <p className="text-[12px] text-slate-400 leading-relaxed">
                      Bấm <strong className="text-[#006590]">"Tải ảnh cá nhân"</strong> để dùng ảnh thực tế của bạn (JPG, PNG &lt; 2MB).
                    </p>
                  </div>
                </div>

                {/* Section 2: Location & Budget */}
                <div className="rounded-2xl border border-slate-150 bg-white p-5 space-y-4">
                  <div className="pb-3 border-b border-slate-100">
                    <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Địa điểm &amp; Ngân sách</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-[13px] font-semibold text-slate-700">Khu vực Đà Nẵng</label>
                      <select value={rmDistrict} onChange={(e) => setRmDistrict(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-[#006590] focus:ring-2 focus:ring-[#006590]/10 rounded-xl px-4 py-3 text-[14px] outline-none text-slate-800 transition-all cursor-pointer">
                        <option value="Hải Châu">Quận Hải Châu</option>
                        <option value="Thanh Khê">Quận Thanh Khê</option>
                        <option value="Liên Chiểu">Quận Liên Chiểu</option>
                        <option value="Sơn Trà">Quận Sơn Trà</option>
                        <option value="Ngũ Hành Sơn">Quận Ngũ Hành Sơn</option>
                        <option value="Cẩm Lệ">Quận Cẩm Lệ</option>
                        <option value="Hòa Vang">Huyện Hòa Vang</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-[13px] font-semibold text-slate-700">Ngân sách tối đa / tháng <span className="text-rose-500">*</span></label>
                      <input type="number" required value={rmBudget} onChange={(e) => setRmBudget(e.target.value)} placeholder="VD: 2500000"
                        className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-[#006590] focus:ring-2 focus:ring-[#006590]/10 rounded-xl px-4 py-3 text-[14px] font-bold text-[#006590] outline-none transition-all placeholder:text-slate-300 placeholder:font-normal" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-[13px] font-semibold text-slate-700">Địa chỉ khu vực mong muốn</label>
                      <input type="text" value={rmAddress} onChange={(e) => setRmAddress(e.target.value)} placeholder="Gần ĐH Duy Tân, 120 Điện Biên Phủ..."
                        className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-[#006590] focus:ring-2 focus:ring-[#006590]/10 rounded-xl px-4 py-3 text-[14px] outline-none text-slate-800 transition-all placeholder:text-slate-300" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="block text-[13px] font-semibold text-slate-700">Loại hình</label>
                        <select value={rmType} onChange={(e) => setRmType(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-[#006590] focus:ring-2 focus:ring-[#006590]/10 rounded-xl px-3 py-3 text-[13px] outline-none text-slate-800 transition-all cursor-pointer">
                          <option value="Phòng trọ">Phòng trọ</option>
                          <option value="Ký túc xá">Ký túc xá</option>
                          <option value="Căn hộ">Căn hộ</option>
                          <option value="Chung cư">Chung cư</option>
                          <option value="Homestay">Homestay</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-[13px] font-semibold text-slate-700">Trạng thái ghép đôi</label>
                        <select value={rmStatus} onChange={(e) => setRmStatus(e.target.value as any)}
                          className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-[#006590] focus:ring-2 focus:ring-[#006590]/10 rounded-xl px-3 py-3 text-[13px] outline-none text-slate-800 transition-all cursor-pointer">
                          <option value="Đang tìm">Đang tìm roommate</option>
                          <option value="Đang trao đổi">Đang trao đổi với ai đó</option>
                          <option value="Đã tìm được">Đã tìm được roommate</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 3: Personal info */}
                <div className="rounded-2xl border border-slate-150 bg-white p-5 space-y-4">
                  <div className="pb-3 border-b border-slate-100">
                    <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Thông tin cá nhân</p>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-[13px] font-semibold text-slate-700">Họ &amp; Tên <span className="text-rose-500">*</span></label>
                      <input
                        type="text" required value={rmName} onChange={(e) => setRmName(e.target.value)}
                        placeholder="Ví dụ: Nguyễn Minh Thảo"
                        className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-[#006590] focus:ring-2 focus:ring-[#006590]/10 rounded-xl px-4 py-3 text-[14px] outline-none text-slate-800 transition-all placeholder:text-slate-300"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="block text-[13px] font-semibold text-slate-700">Giới tính</label>
                        <select value={rmGender} onChange={(e) => setRmGender(e.target.value as any)}
                          className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-[#006590] focus:ring-2 focus:ring-[#006590]/10 rounded-xl px-3 py-3 text-[14px] outline-none text-slate-800 transition-all cursor-pointer">
                          <option value="Nam">Nam</option>
                          <option value="Nữ">Nữ</option>
                          <option value="Khác">Khác</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-[13px] font-semibold text-slate-700">Tuổi</label>
                        <input type="number" value={rmAge} onChange={(e) => setRmAge(Number(e.target.value))} placeholder="21"
                          className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-[#006590] focus:ring-2 focus:ring-[#006590]/10 rounded-xl px-3 py-3 text-[14px] outline-none text-slate-800 transition-all" />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-[13px] font-semibold text-slate-700">Nghề nghiệp / Vai trò</label>
                      <input type="text" value={rmRole} onChange={(e) => setRmRole(e.target.value)} placeholder="Sinh viên, Nhân viên văn phòng..."
                        className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-[#006590] focus:ring-2 focus:ring-[#006590]/10 rounded-xl px-4 py-3 text-[14px] outline-none text-slate-800 transition-all placeholder:text-slate-300" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-[13px] font-semibold text-slate-700">Trường học</label>
                      <select value={rmSchool} onChange={(e) => setRmSchool(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-[#006590] focus:ring-2 focus:ring-[#006590]/10 rounded-xl px-4 py-3 text-[14px] outline-none text-slate-800 transition-all cursor-pointer">
                        {(SCHOOLS_BY_DISTRICT[rmDistrict] || []).map((school) => (
                          <option key={school.value} value={school.value}>
                            {school.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Section 4: Contact & Bio */}
                <div className="rounded-2xl border border-slate-150 bg-white p-5 space-y-4">
                  <div className="pb-3 border-b border-slate-100">
                    <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Liên hệ &amp; Giới thiệu</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-[13px] font-semibold text-slate-700">Số điện thoại <span className="text-rose-500">*</span></label>
                      <input type="text" required value={rmPhone} onChange={(e) => setRmPhone(e.target.value)} placeholder="09xx xxx xxx"
                        className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-[#006590] focus:ring-2 focus:ring-[#006590]/10 rounded-xl px-4 py-3 text-[14px] font-bold outline-none text-slate-800 transition-all placeholder:text-slate-300 placeholder:font-normal" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-[13px] font-semibold text-slate-700">Thói quen nhanh <span className="text-slate-400 font-normal text-[12px]">(cách bằng dấu phẩy)</span></label>
                      <input type="text" value={customTags} onChange={(e) => setCustomTags(e.target.value)} placeholder="Không hút thuốc, Yêu mèo, Ngủ sớm..."
                        className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-[#006590] focus:ring-2 focus:ring-[#006590]/10 rounded-xl px-4 py-3 text-[14px] outline-none text-slate-800 transition-all placeholder:text-slate-300" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[13px] font-semibold text-slate-700">Giới thiệu bản thân &amp; yêu cầu roommate</label>
                    <textarea rows={4} value={rmBio} onChange={(e) => setRmBio(e.target.value)}
                      placeholder="Kể một chút về bản thân: Tần suất dọn vệ sinh, có chấp nhận tụ tập bạn bè không, tính cách thích làm quen hay riêng tư..."
                      className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-[#006590] focus:ring-2 focus:ring-[#006590]/10 rounded-xl px-4 py-3 text-[14px] outline-none text-slate-800 resize-none transition-all placeholder:text-slate-300" />
                  </div>
                </div>

                {/* Section 5: Lifestyle */}
                <div className="rounded-2xl border border-slate-150 bg-white p-5 space-y-4">
                  <div className="pb-3 border-b border-slate-100">
                    <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Thói quen sinh hoạt</p>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {[
                      { label: "Giờ giấc", value: rmSleep, setter: setRmSleep, options: ["Bình thường", "Ngủ sớm", "Cú đêm"] },
                      { label: "Thú cưng", value: rmPets, setter: setRmPets, options: ["Thoải mái", "Yêu mèo", "Yêu chó", "Không nuôi"] },
                      { label: "Hút thuốc", value: rmSmoke, setter: setRmSmoke, options: ["Không hút thuốc", "Hút thuốc ngoài ban công", "Không quan trọng"] },
                      { label: "Nấu ăn", value: rmCook, setter: setRmCook, options: ["Đôi khi nấu", "Thích nấu ăn", "Ăn ngoài"] },
                      { label: "Vệ sinh", value: rmNeatness, setter: setRmNeatness, options: ["Sạch sẽ", "Ngăn nắp", "Thoải mái"] },
                      { label: "Giao tiếp", value: rmInteraction, setter: setRmInteraction, options: ["Cân bằng", "Hướng nội", "Hướng ngoại"] },
                    ].map(({ label, value, setter, options }) => (
                      <div key={label} className="space-y-1.5">
                        <label className="block text-[12px] font-bold text-slate-500 uppercase tracking-wide">{label}</label>
                        <select value={value} onChange={(e) => (setter as any)(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-[#006590] rounded-xl px-3 py-2.5 text-[13px] outline-none text-slate-700 cursor-pointer transition-all">
                          {options.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={onClose}
                    className="px-6 py-3 border border-slate-200 hover:bg-slate-50 font-semibold rounded-full text-sm text-slate-500 duration-150 cursor-pointer">
                    Hủy bỏ
                  </button>
                  <button type="submit"
                    className="px-8 py-3 bg-[#006590] hover:bg-[#005176] font-bold rounded-full text-sm text-white duration-150 cursor-pointer shadow-md flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    {editingData ? "Cập nhật tin" : "Đăng tin ngay"}
                  </button>
                </div>
              </form>
            )}

            {/* TAB CONTENT: 2. ROOM FOR RENT FORM */}
            {activeTab === "room" && (
              <form onSubmit={handleRoomSubmit} className="space-y-5">
                
                {/* Section 1: Room image */}
                <div className="rounded-2xl border border-slate-150 bg-slate-50/50 p-5">
                  <div className="flex justify-between items-center mb-4">
                    <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Hình ảnh căn phòng</p>
                    <label className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-[#006590] hover:text-[#005176] rounded-full text-[11px] font-black shadow-sm duration-150">
                      <Upload className="h-3.5 w-3.5" />
                      <span>Tải ảnh thực tế</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleRImageUpload} />
                    </label>
                  </div>
                  <div className="w-full h-44 rounded-2xl border border-slate-200 overflow-hidden bg-white mb-3">
                    <img src={rImage} alt="Room" className="w-full h-full object-cover" />
                  </div>
                  <p className="text-[12px] text-slate-400 leading-relaxed">
                    Bấm <strong className="text-[#006590]">"Tải ảnh thực tế"</strong> để dùng ảnh chân thật của căn phòng (JPG, PNG &lt; 3MB).
                  </p>
                </div>

                {/* Section 2: Room details */}
                <div className="rounded-2xl border border-slate-150 bg-white p-5 space-y-4">
                  <div className="pb-3 border-b border-slate-100">
                    <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Thông tin chi tiết phòng trọ</p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[13px] font-semibold text-slate-700">Tiêu đề tin đăng <span className="text-rose-500">*</span></label>
                    <input type="text" required value={rTitle} onChange={(e) => setRTitle(e.target.value)}
                      placeholder="VD: Phòng trọ khép kín mới xây gần Đại học Bách Khoa, có điều hòa..."
                      className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-[#006590] focus:ring-2 focus:ring-[#006590]/10 rounded-xl px-4 py-3 text-[14px] outline-none text-slate-800 transition-all placeholder:text-slate-300" />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-[13px] font-semibold text-slate-700">Giá thuê / tháng (VNĐ) <span className="text-rose-500">*</span></label>
                      <input type="number" required value={rPrice} onChange={(e) => setRPrice(e.target.value)} placeholder="VD: 3000000"
                        className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-[#006590] focus:ring-2 focus:ring-[#006590]/10 rounded-xl px-4 py-3 text-[14px] font-bold text-[#006590] outline-none transition-all placeholder:text-slate-300 placeholder:font-normal" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-[13px] font-semibold text-slate-700">Quận / Huyện</label>
                      <select value={rDistrict} onChange={(e) => setRDistrict(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-[#006590] focus:ring-2 focus:ring-[#006590]/10 rounded-xl px-4 py-3 text-[14px] outline-none text-slate-800 transition-all cursor-pointer">
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
                    <div className="space-y-1.5">
                      <label className="block text-[13px] font-semibold text-slate-700">Địa chỉ cụ thể <span className="text-rose-500">*</span></label>
                      <input type="text" required value={rAddress} onChange={(e) => setRAddress(e.target.value)} placeholder="VD: K34/12 Lê Duẩn"
                        className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-[#006590] focus:ring-2 focus:ring-[#006590]/10 rounded-xl px-4 py-3 text-[14px] outline-none text-slate-800 transition-all placeholder:text-slate-300" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-1.5">
                        <label className="block text-[13px] font-semibold text-slate-700">Loại hình</label>
                        <select value={rType} onChange={(e) => setRType(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-[#006590] rounded-xl px-3 py-3 text-[13px] outline-none text-slate-800 cursor-pointer transition-all">
                          <option value="Phòng trọ">Phòng trọ</option>
                          <option value="Ký túc xá">Ký túc xá</option>
                          <option value="Căn hộ">Căn hộ</option>
                          <option value="Chung cư">Chung cư</option>
                          <option value="Homestay">Homestay</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-[13px] font-semibold text-slate-700">Trạng thái phòng</label>
                        <select value={rStatus} onChange={(e) => setRStatus(e.target.value as any)}
                          className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-[#006590] rounded-xl px-3 py-3 text-[13px] outline-none text-slate-800 cursor-pointer transition-all">
                          <option value="còn phòng">Còn phòng trống</option>
                          <option value="hết phòng">Đã hết phòng / Đủ người</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-[13px] font-semibold text-slate-700">Phòng ngủ</label>
                        <select value={rBedrooms} onChange={(e) => setRBedrooms(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-[#006590] rounded-xl px-3 py-3 text-[13px] outline-none text-slate-800 cursor-pointer transition-all">
                          <option value="1">1 phòng</option>
                          <option value="2">2 phòng</option>
                          <option value="3">3 phòng+</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-[13px] font-semibold text-slate-700">Phòng tắm &amp; WC</label>
                      <input type="text" value={rWc} onChange={(e) => setRWc(e.target.value)} placeholder="WC riêng khép kín, sạch sẽ"
                        className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-[#006590] focus:ring-2 focus:ring-[#006590]/10 rounded-xl px-4 py-3 text-[14px] outline-none text-slate-800 transition-all placeholder:text-slate-300" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-[13px] font-semibold text-slate-700">Khu vực nấu ăn</label>
                      <input type="text" value={rKitchen} onChange={(e) => setRKitchen(e.target.value)} placeholder="Bếp riêng, Bếp chung biệt lập..."
                        className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-[#006590] focus:ring-2 focus:ring-[#006590]/10 rounded-xl px-4 py-3 text-[14px] outline-none text-slate-800 transition-all placeholder:text-slate-300" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-[13px] font-semibold text-slate-700">Giá điện sinh hoạt</label>
                      <input type="text" value={rPriceElectricity} onChange={(e) => setRPriceElectricity(e.target.value)} placeholder="3.500đ/kWh hoặc giá nhà nước"
                        className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-[#006590] focus:ring-2 focus:ring-[#006590]/10 rounded-xl px-4 py-3 text-[14px] outline-none text-slate-800 transition-all placeholder:text-slate-300" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-[13px] font-semibold text-slate-700">Giá nước sinh hoạt</label>
                      <input type="text" value={rPriceWater} onChange={(e) => setRPriceWater(e.target.value)} placeholder="10.000đ/m3 hoặc 50.000đ/người/tháng"
                        className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-[#006590] focus:ring-2 focus:ring-[#006590]/10 rounded-xl px-4 py-3 text-[14px] outline-none text-slate-800 transition-all placeholder:text-slate-300" />
                    </div>
                  </div>
                </div>

                {/* Section 3: Roommate criteria */}
                <div className="rounded-2xl border border-slate-150 bg-white p-5 space-y-4">
                  <div className="pb-3 border-b border-slate-100">
                    <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Tiêu chuẩn bạn ở ghép</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-[13px] font-semibold text-slate-700">Giới tính mong muốn</label>
                      <select value={rGenderTarget} onChange={(e) => setRGenderTarget(e.target.value as any)}
                        className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-[#006590] focus:ring-2 focus:ring-[#006590]/10 rounded-xl px-4 py-3 text-[14px] outline-none text-slate-800 transition-all cursor-pointer">
                        <option value="Tất cả">Mọi giới tính</option>
                        <option value="Nam">Nam</option>
                        <option value="Nữ">Nữ</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-[13px] font-semibold text-slate-700">Quy định thú cưng</label>
                      <select value={rPets} onChange={(e) => setRPets(e.target.value as any)}
                        className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-[#006590] focus:ring-2 focus:ring-[#006590]/10 rounded-xl px-4 py-3 text-[14px] outline-none text-slate-800 transition-all cursor-pointer">
                        <option value="thoải mái">Cho nuôi thú cưng</option>
                        <option value="không cho nuôi">Không cho nuôi</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[13px] font-semibold text-slate-700">Yêu cầu về roommate</label>
                    <textarea rows={3} value={rRoommateInfo} onChange={(e) => setRRoommateInfo(e.target.value)}
                      placeholder="Thích gọn gàng, sòng phẳng, thấu hiểu, tôn trọng giấc ngủ của người còn lại..."
                      className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-[#006590] focus:ring-2 focus:ring-[#006590]/10 rounded-xl px-4 py-3 text-[14px] outline-none text-slate-800 resize-none transition-all placeholder:text-slate-300" />
                  </div>

                  {/* Amenities */}
                  <div className="space-y-3">
                    <p className="text-[12px] font-bold text-slate-500 uppercase tracking-widest">Tiện nghi sẵn có</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {(Object.keys(rAmenities) as Array<keyof typeof rAmenities>).map((key) => {
                        const labelsMap: Record<string, string> = {
                          dieuhoa: "Điều hòa", maygiat: "Máy giặt", nhabep: "Khu bếp", wifi: "Wifi",
                          tulanh: "Tủ lạnh", tv: "Tivi", baove: "Bảo vệ 24h", baigieuxe: "Để xe"
                        };
                        const active = rAmenities[key];
                        return (
                          <button key={key} type="button" onClick={() => handleAmenityChange(key)}
                            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-[13px] font-semibold duration-150 cursor-pointer transition-all ${
                              active ? "bg-[#006590]/10 border-[#006590]/40 text-[#006590]" : "bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300"
                            }`}>
                            <span className={`w-4 h-4 rounded-md flex items-center justify-center border shrink-0 transition-all ${
                              active ? "bg-[#006590] border-[#006590]" : "bg-white border-slate-300"
                            }`}>
                              {active && <Check className="h-2.5 w-2.5 text-white stroke-[3px]" />}
                            </span>
                            {labelsMap[key]}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Section 4: Host info */}
                <div className="rounded-2xl border border-slate-150 bg-white p-5 space-y-4">
                  <div className="pb-3 border-b border-slate-100">
                    <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Thông tin người đăng &amp; mô tả phòng</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-[13px] font-semibold text-slate-700">Tên người đăng <span className="text-rose-500">*</span></label>
                      <input type="text" required value={rHostName} onChange={(e) => setRHostName(e.target.value)} placeholder="VD: Khánh Linh"
                        className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-[#006590] focus:ring-2 focus:ring-[#006590]/10 rounded-xl px-4 py-3 text-[14px] outline-none text-slate-800 transition-all placeholder:text-slate-300" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-[13px] font-semibold text-slate-700">Vai trò</label>
                      <input type="text" value={rHostRole} onChange={(e) => setRHostRole(e.target.value)} placeholder="Sinh viên / Chủ phòng trọ"
                        className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-[#006590] focus:ring-2 focus:ring-[#006590]/10 rounded-xl px-4 py-3 text-[14px] outline-none text-slate-800 transition-all placeholder:text-slate-300" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[13px] font-semibold text-slate-700">Số điện thoại liên hệ <span className="text-rose-500">*</span></label>
                    <input type="text" required value={rPhone} onChange={(e) => setRPhone(e.target.value)} placeholder="09xx xxx xxx"
                      className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-[#006590] focus:ring-2 focus:ring-[#006590]/10 rounded-xl px-4 py-3 text-[14px] font-bold outline-none text-slate-800 transition-all placeholder:text-slate-300 placeholder:font-normal" />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[13px] font-semibold text-slate-700">Mô tả chi tiết căn phòng</label>
                    <textarea rows={4} value={rDescription} onChange={(e) => setRDescription(e.target.value)}
                      placeholder="Phòng rộng 25m2, cửa sổ lớn đón gió, giờ giấc tự do không chung chủ, có kho giữ xe máy, tiền điện tính theo công tơ..."
                      className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-[#006590] focus:ring-2 focus:ring-[#006590]/10 rounded-xl px-4 py-3 text-[14px] outline-none text-slate-800 resize-none transition-all placeholder:text-slate-300" />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={onClose}
                    className="px-6 py-3 border border-slate-200 hover:bg-slate-50 font-semibold rounded-full text-sm text-slate-500 duration-150 cursor-pointer">
                    Hủy bỏ
                  </button>
                  <button type="submit"
                    className="px-8 py-3 bg-[#006590] hover:bg-[#005176] font-bold rounded-full text-sm text-white duration-150 cursor-pointer shadow-md flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    {editingData ? "Cập nhật tin phòng trọ" : "Đăng tin phòng trọ"}
                  </button>
                </div>
              </form>
            )}

          </div>
        )}

        </div>
      </div>
    </div>
  );
}
