import { useState, useEffect } from "react";
import {
  X,
  MessageSquare,
  FileText,
  Heart,
  ShieldAlert,
  Shield,
  Smile,
  Star,
  MapPin,
  Ban,
  Eye,
  EyeOff,
  Flag,
  Sparkles,
  Wallet,
  ShieldCheck,
  GraduationCap,
  User,
  Home,
  Moon,
  PawPrint,
  Cigarette,
  Utensils,
  Users,
  Pencil,
  Trash2,
} from "lucide-react";
import { Roommate } from "../types";
import { supabase } from "../lib/supabase";
import { useDialog } from "./ui/DialogProvider";
import { calculateReputationScore, getAverageRating, getReputationLabel } from "../utils/scoring";

interface RoommateModalProps {
  roommate: Roommate | null;
  onClose: () => void;
  onStartChat: (roommateId: string) => void;
  onStartAgreement: (roommateId: string) => void;
  onAddReview: (roommateId: string, review: { rating: number; comment: string; imageUrl?: string }) => void | boolean | Promise<boolean>;
  onUpdateReview: (reviewId: string, review: { rating: number; comment: string; imageUrl?: string }) => Promise<boolean>;
  onDeleteReview: (reviewId: string) => Promise<boolean>;
  onReportReview: (reviewId: string, roommateId: string) => Promise<boolean>;
  currentReviewerId?: string;
  currentReviewerName?: string;
  currentReviewerAvatar?: string;
  isOwnProfile?: boolean;
  onDeleteProfile?: (id: string) => void;
  hasChatWithRoommate?: boolean;
  hasTwoWayMessages?: boolean;
  isAdmin?: boolean;
}

export default function RoommateModal({
  roommate,
  onClose,
  onStartChat,
  onStartAgreement,
  onAddReview,
  onUpdateReview,
  onDeleteReview,
  onReportReview,
  currentReviewerId,
  currentReviewerName,
  currentReviewerAvatar,
  isOwnProfile = false,
  onDeleteProfile,
  hasChatWithRoommate = false,
  hasTwoWayMessages = false,
  isAdmin = false,
}: RoommateModalProps) {
  if (!roommate) return null;
  const { confirm, toast } = useDialog();
  
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
      setIsEditingReview(false);
      setNewComment("");
      setNewRating(0);
      setNewImageUrl("");
      setFormError("");
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

  const [newComment, setNewComment] = useState("");
  const [newRating, setNewRating] = useState(0);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [formError, setFormError] = useState("");
  const [isEditingReview, setIsEditingReview] = useState(false);

  const formatPrice = (price: number | undefined) => {
    if (!price || price === 0) return "Chưa cập nhật";
    return (price / 1000000).toFixed(1) + " triệu";
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newRating < 1 || newRating > 5) {
      setFormError("Vui lòng chọn từ 1 đến 5 sao!");
      return;
    }
    if (!newComment.trim()) {
      setFormError("Vui lòng viết nội dung bình luận!");
      return;
    }
    
    const reviewPayload = {
      rating: newRating,
      comment: newComment.trim(),
      imageUrl: newImageUrl.trim() ? newImageUrl.trim() : undefined
    };
    const success = isEditingReview && ownReview
      ? await onUpdateReview(ownReview.id, reviewPayload)
      : await onAddReview(roommate.id, reviewPayload);

    if (success !== false) {
      // Reset Form
      setNewComment("");
      setNewRating(0);
      setNewImageUrl("");
      setFormError("");
      setIsEditingReview(false);
      toast(isEditingReview ? "Đã cập nhật đánh giá." : "Đã gửi đánh giá.", "success");
    } else {
      setFormError(
        ownReview && !isEditingReview
          ? "Mỗi tài khoản chỉ được đánh giá một lần."
          : "Không thể lưu đánh giá. Vui lòng thử lại."
      );
    }
  };

  const startEditingReview = () => {
    if (!ownReview) return;
    setNewRating(ownReview.rating);
    setNewComment(ownReview.comment);
    setNewImageUrl(ownReview.imageUrl || "");
    setFormError("");
    setIsEditingReview(true);
  };

  const cancelEditingReview = () => {
    setIsEditingReview(false);
    setNewRating(0);
    setNewComment("");
    setNewImageUrl("");
    setFormError("");
  };

  const handleDeleteOwnReview = async () => {
    if (!ownReview) return;
    const approved = await confirm({
      title: "Xóa đánh giá",
      message: "Bạn có chắc chắn muốn xóa đánh giá của mình không?",
      confirmText: "Xóa đánh giá",
      cancelText: "Hủy",
      type: "error",
    });
    if (!approved) return;

    const success = await onDeleteReview(ownReview.id);
    toast(
      success ? "Đã xóa đánh giá." : "Không thể xóa đánh giá. Vui lòng thử lại.",
      success ? "success" : "error"
    );
    if (success) cancelEditingReview();
  };

  const handleReportReview = async (reviewId: string) => {
    const approved = await confirm({
      title: "Báo cáo đánh giá",
      message: "Báo cáo feedback này vì có nội dung phản cảm, xúc phạm hoặc không phù hợp?",
      confirmText: "Gửi báo cáo",
      cancelText: "Hủy",
      type: "warning",
    });
    if (!approved) return;

    const success = await onReportReview(reviewId, roommate.id);
    toast(
      success ? "Đã gửi báo cáo để quản trị viên kiểm tra." : "Không thể gửi báo cáo. Vui lòng thử lại.",
      success ? "success" : "error"
    );
  };

  const averageRating = getAverageRating(roommate.reviews);
  const reviewsCount = roommate.reviews?.length || 0;
  const reputationScore = calculateReputationScore(roommate);
  const ownReview = (roommate.reviews || []).find((review) =>
    currentReviewerId
      ? review.reviewerId === currentReviewerId ||
        (!review.reviewerId &&
          review.reviewerName?.trim().toLowerCase() === currentReviewerName?.trim().toLowerCase())
      : false
  );
  const reputationTone =
    reputationScore === null
      ? {
          card: "border-slate-200 bg-gradient-to-br from-slate-50 to-white",
          icon: "bg-slate-200 text-slate-600",
          score: "text-slate-700",
          bar: "bg-slate-400",
        }
      : reputationScore >= 70
        ? {
            card: "border-emerald-200 bg-gradient-to-br from-emerald-50 to-white shadow-emerald-100/70",
            icon: "bg-emerald-500 text-white",
            score: "text-emerald-700",
            bar: "bg-emerald-500",
          }
        : reputationScore >= 50
          ? {
              card: "border-amber-200 bg-gradient-to-br from-amber-50 to-white shadow-amber-100/70",
              icon: "bg-amber-500 text-white",
              score: "text-amber-700",
              bar: "bg-amber-500",
            }
          : {
              card: "border-rose-200 bg-gradient-to-br from-rose-50 to-white shadow-rose-100/80",
              icon: "bg-rose-500 text-white",
              score: "text-rose-700",
              bar: "bg-rose-500",
            };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={onClose} />

      {/* Modal Wrapper */}
      <div className="relative w-full max-w-3xl z-10 animate-fade-in">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-10 h-10 rounded-xl bg-white/90 shadow-md border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-white active:scale-95 duration-200 cursor-pointer z-50"
          aria-label="Đóng hồ sơ"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Scrollable Container */}
        <div className="bg-[#fbfdff] rounded-[32px] shadow-2xl border border-white/80 w-full max-h-[90vh] flex flex-col overflow-hidden">
          <div className="overflow-y-auto w-full h-full scrollbar-thin scrollbar-thumb-slate-200 hover:scrollbar-thumb-slate-300">
            <div className="p-4 sm:p-6">
          {/* Profile Header */}
          <section className="relative mb-7 overflow-hidden rounded-[28px] border border-sky-100 bg-white shadow-[0_18px_45px_rgba(15,80,110,0.08)]">
            <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-br from-[#ccefff] via-[#e3f7fb] to-[#d8f6e9]" />
            <div className="absolute -left-8 top-5 h-32 w-32 rounded-full bg-sky-400/30 blur-2xl" />
            <div className="absolute right-12 top-0 h-28 w-28 rounded-full bg-emerald-400/25 blur-2xl" />

            <div className="relative flex flex-col gap-5 px-5 pb-5 pt-8 sm:flex-row sm:items-center sm:px-7 sm:pb-6 sm:pt-9">
              <div className="relative mx-auto shrink-0 sm:mx-0">
                <div className="absolute -inset-2 rounded-full bg-white/70 shadow-lg backdrop-blur-sm" />
                <div className="relative h-28 w-28 overflow-hidden rounded-full border-4 border-white bg-slate-100 shadow-[0_10px_30px_rgba(15,80,110,0.18)] sm:h-32 sm:w-32">
                  <img
                    src={roommate.avatar}
                    alt={roommate.name}
                    className="h-full w-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <span className={`absolute bottom-1 right-1 flex h-7 w-7 items-center justify-center rounded-full border-4 border-white shadow-sm ${
                  roommate.status === "Đã tìm được"
                    ? "bg-red-500"
                    : roommate.status === "Đang trao đổi"
                      ? "bg-amber-500"
                      : "bg-emerald-500"
                }`}>
                  <span className="h-2 w-2 rounded-full bg-white" />
                </span>
              </div>

              <div className="min-w-0 flex-1 text-center sm:text-left">
                <div className="flex flex-col items-center gap-2 sm:flex-row sm:flex-wrap sm:justify-start">
                  <h2 className="text-3xl font-black leading-tight tracking-[-0.03em] text-[#07132d] drop-shadow-[0_1px_0_rgba(255,255,255,0.65)] sm:text-[36px]">
                    {roommate.name}, {roommate.age}
                  </h2>
                  <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-bold shadow-sm backdrop-blur-sm ${
                    roommate.status === "Đã tìm được"
                      ? "border-red-100 bg-red-50/90 text-red-700"
                      : roommate.status === "Đang trao đổi"
                        ? "border-amber-100 bg-amber-50/90 text-amber-700"
                        : "border-emerald-300 bg-emerald-100 text-emerald-800 shadow-[0_3px_10px_rgba(16,185,129,0.16)]"
                  }`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${
                      roommate.status === "Đã tìm được"
                        ? "bg-red-500"
                        : roommate.status === "Đang trao đổi"
                          ? "bg-amber-500"
                          : "bg-emerald-500 animate-pulse"
                    }`} />
                    {roommate.status === "Đã tìm được"
                      ? "Đã tìm được roommate"
                      : roommate.status === "Đang trao đổi"
                        ? "Đang trao đổi"
                        : "Đang tìm roommate"}
                  </span>
                </div>

                <div className="mt-3 flex flex-col items-center gap-2 text-sm text-slate-700 sm:items-start">
                  <span className="inline-flex items-center gap-2 font-bold">
                    <Sparkles className="h-4 w-4 text-[#00729c]" />
                    {roommate.role}
                  </span>
                  <span className="inline-flex max-w-full items-start gap-2 rounded-full border border-sky-100 bg-white/95 px-3.5 py-2 text-left font-medium shadow-[0_4px_12px_rgba(15,80,110,0.10)]">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#00729c]" />
                    <span>{roommate.location}</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="relative grid grid-cols-2 gap-2.5 px-4 pb-4 sm:grid-cols-5 sm:px-5 sm:pb-5">
              {[
                {
                  label: "Ngân sách",
                  value: `${formatPrice(roommate.budget)}/tháng`,
                  icon: Wallet,
                  color: "bg-sky-50 text-sky-700",
                },
                {
                  label: "Uy tín",
                  value: getReputationLabel(reputationScore),
                  sub: reviewsCount > 0 ? `${reviewsCount} đánh giá` : "Chưa có đánh giá",
                  icon: ShieldCheck,
                  color: "bg-emerald-50 text-emerald-700",
                  isReputation: true,
                },
                {
                  label: "Trường học",
                  value: roommate.school || (roommate as any).majorKhoidoi || "Không rõ",
                  icon: GraduationCap,
                  color: "bg-violet-50 text-violet-700",
                },
                {
                  label: "Giới tính",
                  value: roommate.gender,
                  icon: User,
                  color: "bg-rose-50 text-rose-700",
                },
                {
                  label: "Loại hình",
                  value: roommate.type || "Chưa rõ",
                  icon: Home,
                  color: "bg-amber-50 text-amber-700",
                },
              ].map((item, index) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.label}
                    className={`group min-w-0 rounded-2xl border px-3 py-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                      item.isReputation
                        ? `${reputationTone.card} shadow-[0_8px_22px_rgba(15,23,42,0.08)] ring-1 ring-inset ring-white/60`
                        : "border-slate-100 bg-white shadow-[0_6px_18px_rgba(15,23,42,0.04)]"
                    } ${
                      index === 4 ? "col-span-2 sm:col-span-1" : ""
                    }`}
                  >
                    <div className={`mb-2 flex h-8 w-8 items-center justify-center rounded-xl shadow-sm ${
                      item.isReputation ? reputationTone.icon : item.color
                    }`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <p className={`text-[10px] font-semibold ${item.isReputation ? reputationTone.score : "text-slate-500"}`}>
                      {item.label}
                    </p>
                    {item.isReputation ? (
                      <>
                        <p className={`mt-0.5 text-[18px] font-black leading-none ${reputationTone.score}`}>
                          {reputationScore === null ? "--" : `${reputationScore}%`}
                        </p>
                        <p className="mt-1 text-[10px] font-bold leading-tight text-slate-600">
                          {getReputationLabel(reputationScore).replace(/^\d+%\s*/, "")}
                        </p>
                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/80 shadow-inner">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${reputationTone.bar}`}
                            style={{ width: `${reputationScore || 0}%` }}
                          />
                        </div>
                      </>
                    ) : (
                      <p className="mt-1 break-words text-[12px] font-bold leading-snug text-slate-800">
                        {item.value}
                      </p>
                    )}
                    {item.sub && <p className="mt-0.5 text-[10px] font-semibold text-slate-400">{item.sub}</p>}
                  </div>
                );
              })}
            </div>
            <p className="border-t border-slate-100 bg-slate-50/60 px-5 py-2.5 text-[10px] text-slate-400">
              Mức uy tín được quy đổi từ đánh giá sao và chỉ dùng để tham khảo.
            </p>
          </section>

        {/* Body Content */}
        <div className="space-y-7 px-1 pb-2 sm:px-2">
          {/* Bio section */}
          <section className="relative mt-4 rounded-[20px] border-2 border-sky-100 bg-white px-5 pb-6 pt-8 shadow-[0_3px_8px_rgba(15,23,42,0.10)] sm:px-8 sm:pb-7 sm:pt-9">
            <h3 className="absolute -top-4 left-5 rounded-xl bg-[#00769f] px-4 py-2 text-[12px] font-extrabold uppercase tracking-tight text-white shadow-md sm:left-8">
              Giới thiệu &amp; tiêu chí
            </h3>
            <p className="text-[15px] font-bold italic leading-relaxed text-slate-700 sm:text-base">
                {roommate.bio && roommate.bio.trim() ? (
                  <>“{roommate.bio}”</>
                ) : (
                  <span className="font-medium text-slate-400">
                    Người dùng chưa cập nhật phần giới thiệu cá nhân.
                  </span>
                )}
            </p>
          </section>

          {/* Lifestyle specifics details list */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Chi tiết lối sống</h3>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-500">
                Thói quen hằng ngày
              </span>
            </div>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {[
                { label: "Ngủ nghỉ", value: roommate.lifestyle.sleep, icon: Moon, color: "bg-indigo-50 text-indigo-600" },
                { label: "Thú cưng", value: roommate.lifestyle.pets, icon: PawPrint, color: "bg-orange-50 text-orange-600" },
                { label: "Hút thuốc", value: roommate.lifestyle.smoke, icon: Cigarette, color: "bg-slate-100 text-slate-600" },
                { label: "Nấu ăn", value: roommate.lifestyle.cook, icon: Utensils, color: "bg-amber-50 text-amber-600" },
                { label: "Tương tác", value: roommate.lifestyle.interaction, icon: Users, color: "bg-sky-50 text-sky-600" },
                { label: "Vệ sinh", value: roommate.lifestyle.neatness, icon: Sparkles, color: "bg-emerald-50 text-emerald-600" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex min-h-16 items-center gap-3 rounded-2xl border border-slate-100 bg-white px-3.5 py-3 shadow-[0_4px_14px_rgba(15,23,42,0.03)] transition-colors hover:border-sky-100 hover:bg-sky-50/30"
                >
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${item.color}`}>
                    <item.icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold text-slate-400">{item.label}</p>
                    <p className="mt-0.5 break-words text-sm font-bold leading-snug text-slate-800">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Private Notes Section - Local Storage only */}
          <div className="border-t border-slate-200 pt-5 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5 select-none">
                <FileText className="h-4 w-4 text-slate-500" />
                <span>Ghi chú cá nhân (Chỉ mình bạn thấy)</span>
              </h4>
              {isSavingNote && (
                <span className="text-[10px] text-emerald-600 font-extrabold bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200 animate-pulse">
                  ✓ Đã tự động lưu
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 leading-normal font-semibold">
              Ghi chú chỉ được lưu cục bộ trên trình duyệt của thiết bị này.
            </p>
            <textarea
              rows={3}
              placeholder={`Nhập ghi chú cá nhân của bạn về ${roommate.name} tại đây...`}
              value={privateNote}
              onChange={(e) => handlePrivateNoteChange(e.target.value)}
              className="w-full bg-white border border-slate-200 focus:border-[#006590] rounded-xl px-4 py-3 text-sm text-slate-700 outline-none resize-none font-medium"
            />
          </div>

          {/* Reviews Rating & Comments Section */}
          <div className="pt-6 border-t border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h4 className="text-sm font-black text-slate-800 tracking-tight flex items-center gap-2">
                <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
                Đánh giá cộng đồng
              </h4>
              <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                {averageRating !== null ? (
                  <>
                    <span className="font-black text-slate-800">{averageRating.toFixed(1)}</span>
                    {renderStars(averageRating, "h-4 w-4")}
                    <span className="text-slate-500 text-xs font-bold">({reviewsCount} lượt)</span>
                  </>
                ) : (
                  <span className="text-slate-500 text-xs font-bold">Chưa có đánh giá</span>
                )}
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
                      <div className="flex items-center gap-2">
                        <div className="bg-amber-50/50 px-2 py-1 rounded-lg">
                          {renderStars(rev.rating, "h-3.5 w-3.5")}
                        </div>
                        {rev.id === ownReview?.id ? (
                          <>
                            <button
                              type="button"
                              onClick={startEditingReview}
                              className="rounded-lg p-1.5 text-sky-600 transition-colors hover:bg-sky-50"
                              title="Chỉnh sửa đánh giá"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={handleDeleteOwnReview}
                              className="rounded-lg p-1.5 text-red-500 transition-colors hover:bg-red-50"
                              title="Xóa đánh giá"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleReportReview(rev.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Báo cáo feedback không phù hợp"
                          >
                            <Flag className="h-3.5 w-3.5" />
                          </button>
                        )}
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
                  <p className="text-slate-400 font-medium text-sm">Chưa có đánh giá nào cho người này.</p>
                </div>
              )}
            </div>

            {/* Submit new community review */}
            {(!isOwnProfile) && (
            <div>
              {ownReview && !isEditingReview ? (
                <div className="flex flex-col gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h5 className="text-sm font-bold text-emerald-900">Bạn đã đánh giá người này</h5>
                    <p className="mt-1 text-xs leading-relaxed text-emerald-700">
                      Mỗi tài khoản chỉ được đánh giá một lần. Bạn có thể chỉnh sửa hoặc xóa đánh giá hiện tại.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={startEditingReview}
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-emerald-700"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Chỉnh sửa
                  </button>
                </div>
              ) : (
              <>
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-4 flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                  <MessageSquare className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h5 className="text-sm font-bold text-blue-900 mb-1">Chia sẻ trải nghiệm của bạn</h5>
                  <p className="text-xs text-blue-700 leading-relaxed">
                    Không cần ký hợp đồng. Hãy đánh giá trung thực dựa trên quá trình trò chuyện hoặc trao đổi với {roommate.name}.
                  </p>
                </div>
              </div>
              <form onSubmit={handleReviewSubmit} className="bg-gradient-to-br from-slate-50 to-white border border-slate-200 p-6 rounded-[24px] shadow-[0_2px_12px_rgba(0,0,0,0.02)] space-y-5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                  <Smile className="h-4 w-4 text-blue-600" />
                </div>
                <h5 className="text-[14px] font-black text-slate-800 tracking-tight">
                  {isEditingReview ? "Chỉnh sửa đánh giá của bạn" : `Viết đánh giá cho ${roommate.name}`}
                </h5>
              </div>

              {/* Reviewer identity & star rating */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">Người đánh giá</label>
                  <div className="h-[46px] flex items-center gap-2.5 bg-white border border-slate-200 rounded-xl px-3">
                    {currentReviewerAvatar ? (
                      <img src={currentReviewerAvatar} alt="" className="w-7 h-7 rounded-full object-cover" />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">?</div>
                    )}
                    <span className="text-[14px] font-bold text-slate-700 truncate">
                      {currentReviewerName || "Đăng nhập để đánh giá"}
                    </span>
                  </div>
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
                  placeholder="Chia sẻ trải nghiệm trò chuyện hoặc trao đổi thực tế..."
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
                <div className="flex w-full gap-2 sm:w-auto">
                  {isEditingReview && (
                    <button
                      type="button"
                      onClick={cancelEditingReview}
                      className="flex-1 rounded-xl bg-slate-100 px-5 py-3 text-[14px] font-bold text-slate-600 transition-colors hover:bg-slate-200 sm:flex-none"
                    >
                      Hủy
                    </button>
                  )}
                  <button
                    type="submit"
                    className="flex-1 rounded-xl bg-slate-900 px-8 py-3 text-[14px] font-bold text-white shadow-[0_4px_12px_rgba(0,0,0,0.1)] transition-all duration-300 hover:bg-blue-600 active:scale-95 sm:flex-none"
                  >
                    {isEditingReview ? "Lưu thay đổi" : "Gửi đánh giá"}
                  </button>
                </div>
              </div>
              </form>
              </>
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
                  roommate.phoneNumber && roommate.phoneNumber !== "Chưa cập nhật" ? (
                    <a
                      href={`tel:${roommate.phoneNumber.replace(/\s/g, "")}`}
                      className="w-full bg-emerald-50 border-2 border-emerald-200 hover:border-emerald-300 hover:bg-emerald-100 text-emerald-700 py-3.5 px-6 rounded-2xl font-black transition-all duration-300 flex items-center justify-center gap-2 text-[15px] animate-fade-in"
                    >
                      📞 {roommate.phoneNumber}
                    </a>
                  ) : (
                    <div className="w-full bg-slate-50 border-2 border-slate-200 text-slate-500 py-3.5 px-6 rounded-2xl font-bold text-center">
                      Người dùng chưa cập nhật SĐT
                    </div>
                  )
                ) : (
                  !isAdmin && (
                    <button
                      onClick={() => {
                        if (hasTwoWayMessages) {
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
                      <span className="ml-2 text-slate-400 text-sm font-medium blur-sm select-none pointer-events-none">09** *** ***</span>
                    </button>
                  )
                )}
                {showPhoneHint && !isAdmin && (
                  <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs font-bold px-4 py-2 rounded-xl whitespace-nowrap shadow-lg animate-fade-in z-50">
                    💬 Hai bên cần nhắn tin cho nhau trước khi xem SĐT
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
                    className="w-full bg-[#f6fafe] hover:bg-sky-100/80 text-[#006590] border border-sky-100 py-3.5 px-6 rounded-2xl font-bold transition-all duration-200 flex items-center justify-center gap-2 text-[15px] active:scale-95 cursor-pointer"
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
            <button
              onClick={onClose}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-4 px-6 rounded-[16px] font-black active:scale-95 duration-200 text-center cursor-pointer text-[15px] border border-slate-200"
            >
              Đóng
            </button>
          )}
        </div>
        </div>
        </div>
        </div>
      </div>
    </div>
  );
}
