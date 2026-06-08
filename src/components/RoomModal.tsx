import { useState, useEffect } from "react";
import { X, Flame, Shield, MapPin, Bed, Bath, User, MessageSquare, Handshake, Check, Info, Star, Upload, Trash2, Moon, Dog, ChefHat, Compass, Sparkles, Heart, CheckCircle2, Smile, FileText, Phone } from "lucide-react";
import { Room, Roommate } from "../types";

interface RoomModalProps {
  room: Room | null;
  onClose: () => void;
  onAddReview?: (roomId: string, review: { reviewerName: string; rating: number; comment: string; images: string[] }) => void | boolean | Promise<boolean>;
  roommates?: Roommate[];
  isOwnProfile?: boolean;
  onDeleteRoom?: (id: string) => void;
  onEditRoom?: (room: Room) => void;
  onInquire: (hostName: string) => void;
  isAdmin?: boolean;
}

export default function RoomModal({ room, onClose, onInquire, onAddReview, roommates = [], isOwnProfile = false, onDeleteRoom, onEditRoom, isAdmin = false }: RoomModalProps) {
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
    school: "ĐH Kinh tế (Ngũ Hành Sơn)",
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

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newRating === 0 || !newComment.trim()) return;

    if (onAddReview) {
      const success = await onAddReview(room.id, {
        reviewerName: "Người dùng RoomieMatch",
        rating: newRating,
        comment: newComment,
        images: newImages.filter(url => url.trim() !== "")
      });

      if (success !== false) {
        setNewRating(0);
        setNewComment("");
        setNewImages([""]);
      }
    }
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString("vi-VN") + "đ";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={onClose} />

      {/* Modal Wrapper */}
      <div className="relative w-full max-w-2xl z-10 animate-fade-in">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute -top-4 -right-2 sm:-right-4 w-11 h-11 rounded-full bg-white shadow-xl border border-gray-200 flex items-center justify-center text-slate-500 hover:text-slate-800 hover:scale-110 duration-200 cursor-pointer z-50"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Scrollable Container */}
        <div className="bg-white rounded-[32px] shadow-2xl border border-gray-100 w-full max-h-[85vh] overflow-hidden flex flex-col">
          <div className="overflow-y-auto w-full h-full scrollbar-thin scrollbar-thumb-slate-200 hover:scrollbar-thumb-slate-300">
            <div className="p-6 sm:p-8">
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
        <div className="pb-7 border-b-2 border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 leading-[1.15] tracking-tight flex-1">
              {room.title}
            </h2>
            <div className="text-3xl sm:text-4xl font-black text-[#006590] shrink-0 whitespace-nowrap bg-[#006590]/5 px-4 py-2.5 rounded-2xl border-2 border-[#006590]/10 text-right">
              {formatPrice(room.price)}
              <span className="block text-[12px] font-black text-slate-500 mt-1 uppercase tracking-wider">
                {room.type.toLowerCase().includes("ký túc xá") || room.type.toLowerCase().includes("kí túc xá") || room.type.toLowerCase().includes("homestay") ? "/ người / tháng" : "/ phòng / tháng"}
              </span>
            </div>
          </div>

          <p className="text-[15px] text-slate-700 font-bold flex items-center gap-2 mb-5 bg-slate-50 inline-flex px-4 py-2 rounded-xl border-2 border-slate-100">
            <MapPin className="h-5 w-5 text-sky-600 shrink-0" />
            {room.location}
          </p>

          {/* Badges for Gender & Pets */}
          <div className="flex flex-wrap gap-2.5">
            {/* Availability Status */}
            {room.status === "hết phòng" ? (
              <span className="text-[12px] uppercase tracking-wider font-black bg-red-500 text-white px-4 py-2 rounded-xl shadow-md flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-white/80" /> Đã hết phòng
              </span>
            ) : (
              <span className="text-[12px] uppercase tracking-wider font-black bg-emerald-500 text-white px-4 py-2 rounded-xl shadow-md flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" /> Còn phòng sẵn sàng
              </span>
            )}

            {room.gender && (
              <span className="text-[12px] uppercase tracking-wider font-black bg-sky-50 text-[#006590] border-2 border-sky-200 px-4 py-2 rounded-xl flex items-center gap-2">
                <User className="h-4.5 w-4.5" /> Ghép: {room.gender}
              </span>
            )}
            {room.pets && (
              <span className={`text-[12px] uppercase tracking-wider font-black px-4 py-2 rounded-xl flex items-center gap-2 border-2 ${
                room.pets === "thoải mái"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-amber-50 text-amber-700 border-amber-200"
              }`}>
                <Dog className="h-4.5 w-4.5" /> {room.pets === "thoải mái" ? "Pet thoải mái" : "Không Pet"}
              </span>
            )}
            <span className="text-[12px] uppercase tracking-wider font-black bg-indigo-50 text-indigo-700 border-2 border-indigo-200 px-4 py-2 rounded-xl flex items-center gap-2">
              <Phone className="h-4.5 w-4.5" /> {room.phoneNumber || "0987 123 456"}
            </span>
          </div>
        </div>

        {/* Key Features Icons Cards */}
        <div className="py-6 space-y-6">
          <div>
            <h4 className="text-[13px] font-black text-[#006590] uppercase tracking-wider mb-3">Đặc trưng nổi bật</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {room.features.map((feat, idx) => (
                <div key={idx} className="bg-white border-2 border-slate-100 shadow-sm px-4 py-3.5 rounded-2xl flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-500 shrink-0" />
                  <span className="text-[14px] font-bold text-slate-800">{feat}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Detailed description */}
          <div>
            <h4 className="text-[13px] font-black text-slate-500 uppercase tracking-wider mb-3">Mô tả thông tin chi tiết</h4>
            <div className="bg-[#f6fafe] border-2 border-sky-100 p-5 rounded-3xl text-slate-800 text-[15px] font-medium leading-relaxed shadow-sm">
              {room.description}
            </div>
          </div>

          {/* Host & Roommate Search Specifications: FULL PROFILE CARDS */}
          <div className="pt-8 border-t-2 border-slate-100 space-y-6">
            <div>
              <h4 className="text-[13px] font-black text-[#006590] uppercase tracking-wider mb-4 flex items-center gap-2">
                <User className="h-4 w-4" />
                Thông tin chi tiết chủ phòng / Bạn ở ghép
              </h4>

              <div className="bg-gradient-to-br from-sky-50 to-indigo-50 border-2 border-sky-100/60 rounded-[32px] p-6 space-y-6 shadow-sm">
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
                    <p className="text-xs font-bold text-[#006590] uppercase tracking-wider line-clamp-2">
                      {resolvedRoommate.role} • {resolvedRoommate.school || (resolvedRoommate as any).majorKhoidoi || "Chưa cập nhật trường"}
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
                <div className="bg-white border-2 border-sky-100 p-5 rounded-2xl relative shadow-sm mt-3">
                  <div className="absolute -top-3 left-6 px-3 bg-[#006590] rounded-lg text-[10px] font-black uppercase text-white py-1 shadow-sm">
                    Giới thiệu & Tiêu chí
                  </div>
                  <p className="text-[13px] font-bold text-slate-700 leading-relaxed italic pt-1">
                    "{resolvedRoommate.bio}"
                  </p>
                </div>

                {/* Behavioral Grid of parameters */}
                <div className="space-y-4">
                  <h6 className="text-[12px] font-black text-slate-500 uppercase tracking-wider">
                    Thống kê thói quen sinh hoạt
                  </h6>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3.5">
                    {/* Sleep */}
                    <div className="bg-white border-2 border-slate-100 px-4 py-3.5 rounded-2xl flex items-center gap-3 shadow-sm">
                      <span className="p-2 bg-blue-50 text-blue-600 rounded-xl shrink-0">
                        <Moon className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider leading-none">Giờ giấc</p>
                        <p className="text-[13px] font-black text-slate-800 mt-1">{resolvedRoommate.lifestyle.sleep}</p>
                      </div>
                    </div>

                    {/* Pets */}
                    <div className="bg-white border-2 border-slate-100 px-4 py-3.5 rounded-2xl flex items-center gap-3 shadow-sm">
                      <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
                        <Dog className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider leading-none">Thú cưng</p>
                        <p className="text-[13px] font-black text-slate-800 mt-1">{resolvedRoommate.lifestyle.pets}</p>
                      </div>
                    </div>

                    {/* Smoke */}
                    <div className="bg-white border-2 border-slate-100 px-4 py-3.5 rounded-2xl flex items-center gap-3 shadow-sm">
                      <span className="p-2 bg-red-50 text-red-500 rounded-xl shrink-0">
                        <Shield className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider leading-none">Hút thuốc</p>
                        <p className="text-[13px] font-black text-slate-800 mt-1">{resolvedRoommate.lifestyle.smoke}</p>
                      </div>
                    </div>

                    {/* Cook */}
                    <div className="bg-white border-2 border-slate-100 px-4 py-3.5 rounded-2xl flex items-center gap-3 shadow-sm">
                      <span className="p-2 bg-amber-50 text-amber-600 rounded-xl shrink-0">
                        <ChefHat className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider leading-none">Nấu ăn</p>
                        <p className="text-[13px] font-black text-slate-800 mt-1">{resolvedRoommate.lifestyle.cook}</p>
                      </div>
                    </div>

                    {/* Interaction */}
                    <div className="bg-white border-2 border-slate-100 px-4 py-3.5 rounded-2xl flex items-center gap-3 shadow-sm">
                      <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl shrink-0">
                        <Compass className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider leading-none">Tương tác</p>
                        <p className="text-[13px] font-black text-slate-800 mt-1">{resolvedRoommate.lifestyle.interaction}</p>
                      </div>
                    </div>

                    {/* Neatness */}
                    <div className="bg-white border-2 border-slate-100 px-4 py-3.5 rounded-2xl flex items-center gap-3 shadow-sm">
                      <span className="p-2 bg-purple-50 text-purple-600 rounded-xl shrink-0">
                        <Smile className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider leading-none">Vệ sinh</p>
                        <p className="text-[13px] font-black text-slate-800 mt-1">{resolvedRoommate.lifestyle.neatness}</p>
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
          <div className="bg-indigo-50/50 border-2 border-indigo-100 rounded-3xl p-5 sm:p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h4 className="text-[13px] font-black text-indigo-800 uppercase tracking-wider flex items-center gap-2 select-none animate-fade-in">
                <FileText className="h-4.5 w-4.5 text-indigo-600" />
                <span>Ghi chú cá nhân (Chỉ mình bạn thấy)</span>
              </h4>
              {isSavingNote && (
                <span className="text-[10px] text-emerald-600 font-extrabold bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200 animate-pulse">
                  ✓ Đã tự động lưu
                </span>
              )}
            </div>
            <p className="text-[12px] text-indigo-900/60 leading-normal font-semibold">
              Lưu lại số phòng, thông tin liên lạc mở rộng, nhận xét riêng, lịch hẹn... Ghi chú này chỉ lưu trên thiết bị của bạn, tuyệt đối bảo mật và không ai khác có thể nhìn thấy.
            </p>
            <textarea
              rows={3}
              placeholder={`Nhập ghi chú cá nhân của bạn về căn phòng này (${room.title}) tại đây...`}
              value={privateNote}
              onChange={(e) => handlePrivateNoteChange(e.target.value)}
              className="w-full bg-white border-2 border-indigo-200/80 focus:border-indigo-400 rounded-xl px-4 py-3 text-[13px] text-slate-800 outline-none duration-250 resize-none font-bold shadow-sm placeholder:font-medium placeholder:text-indigo-900/30"
            />
          </div>

          {/* Reviews & Ratings Section */}
          <div className="pt-8 mt-2 border-t-2 border-slate-100 space-y-5">
            <div className="flex items-center justify-between">
              <h4 className="text-[13px] font-black text-[#006590] uppercase tracking-wider flex items-center gap-2">
                <Star className="h-4 w-4" /> Đánh giá & Bình luận ({room.reviews?.length || 0})
              </h4>
              {room.reviews && room.reviews.length > 0 && (
                <div className="text-[12px] font-black text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl shadow-sm">
                  ★ {(room.reviews.reduce((acc, r) => acc + r.rating, 0) / room.reviews.length).toFixed(1)} / 5.0
                </div>
              )}
            </div>

            {/* Reviews List Scroll Area */}
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200">
              {!room.reviews || room.reviews.length === 0 ? (
                <div className="bg-slate-50 border-2 border-slate-100 p-6 rounded-3xl text-center">
                  <p className="text-[13px] text-slate-500 font-bold italic">Chưa có đánh giá nào cho phòng trọ này. Hãy là người đầu tiên đánh giá!</p>
                </div>
              ) : (
                room.reviews.map((rev) => (
                  <div key={rev.id} className="bg-white border-2 border-slate-100 p-5 rounded-3xl space-y-3 shadow-sm hover:border-[#006590]/20 transition-colors">
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
            {(onAddReview && !isOwnProfile) && (
              <div className="bg-white border-2 border-slate-100 rounded-3xl p-5 sm:p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] space-y-5">
                <h5 className="text-[13px] font-black text-[#006590] uppercase tracking-wider flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  Viết bài đánh giá mới
                </h5>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-2">Tên của bạn</label>
                    <input
                      type="text"
                      placeholder="Người dùng ẩn danh"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="w-full border-2 border-slate-200 bg-slate-50 rounded-xl px-4 py-3 text-[13px] font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#006590] focus:bg-white transition-colors"
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
                  <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-2">Nội dung nhận xét</label>
                  <textarea
                    rows={3}
                    placeholder="Mô tả trải nghiệm thực tế về phòng trọ (an ninh, sạch sẽ, chủ nhà, tiện nghi...)"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="w-full border-2 border-slate-200 bg-slate-50 rounded-xl px-4 py-3 text-[13px] font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#006590] focus:bg-white transition-colors resize-none leading-relaxed"
                  />
                </div>

                {/* Drag and Drop with click trigger */}
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-2">Đính kèm hình ảnh</label>
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={triggerFileInput}
                    className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center ${
                      isDragging 
                        ? "border-[#006590] bg-sky-50" 
                        : "border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-slate-400"
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
                    <Upload className="h-6 w-6 text-[#006590] mb-2" />
                    <p className="text-[13px] text-slate-700 font-extrabold">Kéo thả hình ảnh vào đây hoặc bấm để chọn</p>
                    <p className="text-[11px] text-slate-500 mt-1 font-medium">Hỗ trợ JPG, PNG (tối đa 4 ảnh)</p>
                  </div>

                  {/* Previews */}
                  {newImages.length > 0 && (
                    <div className="flex flex-wrap gap-3 mt-3">
                      {newImages.map((imgBase64, index) => (
                        <div key={index} className="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-200 group shadow-sm">
                          <img src={imgBase64} alt={`Attachment preview ${index}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setNewImages(newImages.filter((_, idx) => idx !== index));
                            }}
                            className="absolute inset-0 bg-black/50 flex items-center justify-center text-white opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-150"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    disabled={!newComment.trim()}
                    onClick={handleReviewSubmit}
                    className="bg-[#006590] hover:bg-[#004e70] disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed disabled:shadow-none text-white text-[13px] font-black px-6 py-3.5 rounded-[14px] transition-all duration-200 flex items-center gap-2 shadow-[0_4px_15px_rgba(0,101,144,0.3)] uppercase cursor-pointer"
                  >
                    <Star className="h-4 w-4" />
                    <span>Gửi đánh giá phòng</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Inquire buttons row */}
        <div className="flex flex-col gap-3 pt-6 mt-2 border-t-2 border-slate-100">
          {!isOwnProfile ? (
            <>
              {!isAdmin && (
                <div className="flex flex-col sm:flex-row gap-3">
                  <a
                    href={`tel:${(room.phoneNumber || "0987123456").replace(/\s/g, "")}`}
                    className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-4 px-6 rounded-[16px] font-black shadow-[0_6px_20px_rgba(16,185,129,0.3)] hover:shadow-[0_8px_25px_rgba(16,185,129,0.4)] active:scale-95 duration-200 flex items-center justify-center gap-2.5 cursor-pointer text-center text-[15px]"
                  >
                    <Phone className="h-5 w-5" /> Gọi điện: {room.phoneNumber || "0987 123 456"}
                  </a>

                  <button
                    onClick={() => onInquire(room.hostName)}
                    className="flex-1 bg-[#006590] hover:bg-[#004e70] text-white py-4 px-6 rounded-[16px] font-black shadow-[0_6px_20px_rgba(0,101,144,0.3)] hover:shadow-[0_8px_25px_rgba(0,101,144,0.4)] active:scale-95 duration-200 flex items-center justify-center gap-2.5 cursor-pointer text-[15px]"
                  >
                    <MessageSquare className="h-5 w-5" />
                    Liên hệ hỏi thông tin
                  </button>
                </div>
              )}

              <button
                onClick={onClose}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-4 px-6 rounded-[16px] font-black active:scale-95 duration-200 text-center cursor-pointer text-[15px] border border-slate-200"
              >
                Quay lại
              </button>
            </>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full sm:w-auto mt-4 sm:mt-0">
              <button
                onClick={() => {
                  if (onEditRoom) {
                    onClose();
                    onEditRoom(room);
                  }
                }}
                className="w-full bg-[#006590] hover:bg-[#004e70] text-white py-3.5 px-6 rounded-[16px] font-black active:scale-95 duration-200 cursor-pointer text-[15px] shadow-md"
              >
                Sửa tin đăng
              </button>
              <button
                onClick={() => {
                  if (onDeleteRoom && window.confirm("Bạn có chắc chắn muốn xóa tin đăng này? Hành động này không thể hoàn tác.")) {
                    onDeleteRoom(room.id);
                  }
                }}
                className="w-full bg-red-50 hover:bg-red-100 text-red-600 py-3.5 px-6 rounded-[16px] font-black active:scale-95 duration-200 cursor-pointer border border-red-100 text-[15px]"
              >
                Xóa tin đăng
              </button>
              <button
                onClick={onClose}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-3.5 px-6 rounded-[16px] font-black active:scale-95 duration-200 cursor-pointer border border-slate-200 text-[15px]"
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
