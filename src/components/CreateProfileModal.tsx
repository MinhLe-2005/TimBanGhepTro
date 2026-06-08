import React, { useState, useRef } from "react";
import { X, Sparkles, Camera, CheckCircle2 } from "lucide-react";
import { supabase } from "../lib/supabase";

interface CreateProfileModalProps {
  onClose: () => void;
  onSave: (profile: any) => void;
  currentProfile: any;
  currentUser?: any;
}

export default function CreateProfileModal({
  onClose,
  onSave,
  currentProfile,
  currentUser,
}: CreateProfileModalProps) {
  const [name, setName] = useState(currentProfile?.name || "");
  const [age, setAge] = useState(currentProfile?.age || 21);
  const [gender, setGender] = useState(currentProfile?.gender || "Nữ");
  const [role, setRole] = useState(currentProfile?.role || "Sinh viên");
  const [location, setLocation] = useState(currentProfile?.location || "Hải Châu, Đà Nẵng");
  const [district, setDistrict] = useState(currentProfile?.district || "Hải Châu");
  const [type, setType] = useState(currentProfile?.type || "Phòng trọ");
  const [budget, setBudget] = useState(currentProfile?.budget || 3000000);
  const [phoneNumber, setPhoneNumber] = useState(currentProfile?.phoneNumber || "");
  const [bio, setBio] = useState(
    currentProfile?.bio ||
      "Mình là người hòa đồng, tôn trọng tính riêng tư và sạch sẽ. Thích một không gian sống yên tĩnh lành mạnh."
  );
  const [phoneNumber, setPhoneNumber] = useState(currentProfile?.phoneNumber || "");

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
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSaving(true);

    // Tạo profile object - luôn dùng auth UUID làm ID
    const profileId = currentUser?.id || currentProfile?.id || `rm-${Date.now()}`;
    
    console.log('[Profile] Creating/updating profile with ID:', profileId, 'auth_id:', currentUser?.id);
    
    const updatedProfile = {
      id: profileId,
      name,
      age: Number(age),
      role,
      avatar: selectedAvatar,
      location,
      district,
      type,
      budget: Number(budget),
      phoneNumber: phoneNumber.trim() || "Chưa cập nhật", // Add phone number
      bio,
      gender,
      isVerified: false,
      status,
      matchScore: 100, // Self is 100% matched
      reputationScore: 0, // FIX: Add missing reputationScore (required by database)
      tags: [sleep, neatness, smoke],
      lifestyle: {
        sleep,
        pets,
        smoke,
        cook,
        interaction,
        neatness,
      },
      createdAt: new Date().toISOString(), // FIX: Add createdAt timestamp
    };

    // Lưu vào Supabase roommates table (PRIMARY - vì App.tsx query từ đây)
    if (import.meta.env.VITE_SUPABASE_URL) {
      try {
        const { reviews, ...dbProfile } = updatedProfile as any;
        if (currentUser?.id) {
          dbProfile.user_id = currentUser.id;
          dbProfile.postedBy = currentUser.id;
        }
        
        // Mark as user profile (NOT a listing that can be deleted)
        dbProfile.is_listing = false;

        console.log('[Profile] 🔵 Attempting to save profile to roommates table...');
        console.log('[Profile] 🔵 Profile data:', JSON.stringify(dbProfile, null, 2));
        
        const { data, error } = await supabase.from('roommates').upsert(dbProfile).select();
        
        if (error) {
          console.error('[Profile] ❌ ERROR saving to roommates table:', error);
          console.error('[Profile] ❌ Error code:', error.code);
          console.error('[Profile] ❌ Error message:', error.message);
          console.error('[Profile] ❌ Error details:', error.details);
          console.error('[Profile] ❌ Error hint:', error.hint);
          alert(`Lỗi lưu profile: ${error.message}. Vui lòng chụp console gửi admin!`);
        } else {
          console.log('[Profile] ✅ Successfully saved to roommates table:', data);
        }
      } catch (err) {
        console.error('[Profile] ❌ Exception saving to roommates table:', err);
        alert(`Lỗi ngoại lệ: ${err}. Vui lòng chụp console gửi admin!`);
      }
      
      // ALSO save to profiles table for backup
      try {
        console.log('[Profile] 🔵 Also saving to profiles table (backup)...');
        
        const { data, error } = await supabase.from('profiles').upsert({
          id: profileId,
          auth_id: currentUser?.id,
          name,
          avatar: selectedAvatar,
          role,
          created_at: new Date().toISOString(),
        }).select();
        
        if (error) {
          console.error('[Profile] ⚠️ Error saving to profiles table (non-critical):', error);
        } else {
          console.log('[Profile] ✅ Also saved to profiles table:', data);
        }
      } catch (err) {
        console.error('[Profile] ⚠️ Exception saving to profiles table (non-critical):', err);
      }
    }

    // Giả lập thời gian lưu để có UX tốt hơn
    setTimeout(() => {
      onSave(updatedProfile);
      setIsSaving(false);
      setSaveSuccess(true);
      
      // Đóng modal sau khi hiện thông báo thành công 2s
      setTimeout(() => {
        onClose();
      }, 2000);
    }, 600);
  };

  if (saveSuccess) {
    return (
      <div className="fixed top-6 right-6 z-[100] bg-emerald-50 text-emerald-800 px-5 py-4 rounded-2xl shadow-xl shadow-slate-200/50 border border-emerald-100 flex items-center gap-3 animate-fade-in">
        <div className="bg-emerald-500 rounded-full p-1 text-white">
          <CheckCircle2 className="w-5 h-5" />
        </div>
        <span className="text-[14px] font-bold">Cập nhật hồ sơ thành công!</span>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-55 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={onClose} />

      {/* Global Saving Overlay */}
      {isSaving && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center bg-white/40 backdrop-blur-sm">
           <div className="bg-white p-5 rounded-2xl shadow-2xl flex flex-col items-center gap-3 animate-fade-in border border-slate-100">
             <div className="w-8 h-8 border-4 border-[#006590]/20 border-t-[#006590] rounded-full animate-spin"></div>
             <span className="text-[13px] font-bold text-[#006590]">Đang lưu dữ liệu...</span>
           </div>
        </div>
      )}

      {/* Modal Container */}
      <div className="relative bg-white rounded-[32px] shadow-2xl border border-gray-100 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col z-10 animate-fade-in">
        {/* Header */}
        <div className="flex justify-between items-center px-6 sm:px-8 py-6 border-b border-slate-100 shrink-0 bg-white z-20">
          <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-sky-50 flex items-center justify-center text-[#006590]">
                  <Sparkles className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">Hồ Sơ Cá Nhân</h3>
                  <p className="text-sm font-medium text-slate-500 mt-0.5">Cập nhật thông tin để thuật toán ghép đôi hiệu quả hơn.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800 duration-200 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
        {/* Scrollable Form */}
        <div className="overflow-y-auto flex-1 scrollbar-thin">
          <form id="profile-form" onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5 relative">
          
          {/* Avatar Section */}
          <div className="rounded-2xl border border-slate-150 bg-slate-50/50 p-5">
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4">Ảnh đại diện</p>
            <div className="flex items-center gap-5">
              <div className="relative shrink-0">
                <div className="w-20 h-20 rounded-full border-3 border-white overflow-hidden shadow-md ring-2 ring-[#006590]/20">
                  <img src={selectedAvatar} alt="Avatar" className="w-full h-full object-cover" />
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 bg-[#006590] text-white p-1.5 rounded-full border-2 border-white hover:bg-[#005176] duration-150 shadow cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
              </div>
              <div>
                <p className="text-[13px] font-semibold text-slate-700 mb-1">Chọn hoặc tải ảnh lên</p>
                <p className="text-[12px] text-slate-400 mb-3">Chọn nhanh ảnh mẫu bên dưới:</p>
                <div className="flex gap-2">
                  {avatars.map((url, idx) => (
                    <button key={idx} type="button" onClick={() => setSelectedAvatar(url)}
                      className={`w-9 h-9 rounded-full overflow-hidden border-2 duration-200 hover:scale-105 cursor-pointer ${
                        selectedAvatar === url ? "border-[#006590] scale-110 shadow-md" : "border-slate-200"
                      }`}>
                      <img src={url} alt={`Preset ${idx}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Basic Info */}
          <div className="rounded-2xl border border-slate-150 bg-white p-5 space-y-4">
            <div className="pb-3 border-b border-slate-100">
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Thông tin cá nhân</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-[13px] font-semibold text-slate-700">Họ &amp; Tên <span className="text-rose-500">*</span></label>
                <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Nhập tên của bạn..."
                  className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-[#006590] focus:ring-2 focus:ring-[#006590]/10 rounded-xl px-4 py-3 text-[14px] text-slate-800 outline-none transition-all placeholder:text-slate-300" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-[13px] font-semibold text-slate-700">Tuổi</label>
                  <input type="number" required min="16" max="40" value={age} onChange={(e) => setAge(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-[#006590] focus:ring-2 focus:ring-[#006590]/10 rounded-xl px-3 py-3 text-[14px] text-slate-800 outline-none transition-all" />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[13px] font-semibold text-slate-700">Giới tính</label>
                  <select value={gender} onChange={(e: any) => setGender(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-[#006590] focus:ring-2 focus:ring-[#006590]/10 rounded-xl px-3 py-3 text-[14px] text-slate-800 outline-none transition-all cursor-pointer">
                    <option value="Nữ">Nữ</option>
                    <option value="Nam">Nam</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[13px] font-semibold text-slate-700">Nghề nghiệp</label>
                <input type="text" required value={role} onChange={(e) => setRole(e.target.value)} placeholder="Sinh viên, Designer..."
                  className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-[#006590] focus:ring-2 focus:ring-[#006590]/10 rounded-xl px-4 py-3 text-[14px] text-slate-800 outline-none transition-all placeholder:text-slate-300" />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[13px] font-semibold text-slate-700">Quận / Huyện</label>
                <select value={district} onChange={(e) => setDistrict(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-[#006590] focus:ring-2 focus:ring-[#006590]/10 rounded-xl px-4 py-3 text-[14px] text-slate-800 outline-none transition-all cursor-pointer">
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
                <label className="block text-[13px] font-semibold text-slate-700">Loại phòng muốn ở</label>
                <select value={type} onChange={(e) => setType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-[#006590] focus:ring-2 focus:ring-[#006590]/10 rounded-xl px-4 py-3 text-[14px] text-slate-800 outline-none transition-all cursor-pointer">
                  <option value="Phòng trọ">Phòng trọ</option>
                  <option value="Ký túc xá">Ký túc xá</option>
                  <option value="Căn hộ">Căn hộ</option>
                  <option value="Chung cư">Chung cư</option>
                  <option value="Homestay">Homestay</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[13px] font-semibold text-slate-700">Địa chỉ chi tiết</label>
                <input type="text" required value={location} onChange={(e) => setLocation(e.target.value)} placeholder="120 Hùng Vương..."
                  className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-[#006590] focus:ring-2 focus:ring-[#006590]/10 rounded-xl px-4 py-3 text-[14px] text-slate-800 outline-none transition-all placeholder:text-slate-300" />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[13px] font-semibold text-slate-700">Ngân sách / tháng (VNĐ)</label>
                <input type="number" required step="500000" min="1000000" value={budget} onChange={(e) => setBudget(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-[#006590] focus:ring-2 focus:ring-[#006590]/10 rounded-xl px-4 py-3 text-[14px] font-bold text-[#006590] outline-none transition-all" />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[13px] font-semibold text-slate-700">Số điện thoại <span className="text-[11px] text-slate-400">(tùy chọn)</span></label>
                <input type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="0987 123 456"
                  className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-[#006590] focus:ring-2 focus:ring-[#006590]/10 rounded-xl px-4 py-3 text-[14px] text-slate-800 outline-none transition-all placeholder:text-slate-300" />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[13px] font-semibold text-slate-700">Trạng thái ghép đôi</label>
                <select value={status} onChange={(e: any) => setStatus(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-[#006590] focus:ring-2 focus:ring-[#006590]/10 rounded-xl px-4 py-3 text-[14px] text-slate-800 outline-none transition-all cursor-pointer">
                  <option value="chưa tìm được bạn">Chưa tìm được bạn</option>
                  <option value="đã tìm được bạn">Đã tìm được bạn</option>
                </select>
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <label className="block text-[13px] font-semibold text-slate-700">Bio / Lời nhắn</label>
                <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} placeholder="Nói ngắn gọn về sở thích và mong muốn tìm roommate..."
                  className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-[#006590] focus:ring-2 focus:ring-[#006590]/10 rounded-xl px-4 py-3 text-[14px] text-slate-800 outline-none transition-all resize-none placeholder:text-slate-300" />
              </div>
            </div>
          </div>

          {/* Lifestyle Section */}
          <div className="rounded-2xl border border-slate-150 bg-white p-5 space-y-4">
            <div className="pb-3 border-b border-slate-100">
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Phong cách sống</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { label: "Giờ giấc", value: sleep, setter: setSleep, options: ["Bình thường", "Ngủ sớm", "Cú đêm"] },
                { label: "Thú cưng", value: pets, setter: setPets, options: ["Thoải mái", "Yêu mèo", "Yêu chó", "Không tiện nuôi"] },
                { label: "Hút thuốc", value: smoke, setter: setSmoke, options: ["Không hút thuốc", "Hút thuốc ngoài ban công", "Không quan trọng"] },
                { label: "Nấu ăn", value: cook, setter: setCook, options: ["Đôi khi nấu", "Thích nấu ăn", "Ăn ngoài"] },
                { label: "Giao tiếp", value: interaction, setter: setInteraction, options: ["Cân bằng", "Hướng nội", "Hướng ngoại"] },
                { label: "Gọn gàng", value: neatness, setter: setNeatness, options: ["Sạch sẽ", "Ngăn nắp", "Thoải mái"] },
              ].map(({ label, value, setter, options }) => (
                <div key={label} className="space-y-1.5">
                  <label className="block text-[12px] font-bold text-slate-500 uppercase tracking-wide">{label}</label>
                  <select value={value} onChange={(e) => (setter as any)(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-[#006590] rounded-xl px-3 py-2.5 text-[13px] text-slate-700 outline-none cursor-pointer transition-all">
                    {options.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              ))}
            </div>
          </div>

          </form>
        </div>

        {/* Action Row */}
        <div className="px-6 sm:px-8 py-5 border-t border-slate-100 bg-white shrink-0 z-20 flex gap-3">
          <button type="button" onClick={onClose}
            className="flex-1 border border-slate-200 text-slate-500 py-3.5 rounded-xl font-semibold text-sm hover:bg-slate-50 hover:text-slate-700 duration-200 cursor-pointer text-center">
            Hủy bỏ
          </button>
          <button type="submit" form="profile-form" disabled={isSaving}
            className="flex-1 bg-[#006590] hover:bg-[#005176] text-white py-3.5 rounded-xl font-bold text-sm shadow-md duration-200 cursor-pointer text-center disabled:opacity-70 flex items-center justify-center gap-2">
            {isSaving ? "Đang lưu..." : "Lưu & Cập Nhật Hồ Sơ"}
          </button>
        </div>
      </div>
    </div>
  );
}
