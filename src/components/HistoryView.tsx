import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AlertCircle, BadgeCheck, Check, Clock, Eye, FileText, UserRound, X } from "lucide-react";
import { supabase } from "../lib/supabase";
import { Roommate } from "../types";
import {
  AgreementRecord,
  buildAgreementHistory,
  findRoommateByIdentity,
} from "../utils/agreements";

interface HistoryViewProps {
  currentUserProfile: any;
  currentUser?: any;
  roommates: Roommate[];
  onRequireAuth?: () => void;
  onRequireProfile?: () => void;
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
  onRequireAuth,
  onRequireProfile,
}: HistoryViewProps) {
  const [agreements, setAgreements] = useState<AgreementRecord[]>([]);
  const [selectedAgreement, setSelectedAgreement] = useState<AgreementRecord | null>(null);
  const myAuthId = currentUser?.id || "";

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
        message="Vui lòng đăng nhập để xem lịch sử hợp đồng."
        buttonLabel="Đăng nhập ngay"
        onClick={onRequireAuth}
      />
    );
  }

  if (!currentUserProfile) {
    return (
      <EmptyAccess
        icon={<BadgeCheck className="h-10 w-10 text-sky-500" />}
        message="Bạn cần thiết lập hồ sơ cá nhân để xem lịch sử hợp đồng."
        buttonLabel="Tạo hồ sơ ngay"
        onClick={onRequireProfile}
      />
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in pb-16 pt-6">
      <section className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8">
        <div className="flex items-center gap-3 pb-6 border-b border-slate-100">
          <div className="w-12 h-12 bg-[#006590]/10 text-[#006590] rounded-xl flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800">Quản Lý Hợp Đồng</h1>
            <p className="text-sm text-slate-500">
              Theo dõi bản chờ ký, đã ký và đã hủy
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {agreements.length === 0 ? (
            <div className="text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-bold">Chưa có hợp đồng nào</p>
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

                return (
                  <article
                    key={agreement.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-2xl border border-slate-100 hover:border-sky-200 hover:shadow-md transition-all gap-4"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <img
                        src={partner?.avatar || fallbackAvatar}
                        alt=""
                        className="w-12 h-12 rounded-full object-cover border border-slate-200 shrink-0"
                      />
                      <div className="min-w-0">
                        <h2 className="text-base font-bold text-slate-800 truncate">
                          {partner?.name || "Người dùng RoomieMatch"}
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
  const creatorName =
    agreement.creator_id === currentUserId
      ? currentUserName
      : findRoommateByIdentity(roommates, agreement.creator_id)?.name || "Người dùng RoomieMatch";
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
                Chi Tiết Hợp Đồng
              </h2>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Mã hợp đồng: {agreement.id.slice(0, 8).toUpperCase()}
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
            <InfoRow label="Người còn lại" value={partner?.name || "Người dùng RoomieMatch"} />
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

          <p className="text-xs text-slate-400 flex items-start gap-2">
            <UserRound className="w-4 h-4 shrink-0" />
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
