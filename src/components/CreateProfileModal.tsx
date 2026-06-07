import React, { useState } from "react";
import { X, Sparkles, Smile, Bed, Clock, Award, Shield, User, Heart } from "lucide-react";

interface CreateProfileModalProps {
  onClose: () => void;
  onSave: (profile: any) => void;
  currentProfile: any;
}

export default function CreateProfileModal({
  onClose,
  onSave,
  currentProfile,
}: CreateProfileModalProps) {
  const [name, setName] = useState(currentProfile?.name || "");
  const [age, setAge] = useState(currentProfile?.age || 21);
  const [gender, setGender] = useState(currentProfile?.gender || "Nữ");
  const [role, setRole] = useState(currentProfile?.role || "Sinh viên");
  const [location, setLocation] = useState(currentProfile?.location || "Hải Châu, Đà Nẵng");
  const [district, setDistrict] = useState(currentProfile?.district || "Hải Châu");
  const [type, setType] = useState(currentProfile?.type || "Phòng trọ");
  const [budget, setBudget] = useState(currentProfile?.budget || 3000000);
  const [bio, setBio] = useState(
    currentProfile?.bio ||
      "Mình là người hòa đồng, tôn trọng tính riêng tư và sạch sẽ. Thích một không gian sống yên tĩnh lành mạnh."
  );

  // Lifestyle states
  const [sleep, setSleep] = useState<"Cú đêm" | "Ngủ sớm" | "Bình thường">(
    currentProfile?.lifestyle?.sleep || "Bình thường"
  );
  const [pets, setPets] = useState<"Yêu mèo" | "Yêu chó" | "Không tiện nuôi" | "Thoải mái">(
    currentProfile?.lifestyle?.pets || "Thoải mái"
  );
  const [smoke, setSmoke] = useState<"Không hút thuốc" | "Hút thuốc ngoài ban công" | "Không quan trọng">(
    currentProfile?.lifestyle?.smoke || "Không hút thuốc"
  );
  const [cook, setCook] = useState<"Thích nấu ăn" | "Ăn ngoài" | "Đôi khi nấu">(
    currentProfile?.lifestyle?.cook || "Đôi khi nấu"
  );
  const [interaction, setInteraction] = useState<"Hướng nội" | "Hướng ngoại" | "Cân bằng">(
    currentProfile?.lifestyle?.interaction || "Cân bằng"
  );
  const [neatness, setNeatness] = useState<"Ngăn nắp" | "Sạch sẽ" | "Thoải mái">(
    currentProfile?.lifestyle?.neatness || "Sạch sẽ"
  );

  // Avatar presets
  const avatars = [
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=150&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=150&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop",
  ];
  const [selectedAvatar, setSelectedAvatar] = useState(currentProfile?.avatar || avatars[4]);
  const [status, setStatus] = useState<"chưa tìm được bạn" | "đã tìm được bạn">(
    currentProfile?.status || "chưa tìm được bạn"
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const updatedProfile = {
      id: "me",
      name,
      age: Number(age),
      role,
      avatar: selectedAvatar,
      location,
      district,
      type,
      budget: Number(budget),
      bio,
      gender,
      isVerified: false,
      status,
      matchScore: 100, // Self is 100% matched
      tags: [sleep, neatness, smoke],
      lifestyle: {
        sleep,
        pets,
        smoke,
        cook,
        interaction,
        neatness,
      },
    };
    onSave(updatedProfile);
  };

  return (
    <div className="fixed inset-0 z-55 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={onClose} />

      {/* Modal Container */}
      <div className="relative bg-white rounded-[32px] shadow-2xl border border-gray-100 w-full max-w-2xl max-h-[90vh] overflow-y-auto z-10 animate-fade-in p-6 sm:p-8">
        {/* Header */}
        <div className="flex justify-between items-center pb-4 border-b border-slate-100 mb-6">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-sky-50 rounded-xl text-[#006590]">
              <Sparkles className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-xl font-extrabold text-[#0f172a] tracking-tight">Cài đặt Hồ Sơ Cá Nhân</h3>
              <p className="text-xs text-slate-500">Cập nhật thông tin và thói quen để thuật toán ghép đôi hoạt động chính xác.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800 duration-200 cursor-pointer"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar Selection */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-3">Chọn ảnh đại diện của bạn</label>
            <div className="flex flex-wrap gap-4 items-center">
              <div className="w-16 h-16 rounded-full border-2 border-[#006590]/60 overflow-hidden shadow-sm">
                <img src={selectedAvatar} alt="Current selected" className="w-full h-full object-cover" />
              </div>
              <div className="flex gap-2">
                {avatars.map((url, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedAvatar(url)}
                    className={`w-11 h-11 rounded-full overflow-hidden border-2 duration-200 hover:scale-105 ${
                      selectedAvatar === url ? "border-[#006590] scale-105 shadow-md" : "border-slate-200"
                    }`}
                  >
                    <img src={url} alt={`Preset ${idx}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Basic Info input grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Họ và Tên</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nhập tên của bạn..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:border-[#006590] focus:ring-1 focus:ring-[#006590] outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Tuổi</label>
                <input
                  type="number"
                  required
                  min="16"
                  max="40"
                  value={age}
                  onChange={(e) => setAge(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:border-[#006590] focus:ring-1 focus:ring-[#006590] outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Giới tính</label>
                <select
                  value={gender}
                  onChange={(e: any) => setGender(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:border-[#006590] focus:ring-1 focus:ring-[#006590] outline-none"
                >
                  <option value="Nữ">Nữ</option>
                  <option value="Nam">Nam</option>
                  <option value="LGBT">LGBT</option>
                  <option value="Khác">Khác</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Vai trò / Nghề nghiệp</label>
              <input
                type="text"
                required
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="Ví dụ: Sinh viên, Designer, IT..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:border-[#006590] focus:ring-1 focus:ring-[#006590] outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">📍 Quận / Huyện (Đà Nẵng)</label>
              <select
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:border-[#006590] focus:ring-1 focus:ring-[#006590] outline-none"
              >
                <option value="Hải Châu">Hải Châu</option>
                <option value="Thanh Khê">Thanh Khê</option>
                <option value="Liên Chiểu">Liên Chiểu</option>
                <option value="Sơn Trà">Sơn Trà</option>
                <option value="Ngũ Hành Sơn">Ngũ Hành Sơn</option>
                <option value="Cẩm Lệ">Cẩm Lệ</option>
                <option value="Hòa Vang">Hòa Vang</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">🏠 Loại hình phòng muốn ở</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:border-[#006590] focus:ring-1 focus:ring-[#006590] outline-none"
              >
                <option value="Phòng trọ">Phòng trọ</option>
                <option value="Ký túc xá">Ký túc xá</option>
                <option value="Căn hộ">Căn hộ</option>
                <option value="Chung cư">Chung cư</option>
                <option value="Homestay">Homestay</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">📝 Địa chỉ chi tiết / Mô tả nơi ở</label>
              <input
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Ví dụ: 120 Hùng Vương, Hải Châu hoặc FPT City..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:border-[#006590] focus:ring-1 focus:ring-[#006590] outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Ngân sách tối đa (VND / tháng)</label>
              <input
                type="number"
                required
                step="500000"
                min="1000000"
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:border-[#006590] focus:ring-1 focus:ring-[#006590] outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Lời nhắn / Bio bản thân</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={2}
                placeholder="Nói ngắn gọn về sở thích và mong muốn tìm roommate..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:border-[#006590] focus:ring-1 focus:ring-[#006590] outline-none resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">🔍 Trạng thái ghép đôi</label>
              <select
                value={status}
                onChange={(e: any) => setStatus(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:border-[#006590] focus:ring-1 focus:ring-[#006590] outline-none"
              >
                <option value="chưa tìm được bạn">🔍 Chưa tìm được bạn</option>
                <option value="đã tìm được bạn">🔒 Đã tìm được bạn</option>
              </select>
            </div>
          </div>

          {/* Lifestyle Preferences Title */}
          <div className="pt-4 border-t border-slate-100">
            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Khảo sát phong cách sống</h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">⏰ GIỜ GIẤC NGỦ NGHỈ</label>
                <select
                  value={sleep}
                  onChange={(e: any) => setSleep(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none"
                >
                  <option value="Bình thường">Bình thường</option>
                  <option value="Ngủ sớm">Ngủ sớm</option>
                  <option value="Cú đêm">Cú đêm</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">🐾 THÁI ĐỘ THÚ CƯNG</label>
                <select
                  value={pets}
                  onChange={(e: any) => setPets(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none"
                >
                  <option value="Thoải mái">Thoải mái</option>
                  <option value="Yêu mèo">Yêu mèo</option>
                  <option value="Yêu chó">Yêu chó</option>
                  <option value="Không tiện nuôi">Không dắt thú cưng về</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">🚬 THÓI QUEN HÚT THUỐC</label>
                <select
                  value={smoke}
                  onChange={(e: any) => setSmoke(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none"
                >
                  <option value="Không hút thuốc">Không hút thuốc</option>
                  <option value="Hút thuốc ngoài ban công">Hút thuốc ngoài ban công</option>
                  <option value="Không quan trọng">Không quan trọng</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">🍳 THÓI QUEN NẤU ĂN</label>
                <select
                  value={cook}
                  onChange={(e: any) => setCook(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none"
                >
                  <option value="Đôi khi nấu">Đôi khi nấu</option>
                  <option value="Thích nấu ăn">Thích nấu ăn (thường xuyên)</option>
                  <option value="Ăn ngoài">Ăn ngoài là chính</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">💬 GIAO TIẾP XÃ HỘI</label>
                <select
                  value={interaction}
                  onChange={(e: any) => setInteraction(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none"
                >
                  <option value="Cân bằng">Cân bằng</option>
                  <option value="Hướng nội">Hướng nội (ít tương tác)</option>
                  <option value="Hướng ngoại">Hướng ngoại (hay tụ tập kể chuyện)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">🧹 CHỈ SỐ GỌN GÀNG SẠCH SẼ</label>
                <select
                  value={neatness}
                  onChange={(e: any) => setNeatness(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none"
                >
                  <option value="Sạch sẽ">Sạch sẽ (dọn dẹp thường xuyên)</option>
                  <option value="Ngăn nắp">Ngăn nắp (mọi thứ quy củ)</option>
                  <option value="Thoải mái">Thoải mái (tự do gọn gàng khi rảnh)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex gap-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-slate-200 text-slate-500 py-3 rounded-xl font-bold hover:bg-slate-50 duration-200 cursor-pointer text-center"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="flex-1 bg-[#006590] hover:bg-[#005176] text-white py-3 rounded-xl font-bold shadow-md hover:shadow-lg duration-200 cursor-pointer text-center"
            >
              Lưu & Cập Nhật Hồ Sơ
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
