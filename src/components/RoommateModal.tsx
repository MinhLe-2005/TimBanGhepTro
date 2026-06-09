import { useState, useEffect } from "react";
import { X, CheckCircle2, MessageSquare, FileText, Heart, ShieldAlert, Sparkles, Smile, Bed, Dog, Shield, ChefHat, Moon, Compass, Star, MapPin, Ban, Eye, EyeOff } from "lucide-react";
import { Roommate } from "../types";
import { supabase } from "../lib/supabase";

interface RoommateModalProps {
  roommate: Roommate | null;
  onClose: () => void;
  onStartChat: (roommateId: string) => void;
  onStartAgreement: (roommateId: string) => void;
  compatibilityDetails?: {
    sleepMatch: boolean;
    petsMatch: boolean;
    smokeMatch: boolean;
    cookMatch: boolean;
    neatMatch: boolean;
  };
  onAddReview: (roommateId: string, review: { reviewerName: string; rating: number; comment: string; imageUrl?: string }) => void | boolean | Promise<boolean>;
  isOwnProfile?: boolean;
  onDeleteProfile?: (id: string) => void;
  hasChatWithRoommate?: boolean;
  isAdmin?: boolean;
}

export default function RoommateModal({
  roommate,
  onClose,
  onStartChat,
  onStartAgreement,
  compatibilityDetails = { sleepMatch: true, petsMatch: true, smokeMatch: true, cookMatch: true, neatMatch: true },
  onAddReview,
  isOwnProfile = false,
  onDeleteProfile,
  hasChatWithRoommate = false,
  isAdmin = false,
}: RoommateModalProps) {
  if (!roommate) return null;
  
  // Debug: Log received roommate data
  console.log('[RoommateModal] Received roommate data:', {
    id: roommate.id,
    name: roommate.name,
    budget: roommate.budget,
    bio: roommate.bio,
    phoneNumber: roommate.phoneNumber,
    lifestyle: roommate.lifestyle,
    is_listing: roommate.is_listing,
    postedBy: roommate.postedBy,
    hasBudget: !!roommate.budget,
    hasBio: !!roommate.bio,
    hasLifestyle: !!roommate.lifestyle,
    hasPhone: !!roommate.phoneNumber
  });

  const renderStars = (rating: number, sizeClass: string = "h-4 w-4") => {
    return (
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => {
          const starVal = i + 1;
          let fillPercent = 0;
          if (rating >= starVal) {
            fillPercent = 100;
          } else if (rating > i) {
            fillPercent = (rating - i) * 100;
          }

          return (
            <div key={i} className="relative text-slate-300 select-none">
              {/* Background empty star */}
              <Star className={`${sizeClass} text-slate-200`} />
              {/* Foreground filled star */}
              <div
                className="absolute top-0 left-0 overflow-hidden text-amber-500"
                style={{ width: `${fillPercent}%` }}
              >
                <Star className={`${sizeClass} fill-amber-400 text-amber-400`} />
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [privateNote, setPrivateNote] = useState("");
  const [isSavingNote, setIsSavingNote] = useState(false);

  // Block state
  const [isBlocked, setIsBlocked] = useState(false);
  // Phone reveal state
  const [phoneRevealed, setPhoneRevealed] = useState(false);
  const [showPhoneHint, setShowPhoneHint] = useState(false);
  // Agreement hint state
  const [showAgreementHint, setShowAgreementHint] = useState(false);

  useEffect(() => {
    if (roommate) {
      setPrivateNote(localStorage.getItem(`roommate_notes_${roommate.id}`) || "");
      // Load block state
      try {
        const blocked: string[] = JSON.parse(localStorage.getItem('roomiematch_blocked_users') || '[]');
        setIsBlocked(blocked.includes(roommate.id));
      } catch { setIsBlocked(false); }
      // Reset phone reveal on open
      setPhoneRevealed(false);
      setShowPhoneHint(false);
    }
  }, [roommate?.id]);

  useEffect(() => {
    if (isSavingNote) {
      const timer = setTimeout(() => setIsSavingNote(false), 1200);
      return () => clearTimeout(timer);
    }
  }, [isSavingNote]);

  const handlePrivateNoteChange = (text: string) => {
    setPrivateNote(text);
    if (roommate) {
      localStorage.setItem(`roommate_notes_${roommate.id}`, text);
      setIsSavingNote(true);
    }
  };

  const [newReviewerName, setNewReviewerName] = useState("");
  const [newComment, setNewComment] = useState("");
  const [newRating, setNewRating] = useState(5);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [formError, setFormError] = useState("");
  const [hasCompletedAgreement, setHasCompletedAgreement] = useState(false);
  const [checkingAgreement, setCheckingAgreement] = useState(true);

  // Check if current user has completed agreement with this roommate
  useEffect(() => {
    const checkAgreement = async () => {
      if (!roommate || isOwnProfile) {
        setCheckingAgreement(false);
        return;
      }

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setCheckingAgreement(false);
          return;
        }

        // Check if there's a completed agreement between current user and this roommate
        const { data, error } = await supabase
          .from('agreements')
          .select('id, status')
          .eq('status', 'completed')
          .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
          .or(`user1_id.eq.${roommate.postedBy || roommate.id},user2_id.eq.${roommate.postedBy || roommate.id}`)
          .limit(1);

        if (!error && data && data.length > 0) {
          setHasCompletedAgreement(true);
        }
      } catch (err) {
        console.error('[RoommateModal] Error checking agreement:', err);
      } finally {
        setCheckingAgreement(false);
      }
    };

    checkAgreement();
  }, [roommate, isOwnProfile]);

  const formatPrice = (price: number | undefined) => {
    if (!price || price === 0) return "Chưa cập nhật";
    return (price / 1000000).toFixed(1) + " triệu";
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if user has completed agreement first
    if (!hasCompletedAgreement) {
      setFormError(`Bạn cần hoàn thành hợp đồng với ${roommate.name} trước khi có thể đánh giá!`);
      return;
    }
    
    if (!newReviewerName.trim()) {
      setFormError("Vui lòng nhập tên của bạn!");
      return;
    }
    if (!newComment.trim()) {
      setFormError("Vui lòng viết nội dung bình luận!");
      return;
    }
    
    const success = await onAddReview(roommate.id, {
      reviewerName: newReviewerName.trim(),
      rating: newRating,
      comment: newComment.trim(),
      imageUrl: newImageUrl.trim() ? newImageUrl.trim() : undefined
    });

    if (success !== false) {
      // Reset Form
      setNewReviewerName("");
      setNewComment("");
      setNewRating(5);
      setNewImageUrl("");
      setFormError("");
    }
  };

  const averageRating = roommate.reviews && roommate.reviews.length > 0
    ? (roommate.reviews.reduce((sum, r) => sum + r.rating, 0) / roommate.reviews.length).toFixed(1)
    : "5.0";
  
  const reputationScore = roommate.reputationScore || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={onClose} />

      {/* Modal Wrapper */}
      <div className="relative w-full max-w-2xl z-10 animate-fade-in">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute -top-4 -right-2 sm:-right-4 w-11 h-11 rounded-full bg-white shadow-xl border border-gray-200 flex items-center justify-center text-slate-500 hover:text-slate-800 hover:scale-110 active:scale-95 duration-200 cursor-pointer z-50"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Scrollable Container */}
        <div className="bg-white rounded-[32px] shadow-2xl border border-gray-100 w-full max-h-[85vh] flex flex-col overflow-hidden">
          <div className="overflow-y-auto w-full h-full scrollbar-thin scrollbar-thumb-slate-200 hover:scrollbar-thumb-slate-300">
            <div className="p-6 sm:p-8">
          {/* Cover & Avatar Header */}
          <div className="relative bg-gradient-to-tr from-sky-50 to-[#f6fafe] rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row gap-6 sm:gap-8 items-center border border-slate-100 mb-6 mt-2 overflow-hidden shadow-sm">
          {/* Decorative background shapes */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-sky-200/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-indigo-200/20 rounded-full blur-3xl"></div>

          <div className="relative shrink-0 z-10">
            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full border-[5px] border-white overflow-hidden shadow-xl">
              <img
                src={roommate.avatar}
                alt={roommate.name}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            {/* Status indicator badge on the avatar */}
            <div className={`absolute bottom-1 right-2 w-7 h-7 rounded-full border-[3px] border-white flex items-center justify-center shadow-sm ${
              roommate.status === "Đã tìm được" ? "bg-red-500" : roommate.status === "Đang trao đổi" ? "bg-amber-500" : "bg-emerald-500"
            }`} title={roommate.status === "Đã tìm được" ? "Đã tìm được roommate" : roommate.status === "Đang trao đổi" ? "Đang trao đổi" : "Đang tìm roommate"}>
               {roommate.status === "Đã tìm được" ? <CheckCircle2 className="w-3.5 h-3.5 text-white" /> : roommate.status === "Đang trao đổi" ? <span className="text-[10px] font-black text-white">⇄</span> : <div className="w-2.5 h-2.5 bg-white rounded-full animate-pulse" />}
            </div>
          </div>

          <div className="text-center sm:text-left flex-grow z-10">
            <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-2.5 mb-2.5">
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-none text-center sm:text-left">
                {roommate.name}, {roommate.age}
              </h2>
              {roommate.isVerified && (
                <div className="inline-flex items-center gap-1.5 bg-blue-500 text-white px-2.5 py-1 rounded-lg shadow-sm shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                  <span className="text-[11px] font-bold uppercase tracking-wider whitespace-nowrap">Đã xác minh</span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-5 mx-auto sm:mx-0 max-w-lg">
               <div className="bg-white px-3.5 py-1.5 rounded-xl border-2 border-slate-100 shadow-sm text-[14px] text-slate-700 font-bold shrink-0">
                 {roommate.role}
               </div>
               <div className="bg-white px-3.5 py-1.5 rounded-xl border-2 border-slate-100 shadow-sm text-[14px] text-slate-700 font-bold flex items-center gap-1.5 text-left">
                 <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                 {roommate.location}
               </div>
            </div>

            {/* Quick Stats Row */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
              <div className="bg-white px-4 py-2.5 rounded-2xl border-2 border-slate-100 shadow-sm flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 text-base">💵</span>
                <div className="flex flex-col items-start pr-2">
                  <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider">Ngân sách tối đa</span>
                  <span className="text-[14px] font-black text-slate-800 leading-tight mt-0.5">{formatPrice(roommate.budget)}/tháng</span>
                </div>
              </div>
              <div className="bg-white px-4 py-2.5 rounded-2xl border-2 border-slate-100 shadow-sm flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 text-base">🛡️</span>
                <div className="flex flex-col items-start pr-2">
                  <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider">Mức uy tín</span>
                  <span className="text-[14px] font-black text-emerald-600 leading-tight mt-0.5">
                    {reputationScore > 0 ? `${reputationScore}% Tốt` : "Chưa đánh giá"}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Extended Stats Row */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-3">
              <div className="bg-white px-4 py-2.5 rounded-2xl border-2 border-slate-100 shadow-sm flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 text-base">🏫</span>
                <div className="flex flex-col items-start pr-2">
                  <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider">Trường học</span>
                  <span className="text-[13px] font-black text-slate-800 leading-tight mt-0.5">{roommate.school || (roommate as any).majorKhoidoi || "Không rõ"}</span>
                </div>
              </div>
              <div className="bg-white px-4 py-2.5 rounded-2xl border-2 border-slate-100 shadow-sm flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-pink-50 text-pink-600 flex items-center justify-center shrink-0 text-base">👥</span>
                <div className="flex flex-col items-start pr-2">
                  <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider">Giới tính</span>
                  <span className="text-[13px] font-black text-slate-800 leading-tight mt-0.5">{roommate.gender}</span>
                </div>
              </div>
              <div className="bg-white px-4 py-2.5 rounded-2xl border-2 border-slate-100 shadow-sm flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-cyan-50 text-cyan-600 flex items-center justify-center shrink-0 text-base">🏠</span>
                <div className="flex flex-col items-start pr-2">
                  <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider">Loại hình</span>
                  <span className="text-[13px] font-black text-slate-800 leading-tight mt-0.5">{roommate.type}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Body Content */}
        <div className="py-2 space-y-8">
          {/* Bio section */}
          <div>
            <div className="bg-white border-2 border-sky-100 p-5 sm:p-6 rounded-2xl relative shadow-sm mt-3">
              <div className="absolute -top-3 left-6 px-3 bg-[#006590] rounded-lg text-[10px] font-black uppercase text-white py-1 shadow-sm">
                GIỚI THIỆU & TIÊU CHÍ
              </div>
              <p className="text-[15px] font-bold text-slate-700 leading-relaxed italic pt-1">
                {roommate.bio && roommate.bio.trim() ? (
                  `"${roommate.bio}"`
                ) : (
                  <span className="text-slate-400">
                    Người dùng chưa cập nhật phần giới thiệu cá nhân.
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* AI Compatibility Meter */}
          <div className="bg-slate-900 rounded-[28px] p-6 sm:p-8 shadow-xl relative overflow-hidden">
            {/* Decorative background circle */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-[#006590] opacity-30 rounded-full blur-3xl"></div>
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-7 relative z-10 gap-4">
              <div>
                <span className="text-[17px] font-black text-white flex items-center gap-2 mb-1.5 tracking-tight">
                  <Sparkles className="h-5 w-5 text-amber-400 fill-amber-400" />
                  Chỉ số tương thích thông minh
                </span>
                <p className="text-[13px] text-slate-400 font-medium max-w-[280px]">
                  AI phân tích dựa trên 6 yếu tố cốt lõi về lối sống giữa bạn và {roommate.name}.
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-md border border-white/10 px-6 py-3 rounded-2xl shrink-0 flex items-center gap-2.5 shadow-inner">
                <span className="text-4xl font-black text-white">{roommate.matchScore}%</span>
                <span className="text-[10px] font-extrabold text-slate-300 uppercase leading-tight w-12 tracking-wider">Độ phù hợp</span>
              </div>
            </div>

            {/* Compatibility Bars grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 relative z-10">
              {[
                { label: "Ngủ nghỉ", match: compatibilityDetails.sleepMatch, icon: <Moon className="h-4 w-4" /> },
                { label: "Thú cưng", match: compatibilityDetails.petsMatch, icon: <Dog className="h-4 w-4" /> },
                { label: "Hút thuốc", match: compatibilityDetails.smokeMatch, icon: <Shield className="h-4 w-4" /> },
                { label: "Nấu ăn", match: compatibilityDetails.cookMatch, icon: <ChefHat className="h-4 w-4" /> }
              ].map((item, i) => (
                <div key={i} className="bg-white/5 border border-white/5 rounded-[16px] px-3.5 py-3 flex flex-col items-start gap-2 hover:bg-white/10 transition-colors duration-300">
                  <span className="text-slate-400 flex items-center gap-1.5 bg-slate-800 p-1.5 rounded-lg">
                    {item.icon}
                  </span>
                  <div>
                    <p className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">{item.label}</p>
                    <p className={`text-[13px] font-black mt-0.5 ${item.match ? "text-emerald-400" : "text-amber-400"}`}>
                      {item.match ? "Hợp nhau" : "Khác biệt"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Lifestyle specifics details list */}
          <div>
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <span className="w-4 h-0.5 bg-slate-300 rounded-full"></span> Chi tiết lối sống
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { label: "Ngủ nghỉ", value: roommate.lifestyle.sleep, icon: "🌙" },
                { label: "Thú cưng", value: roommate.lifestyle.pets, icon: "🐾" },
                { label: "Hút thuốc", value: roommate.lifestyle.smoke, icon: "🚭" },
                { label: "Nấu ăn", value: roommate.lifestyle.cook, icon: "🍳" },
                { label: "Tương tác", value: roommate.lifestyle.interaction, icon: "💬" },
                { label: "Vệ sinh", value: roommate.lifestyle.neatness, icon: "✨" },
              ].map((item, idx) => (
                <div key={idx} className="bg-white border-2 border-slate-100 p-3.5 rounded-[16px] flex items-center gap-3 shadow-sm hover:border-slate-300 transition-colors duration-300">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 text-[18px] border-2 border-slate-100">
                    {item.icon}
                  </div>
                  <div className="flex flex-col">
                    <p className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest mb-0.5">{item.label}</p>
                    <p className="text-[13px] font-black text-slate-800 leading-tight">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Private Notes Section - Local Storage only */}
          <div className="bg-indigo-50/50 border-2 border-indigo-100 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-black text-indigo-900 flex items-center gap-1.5 select-none animate-fade-in">
                <FileText className="h-4.5 w-4.5 text-indigo-600" />
                <span>Ghi chú cá nhân (Chỉ mình bạn thấy)</span>
              </h4>
              {isSavingNote && (
                <span className="text-[10px] text-emerald-600 font-extrabold bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200 animate-pulse">
                  ✓ Đã tự động lưu
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 leading-normal font-semibold">
              Lưu lại số phòng, thông tin liên lạc mở rộng, nhận xét riêng, lịch hẹn... Ghi chú này chỉ lưu trên thiết bị của bạn, tuyệt đối bảo mật và không ai khác có thể nhìn thấy.
            </p>
            <textarea
              rows={3}
              placeholder={`Nhập ghi chú cá nhân của bạn về ${roommate.name} tại đây...`}
              value={privateNote}
              onChange={(e) => handlePrivateNoteChange(e.target.value)}
              className="w-full bg-white border border-indigo-200/60 focus:border-indigo-500 rounded-xl px-4 py-3 text-sm text-slate-700 outline-none duration-250 resize-none font-medium shadow-inner"
            />
          </div>

          {/* Reviews Rating & Comments Section */}
          <div className="pt-6 border-t border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h4 className="text-sm font-black text-slate-800 tracking-tight flex items-center gap-2">
                <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
                Đánh giá từ roommate cũ
              </h4>
              <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                <span className="font-black text-slate-800">{averageRating}</span>
                {renderStars(parseFloat(averageRating), "h-4 w-4")}
                <span className="text-slate-500 text-xs font-bold">({(roommate.reviews || []).length} lượt)</span>
              </div>
            </div>

            {/* List of existing reviews */}
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin mb-8">
              {(roommate.reviews && roommate.reviews.length > 0) ? (
                roommate.reviews.map((rev) => (
                  <div key={rev.id} className="bg-white p-5 rounded-[20px] border border-slate-200/60 shadow-[0_2px_12px_rgba(0,0,0,0.02)] space-y-3 hover:border-slate-300 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3.5">
                        <img 
                          src={rev.reviewerAvatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop"} 
                          alt={rev.reviewerName} 
                          className="w-10 h-10 rounded-full object-cover border border-slate-100 shadow-sm"
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <p className="text-[14px] font-bold text-slate-800 leading-none mb-1.5">{rev.reviewerName}</p>
                          <p className="text-[11px] text-slate-400 font-semibold">{rev.createdAt}</p>
                        </div>
                      </div>
                      
                      {/* Star Rating display */}
                      <div className="bg-amber-50/50 px-2 py-1 rounded-lg">
                        {renderStars(rev.rating, "h-3.5 w-3.5")}
                      </div>
                    </div>
                    
                    <p className="text-[14px] text-slate-600 leading-relaxed font-medium">
                      {rev.comment}
                    </p>

                    {/* Review optional attached image */}
                    {rev.imageUrl && (
                      <div className="mt-3 relative inline-block rounded-xl overflow-hidden border border-slate-200 max-w-[200px] bg-slate-50">
                        <img 
                          src={rev.imageUrl} 
                          alt="Đính kèm từ người dùng" 
                          className="w-full max-h-[140px] object-cover hover:scale-105 transition-transform duration-300"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                             (e.target as HTMLImageElement).style.display = 'none';
                             (e.target as HTMLImageElement).parentElement!.style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <p className="text-slate-400 font-medium text-sm">Chưa có đánh giá nào từ roommate cũ cho người này.</p>
                </div>
              )}
            </div>

            {/* Submit new Review form - Only for users who completed agreement */}
            {(!isOwnProfile) && (
            <div>
              {checkingAgreement ? (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center">
                  <p className="text-sm text-slate-500 font-medium">Đang kiểm tra quyền đánh giá...</p>
                </div>
              ) : hasCompletedAgreement ? (
                <>
                  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 mb-4 flex items-start gap-3">
                    <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div className="flex-1">
                      <h5 className="text-sm font-bold text-emerald-900 mb-1">Bạn có thể đánh giá</h5>
                      <p className="text-xs text-emerald-700 leading-relaxed">
                        Bạn đã hoàn thành hợp đồng với {roommate.name}. Hãy chia sẻ trải nghiệm của bạn để giúp cộng đồng!
                      </p>
                    </div>
                  </div>
                  <form onSubmit={handleReviewSubmit} className="bg-gradient-to-br from-slate-50 to-white border border-slate-200 p-6 rounded-[24px] shadow-[0_2px_12px_rgba(0,0,0,0.02)] space-y-5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                  <Smile className="h-4 w-4 text-blue-600" />
                </div>
                <h5 className="text-[14px] font-black text-slate-800 tracking-tight">Viết đánh giá cho {roommate.name}</h5>
              </div>

              {/* Enter Name & Star rating in same row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">Tên của bạn</label>
                  <input 
                    type="text" 
                    placeholder="Nhập tên..." 
                    value={newReviewerName}
                    onChange={(e) => setNewReviewerName(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-[14px] font-medium text-slate-800 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">Xếp hạng của bạn</label>
                  <div className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-2 rounded-xl">
                    <div className="flex items-center">
                      {Array.from({ length: 5 }).map((_, i) => {
                        const starVal = i + 1;
                        const isFilled = hoverRating !== null ? starVal <= hoverRating : starVal <= newRating;
                        return (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setNewRating(starVal)}
                            onMouseEnter={() => setHoverRating(starVal)}
                            onMouseLeave={() => setHoverRating(null)}
                            className="p-1 transition-transform duration-100 hover:scale-125 active:scale-90 cursor-pointer outline-none"
                          >
                            <Star className={`h-6 w-6 ${isFilled ? "fill-amber-400 text-amber-400" : "text-slate-200"}`} />
                          </button>
                        );
                      })}
                    </div>
                    <div className="h-6 w-px bg-slate-200 mx-1"></div>
                    <span className="text-[14px] font-black text-amber-600">
                      {newRating}/5
                    </span>
                  </div>
                </div>
              </div>

              {/* Comment text */}
              <div>
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">Nội dung bình luận</label>
                <textarea 
                  rows={3}
                  placeholder="Nhập trải nghiệm thực tế khi ở ghép cùng người này..." 
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-[14px] font-medium text-slate-800 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all resize-none"
                />
              </div>

              {/* Submit triggers and messages */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                {formError ? (
                  <span className="text-[12px] font-bold text-red-600 bg-red-50 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4" /> {formError}
                  </span>
                ) : (
                  <span className="text-[12px] text-blue-600 font-bold flex items-center gap-1.5">
                    <Shield className="w-4 h-4" /> Đóng góp giúp cộng đồng an toàn hơn
                  </span>
                )}
                <button
                  type="submit"
                  className="w-full sm:w-auto bg-slate-900 hover:bg-blue-600 text-white py-3 px-8 rounded-xl font-bold text-[14px] transition-all duration-300 shadow-[0_4px_12px_rgba(0,0,0,0.1)] active:scale-95"
                >
                  Gửi đánh giá
                </button>
              </div>
            </form>
                </>
              ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex items-start gap-4">
                  <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                    <ShieldAlert className="h-5 w-5 text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <h5 className="text-sm font-bold text-amber-900 mb-2">Chưa thể đánh giá</h5>
                    <p className="text-xs text-amber-700 leading-relaxed mb-3">
                      Bạn cần hoàn thành hợp đồng ở ghép với {roommate.name} trước khi có thể viết đánh giá. Điều này đảm bảo tính xác thực và minh bạch cho cộng đồng RoomieMatch.
                    </p>
                    <button
                      onClick={() => onStartAgreement(roommate.id)}
                      className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-2"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      Tạo hợp đồng với {roommate.name}
                    </button>
                  </div>
                </div>
              )}
            </div>
            )}
          </div>
        </div>

        {/* Action Button Row */}
        <div className="flex flex-col gap-3 mt-8">
          {!isOwnProfile ? (
            <>
              {/* Phone number reveal button */}
              <div className="relative">
                {phoneRevealed ? (
                  <a
                    href={`tel:${(roommate.phoneNumber || "0987123456").replace(/\s/g, "")}`}
                    className="w-full bg-emerald-50 border-2 border-emerald-200 hover:border-emerald-300 hover:bg-emerald-100 text-emerald-700 py-3.5 px-6 rounded-2xl font-black transition-all duration-300 flex items-center justify-center gap-2 text-[15px] animate-fade-in"
                  >
                    📞 {roommate.phoneNumber || "0987 123 456"}
                  </a>
                ) : (
                  !isAdmin && (
                    <button
                      onClick={() => {
                        if (hasChatWithRoommate) {
                          setPhoneRevealed(true);
                          setShowPhoneHint(false);
                        } else {
                          setShowPhoneHint(true);
                          setTimeout(() => setShowPhoneHint(false), 3000);
                        }
                      }}
                      className="w-full bg-white border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 py-3.5 px-6 rounded-2xl font-black transition-all duration-200 flex items-center justify-center gap-2 text-[15px] relative overflow-hidden"
                    >
                      <Eye className="h-5 w-5" />
                      <span>Xem số điện thoại</span>
                      <span className="ml-2 text-slate-400 text-sm font-medium blur-sm select-none pointer-events-none">0987 *** ***</span>
                    </button>
                  )
                )}
                {showPhoneHint && !isAdmin && (
                  <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs font-bold px-4 py-2 rounded-xl whitespace-nowrap shadow-lg animate-fade-in z-50">
                    💬 Nhắn tin với {roommate.name} trước để xem số điện thoại
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
                  </div>
                )}
              </div>

              {!isAdmin && (
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => onStartChat(roommate.id)}
                    className="flex-1 bg-[#006590] hover:bg-[#005176] text-white py-3.5 px-6 rounded-2xl font-black shadow-lg shadow-sky-900/20 active:scale-95 transition-all duration-200 flex items-center justify-center gap-2 text-[15px]"
                  >
                    <MessageSquare className="h-5 w-5" />
                    Nhắn tin ngay
                  </button>
                  
                  {/* Show "View Listing" button if this person has a listing post */}
                  {roommate.is_listing && (
                    <button
                      onClick={() => {
                        // This modal is already showing the listing, so just scroll to top or show a hint
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 px-6 rounded-2xl font-black shadow-lg shadow-emerald-900/20 active:scale-95 transition-all duration-200 flex items-center justify-center gap-2 text-[15px]"
                      title="Bạn đang xem bài đăng này"
                    >
                      <Eye className="h-5 w-5" />
                      Đang xem bài đăng
                    </button>
                  )}
                </div>
              )}

              {!isAdmin && (
                <div className="relative">
                  <button
                    onClick={() => {
                      if (hasChatWithRoommate) {
                        onStartAgreement(roommate.id);
                      } else {
                        setShowAgreementHint(true);
                        setTimeout(() => setShowAgreementHint(false), 3000);
                      }
                    }}
                    className={`w-full py-3.5 px-6 rounded-2xl font-bold active:scale-95 transition-all duration-200 flex items-center justify-center gap-2 text-[15px] border ${
                      hasChatWithRoommate
                        ? 'bg-[#f6fafe] hover:bg-sky-100/80 text-[#006590] border-sky-100'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                    }`}
                  >
                    <FileText className="h-5 w-5" />
                    Tạo thỏa thuận sống chung
                  </button>
                  {showAgreementHint && (
                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs font-bold px-4 py-2 rounded-xl whitespace-nowrap shadow-lg animate-fade-in z-50">
                      💬 Nhắn tin với {roommate.name} trước để tạo thỏa thuận
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
                    </div>
                  )}
                </div>
              )}

              {/* Block / Unblock button */}
              {!isAdmin && (
                <button
                  onClick={async () => {
                    try {
                      const blocked: string[] = JSON.parse(localStorage.getItem('roomiematch_blocked_users') || '[]');
                      let updated: string[];
                      const willBlock = !isBlocked;
                      if (!willBlock) {
                        updated = blocked.filter(id => id !== roommate.id);
                      } else {
                        updated = [...blocked, roommate.id];
                      }
                      localStorage.setItem('roomiematch_blocked_users', JSON.stringify(updated));
                      setIsBlocked(!isBlocked);
                      
                      // Sync to Supabase chat so the partner knows
                      const { data: { session } } = await supabase.auth.getSession();
                      const myId = session?.user?.id;
                      if (myId) {
                        const partnerId = roommate.user_id || roommate.id;
                        const chatId = [myId, partnerId].sort().join('_');
                        await supabase.from('messages').insert({
                          id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                          chat_id: chatId,
                          sender_id: myId,
                          text: willBlock ? "[SYSTEM_BLOCK]" : "[SYSTEM_UNBLOCK]"
                        });
                      }
                    } catch (e) {
                       console.error('Lỗi khi thao tác chặn', e);
                    }
                  }}
                  className={`w-full py-3 px-6 rounded-2xl font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 border ${
                    isBlocked
                      ? 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      : 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100'
                  }`}
                >
                  <Ban className="h-4 w-4" />
                  {isBlocked ? 'Hủy chặn người dùng này' : `Chặn ${roommate.name}`}
                </button>
              )}
            </>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  const confirmMessage = roommate.is_listing 
                    ? "Bạn có chắc chắn muốn xóa tin đăng này? Hành động này không thể hoàn tác."
                    : "Bạn có chắc chắn muốn xóa hồ sơ này? Hành động này không thể hoàn tác.";
                  if (onDeleteProfile && window.confirm(confirmMessage)) {
                    onDeleteProfile(roommate.id);
                  }
                }}
                className="w-full bg-red-50 hover:bg-red-100 text-red-600 py-4 px-6 rounded-[16px] font-black active:scale-95 duration-200 text-center cursor-pointer text-[15px] border border-red-100"
              >
                {roommate.is_listing ? 'Xóa tin đăng' : 'Xóa hồ sơ'}
              </button>
              <button
                onClick={onClose}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-4 px-6 rounded-[16px] font-black active:scale-95 duration-200 text-center cursor-pointer text-[15px] border border-slate-200"
              >
                Đóng
              </button>
            </div>
          )}
        </div>
        </div>
        </div>
        </div>
      </div>
    </div>
  );
}
