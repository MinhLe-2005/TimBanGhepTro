import { useState, useEffect } from "react";
import { X, Flame, Shield, MapPin, Bed, Bath, User, MessageSquare, Handshake, Check, Info, Star, Upload, Trash2, Moon, Dog, ChefHat, Compass, Sparkles, Heart, CheckCircle2, Smile, FileText } from "lucide-react";
import { Room, Roommate } from "../types";

interface RoomModalProps {
  room: Room | null;
  onClose: () => void;
  onInquire: (hostName: string) => void;
  onAddReview?: (roomId: string, review: { reviewerName: string; rating: number; comment: string; images: string[] }) => void;
  roommates?: Roommate[];
}

export default function RoomModal({ room, onClose, onInquire, onAddReview, roommates = [] }: RoomModalProps) {
  if (!room) return null;

  const hostRoommate = roommates.find(
    (r) => r.name.toLowerCase() === room.hostName.toLowerCase()
  ) || roommates.find(
    (r) => r.name.toLowerCase().includes(room.hostName.toLowerCase()) || room.hostName.toLowerCase().includes(r.name.toLowerCase())
  );

  const resolvedRoommate: Roommate = hostRoommate || {
    id: "fallback-host",
    name: room.hostName || "Chủ phòng",
    age: 21,
    role: room.hostRole || "Sinh viên / Thành viên",
    majorKhoidoi: "Khối Kinh tế",
    phoneNumber: room.phoneNumber || "0987 123 456",
    avatar: room.hostAvatar || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=150&auto=format&fit=crop",
    status: "Đã có phòng",
    location: room.location,
    matchScore: 88,
    reputationScore: 96,
    tags: room.habits || ["Sạch sẽ", "Không hút thuốc", "Tôn trọng"],
    isVerified: true,
    bio: room.roommateInfo || "Chào bạn! Mình là người đăng tin tìm bạn ở ghép cho căn phòng này. Mình thích giữ không gian sạch sẽ, thân thiện, tôn trọng giờ giấc nghỉ ngơi của nhau.",
    budget: room.price,
    gender: room.gender === "Tất cả" ? "Nữ" : (room.gender as any || "Nữ"),
    lifestyle: {
      sleep: "Bình thường",
      pets: room.pets === "thoải mái" ? "Thoải mái" : "Không tiện nuôi",
      smoke: "Không hút thuốc",
      cook: "Đôi khi nấu",
      interaction: "Cân bằng",
      neatness: "Sạch sẽ",
    },
    reviews: []
  };

  const [newName, setNewName] = useState("");
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState("");
  const [newImages, setNewImages] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const [privateNote, setPrivateNote] = useState("");
  const [isSavingNote, setIsSavingNote] = useState(false);

  useEffect(() => {
    if (room) {
      setPrivateNote(localStorage.getItem(`room_notes_${room.id}`) || "");
    }
  }, [room?.id]);

  useEffect(() => {
    if (isSavingNote) {
      const timer = setTimeout(() => setIsSavingNote(false), 1200);
      return () => clearTimeout(timer);
    }
  }, [isSavingNote]);

  const handlePrivateNoteChange = (text: string) => {
    setPrivateNote(text);
    if (room) {
      localStorage.setItem(`room_notes_${room.id}`, text);
      setIsSavingNote(true);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
  };

  const processFiles = (files: File[]) => {
    const validImageFiles = files.filter(f => f.type.startsWith("image/"));
    validImageFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
          setNewImages(prev => [...prev, reader.result as string].slice(0, 4));
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      processFiles(files);
    }
  };

  const triggerFileInput = () => {
    const el = document.getElementById("review-image-file-input");
    if (el) {
      el.click();
    }
  };

  const handleSubmitReview = () => {
    if (!newComment.trim()) return;
    if (onAddReview) {
      onAddReview(room.id, {
        reviewerName: newName.trim(),
        rating: newRating,
        comment: newComment.trim(),
        images: newImages,
      });
      setNewName("");
      setNewRating(5);
      setNewComment("");
      setNewImages([]);
    }
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString("vi-VN") + "đ";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={onClose} />

      {/* Modal Container */}
      <div className="relative bg-white rounded-[32px] shadow-2xl border border-gray-100 w-full max-w-2xl max-h-[90vh] overflow-y-auto z-10 animate-fade-in p-6 sm:p-8 scrollbar-thin">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 w-11 h-11 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800 hover:scale-110 duration-200 cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Room Header Carousel Image */}
        <div className="relative rounded-2xl overflow-hidden aspect-[16/9] w-full bg-slate-100 mb-6 border border-slate-100/50 pt-4 sm:pt-0">
          <img
            src={room.images[0]}
            alt={room.title}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          {room.isHot && (
            <div className="absolute top-4 left-4 z-10 bg-red-500 text-white px-3.5 py-1.5 rounded-full text-xs font-bold shadow-md flex items-center gap-1">
              <Flame className="h-4 w-4 fill-white" />
              TIN HOT NỔI BẬT
            </div>
          )}
        </div>

        {/* Title & Price Metadata */}
        <div className="pb-6 border-b border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 mb-2">
            <h2 className="text-xl sm:text-2xl font-black text-slate-800 leading-tight tracking-tight flex-1">
              {room.title}
            </h2>
            <div className="text-2xl font-black text-[#006590] shrink-0 whitespace-nowrap">
              {formatPrice(room.price)}
              <span className="text-xs font-bold text-slate-500">
                {room.type.toLowerCase().includes("ký túc xá") || room.type.toLowerCase().includes("kí túc xá") || room.type.toLowerCase().includes("homestay") ? " / người / tháng" : " / phòng / tháng"}
              </span>
            </div>
          </div>

          <p className="text-sm text-slate-500 font-semibold flex items-center gap-1">
            <MapPin className="h-4.5 w-4.5 text-sky-600 shrink-0" />
            Vị trí: {room.location}
          </p>

          {/* Badges for Gender & Pets */}
          <div className="flex flex-wrap gap-2 mt-3">
            {/* Availability Status */}
            {room.status === "hết phòng" ? (
              <span className="text-[11px] uppercase tracking-wider font-extrabold bg-red-100 text-red-800 border border-red-200 px-3 py-1 rounded-full">
                🔴 Đã hết phòng
              </span>
            ) : (
              <span className="text-[11px] uppercase tracking-wider font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-150 px-3 py-1 rounded-full">
                🟢 Còn phòng sẵn sàng
              </span>
            )}

            {room.gender && (
              <span className="text-[11px] uppercase tracking-wider font-extrabold bg-[#006590]/15 text-[#006590] px-3 py-1 rounded-full">
                👥 Đối tượng ghép: {room.gender}
              </span>
            )}
            {room.pets && (
              <span className={`text-[11px] uppercase tracking-wider font-extrabold px-3 py-1 rounded-full ${
                room.pets === "thoải mái"
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                  : "bg-amber-50 text-amber-700 border border-amber-100"
              }`}>
                🐾 {room.pets === "thoải mái" ? "Nuôi Pet thoải mái" : "Không nuôi Pet"}
              </span>
            )}
            <span className="text-[11px] uppercase tracking-wider font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-150 px-3 py-1 rounded-full">
              📞 SĐT: {room.phoneNumber || "0987 123 456"}
            </span>
          </div>
        </div>

        {/* Key Features Icons Cards */}
        <div className="py-6 space-y-6">
          <div>
            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Đặc trưng nổi bật</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {room.features.map((feat, idx) => (
                <div key={idx} className="bg-slate-50 border border-slate-100 px-4 py-3 rounded-xl flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-500 shrink-0" />
                  <span className="text-sm font-bold text-slate-700">{feat}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Detailed description */}
          <div>
            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2.5">Mô tả thông tin chi tiết</h4>
            <div className="bg-[#f6fafe] border border-sky-100/50 p-4 rounded-2xl text-slate-700 text-[14.5px] leading-relaxed">
              {room.description}
            </div>
          </div>

          {/* Host & Roommate Search Specifications: FULL PROFILE CARDS */}
          <div className="pt-6 border-t border-slate-100 space-y-6">
            <div>
              <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                👤 Thông tin chi tiết chủ phòng / Bạn ở ghép
              </h4>

              <div className="bg-gradient-to-br from-[#006590]/5 to-indigo-50/40 border border-sky-100/60 rounded-3xl p-5 sm:p-6 space-y-5">
                {/* Header Row: Avatar, Name & Metadata */}
                <div className="flex flex-col sm:flex-row gap-4 items-center sm:items-start text-center sm:text-left">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-white shadow-md overflow-hidden shrink-0">
                    <img src={resolvedRoommate.avatar} alt={resolvedRoommate.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  <div className="flex-grow space-y-1 sm:space-y-2">
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                      <h5 className="text-xl font-extrabold text-[#0f172a] tracking-tight">
                        {resolvedRoommate.name}, {resolvedRoommate.age || 22} tuổi
                      </h5>
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-150 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 fill-emerald-500 text-white" />
                        Đã xác minh
                      </span>
                    </div>
                    <p className="text-xs font-bold text-[#006590] uppercase tracking-wider">
                      {resolvedRoommate.role} • {resolvedRoommate.majorKhoidoi || "Khối Kinh tế"}
                    </p>
                    <p className="text-[11px] text-slate-500 font-semibold">
                      📍 Khu vực tìm: {resolvedRoommate.location}
                    </p>
                  </div>

                  {/* Reputation / Match score badge */}
                  <div className="flex flex-col items-center justify-center bg-white border border-sky-100 px-4 py-2.5 rounded-2xl shrink-0 shadow-xs">
                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Mức uy tín</div>
                    <div className="text-base font-black text-emerald-600 flex items-center gap-1 leading-none">
                      <Shield className="h-4 w-4 text-emerald-500" />
                      {resolvedRoommate.reputationScore || 98}%
                    </div>
                  </div>
                </div>

                {/* Bio text block */}
                <div className="bg-white/85 border border-sky-100/50 p-4 rounded-2xl relative shadow-xs">
                  <div className="absolute -top-2 left-6 px-2 bg-sky-100/60 rounded text-[9px] font-extrabold uppercase text-[#006590] scale-85">
                    Lời tự bạch / Yêu cầu
                  </div>
                  <p className="text-xs font-medium text-slate-600 leading-relaxed italic pt-1">
                    "{resolvedRoommate.bio}"
                  </p>
                </div>

                {/* Behavioral Grid of parameters */}
                <div className="space-y-3">
                  <h6 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                    Thống kê thói quen sinh hoạt
                  </h6>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {/* Sleep */}
                    <div className="bg-white/70 border border-slate-100/80 px-3 py-2.5 rounded-xl flex items-center gap-2.5 shadow-xs">
                      <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg shrink-0">
                        <Moon className="h-3.5 w-3.5" />
                      </span>
                      <div>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider leading-none">Giờ giấc</p>
                        <p className="text-xs font-extrabold text-slate-700 mt-0.5">{resolvedRoommate.lifestyle.sleep}</p>
                      </div>
                    </div>

                    {/* Pets */}
                    <div className="bg-white/70 border border-slate-100/80 px-3 py-2.5 rounded-xl flex items-center gap-2.5 shadow-xs">
                      <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg shrink-0">
                        <Dog className="h-3.5 w-3.5" />
                      </span>
                      <div>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider leading-none">Thú cưng</p>
                        <p className="text-xs font-extrabold text-slate-700 mt-0.5">{resolvedRoommate.lifestyle.pets}</p>
                      </div>
                    </div>

                    {/* Smoke */}
                    <div className="bg-white/70 border border-slate-100/80 px-3 py-2.5 rounded-xl flex items-center gap-2.5 shadow-xs">
                      <span className="p-1.5 bg-red-50 text-red-500 rounded-lg shrink-0">
                        <Shield className="h-3.5 w-3.5" />
                      </span>
                      <div>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider leading-none">Hút thuốc</p>
                        <p className="text-xs font-extrabold text-slate-700 mt-0.5">{resolvedRoommate.lifestyle.smoke}</p>
                      </div>
                    </div>

                    {/* Cook */}
                    <div className="bg-white/70 border border-slate-100/80 px-3 py-2.5 rounded-xl flex items-center gap-2.5 shadow-xs">
                      <span className="p-1.5 bg-amber-50 text-amber-600 rounded-lg shrink-0">
                        <ChefHat className="h-3.5 w-3.5" />
                      </span>
                      <div>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider leading-none">Nấu ăn</p>
                        <p className="text-xs font-extrabold text-slate-700 mt-0.5">{resolvedRoommate.lifestyle.cook}</p>
                      </div>
                    </div>

                    {/* Interaction */}
                    <div className="bg-white/70 border border-slate-100/80 px-3 py-2.5 rounded-xl flex items-center gap-2.5 shadow-xs">
                      <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg shrink-0">
                        <Compass className="h-3.5 w-3.5" />
                      </span>
                      <div>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider leading-none">Tương tác</p>
                        <p className="text-xs font-extrabold text-slate-700 mt-0.5">{resolvedRoommate.lifestyle.interaction}</p>
                      </div>
                    </div>

                    {/* Neatness */}
                    <div className="bg-white/70 border border-slate-100/80 px-3 py-2.5 rounded-xl flex items-center gap-2.5 shadow-xs">
                      <span className="p-1.5 bg-purple-50 text-purple-600 rounded-lg shrink-0">
                        <Smile className="h-3.5 w-3.5" />
                      </span>
                      <div>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider leading-none">Vệ sinh</p>
                        <p className="text-xs font-extrabold text-slate-700 mt-0.5">{resolvedRoommate.lifestyle.neatness}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tags row with lovely colors */}
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {resolvedRoommate.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="bg-[#006590]/10 text-[#006590] border border-[#006590]/15 text-[10px] font-extrabold px-3 py-1 rounded-lg"
                    >
                      ✨ {tag}
                    </span>
                  ))}
                </div>
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
              placeholder={`Nhập ghi chú cá nhân của bạn về căn phòng này (${room.title}) tại đây...`}
              value={privateNote}
              onChange={(e) => handlePrivateNoteChange(e.target.value)}
              className="w-full bg-white border border-amber-200/60 focus:border-amber-500 rounded-xl px-4 py-3 text-sm text-slate-700 outline-none duration-250 resize-none font-medium shadow-inner"
            />
          </div>

          {/* Reviews & Ratings Section */}
          <div className="pt-6 border-t border-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                ⭐ Đánh giá & Bình luận ({room.reviews?.length || 0})
              </h4>
              {room.reviews && room.reviews.length > 0 && (
                <div className="text-xs font-extrabold text-amber-600 bg-amber-50 border border-amber-100 px-2.5 py-1 rounded-lg">
                  ★ {(room.reviews.reduce((acc, r) => acc + r.rating, 0) / room.reviews.length).toFixed(1)} / 5.0
                </div>
              )}
            </div>

            {/* Reviews List Scroll Area */}
            <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin">
              {!room.reviews || room.reviews.length === 0 ? (
                <div className="bg-slate-50 border border-slate-100/60 p-4 rounded-xl text-center">
                  <p className="text-xs text-slate-400 font-medium italic">Chưa có đánh giá nào cho phòng trọ này. Hãy là người đầu tiên đánh giá!</p>
                </div>
              ) : (
                room.reviews.map((rev) => (
                  <div key={rev.id} className="bg-slate-50 border border-slate-100 p-4 rounded-2xl space-y-2.5 shadow-[0_4px_12px_rgba(0,0,0,0.01)]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <img
                          src={rev.reviewerAvatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop"}
                          alt={rev.reviewerName}
                          className="w-8 h-8 rounded-full object-cover border border-slate-150 shadow-sm"
                        />
                        <div>
                          <p className="text-xs font-black text-slate-800 leading-none">{rev.reviewerName}</p>
                          <p className="text-[10px] text-slate-400 font-bold mt-0.5">{rev.createdAt}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5 select-none">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <span
                            key={i}
                            className={`text-xs ${
                              i < rev.rating ? "text-amber-500 font-black" : "text-slate-300"
                            }`}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 font-medium whitespace-pre-wrap leading-relaxed">
                      {rev.comment}
                    </p>

                    {/* Image Attachments */}
                    {rev.images && rev.images.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {rev.images.map((img, idx) => (
                          <a
                            href={img}
                            target="_blank"
                            rel="noreferrer"
                            key={idx}
                            className="relative w-16 h-16 rounded-lg overflow-hidden border border-slate-200 bg-white shadow-sm hover:opacity-90 active:scale-95 transition-all"
                          >
                            <img src={img} alt="Review attachment" className="w-full h-full object-cover" />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Create review input form matching instructions */}
            {onAddReview && (
              <div className="bg-[#fafbfd] border border-sky-100/30 rounded-2xl p-4 sm:p-5 space-y-4">
                <h5 className="text-xs font-black text-slate-700 uppercase tracking-wider">Viết bài đánh giá mới</h5>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">Tên của bạn</label>
                    <input
                      type="text"
                      placeholder="Người dùng ẩn danh"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="w-full border border-slate-200 bg-white rounded-xl px-3 py-2 text-xs font-bold text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#006590]/15"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">Trải nghiệm của bạn</label>
                    <div className="flex items-center gap-1 h-8 select-none">
                      {Array.from({ length: 5 }).map((_, i) => {
                        const starVal = i + 1;
                        return (
                          <button
                            type="button"
                            key={starVal}
                            onClick={() => setNewRating(starVal)}
                            className="p-1 hover:scale-125 duration-100 transition-transform cursor-pointer"
                          >
                            <Star
                              className={`h-5 w-5 stroke-1.5 ${
                                starVal <= newRating ? "fill-amber-400 text-amber-400" : "text-slate-300"
                              }`}
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">Nội dung nhận xét</label>
                  <textarea
                    rows={2.5}
                    placeholder="Mô tả trải nghiệm thực tế về phòng trọ (an ninh, sạch sẽ, chủ nhà, tiện nghi...)"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="w-full border border-slate-200 bg-white rounded-xl px-3 py-2 text-xs font-medium text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#006590]/15 resize-none leading-relaxed"
                  />
                </div>

                {/* Drag and Drop with click trigger */}
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">Đính kèm hình ảnh</label>
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={triggerFileInput}
                    className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center ${
                      isDragging 
                        ? "border-[#006590] bg-[#006590]/5" 
                        : "border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="file"
                      id="review-image-file-input"
                      multiple
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <Upload className="h-5 w-5 text-slate-400 mb-1.5" />
                    <p className="text-[11px] text-slate-600 font-extrabold">Kéo thả hình ảnh vào đây hoặc bấm để chọn</p>
                    <p className="text-[9px] text-slate-400 mt-0.5">Hỗ trợ JPG, PNG (tối đa 4 ảnh)</p>
                  </div>

                  {/* Previews */}
                  {newImages.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2.5">
                      {newImages.map((imgBase64, index) => (
                        <div key={index} className="relative w-12 h-12 rounded-lg overflow-hidden border border-slate-200 group">
                          <img src={imgBase64} alt={`Attachment preview ${index}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setNewImages(newImages.filter((_, idx) => idx !== index));
                            }}
                            className="absolute inset-0 bg-black/40 flex items-center justify-center text-white opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-150"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    disabled={!newComment.trim()}
                    onClick={handleSubmitReview}
                    className="bg-[#006590] hover:bg-[#005176] disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-xs font-extrabold px-5 py-2.5 rounded-xl transition-all duration-200 flex items-center gap-1 shadow-sm uppercase cursor-pointer"
                  >
                    <span>Gửi đánh giá phòng</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Inquire buttons row */}
        <div className="flex flex-col gap-3 pt-6 border-t border-slate-100">
          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href={`tel:${(room.phoneNumber || "0987123456").replace(/\s/g, "")}`}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 px-6 rounded-full font-bold shadow-md hover:shadow-emerald-900/15 active:scale-95 duration-200 flex items-center justify-center gap-2 cursor-pointer text-center text-sm"
            >
              📞 Gọi điện: {room.phoneNumber || "0987 123 456"}
            </a>

            <button
              onClick={() => onInquire(room.hostName)}
              className="flex-1 bg-[#006590] hover:bg-[#005176] text-white py-3.5 px-6 rounded-full font-bold shadow-md hover:shadow-sky-900/10 active:scale-95 duration-200 flex items-center justify-center gap-2 cursor-pointer text-sm"
            >
              <MessageSquare className="h-5 w-5" />
              Liên hệ hỏi thông tin phòng
            </button>
          </div>

          <button
            onClick={onClose}
            className="w-full border border-slate-200 text-slate-500 py-3.5 px-6 rounded-full font-bold hover:bg-slate-50 active:scale-95 duration-200 text-center cursor-pointer text-sm"
          >
            Quay lại
          </button>
        </div>
      </div>
    </div>
  );
}
