import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AlertCircle, BadgeCheck, Check, Clock, Eye, FileText, UserRound, X } from "lucide-react";
import { useDialog } from "./ui/DialogProvider";
import { supabase } from "../lib/supabase";
import { Roommate, Room } from "../types";
import {
  AgreementRecord,
  buildAgreementHistory,
  findRoommateByIdentity,
} from "../utils/agreements";

interface HistoryViewProps {
  currentUserProfile: any;
  currentUser?: any;
  roommates: Roommate[];
  rooms?: Room[];
  onRequireAuth?: () => void;
  onRequireProfile?: () => void;
  onExtendPost?: (type: 'room' | 'roommate', id: string) => void;
}

const fallbackAvatar = "https://images.unsplash.com/photo-1534528741775-53994a69daeb";

const formatDateTime = (value?: string) => {
  if (!value) return "Chưa có";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Không xác định";
  return date.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const ruleLabels: Array<[keyof AgreementRecord["rules"], string]> = [
  ["quiet", "Giờ yên tĩnh"],
  ["cleaning", "Dọn dẹp"],
  ["visitors", "Khách thăm"],
  ["bills", "Chia chi phí"],
  ["pets", "Thú cưng"],
  ["otherNotes", "Ghi chú khác"],
];

export default function HistoryView({
  currentUserProfile,
  currentUser,
  roommates,
  rooms = [],
  onRequireAuth,
  onRequireProfile,
  onExtendPost,
}: HistoryViewProps) {
  const [activeTab, setActiveTab] = useState<'agreements' | 'posts'>('agreements');
  const [agreements, setAgreements] = useState<AgreementRecord[]>([]);
  const [selectedAgreement, setSelectedAgreement] = useState<AgreementRecord | null>(null);
  const { previewImage, toast } = useDialog();
  const myAuthId = currentUser?.id || "";

  // Get user's posts
  const myRooms = rooms.filter(r => r.postedBy === myAuthId || r.user_id === myAuthId);
  const myRoommates = roommates.filter(r => r.postedBy === myAuthId || r.user_id === myAuthId);

  useEffect(() => {
    if (!myAuthId) return;

    const fetchAgreements = async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("chat_id, sender_id, text, timestamp")
        .like("chat_id", `%${myAuthId}%`)
        .like("text", "%[AGREEMENT_%")
        .order("timestamp", { ascending: true });

      if (error) {
        console.error("[HistoryView] Cannot load agreements:", error);
        return;
      }

      const ownMessages = (data || []).filter((message) =>
        message.chat_id?.split("_").includes(myAuthId)
      );
      setAgreements(buildAgreementHistory(ownMessages, myAuthId));
    };

    fetchAgreements();

    const channel = supabase
      .channel(`history-agreements-${myAuthId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const message = payload.new as { chat_id?: string; text?: string };
          if (
            message.text?.startsWith("[AGREEMENT_") &&
            message.chat_id?.split("_").includes(myAuthId)
          ) {
            fetchAgreements();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [myAuthId]);

  if (!currentUser) {
    return (
      <EmptyAccess
        icon={<AlertCircle className="h-10 w-10 text-slate-300" />}
        message="Vui lòng đăng nhập để xem lịch sử thỏa thuận."
        buttonLabel="Đăng nhập ngay"
        onClick={onRequireAuth}
      />
    );
  }

  if (!currentUserProfile) {
    return (
      <EmptyAccess
        icon={<BadgeCheck className="h-10 w-10 text-sky-500" />}
        message="Bạn cần thiết lập hồ sơ cá nhân để xem lịch sử thỏa thuận."
        buttonLabel="Tạo hồ sơ ngay"
        onClick={onRequireProfile}
      />
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in pb-16 pt-6">
      <section className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#006590]/10 text-[#006590] rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-800">Quản Lý Giao Dịch</h1>
              <p className="text-sm text-slate-500">
                Lịch sử thỏa thuận và bài đăng của bạn
              </p>
            </div>
          </div>
          
          {/* Tabs */}
          <div className="flex bg-slate-100 p-1.5 rounded-xl self-stretch sm:self-auto shrink-0">
            <button
              onClick={() => setActiveTab('agreements')}
              className={`flex-1 sm:flex-none px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 ${
                activeTab === 'agreements'
                  ? 'bg-white text-[#006590] shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Thỏa thuận
            </button>
            <button
              onClick={() => setActiveTab('posts')}
              className={`flex-1 sm:flex-none px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 ${
                activeTab === 'posts'
                  ? 'bg-white text-[#006590] shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Bài đăng
            </button>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {activeTab === 'agreements' ? (
            agreements.length === 0 ? (
            <div className="text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-bold">Chưa có thỏa thuận nào</p>
              <p className="text-xs text-slate-400 mt-1">
                Các thỏa thuận bạn gửi hoặc nhận sẽ xuất hiện tại đây.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {agreements.map((agreement) => {
                const partnerId =
                  agreement.creator_id === myAuthId
                    ? agreement.partner_id
                    : agreement.creator_id;
                const partner = findRoommateByIdentity(roommates, partnerId);
                const isCreator = agreement.creator_id === myAuthId;
                
                // ✅ Ưu tiên profile HIỆN TẠI, fallback về cached data từ agreement
                const partnerName = partner?.name || (isCreator 
                  ? agreement.partner_name
                  : agreement.creator_name) || "Người dùng RoomieMatch";
                
                const partnerAvatar = partner?.avatar || (isCreator
                  ? agreement.partner_avatar
                  : agreement.creator_avatar) || fallbackAvatar;

                return (
                  <article
                    key={agreement.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-2xl border border-slate-100 hover:border-sky-200 hover:shadow-md transition-all gap-4"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <img
                        src={partnerAvatar}
                        alt=""
                        className="w-12 h-12 rounded-full object-cover border border-slate-200 shrink-0 cursor-zoom-in"
                        onClick={(e) => { e.stopPropagation(); previewImage(partnerAvatar); }}
                      />
                      <div className="min-w-0">
                        <h2 className="text-base font-bold text-slate-800 truncate">
                          {partnerName}
                        </h2>
                        <p className="text-xs text-slate-500 mt-1">
                          Tạo lúc {formatDateTime(agreement.created_at)}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                          Mã: {agreement.id.slice(0, 12)}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <StatusBadge agreement={agreement} isCreator={isCreator} />
                      <button
                        type="button"
                        onClick={() => setSelectedAgreement(agreement)}
                        className="px-4 py-2 bg-[#006590] hover:bg-[#005176] text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        Xem chi tiết
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )) : (
            <div className="space-y-6">
              {myRooms.length === 0 && myRoommates.length === 0 ? (
                <div className="text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 font-bold">Bạn chưa có bài đăng nào</p>
                </div>
              ) : (
                <>
                  {myRoommates.length > 0 && (
                    <div>
                      <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <UserRound className="w-5 h-5 text-[#006590]" />
                        Hồ sơ tìm người ở ghép
                      </h3>
                      <div className="grid gap-4">
                        {myRoommates.map(r => <PostItem key={r.id} item={r} type="roommate" onExtend={() => onExtendPost?.('roommate', r.id)} />)}
                      </div>
                    </div>
                  )}

                  {myRooms.length > 0 && (
                    <div>
                      <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-emerald-600" />
                        Bài đăng cho thuê phòng
                      </h3>
                      <div className="grid gap-4">
                        {myRooms.map(r => <PostItem key={r.id} item={r} type="room" onExtend={() => onExtendPost?.('room', r.id)} />)}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </section>

      {selectedAgreement && (
        <AgreementDetailModal
          agreement={selectedAgreement}
          currentUserId={myAuthId}
          currentUserName={currentUserProfile?.name || "Bạn"}
          roommates={roommates}
          onClose={() => setSelectedAgreement(null)}
        />
      )}
    </div>
  );
}

function StatusBadge({
  agreement,
  isCreator,
}: {
  agreement: AgreementRecord;
  isCreator: boolean;
}) {
  if (agreement.status === "signed") {
    return (
      <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[11px] font-bold uppercase flex items-center gap-1.5">
        <Check className="w-3.5 h-3.5" /> Đã ký
      </span>
    );
  }

  if (agreement.status === "pending") {
    return (
      <span className="px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-[11px] font-bold uppercase flex items-center gap-1.5">
        <Clock className="w-3.5 h-3.5" />
        {isCreator ? "Chờ đối tác ký" : "Chờ bạn ký"}
      </span>
    );
  }

  return (
    <span className="px-3 py-1.5 bg-slate-50 text-slate-600 border border-slate-200 rounded-full text-[11px] font-bold uppercase flex items-center gap-1.5">
      <X className="w-3.5 h-3.5" /> Đã hủy
    </span>
  );
}

function AgreementDetailModal({
  agreement,
  currentUserId,
  currentUserName,
  roommates,
  onClose,
}: {
  agreement: AgreementRecord;
  currentUserId: string;
  currentUserName: string;
  roommates: Roommate[];
  onClose: () => void;
}) {
  const partnerId =
    agreement.creator_id === currentUserId ? agreement.partner_id : agreement.creator_id;
  const partner = findRoommateByIdentity(roommates, partnerId);
  
  // ✅ Ưu tiên tên và avatar từ profile HIỆN TẠI, fallback về cached name
  const creatorProfile = findRoommateByIdentity(roommates, agreement.creator_id);
  const creatorName =
    agreement.creator_id === currentUserId
      ? currentUserName
      : (creatorProfile?.name || agreement.creator_name || "Người dùng RoomieMatch");
  
  const partnerName = partner?.name || (agreement.creator_id === currentUserId
    ? agreement.partner_name
    : agreement.creator_name) || "Người dùng RoomieMatch";
    
  const signerName =
    agreement.signed_by_name ||
    (agreement.signed_by === currentUserId
      ? currentUserName
      : findRoommateByIdentity(roommates, agreement.signed_by)?.name);
  const populatedRules = ruleLabels.filter(([key]) => agreement.rules?.[key]?.trim());

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[2px] sm:p-8"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="flex max-h-[calc(100dvh-4rem)] w-full max-w-xl flex-col overflow-hidden rounded-3xl border border-white/80 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.28)]"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="agreement-detail-title"
      >
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#006590]/10 text-[#006590] rounded-xl flex items-center justify-center shrink-0">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h2 id="agreement-detail-title" className="text-xl font-black text-slate-800 sm:text-2xl">
                Chi Tiết Thỏa Thuận
              </h2>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Mã thỏa thuận: {agreement.id.slice(0, 8).toUpperCase()}
              </p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Đóng"
            onClick={onClose}
            className="w-10 h-10 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center justify-center transition-colors shrink-0"
          >
            <X className="h-5 w-5 text-slate-600" />
          </button>
        </header>

        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-5 py-5 sm:px-6">
          <div className="grid gap-3 sm:grid-cols-2">
            <InfoRow label="Người đề xuất" value={creatorName} />
            <InfoRow label="Người còn lại" value={partnerName} />
            <InfoRow label="Ngày tạo" value={formatDateTime(agreement.created_at)} />
            <InfoRow
              label={agreement.status === "cancelled" ? "Ngày hủy" : "Ngày ký"}
              value={
                agreement.status === "cancelled"
                  ? formatDateTime(agreement.cancelled_at)
                  : agreement.status === "signed"
                    ? formatDateTime(agreement.signed_at)
                    : "Chưa ký"
              }
            />
            {agreement.status === "signed" && (
              <InfoRow label="Người ký xác nhận" value={signerName || "Đối tác"} />
            )}
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
              <p className="text-xs font-bold uppercase text-slate-400 mb-2">Trạng thái</p>
              <StatusBadge
                agreement={agreement}
                isCreator={agreement.creator_id === currentUserId}
              />
            </div>
          </div>

          <section>
            <h3 className="text-base font-black text-slate-800 mb-3">Các điều khoản</h3>
            {populatedRules.length === 0 ? (
              <p className="text-sm text-slate-500 bg-slate-50 border border-slate-100 rounded-xl p-4">
                Bản ghi cũ này không có dữ liệu điều khoản.
              </p>
            ) : (
              <div className="space-y-3">
                {populatedRules.map(([key, label]) => (
                  <div key={key} className="border border-slate-100 rounded-xl p-4">
                    <p className="text-xs font-bold uppercase text-slate-400 mb-1.5">{label}</p>
                    <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                      {agreement.rules[key]}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>

          <p className="flex items-start gap-2 text-xs font-semibold leading-relaxed text-red-500">
            <UserRound className="w-4 h-4 shrink-0 text-red-400" />
            Đây là thỏa thuận sống chung giữa hai người dùng, không thay thế hợp đồng thuê nhà có giá trị pháp lý.
          </p>
        </div>

        <footer className="shrink-0 border-t border-slate-100 bg-white px-5 py-4 sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 bg-[#006590] hover:bg-[#005176] text-white font-bold rounded-xl transition-colors"
          >
            Đóng
          </button>
        </footer>
      </div>
    </div>,
    document.body
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
      <p className="text-xs font-bold uppercase text-slate-400 mb-1">{label}</p>
      <p className="text-sm font-bold text-slate-700">{value}</p>
    </div>
  );
}

function EmptyAccess({
  icon,
  message,
  buttonLabel,
  onClick,
}: {
  icon: React.ReactNode;
  message: string;
  buttonLabel: string;
  onClick?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 min-h-[60vh]">
      <div className="bg-white p-10 rounded-3xl border border-slate-100 max-w-md text-center shadow-sm">
        <div className="flex justify-center mb-3">{icon}</div>
        <p className="text-slate-600 font-bold mb-6">{message}</p>
        <button
          type="button"
          onClick={onClick}
          className="w-full py-3 bg-[#006590] hover:bg-[#005176] text-white font-bold rounded-xl transition-colors"
        >
          {buttonLabel}
        </button>
      </div>
    </div>
  );
}

function PostItem({ item, type, onExtend }: { item: any; type: 'room' | 'roommate'; onExtend: () => void }) {
  const createdAt = new Date(item.created_at || Date.now());
  const now = new Date();
  
  // Assume expiration is 30 days
  const expiresAt = new Date(createdAt.getTime() + 30 * 24 * 60 * 60 * 1000);
  const daysLeft = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const isExpired = daysLeft <= 0;
  const isExpiringSoon = daysLeft > 0 && daysLeft <= 3; // within 3 days

  return (
    <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${isExpired ? 'border-red-200 bg-red-50/30' : isExpiringSoon ? 'border-amber-200 bg-amber-50/30' : 'border-slate-100 bg-white hover:border-sky-200 hover:shadow-md'}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h4 className="text-base font-bold text-slate-800 line-clamp-1">{type === 'room' ? item.title : item.name}</h4>
          <p className="text-xs text-slate-500 mt-1">Đăng ngày: {formatDateTime(item.created_at)}</p>
          <div className="mt-2 flex items-center gap-2">
            {isExpired ? (
              <span className="px-2.5 py-1 bg-red-100 text-red-700 rounded text-[10px] font-bold uppercase flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Đã hết hạn
              </span>
            ) : isExpiringSoon ? (
              <span className="px-2.5 py-1 bg-amber-100 text-amber-700 rounded text-[10px] font-bold uppercase flex items-center gap-1">
                <Clock className="w-3 h-3" /> Hết hạn sau {daysLeft} ngày
              </span>
            ) : (
              <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded text-[10px] font-bold uppercase flex items-center gap-1">
                <Check className="w-3 h-3" /> Còn {daysLeft} ngày
              </span>
            )}
          </div>
        </div>
        
        <button
          onClick={onExtend}
          className="shrink-0 px-4 py-2 bg-sky-100 hover:bg-sky-200 text-[#006590] text-xs font-bold rounded-xl transition-colors whitespace-nowrap"
        >
          Gia hạn bài đăng
        </button>
      </div>
    </div>
  );
}
