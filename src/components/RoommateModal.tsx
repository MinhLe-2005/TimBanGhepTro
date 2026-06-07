import { useState, useEffect } from "react";
import { X, CheckCircle2, MessageSquare, FileText, Heart, ShieldAlert, Sparkles, Smile, Bed, Dog, Shield, ChefHat, Moon, Compass, Star } from "lucide-react";
import { Roommate } from "../types";

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
  onAddReview: (roommateId: string, review: { reviewerName: string; rating: number; comment: string; imageUrl?: string }) => void;
}

export default function RoommateModal({
  roommate,
  onClose,
  onStartChat,
  onStartAgreement,
  compatibilityDetails = { sleepMatch: true, petsMatch: true, smokeMatch: true, cookMatch: true, neatMatch: true },
  onAddReview,
}: RoommateModalProps) {
  if (!roommate) return null;

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

  useEffect(() => {
    if (roommate) {
      setPrivateNote(localStorage.getItem(`roommate_notes_${roommate.id}`) || "");
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

  const formatPrice = (price: number) => {
    return (price / 1000000).toFixed(1) + " triệu";
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReviewerName.trim()) {
      setFormError("Vui lòng nhập tên của bạn!");
      return;
    }
    if (!newComment.trim()) {
      setFormError("Vui lòng viết nội dung bình luận!");
      return;
    }
    
    onAddReview(roommate.id, {
      reviewerName: newReviewerName.trim(),
      rating: newRating,
      comment: newComment.trim(),
      imageUrl: newImageUrl.trim() ? newImageUrl.trim() : undefined
    });

    // Reset Form
    setNewReviewerName("");
    setNewComment("");
    setNewRating(5);
    setNewImageUrl("");
    setFormError("");
  };

  const averageRating = roommate.reviews && roommate.reviews.length > 0
    ? (roommate.reviews.reduce((sum, r) => sum + r.rating, 0) / roommate.reviews.length).toFixed(1)
    : "5.0";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={onClose} />

      {/* Modal Container */}
      <div className="relative bg-white rounded-[32px] shadow-2xl border border-gray-100 w-full max-w-2xl max-h-[90vh] overflow-y-auto z-10 animate-fade-in p-6 sm:p-8 scrollbar-thin">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 w-11 h-11 rounded-full bg-[#f6fafe] border border-gray-100 flex items-center justify-center text-slate-500 hover:text-slate-800 hover:scale-110 active:scale-95 duration-200 cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Top Header Row with Profile */}
        <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start pt-4 sm:pt-0 pb-6 border-b border-slate-100">
          <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full border-4 border-sky-100 overflow-hidden shadow-md shrink-0">
            <img
              src={roommate.avatar}
              alt={roommate.name}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>

          <div className="text-center sm:text-left flex-grow">
            <div className="flex flex-wrap items-center gap-2 mb-2 justify-center sm:justify-start">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0f172a] tracking-tight">
                {roommate.name}, {roommate.age}
              </h2>
              
              {/* Status Badge */}
              {roommate.status === "Đã có phòng" ? (
                <div className="flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full border border-emerald-100 self-center sm:self-auto">
                  <span className="text-[11px] font-bold">🏠 Đã có phòng</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 bg-purple-50 text-purple-700 px-2.5 py-0.5 rounded-full border border-purple-100 self-center sm:self-auto">
                  <span className="text-[11px] font-bold">🔍 Chưa có phòng</span>
                </div>
              )}
            </div>

            <p className="text-[15px] text-[#006590] font-semibold mb-3">
              {roommate.role} • {roommate.location}
            </p>

            {/* Badges row */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <div className="inline-flex items-center gap-1.5 bg-[#dff6ff] text-[#006590] px-4 py-1.5 rounded-full text-xs font-bold border border-sky-100">
                Ngân sách tối đa: {formatPrice(roommate.budget)}/tháng
              </div>
              <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 px-4 py-1.5 rounded-full text-xs font-bold border border-emerald-100 shadow-sm">
                📞 SĐT: {roommate.phoneNumber || "0987 654 321"}
              </div>
            </div>
          </div>
        </div>

        {/* Body Content */}
        <div className="py-6 space-y-6">
          {/* Bio section */}
          <div>
            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2.5">Giới thiệu bản thân</h4>
            <p className="text-slate-700 leading-relaxed font-normal bg-slate-50 p-4 rounded-2xl border border-slate-100">
              "{roommate.bio}"
            </p>
          </div>

          {/* AI Compatibility Meter */}
          <div className="bg-gradient-to-br from-sky-500/5 to-blue-600/10 rounded-2xl p-5 border border-sky-100/60">
            <div className="flex justify-between items-center mb-4">
              <span className="text-[15px] font-extrabold text-slate-700 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-sky-500 fill-sky-100" />
                Chỉ số tương thích thông minh
              </span>
              <span className="text-2xl font-black text-[#006590]">{roommate.matchScore}%</span>
            </div>

            {/* Compatibility Bars */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex justify-between items-center bg-white/70 px-4 py-2.5 rounded-xl text-sm border border-slate-100">
                <span className="text-slate-600 font-medium flex items-center gap-1.5">
                  <Moon className="h-4 w-4 text-sky-600" /> Giờ ngủ nghỉ
                </span>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${compatibilityDetails.sleepMatch ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                  {compatibilityDetails.sleepMatch ? "Hợp nhau" : "Khác biệt"}
                </span>
              </div>

              <div className="flex justify-between items-center bg-white/70 px-4 py-2.5 rounded-xl text-sm border border-slate-100">
                <span className="text-slate-600 font-medium flex items-center gap-1.5">
                  <Dog className="h-4 w-4 text-sky-600" /> Thú cưng
                </span>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${compatibilityDetails.petsMatch ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                  {compatibilityDetails.petsMatch ? "Hợp nhau" : "Khác biệt"}
                </span>
              </div>

              <div className="flex justify-between items-center bg-white/70 px-4 py-2.5 rounded-xl text-sm border border-slate-100">
                <span className="text-slate-600 font-medium flex items-center gap-1.5">
                  <Shield className="h-4 w-4 text-sky-600" /> Hút thuốc
                </span>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${compatibilityDetails.smokeMatch ? "bg-emerald-50 text-emerald-700" : "bg-red-550 bg-red-50 text-red-700"}`}>
                  {compatibilityDetails.smokeMatch ? "Hợp nhau" : "Khác biệt"}
                </span>
              </div>

              <div className="flex justify-between items-center bg-white/70 px-4 py-2.5 rounded-xl text-sm border border-slate-100">
                <span className="text-slate-600 font-medium flex items-center gap-1.5">
                  <ChefHat className="h-4 w-4 text-sky-600" /> Nấu ăn chung
                </span>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${compatibilityDetails.cookMatch ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                  {compatibilityDetails.cookMatch ? "Hợp nhau" : "Khác biệt"}
                </span>
              </div>
            </div>
          </div>

          {/* Lifestyle specifics details list */}
          <div>
            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Thói quen sinh hoạt</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl">
                <p className="text-[11px] text-slate-400 font-bold uppercase">Ngủ nghỉ</p>
                <p className="text-sm font-bold text-slate-700 mt-1">{roommate.lifestyle.sleep}</p>
              </div>
              <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl">
                <p className="text-[11px] text-slate-400 font-bold uppercase">Thú cưng</p>
                <p className="text-sm font-bold text-slate-700 mt-1">{roommate.lifestyle.pets}</p>
              </div>
              <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl">
                <p className="text-[11px] text-slate-400 font-bold uppercase">Hút thuốc</p>
                <p className="text-sm font-bold text-slate-700 mt-1">{roommate.lifestyle.smoke}</p>
              </div>
              <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl">
                <p className="text-[11px] text-slate-400 font-bold uppercase">Nấu ăn</p>
                <p className="text-sm font-bold text-slate-700 mt-1">{roommate.lifestyle.cook}</p>
              </div>
              <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl">
                <p className="text-[11px] text-slate-400 font-bold uppercase">Tương tác</p>
                <p className="text-sm font-bold text-slate-700 mt-1">{roommate.lifestyle.interaction}</p>
              </div>
              <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl">
                <p className="text-[11px] text-slate-400 font-bold uppercase">Mức dọn dẹp</p>
                <p className="text-sm font-bold text-slate-700 mt-1">{roommate.lifestyle.neatness}</p>
              </div>
            </div>
          </div>

          {/* Private Notes Section - Local Storage only */}
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-amber-800 flex items-center gap-1.5 select-none animate-fade-in">
                <span>📝 Ghi chú cá nhân (Chỉ mình bạn thấy)</span>
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
              className="w-full bg-white border border-amber-200/60 focus:border-amber-500 rounded-xl px-4 py-3 text-sm text-slate-700 outline-none duration-250 resize-none font-medium shadow-inner"
            />
          </div>

          {/* Reviews Rating & Comments Section */}
          <div className="pt-4 border-t border-slate-150">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
                Đánh giá từ roommate cũ
              </h4>
              <div className="flex items-center gap-2 bg-amber-50 text-amber-800 px-3 py-1.5 rounded-full text-xs border border-amber-100 shadow-sm">
                {renderStars(parseFloat(averageRating), "h-3.5 w-3.5")}
                <span className="font-extrabold font-mono">{averageRating} / 5.0</span>
                <span className="text-slate-400 font-medium">({(roommate.reviews || []).length} lượt)</span>
              </div>
            </div>

            {/* List of existing reviews */}
            <div className="space-y-4 max-h-[250px] overflow-y-auto pr-1 scrollbar-thin mb-6">
              {(roommate.reviews && roommate.reviews.length > 0) ? (
                roommate.reviews.map((rev) => (
                  <div key={rev.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img 
                          src={rev.reviewerAvatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop"} 
                          alt={rev.reviewerName} 
                          className="w-9 h-9 rounded-full object-cover border border-slate-250 border-slate-200"
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <p className="text-sm font-bold text-slate-800">{rev.reviewerName}</p>
                          <p className="text-[10px] text-slate-400 font-medium">{rev.createdAt}</p>
                        </div>
                      </div>
                      
                      {/* Star Rating display */}
                      <div>
                        {renderStars(rev.rating, "h-3.5 w-3.5")}
                      </div>
                    </div>
                    
                    <p className="text-sm text-slate-600 leading-normal font-normal">
                      {rev.comment}
                    </p>

                    {/* Review optional attached image */}
                    {rev.imageUrl && (
                      <div className="mt-2 relative inline-block rounded-xl overflow-hidden border border-slate-200 max-w-[180px] bg-white">
                        <img 
                          src={rev.imageUrl} 
                          alt="Đính kèm từ người dùng" 
                          className="w-full max-h-[120px] object-cover hover:scale-105 duration-200"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 text-sm">
                  Chưa có đánh giá nào từ roommate cũ cho người này.
                </div>
              )}
            </div>

            {/* Submit new Review form */}
            <form onSubmit={handleReviewSubmit} className="bg-sky-50/50 border border-sky-100/60 p-5 rounded-2xl space-y-4">
              <p className="text-xs font-extrabold text-[#006590] uppercase tracking-wider flex items-center gap-1.5">
                <Smile className="h-4 w-4" /> Viết đánh giá cho {roommate.name}
              </p>

              {/* Enter Name & Star rating in same row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Tên của bạn</label>
                  <input 
                    type="text" 
                    placeholder="Nhập tên..." 
                    value={newReviewerName}
                    onChange={(e) => setNewReviewerName(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 outline-none focus:border-[#006590] duration-200"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Xếp hạng của bạn</label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 bg-white border border-slate-200/80 p-2 rounded-xl">
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
                            className="p-1 transition-all duration-100 hover:scale-120 active:scale-90 focus:outline-none cursor-pointer"
                          >
                            <Star className={`h-6 w-6 ${isFilled ? "fill-amber-400 text-amber-400" : "text-slate-200"}`} />
                          </button>
                        );
                      })}
                      <span className="ml-2 text-xs font-extrabold text-amber-700 bg-amber-50 px-2 py-1 rounded-lg border border-amber-100 font-mono">
                        {newRating} / 5
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Comment text */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Nội dung bình luận</label>
                <textarea 
                  rows={2}
                  placeholder="Nhập trải nghiệm thực tế khi ở ghép cùng người này..." 
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-normal text-slate-700 outline-none focus:border-[#006590] duration-200 resize-none"
                />
              </div>

              {/* Photo attachment mock upload */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Ảnh minh họa (không bắt buộc)</label>
                <div className="flex flex-col sm:flex-row gap-3 items-stretch">
                  <input 
                    type="text" 
                    placeholder="Dán link ảnh hoặc chọn ảnh mẫu nhanh bên dưới..." 
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    className="flex-grow bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 outline-none focus:border-[#006590] duration-200"
                  />
                  
                  {/* Preset illustration triggers for easy selection */}
                  <div className="flex gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setNewImageUrl("https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=500&auto=format&fit=crop")}
                      className="bg-white border text-xs hover:border-sky-500 rounded-lg px-2 text-[10px] font-bold text-slate-500 text-center flex items-center justify-center"
                    >
                      🍳 Nấu ăn
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewImageUrl("https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?q=80&w=500&auto=format&fit=crop")}
                      className="bg-white border text-xs hover:border-sky-500 rounded-lg px-2 text-[10px] font-bold text-slate-500 text-center flex items-center justify-center"
                    >
                      🐱 Nuôi mèo
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewImageUrl("https://images.unsplash.com/photo-1513364776144-60967b0f800f?q=80&w=500&auto=format&fit=crop")}
                      className="bg-white border text-xs hover:border-sky-500 rounded-lg px-2 text-[10px] font-bold text-slate-500 text-center flex items-center justify-center"
                    >
                      🎨 Phòng ngủ
                    </button>
                  </div>
                </div>
                
                {newImageUrl && (
                  <div className="mt-2.5 relative inline-block rounded-xl overflow-hidden border border-slate-200 bg-white shadow-sm p-1">
                    <img src={newImageUrl} alt="Preview attachment" className="max-h-[60px] rounded-lg object-cover" />
                    <button 
                      type="button" 
                      onClick={() => setNewImageUrl("")}
                      className="absolute -top-1 -right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-[9px] font-bold"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>

              {/* Submit triggers and messages */}
              <div className="flex items-center justify-between pt-1">
                {formError ? (
                  <span className="text-[11px] font-bold text-red-500 bg-red-50 px-2.5 py-1 rounded-lg">
                    ⚠️ {formError}
                  </span>
                ) : (
                  <span className="text-[11px] text-[#006590] font-bold">
                    🛡️ Tăng điểm uy tín cho {roommate.name}!
                  </span>
                )}
                <button
                  type="submit"
                  className="bg-[#006590] hover:bg-[#005176] text-white py-2 px-5 rounded-full font-bold text-xs shadow-sm active:scale-95 duration-250 cursor-pointer shrink-0"
                >
                  Gửi đánh giá
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Action Button Row */}
        <div className="flex flex-col gap-3 pt-6 border-t border-slate-100">
          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href={`tel:${(roommate.phoneNumber || "0987123456").replace(/\s/g, "")}`}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 px-6 rounded-full font-bold shadow-md hover:shadow-emerald-900/15 active:scale-95 duration-200 flex items-center justify-center gap-2 cursor-pointer text-center text-sm"
            >
              📞 Gọi điện: {roommate.phoneNumber || "0987 123 456"}
            </a>

            <button
              onClick={() => onStartChat(roommate.id)}
              className="flex-1 bg-[#006590] hover:bg-[#005176] text-white py-3.5 px-6 rounded-full font-bold shadow-md hover:shadow-sky-900/10 active:scale-95 duration-200 flex items-center justify-center gap-2 cursor-pointer text-sm"
            >
              <MessageSquare className="h-5 w-5" />
              Bắt đầu Trò Chuyện
            </button>
          </div>

          <button
            onClick={() => onStartAgreement(roommate.id)}
            className="w-full bg-[#dff6ff] hover:bg-sky-200/80 text-[#006590] py-3.5 px-6 rounded-full font-bold active:scale-95 duration-200 flex items-center justify-center gap-2 cursor-pointer text-sm"
          >
            <FileText className="h-5 w-5" />
            Tạo thỏa thuận sống chung
          </button>
        </div>
      </div>
    </div>
  );
}
