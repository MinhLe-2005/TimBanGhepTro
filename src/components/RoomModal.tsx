import { useState, useEffect } from "react";
import { X, Flame, ChevronLeft, ChevronRight, Shield, Zap, Droplet, Building, MapPin, Bed, Bath, User, MessageSquare, Handshake, Check, Info, Star, Upload, Trash2, Moon, Dog, ChefHat, Compass, Sparkles, Heart, Smile, FileText, Phone, Ban, Users, LayoutGrid, Image as ImageIcon, Cigarette, Utensils, Clock } from "lucide-react";
import { Room, Roommate } from "../types";
import { useConfirmDialog } from "../hooks/useConfirmDialog";
import { calculateReputationScore, getReputationLabel } from "../utils/scoring";
import { compressImageFile } from "../utils/cropImage";

interface RoomModalProps {
  room: Room | null;
  onClose: () => void;
  onAddReview?: (roomId: string, review: { reviewerName: string; rating: number; comment: string; images: string[] }) => void | boolean | Promise<boolean>;
  roommates?: Roommate[];
  isOwnProfile?: boolean;
  onDeleteRoom?: (id: string) => boolean | Promise<boolean>;
  onEditRoom?: (room: Room) => void;
  onInquire: (hostName: string) => void;
  isAdmin?: boolean;
  onViewHostProfile?: (roommate: Roommate) => void;
  hasSignedAgreement?: boolean;
  currentUserId?: string;
  currentUserProfile?: { name?: string; avatar?: string } | null;
}

export default function RoomModal({ room, onClose, onInquire, onAddReview, roommates = [], isOwnProfile = false, onDeleteRoom, onEditRoom, isAdmin = false, onViewHostProfile, hasSignedAgreement = false, currentUserId, currentUserProfile }: RoomModalProps) {
  const { confirm, Dialog: ConfirmDialogComponent } = useConfirmDialog();
  
  if (!room) return null;

  let targetTenants = 0;
  let currentTenants = 0;
  const displayFeatures: string[] = [];
  
  if (room.features) {
    room.features.forEach(f => {
      if (f.startsWith("TARGET_TENANTS:")) targetTenants = parseInt(f.split(":")[1]);
      else if (f.startsWith("CURRENT_TENANTS:")) currentTenants = parseInt(f.split(":")[1]);
      else displayFeatures.push(f);
    });
  }

  // Match the room owner by account ID first. Prefer the personal profile over listings.
  const roomOwnerId = room.user_id || room.postedBy;
  const ownerMatches = roomOwnerId
    ? roommates.filter(
        (roommate) =>
          roommate.user_id === roomOwnerId ||
          roommate.auth_id === roomOwnerId ||
          roommate.postedBy === roomOwnerId ||
          roommate.id === roomOwnerId
      )
    : [];
  const normalizedHostName = room.hostName.toLowerCase();
  const nameMatches = roommates.filter(
    (roommate) =>
      roommate.name.toLowerCase() === normalizedHostName ||
      roommate.name.toLowerCase().includes(normalizedHostName) ||
      normalizedHostName.includes(roommate.name.toLowerCase())
  );
  const hostRoommate =
    ownerMatches.find((roommate) => !roommate.is_listing) ||
    nameMatches.find((roommate) => !roommate.is_listing) ||
    ownerMatches[0] ||
    nameMatches[0] ||
    null;

  // Aggregate all roommate reviews for this host (from both personal and listing profiles)
  const allHostReviews = [
    ...ownerMatches.flatMap(r => r.reviews || []),
    ...nameMatches.flatMap(r => r.reviews || [])
  ];
  const uniqueReviewsMap = new Map();
  allHostReviews.forEach(r => {
    if (r.id) uniqueReviewsMap.set(r.id, r);
  });
  const combinedHostReviews = Array.from(uniqueReviewsMap.values());

  // Use room's data as primary source, but PRIORITIZE avatar from actual user profile
  const resolvedRoommate: Roommate = {
    ...hostRoommate,
    id: hostRoommate?.id || "fallback-host",
    name: room.hostName || "Chủ phòng",
    age: hostRoommate?.age || 21,
    role: (room.hostRole || "Sinh viên").replace("Giảng viên / ", "").replace("Giảng viên", "Sinh viên"),
    school: hostRoommate?.school || "Chưa có thông tin trường",
    phoneNumber: room.phoneNumber || hostRoommate?.phoneNumber || "Chưa cập nhật SĐT",
    // PRIORITY: hostRoommate avatar (actual user) > room.hostAvatar (may be stale) > default
    avatar: hostRoommate?.avatar || room.hostAvatar || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=150&auto=format&fit=crop",
    status: "Đã tìm được",
    location: room.location,
    matchScore: hostRoommate?.matchScore || 0,
    reputationScore: hostRoommate?.reputationScore || 0,
    tags: room.habits || ["Sạch sẽ", "Không hút thuốc", "Tôn trọng"],
    isVerified: hostRoommate?.isVerified || !!room.isVerifiedRoom,
    bio: room.roommateInfo || hostRoommate?.bio || "Chào bạn! Mình là người đăng tin tìm bạn ở ghép cho căn phòng này. Mình thích giữ không gian sạch sẽ, thân thiện, tôn trọng giờ giấc nghỉ ngơi của nhau.",
    budget: room.price,
    gender: room.gender === "Tất cả" ? "Nữ" : (room.gender as any || "Nữ"),
    lifestyle: hostRoommate?.lifestyle || {
      sleep: "Bình thường",
      pets: room.pets === "thoải mái" ? "Thoải mái" : "Không tiện nuôi",
      smoke: "Không hút thuốc",
      cook: "Đôi khi nấu",
      interaction: "Cân bằng",
      neatness: "Sạch sẽ",
    },
    reviews: combinedHostReviews
  };
  const hostReputationScore = calculateReputationScore(resolvedRoommate);

  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState("");
  const [newImages, setNewImages] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showGallery, setShowGallery] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState<number | null>(null);

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === room.images.length - 1 ? 0 : prev + 1));
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === 0 ? room.images.length - 1 : prev - 1));
  };

  const [privateNote, setPrivateNote] = useState("");
  const [isSavingNote, setIsSavingNote] = useState(false);

  useEffect(() => {
    if (room) {
      setPrivateNote(localStorage.getItem(`room_notes_${room.id}`) || "");
    }
  }, [room?.id]);

  const ownReview = room.reviews?.find((review) => review.reviewerId === currentUserId);

  useEffect(() => {
    setNewRating(ownReview?.rating || 5);
    setNewComment(ownReview?.comment || "");
    setNewImages(ownReview?.images || []);
  }, [room.id, ownReview?.id, ownReview?.rating, ownReview?.comment]);

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
      compressImageFile(file, 1200, 0.8).then(compressedFile => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (reader.result) {
            setNewImages(prev => [...prev, reader.result as string].slice(0, 4));
          }
        };
        reader.readAsDataURL(compressedFile);
      }).catch(err => {
        console.error("Compression error:", err);
        const reader = new FileReader();
        reader.onloadend = () => {
          if (reader.result) {
            setNewImages(prev => [...prev, reader.result as string].slice(0, 4));
          }
        };
        reader.readAsDataURL(file);
      });
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
        if (!ownReview) {
          setNewRating(5);
          setNewComment("");
          setNewImages([]);
        }
      }
    }
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString("vi-VN") + "đ";
  };

  const now = Date.now();
  let createdAtTs = now;
  let hasValidDate = false;

  if (room.created_at) {
    const d = new Date(room.created_at);
    if (!isNaN(d.getTime())) {
      createdAtTs = d.getTime();
      hasValidDate = true;
    }
  } else if (room.createdAt) {
    const d = new Date(room.createdAt);
    if (!isNaN(d.getTime())) {
      createdAtTs = d.getTime();
      hasValidDate = true;
    }
  }
  
  if (!hasValidDate) {
    const match = String(room.id).match(/room-(\d+)/);
    if (match) {
      createdAtTs = parseInt(match[1], 10);
    }
  }

  const createdAt = new Date(createdAtTs);
  const createdMidnight = new Date(createdAt);
  createdMidnight.setHours(0, 0, 0, 0);
  const todayMidnight = new Date();
  todayMidnight.setHours(0, 0, 0, 0);
  
  const daysElapsed = Math.floor((todayMidnight.getTime() - createdMidnight.getTime()) / (1000 * 60 * 60 * 24));
  const daysLeft = Math.max(0, 30 - daysElapsed);
  const isExpired = room.status === "Hết hạn" || daysLeft <= 0;

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
        <div className="relative rounded-2xl overflow-hidden aspect-[16/9] w-full bg-slate-100 mb-6 border border-slate-100/50 pt-4 sm:pt-0 group">
          <img
            src={room.images[currentImageIndex] || room.images[0]}
            alt={room.title}
            className="w-full h-full object-cover transition-opacity duration-300 cursor-pointer"
            referrerPolicy="no-referrer"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowGallery(true); }}
          />

          {/* Nút Xem tất cả ảnh (Đậm và nổi bật) */}
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowGallery(true); }}
            className="absolute bottom-4 right-4 bg-white text-slate-900 px-4 py-2 rounded-xl text-[13px] font-black shadow-lg border border-slate-200 flex items-center gap-2 hover:bg-slate-50 hover:scale-105 active:scale-95 transition-all z-[60] pointer-events-auto cursor-pointer"
          >
            <ImageIcon className="w-4 h-4 text-[#006590]" />
            XEM TẤT CẢ {room.images.length} ẢNH
          </button>
          
          {room.images.length > 1 && (
            <>
              {/* Image Indicators */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20 bg-black/30 px-3 py-1.5 rounded-full backdrop-blur-sm">
                {room.images.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(idx); }}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      idx === currentImageIndex 
                        ? "bg-white scale-125 w-4" 
                        : "bg-white/50 hover:bg-white/80"
                    }`}
                  />
                ))}
              </div>

              {/* Navigation Arrows */}
              <button 
                onClick={prevImage}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 hover:bg-white text-slate-800 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-md backdrop-blur-sm z-20 -translate-x-4 group-hover:translate-x-0"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button 
                onClick={nextImage}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 hover:bg-white text-slate-800 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-md backdrop-blur-sm z-20 translate-x-4 group-hover:translate-x-0"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
              
              <div className="absolute top-4 right-4 z-20 bg-black/60 text-white px-2 py-1 rounded-md text-[11px] font-bold backdrop-blur-md">
                {currentImageIndex + 1} / {room.images.length}
              </div>
            </>
          )}

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
            {isExpired ? (
              <span className="text-[12px] uppercase tracking-wider font-black bg-slate-200 text-slate-700 px-4 py-2 rounded-xl shadow-md flex items-center gap-2">
                <Ban className="h-4 w-4" /> Đã hết hạn
              </span>
            ) : room.status === "hết phòng" || (targetTenants > 0 && currentTenants >= targetTenants) ? (
              <span className="text-[12px] uppercase tracking-wider font-black bg-slate-800 text-white px-4 py-2 rounded-xl shadow-md flex items-center gap-2">
                <Ban className="h-4 w-4" /> Đã hết phòng
              </span>
            ) : (
              <span className="text-[12px] uppercase tracking-wider font-black bg-emerald-500 text-white px-4 py-2 rounded-xl shadow-md flex items-center gap-2">
                Còn phòng sẵn sàng
              </span>
            )}
            
            {/* Expiration Badge */}
            {(isOwnProfile || isAdmin) && !isExpired && (
              <span className={`text-[12px] uppercase tracking-wider font-black px-4 py-2 rounded-xl shadow-md flex items-center gap-2 border-2 ${
                daysLeft <= 3 
                  ? "bg-amber-50 text-amber-600 border-amber-200" 
                  : "bg-sky-50 text-sky-600 border-sky-200"
              }`}>
                {daysLeft <= 3 ? <Moon className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                Còn {daysLeft} ngày
              </span>
            )}
            
            {targetTenants > 0 && (
              <span className={`text-[12px] uppercase tracking-wider font-black px-4 py-2 rounded-xl shadow-md flex items-center gap-2 border-2 ${currentTenants >= targetTenants ? 'bg-red-50 text-red-600 border-red-200' : 'bg-blue-50 text-[#006590] border-blue-200'}`}>
                <Users className="h-4.5 w-4.5" /> 
                {currentTenants >= targetTenants ? `Đã đủ (${currentTenants}/${targetTenants})` : `Còn ${Math.max(0, targetTenants - currentTenants)} chỗ (${currentTenants}/${targetTenants})`}
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
          {/* Basic Costs */}
          <div>
            <h4 className="text-[13px] font-black text-[#006590] uppercase tracking-wider mb-3 flex items-center gap-2">
              <Zap className="h-4 w-4" /> Thông tin & Chi phí cơ bản
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              {/* Type */}
              <div className="bg-gradient-to-br from-indigo-50 to-white border-2 border-indigo-100/60 px-4 py-3.5 rounded-2xl flex flex-col items-center justify-center gap-2 text-center shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
                <div className="bg-indigo-100 p-2 rounded-xl text-indigo-600 mb-1">
                  <Building className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider leading-none">Loại phòng</span>
                <span className="text-[14px] font-black text-indigo-900">{room.type}</span>
              </div>
              
              {/* Bedroom */}
              <div className="bg-gradient-to-br from-emerald-50 to-white border-2 border-emerald-100/60 px-4 py-3.5 rounded-2xl flex flex-col items-center justify-center gap-2 text-center shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
                <div className="bg-emerald-100 p-2 rounded-xl text-emerald-600 mb-1">
                  <Bed className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider leading-none">Phòng ngủ</span>
                <span className="text-[14px] font-black text-emerald-900">{room.bedrooms} PN</span>
              </div>
              
              {/* Electricity */}
              <div className="bg-gradient-to-br from-amber-50 to-white border-2 border-amber-100/60 px-4 py-3.5 rounded-2xl flex flex-col items-center justify-center gap-2 text-center shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
                <div className="bg-amber-100 p-2 rounded-xl text-amber-600 mb-1">
                  <Zap className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider leading-none">Giá điện</span>
                <span className="text-[14px] font-black text-amber-900 truncate max-w-full px-1" title={room.electricity || 'Chưa cập nhật'}>{room.electricity || 'Chưa cập nhật'}</span>
              </div>
              
              {/* Water */}
              <div className="bg-gradient-to-br from-cyan-50 to-white border-2 border-cyan-100/60 px-4 py-3.5 rounded-2xl flex flex-col items-center justify-center gap-2 text-center shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
                <div className="bg-cyan-100 p-2 rounded-xl text-cyan-600 mb-1">
                  <Droplet className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider leading-none">Giá nước</span>
                <span className="text-[14px] font-black text-cyan-900 truncate max-w-full px-1" title={room.water || 'Chưa cập nhật'}>{room.water || 'Chưa cập nhật'}</span>
              </div>
            </div>
          </div>
          <div>
            <h4 className="text-[13px] font-black text-[#006590] uppercase tracking-wider mb-3">Nội thất & Tiện ích</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {displayFeatures.map((feat, idx) => (
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
                    </div>
                    <p className="text-xs font-bold text-[#006590] uppercase tracking-wider line-clamp-2">
                      {resolvedRoommate.role} • {resolvedRoommate.school || (resolvedRoommate as any).majorKhoidoi || "Chưa cập nhật trường"}
                    </p>
                    <p className="text-[11px] text-slate-500 font-semibold">
                      📍 Khu vực tìm: {resolvedRoommate.location}
                    </p>
                  </div>

                  {/* Reputation / Match score badge */}
                  <div
                    title="Điểm quy đổi từ đánh giá sao; không phải bảo chứng an toàn"
                    className="flex flex-col items-center justify-center bg-white border border-sky-100 px-4 py-2.5 rounded-2xl shrink-0 shadow-xs"
                  >
                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Mức uy tín</div>
                    <div className="text-base font-black text-emerald-600 flex items-center gap-1 leading-none">
                      <Shield className="h-4 w-4 text-emerald-500" />
                      {getReputationLabel(hostReputationScore)}
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

                {/* View Full Profile Button */}
                {onViewHostProfile && hostRoommate && (
                  <div className="pt-4 border-t border-sky-100 mt-4">
                    <button
                      onClick={() => {
                        console.log('[RoomModal] View host profile clicked:', hostRoommate);
                        onViewHostProfile(hostRoommate);
                      }}
                      className="w-full bg-gradient-to-r from-[#006590] to-sky-600 hover:from-[#005176] hover:to-sky-700 text-white font-bold text-[14px] py-3.5 px-5 rounded-2xl shadow-lg shadow-sky-500/20 transition-all duration-200 cursor-pointer flex items-center justify-center gap-2.5"
                    >
                      <User className="h-5 w-5" />
                      Xem hồ sơ đầy đủ của {resolvedRoommate.name}
                    </button>
                    <p className="text-[11px] text-slate-500 text-center mt-2 font-medium">
                      Xem chi tiết nhu cầu tìm phòng, sở thích, và thông tin liên hệ đầy đủ
                    </p>
                  </div>
                )}
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
                  <p className="text-[13px] text-slate-500 font-bold italic">Chưa có đánh giá nào cho phòng trọ này. Ký thỏa thuận sống chung với chủ phòng để trở thành người đầu tiên đánh giá!</p>
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
            {!isOwnProfile && !hasSignedAgreement && currentUserId && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center mt-6">
                <p className="text-[13px] text-amber-700 font-medium">
                  Chỉ những người đã ký <strong>Thỏa thuận sống chung</strong> với chủ phòng mới có thể đánh giá phòng trọ này.
                </p>
              </div>
            )}
            {(onAddReview && !isOwnProfile && hasSignedAgreement) && (
              <div className="bg-white border-2 border-slate-100 rounded-3xl p-5 sm:p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] space-y-5">
                <h5 className="text-[13px] font-black text-[#006590] uppercase tracking-wider flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  {ownReview ? "Cập nhật đánh giá của bạn" : "Viết bài đánh giá mới"}
                </h5>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-2">Người đánh giá</label>
                    <div className="h-[46px] flex items-center gap-2.5 border-2 border-slate-100 bg-slate-50 rounded-xl px-3">
                      {currentUserProfile?.avatar && (
                        <img src={currentUserProfile.avatar} alt="" className="w-7 h-7 rounded-full object-cover" />
                      )}
                      <span className="text-[13px] font-bold text-slate-700">
                        {currentUserProfile?.name || "Thành viên RoomieMatch"}
                      </span>
                    </div>
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
                    <span>{ownReview ? "Cập nhật đánh giá" : "Gửi đánh giá phòng"}</span>
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
                onClick={async () => {
                  const confirmed = await confirm({
                    title: "Xóa tin đăng phòng trọ",
                    message: "Bạn có chắc chắn muốn xóa tin đăng này? Hành động này không thể hoàn tác.",
                    confirmText: "Xóa vĩnh viễn",
                    cancelText: "Hủy",
                    type: "danger"
                  });
                  
                  if (confirmed && onDeleteRoom) {
                    await onDeleteRoom(room.id);
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
      
      {/* Confirm Dialog */}
      <ConfirmDialogComponent />

      {/* Gallery Grid Modal */}
      {showGallery && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={() => setShowGallery(false)} />
          <div className="relative w-full max-w-5xl z-10 animate-fade-in">
            {/* Close Button */}
            <button
              onClick={() => setShowGallery(false)}
              className="absolute top-3 right-3 w-10 h-10 rounded-xl bg-white/90 shadow-md border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-white active:scale-95 duration-200 cursor-pointer z-50"
              aria-label="Đóng"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="bg-[#fbfdff] rounded-[32px] shadow-2xl border border-white/80 w-full max-h-[90vh] flex flex-col overflow-hidden">
              <section className="relative overflow-hidden border-b border-sky-100 bg-white shadow-[0_4px_20px_rgba(15,80,110,0.05)] shrink-0">
                <div className="absolute inset-x-0 top-0 h-full bg-gradient-to-br from-[#ccefff] via-[#e3f7fb] to-[#d8f6e9] opacity-40" />
                <div className="absolute -left-8 top-5 h-32 w-32 rounded-full bg-sky-400/20 blur-2xl" />
                <div className="absolute right-12 top-0 h-28 w-28 rounded-full bg-emerald-400/15 blur-2xl" />

                <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 sm:p-8 pr-14">
                  <div className="flex items-center gap-4">
                    <div className="relative h-14 w-14 overflow-hidden rounded-2xl border-2 border-white bg-white shadow-md flex items-center justify-center shrink-0">
                      <div className="absolute inset-0 bg-sky-50" />
                      <ImageIcon className="w-7 h-7 text-sky-500 relative z-10" />
                    </div>
                    <div>
                      <h2 className="text-2xl sm:text-3xl font-black text-[#07132d] tracking-tight">Xem thêm ảnh phòng</h2>
                      <p className="text-slate-500 text-sm mt-1 font-medium">Toàn bộ hình ảnh chi tiết về phòng</p>
                    </div>
                  </div>
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-sky-100 text-sky-600 font-bold text-sm shadow-sm backdrop-blur-md">
                    <LayoutGrid className="w-4 h-4" />
                    {room.images.length} hình ảnh
                  </div>
                </div>
              </section>

              <div className="overflow-y-auto w-full h-full p-4 sm:p-6 lg:p-8 scrollbar-thin scrollbar-thumb-slate-200 hover:scrollbar-thumb-slate-300">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 sm:gap-6">
                  {room.images.map((img, idx) => (
                    <div 
                      key={idx} 
                      className="aspect-[4/3] rounded-2xl overflow-hidden cursor-zoom-in group border border-slate-100 shadow-sm hover:shadow-xl transition-all relative"
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setFullscreenImage(idx); }}
                    >
                      <img 
                        src={img} 
                        alt={`Ảnh ${idx + 1}`} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 bg-white/90 text-slate-800 text-xs font-bold px-3 py-1.5 rounded-full shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                          Phóng to
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Lightbox Overlay */}
      {fullscreenImage !== null && (
        <div 
          className="fixed inset-0 z-[300] bg-black/95 backdrop-blur-sm flex flex-col"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setFullscreenImage(null); }}
        >
          {/* Header */}
          <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-center bg-gradient-to-b from-black/70 to-transparent z-10">
            <span className="text-white/80 font-medium px-4">
              {fullscreenImage + 1} / {room.images.length}
            </span>
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setFullscreenImage(null); }}
              className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Main Image */}
          <div className="flex-1 flex items-center justify-center p-4 md:p-12 relative">
            {room.images.length > 1 && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setFullscreenImage((prev) => (prev === 0 ? room.images.length - 1 : prev! - 1));
                }}
                className="absolute left-4 md:left-8 p-4 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
            )}

            <img
              src={room.images[fullscreenImage]}
              alt={`Hình ảnh ${fullscreenImage + 1}`}
              className="max-w-full max-h-full object-contain select-none"
              referrerPolicy="no-referrer"
              onClick={(e) => e.stopPropagation()}
            />

            {room.images.length > 1 && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setFullscreenImage((prev) => (prev === room.images.length - 1 ? 0 : prev! + 1));
                }}
                className="absolute right-4 md:right-8 p-4 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors cursor-pointer"
              >
                <ChevronRight className="w-8 h-8" />
              </button>
            )}
          </div>
          
          {/* Thumbnails */}
          {room.images.length > 1 && (
            <div className="p-4 bg-black/50 overflow-x-auto flex gap-2 justify-center pb-8" onClick={(e) => e.stopPropagation()}>
              {room.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setFullscreenImage(idx); }}
                  className={`relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden transition-all duration-300 ${
                    idx === fullscreenImage ? 'ring-2 ring-white scale-105 opacity-100' : 'opacity-50 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt={`Thumbnail ${idx}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
