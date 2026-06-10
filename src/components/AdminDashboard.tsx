import { useState, useEffect } from "react";
import { Users, AlertTriangle, Shield, Trash2, Ban, ShieldCheck, FileText, UserCheck, Flag, Check, Star } from "lucide-react";
import { supabase } from "../lib/supabase";
import { Roommate, Room } from "../types";
import { useDialog } from "./ui/DialogProvider";

interface AdminDashboardProps {
  currentUser: any;
  roommates: Roommate[];
  rooms: Room[];
  onDeleteRoommate?: (id: string) => void;
  onDeleteRoom?: (id: string) => void;
  onReviewDeleted?: (id: string) => void;
}

export default function AdminDashboard({ currentUser, roommates, rooms, onDeleteRoommate, onDeleteRoom, onReviewDeleted }: AdminDashboardProps) {
  const { confirm, toast } = useDialog();
  const [activeTab, setActiveTab] = useState<"reports" | "reviewReports" | "users" | "listings" | "rooms" | "agreements">("reviewReports");
  const [reports, setReports] = useState<any[]>([]);
  const [reviewReports, setReviewReports] = useState<any[]>([]);
  const [bannedUsers, setBannedUsers] = useState<string[]>([]);
  const [agreements, setAgreements] = useState<any[]>([]);
  const [allSupabaseRoommates, setAllSupabaseRoommates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAdminData = async () => {
    setIsLoading(true);
    try {
      // Fetch ALL roommates from Supabase (both profiles and listings)
      const { data: allRoommatesData } = await supabase
        .from('roommates')
        .select('*')
        .order('createdAt', { ascending: false });
      if (allRoommatesData) setAllSupabaseRoommates(allRoommatesData);

      // Fetch Reports
      const { data: reportMsgs } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', 'SYSTEM_REPORTS')
        .order('timestamp', { ascending: false });

      if (reportMsgs) {
        const parsedReports = reportMsgs.map(msg => {
           let payload = null;
           try { payload = JSON.parse(msg.text.replace('[REPORT]', '').trim()); } catch {}
           return {
             report_message_id: msg.id,
             sender_id: msg.sender_id,
             created_at: msg.created_at || msg.timestamp,
             ...payload,
           };
        }).filter(r => r.target_id);
        setReports(parsedReports);
      }

      // Fetch reported feedback from the dedicated table when available.
      const { data: reviewReportRows } = await supabase
        .from('review_reports')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      // Also read fallback reports created before the migration was applied.
      const { data: fallbackReviewReports } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', 'SYSTEM_REVIEW_REPORTS');

      const tableReports = (reviewReportRows || []).map(report => ({
        ...report,
        source: 'table',
      }));
      const messageReports = (fallbackReviewReports || []).map(message => {
        try {
          const payload = JSON.parse(message.text.replace('[REVIEW_REPORT]', '').trim());
          return {
            ...payload,
            id: message.id,
            created_at: message.created_at || message.timestamp,
            source: 'message',
          };
        } catch {
          return null;
        }
      }).filter(Boolean);

      const combinedReviewReports = [...tableReports, ...messageReports];
      const reviewIds = [...new Set(combinedReviewReports.map(report => report.review_id).filter(Boolean))];
      let reviewRows: any[] = [];
      if (reviewIds.length > 0) {
        const { data } = await supabase.from('reviews').select('*').in('id', reviewIds);
        reviewRows = data || [];
      }

      const { data: reviewIdentityMessages } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', 'SYSTEM_REVIEW_IDENTITIES');
      const reviewIdentityMap = new Map();
      (reviewIdentityMessages || []).forEach(message => {
        try {
          const payload = JSON.parse(message.text.replace('[REVIEW_IDENTITY]', '').trim());
          reviewIdentityMap.set(String(payload.review_id), payload.reviewer_id);
        } catch {}
      });

      const reviewMap = new Map(reviewRows.map(review => [
        String(review.id),
        {
          ...review,
          reviewer_id: review.reviewer_id || reviewIdentityMap.get(String(review.id)),
        },
      ]));
      setReviewReports(
        combinedReviewReports
          .map(report => ({ ...report, review: reviewMap.get(String(report.review_id)) }))
          .filter(report => report.review)
      );

      // Fetch Bans
      const { data: banMsgs } = await supabase.from('messages').select('*').eq('chat_id', 'SYSTEM_BANS');
      if (banMsgs) setBannedUsers(banMsgs.map(m => m.text.replace('[BAN]', '').trim()));

      // Fetch Agreements
      const { data: agreementMsgs } = await supabase
        .from('messages').select('*').like('text', '%[AGREEMENT_%').order('created_at', { ascending: false });

      if (agreementMsgs) {
         const aggrMap = new Map();
         agreementMsgs.forEach(msg => {
            const tryParse = (prefix: string, type: string) => {
              if (msg.text.startsWith(prefix)) {
                try {
                  const payload = JSON.parse(msg.text.replace(prefix, '').trim());
                  if (!aggrMap.has(payload.id)) aggrMap.set(payload.id, { ...payload, chat_id: msg.chat_id, type });
                } catch {}
              }
            };
            tryParse('[AGREEMENT_SIGNED]', 'signed');
            tryParse('[AGREEMENT_CANCELLED]', 'cancelled');
            tryParse('[AGREEMENT_DRAFT]', 'pending');
         });
         setAgreements(Array.from(aggrMap.values()));
      }
    } catch (e) {
      console.error("Admin fetch error", e);
    }
    setIsLoading(false);
  };

  useEffect(() => { fetchAdminData(); }, []);

  // Listings = is_listing is not false; Profiles = is_listing is false
  const listings = allSupabaseRoommates.filter(r => r.is_listing !== false && r.is_listing !== 'false');
  const profiles = allSupabaseRoommates.filter(r => r.is_listing === false || r.is_listing === 'false');

  const handleBanUser = async (userId: string) => {
    const ok = await confirm({ title: 'Khóa tài khoản', message: 'Bạn có chắc muốn khóa vĩnh viễn tài khoản này?', confirmText: 'Khóa ngay', type: 'error' });
    if (!ok) return false;
    const { error } = await supabase.from('messages').insert({
      chat_id: 'SYSTEM_BANS', sender_id: currentUser.id, text: `[BAN] ${userId}`
    });
    if (!error) {
      toast('Đã khóa người dùng thành công.', 'success');
      await fetchAdminData();
      return true;
    }
    toast('Không thể khóa người dùng.', 'error');
    return false;
  };

  const resolveChatReport = async (report: any) => {
    const reportMessageId = report.report_message_id || report.id;
    if (!reportMessageId) return;
    await supabase.from('messages').delete().eq('id', reportMessageId);
  };

  const handleDismissChatReport = async (report: any) => {
    const ok = await confirm({
      title: 'Bỏ qua báo cáo',
      message: 'Tin nhắn này không vi phạm và báo cáo sẽ được đóng?',
      confirmText: 'Bỏ qua',
      type: 'success',
    });
    if (!ok) return;
    await resolveChatReport(report);
    toast('Đã đóng báo cáo.', 'success');
    fetchAdminData();
  };

  const handleDeleteReportedMessage = async (report: any) => {
    if (!report.reported_message_id) {
      toast('Báo cáo cũ không gắn ID tin nhắn nên không thể xóa chính xác.', 'warning');
      return;
    }

    const ok = await confirm({
      title: 'Xóa tin nhắn vi phạm',
      message: 'Xóa vĩnh viễn đúng tin nhắn được báo cáo khỏi cuộc trò chuyện?',
      confirmText: 'Xóa tin nhắn',
      type: 'error',
    });
    if (!ok) return;

    const { error } = await supabase.from('messages').delete().eq('id', report.reported_message_id);
    if (error) {
      toast('Không thể xóa tin nhắn.', 'error');
      return;
    }

    await resolveChatReport(report);
    toast('Đã xóa tin nhắn vi phạm.', 'success');
    fetchAdminData();
  };

  const handleBanReportedUser = async (report: any, targetAccountId: string) => {
    const banned = await handleBanUser(targetAccountId);
    if (!banned) return;
    await resolveChatReport(report);
    fetchAdminData();
  };

  const resolveReviewReport = async (report: any, status: 'dismissed' | 'review_deleted' | 'user_banned') => {
    if (report.source === 'table') {
      await supabase.from('review_reports').update({ status }).eq('id', report.id);
    } else {
      await supabase.from('messages').delete().eq('id', report.id);
    }
  };

  const handleDismissReviewReport = async (report: any) => {
    const ok = await confirm({
      title: 'Bỏ qua báo cáo',
      message: 'Feedback này bình thường và không cần xử lý?',
      confirmText: 'Bỏ qua',
      type: 'success',
    });
    if (!ok) return;
    await resolveReviewReport(report, 'dismissed');
    toast('Đã bỏ qua báo cáo.', 'success');
    fetchAdminData();
  };

  const handleDeleteReportedReview = async (report: any) => {
    const ok = await confirm({
      title: 'Xóa feedback',
      message: 'Xóa vĩnh viễn feedback này khỏi hệ thống?',
      confirmText: 'Xóa feedback',
      type: 'error',
    });
    if (!ok) return;

    const { error } = await supabase.from('reviews').delete().eq('id', report.review_id);
    if (error) {
      toast('Không thể xóa feedback.', 'error');
      return;
    }
    await resolveReviewReport(report, 'review_deleted');
    onReviewDeleted?.(report.review_id);
    toast('Đã xóa feedback phản cảm.', 'success');
    fetchAdminData();
  };

  const handleBanReviewAuthor = async (report: any) => {
    const reviewerId = report.review?.reviewer_id;
    if (!reviewerId) {
      toast('Feedback cũ chưa gắn tài khoản nên không thể khóa chính xác người viết.', 'warning');
      return;
    }
    const banned = await handleBanUser(reviewerId);
    if (!banned) return;
    await resolveReviewReport(report, 'user_banned');
    fetchAdminData();
  };

  const handleUnbanUser = async (userId: string) => {
    const ok = await confirm({ title: 'Mở khóa tài khoản', message: 'Bạn có chắc muốn mở khóa tài khoản này?', confirmText: 'Mở khóa', type: 'success' });
    if (!ok) return;
    const { data: banMsgs } = await supabase.from('messages').select('id, text').eq('chat_id', 'SYSTEM_BANS');
    if (banMsgs) {
       const msgsToDelete = banMsgs.filter(m => m.text.includes(userId)).map(m => m.id);
       for (const id of msgsToDelete) await supabase.from('messages').delete().eq('id', id);
    }
    toast('✅ Đã mở khóa tài khoản.', 'success'); fetchAdminData();
  };

  const handleDeleteListing = async (table: 'roommates' | 'rooms', id: string) => {
    const ok = await confirm({ title: 'Xóa bài đăng', message: 'Xóa vĩnh viễn bài đăng này? Hành động không thể hoàn tác.', confirmText: 'Xóa ngay', type: 'error' });
    if (!ok) return;
    await supabase.from(table).delete().eq('id', id);
    if (table === 'roommates' && onDeleteRoommate) onDeleteRoommate(id);
    if (table === 'rooms' && onDeleteRoom) onDeleteRoom(id);
    toast('🗑️ Đã xóa tin đăng.', 'info'); fetchAdminData();
  };

  const handleDeleteAgreement = async (id: string) => {
    const ok = await confirm({ title: 'Hủy hợp đồng', message: 'Bạn có chắc chắn muốn hủy bỏ hợp đồng này?', confirmText: 'Hủy hợp đồng', type: 'warning' });
    if (!ok) return;
    const target = agreements.find(a => a.id === id);
    if (target) {
       await supabase.from('messages').insert({ chat_id: target.chat_id, sender_id: currentUser.id, text: `[AGREEMENT_CANCELLED] {"id":"${id}"}` });
       const ids = target.chat_id.split('_');
       if (ids.length === 2) await supabase.from('roommates').update({ status: 'Đang tìm' }).in('id', ids);
       toast('✅ Đã hủy hợp đồng thành công.', 'success'); fetchAdminData();
    }
  };

  const tabBtn = (tab: typeof activeTab, label: string, count: number, icon: React.ReactNode, color: string) => (
    <button onClick={() => setActiveTab(tab)}
      className={`px-5 py-3 rounded-xl font-bold flex items-center gap-2 transition-all ${activeTab === tab ? color : "bg-white text-slate-600 hover:bg-slate-50"}`}>
      {icon} {label} ({count})
    </button>
  );

  const UserCard = ({ rm, isBanned }: { rm: any; isBanned: boolean }) => (
    <div className="border border-slate-200 p-4 rounded-2xl flex items-start gap-4 relative overflow-hidden">
      {isBanned && <div className="absolute inset-0 bg-slate-900/10 backdrop-blur-[1px] z-10 flex items-center justify-center pointer-events-none"><span className="bg-rose-600 text-white px-3 py-1 rounded-full text-xs font-black shadow-lg">BANNED</span></div>}
      <img src={rm.avatar} className="w-12 h-12 rounded-full object-cover shrink-0" alt={rm.name} />
      <div className="flex-1 min-w-0">
        <p className="font-bold text-slate-800 truncate">{rm.name}</p>
        <p className="text-xs text-slate-500 truncate">{rm.role} · {rm.district}</p>
        {rm.budget ? <p className="text-xs text-[#006590] font-semibold mt-0.5">{(rm.budget/1000000).toFixed(1)} tr/tháng</p> : null}
        <p className="text-[10px] text-slate-400 mt-1 truncate font-mono">UID: {rm.user_id || rm.postedBy || '—'}</p>
        {rm.createdAt && <p className="text-[10px] text-slate-400">Đăng: {new Date(rm.createdAt).toLocaleString('vi-VN')}</p>}
      </div>
      <div className="flex flex-col gap-1.5 z-20 shrink-0">
        {!isBanned && (rm.user_id || rm.id) && (
          <button onClick={() => handleBanUser(rm.user_id || rm.id)} className="p-2 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-xl transition-colors" title="Khóa user">
            <Ban className="w-4 h-4" />
          </button>
        )}
        {isBanned && (
          <button onClick={() => handleUnbanUser(rm.user_id || rm.id)} className="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-xl transition-colors" title="Mở khóa">
            <ShieldCheck className="w-4 h-4" />
          </button>
        )}
        <button onClick={() => handleDeleteListing('roommates', rm.id)} className="p-2 bg-slate-50 text-slate-400 hover:bg-slate-200 hover:text-slate-700 rounded-xl transition-colors" title="Xóa">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 mt-16 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
          <Shield className="w-8 h-8 text-rose-600" /> Bảng Điều Khiển Quản Trị
        </h1>
        <p className="text-slate-500 mt-2">Hệ thống quản lý nội dung, tài khoản và xử lý vi phạm</p>
      </div>

      <div className="flex flex-wrap gap-3 mb-8">
        {tabBtn("reports", "Báo cáo", reports.length, <AlertTriangle className="w-5 h-5" />, "bg-rose-100 text-rose-700")}
        {tabBtn("reviewReports", "Feedback bị báo cáo", reviewReports.length, <Flag className="w-5 h-5" />, "bg-amber-100 text-amber-700")}
        {tabBtn("listings", "Bài đăng tìm bạn", listings.length, <Users className="w-5 h-5" />, "bg-sky-100 text-[#006590]")}
        {tabBtn("users", "Hồ sơ người dùng", profiles.length, <UserCheck className="w-5 h-5" />, "bg-purple-100 text-purple-700")}
        {tabBtn("rooms", "Tin đăng phòng", rooms.length, <FileText className="w-5 h-5" />, "bg-emerald-100 text-emerald-700")}
        {tabBtn("agreements", "Hợp đồng", agreements.length, <FileText className="w-5 h-5" />, "bg-amber-100 text-amber-700")}
      </div>

      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100">
        {isLoading ? (
          <div className="text-center py-20 text-slate-400 font-bold animate-pulse">Đang tải dữ liệu...</div>
        ) : (
          <>
            {/* TAB: REPORTED REVIEWS */}
            {activeTab === "reviewReports" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-black text-slate-800">Feedback bị báo cáo</h3>
                  <p className="text-sm text-slate-500 mt-1">Kiểm tra nội dung rồi bỏ qua, xóa feedback hoặc khóa tài khoản người viết.</p>
                </div>
                {reviewReports.length === 0 ? (
                  <div className="text-center py-10 bg-slate-50 rounded-2xl">
                    <ShieldCheck className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                    <p className="text-slate-500 font-bold">Không có feedback nào đang chờ xử lý.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reviewReports.map(report => {
                      const review = report.review;
                      const reviewerId = review?.reviewer_id;
                      const isReviewerBanned = reviewerId ? bannedUsers.includes(reviewerId) : false;
                      return (
                        <div key={`${report.source}-${report.id}`} className="border border-amber-200 bg-amber-50/30 p-5 rounded-2xl">
                          <div className="flex flex-col lg:flex-row gap-5">
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2 mb-3">
                                <span className="bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full text-[11px] font-black">CHỜ XỬ LÝ</span>
                                <span className="text-xs text-slate-500">{report.created_at ? new Date(report.created_at).toLocaleString('vi-VN') : 'Không rõ thời gian'}</span>
                              </div>
                              <div className="flex items-center gap-3 mb-3">
                                <img
                                  src={review.reviewer_avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=100&auto=format&fit=crop"}
                                  alt=""
                                  className="w-10 h-10 rounded-full object-cover border border-slate-200"
                                />
                                <div>
                                  <p className="font-bold text-slate-800">{review.reviewer_name || 'Người dùng cũ'}</p>
                                  <div className="flex items-center gap-1 text-amber-500">
                                    {Array.from({ length: 5 }).map((_, index) => (
                                      <Star key={index} className={`w-3.5 h-3.5 ${index < Number(review.rating) ? 'fill-amber-400' : 'text-slate-300'}`} />
                                    ))}
                                  </div>
                                </div>
                              </div>
                              <blockquote className="bg-white border border-slate-200 rounded-xl p-4 text-sm text-slate-700 font-medium break-words">
                                “{review.comment}”
                              </blockquote>
                              <div className="mt-3 text-xs text-slate-500 space-y-1">
                                <p><span className="font-bold">Lý do báo cáo:</span> {report.reason}</p>
                                <p><span className="font-bold">Người báo cáo:</span> {report.reporter_id}</p>
                                <p><span className="font-bold">Tài khoản người viết:</span> {reviewerId || 'Legacy, chưa xác định'}</p>
                              </div>
                            </div>
                            <div className="grid grid-cols-1 gap-2 w-full lg:w-44 shrink-0">
                              <button onClick={() => handleDismissReviewReport(report)} className="flex items-center justify-center gap-2 bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-50 px-3 py-2.5 rounded-xl text-sm font-bold">
                                <Check className="w-4 h-4" /> Bỏ qua
                              </button>
                              <button onClick={() => handleDeleteReportedReview(report)} className="flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-3 py-2.5 rounded-xl text-sm font-bold">
                                <Trash2 className="w-4 h-4" /> Xóa feedback
                              </button>
                              <button
                                onClick={() => handleBanReviewAuthor(report)}
                                disabled={!reviewerId || isReviewerBanned}
                                className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 text-white px-3 py-2.5 rounded-xl text-sm font-bold disabled:cursor-not-allowed"
                                title={!reviewerId ? 'Feedback legacy chưa có ID tài khoản' : undefined}
                              >
                                <Ban className="w-4 h-4" /> {isReviewerBanned ? 'Đã khóa' : 'Khóa tài khoản'}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB: REPORTS */}
            {activeTab === "reports" && (
              <div className="space-y-6">
                <h3 className="text-lg font-black text-slate-800">Danh sách báo cáo</h3>
                {reports.length === 0 ? (
                  <div className="text-center py-10 bg-slate-50 rounded-2xl">
                    <ShieldCheck className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                    <p className="text-slate-500 font-bold">Không có báo cáo vi phạm nào.</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {reports.map(report => {
                      const targetUser = allSupabaseRoommates.find(r => r.id === report.target_id || r.user_id === report.target_id);
                      const targetAccountId = targetUser?.user_id || targetUser?.auth_id || report.target_id;
                      const isBanned = bannedUsers.includes(targetAccountId);
                      return (
                        <div key={report.report_message_id || report.id} className="border border-rose-100 bg-rose-50/30 p-5 rounded-2xl flex flex-col md:flex-row gap-5 items-start">
                          <div className="flex-1 space-y-3">
                            <div className="flex items-center gap-2">
                              <span className="bg-rose-100 text-rose-700 px-3 py-1 rounded-full text-xs font-black">REPORT</span>
                              <span className="text-xs text-slate-500">{new Date(report.created_at).toLocaleString('vi-VN')}</span>
                            </div>
                            <p className="text-sm"><span className="font-bold text-slate-700">Người bị report: </span><span className="text-rose-600 font-black">{targetUser?.name || report.target_id}</span></p>
                            <p className="text-xs text-slate-500"><span className="font-bold">Người báo cáo: </span>{report.sender_id}</p>
                            <p className="text-sm"><span className="font-bold text-slate-700">Lý do: </span>{report.reason}</p>
                            {report.reported_message_id && (
                              <div className="rounded-xl border border-rose-200 bg-white p-4">
                                <p className="mb-2 text-[11px] font-black uppercase tracking-wider text-rose-600">Tin nhắn bị báo cáo</p>
                                <p className="break-words text-sm font-semibold text-slate-700">
                                  {report.reported_message_text || 'Đã gửi một hình ảnh'}
                                </p>
                                {report.reported_message_image && (
                                  <img
                                    src={report.reported_message_image}
                                    alt="Tin nhắn bị báo cáo"
                                    className="mt-3 max-h-48 rounded-lg border border-slate-200 object-contain"
                                  />
                                )}
                                {report.reported_message_timestamp && (
                                  <p className="mt-2 text-[10px] text-slate-400">
                                    {new Date(report.reported_message_timestamp).toLocaleString('vi-VN')}
                                  </p>
                                )}
                              </div>
                            )}
                            {report.image && (
                              <div className="mt-3">
                                <span className="font-bold text-slate-700 text-sm block mb-2">Ảnh minh chứng:</span>
                                <img src={report.image} alt="Proof" className="w-48 h-auto rounded-lg border border-slate-200" />
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col gap-2 min-w-[160px]">
                            <button
                              onClick={() => handleDismissChatReport(report)}
                              className="w-full bg-white border border-emerald-200 hover:bg-emerald-50 text-emerald-700 font-bold py-2.5 rounded-xl text-sm transition-colors"
                            >
                              Bỏ qua
                            </button>
                            <button
                              onClick={() => handleDeleteReportedMessage(report)}
                              disabled={!report.reported_message_id}
                              className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold py-2.5 rounded-xl text-sm transition-colors disabled:cursor-not-allowed"
                              title={!report.reported_message_id ? 'Báo cáo cũ chưa gắn tin nhắn cụ thể' : undefined}
                            >
                              Xóa tin nhắn
                            </button>
                            {isBanned ? (
                              <button onClick={() => handleUnbanUser(targetAccountId)} className="w-full bg-emerald-100 hover:bg-emerald-200 text-emerald-700 font-bold py-2.5 rounded-xl text-sm transition-colors">Mở khóa User</button>
                            ) : (
                              <button onClick={() => handleBanReportedUser(report, targetAccountId)} className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 rounded-xl text-sm transition-colors">Khóa Tài Khoản</button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB: LISTINGS */}
            {activeTab === "listings" && (
              <div className="space-y-6">
                <h3 className="text-lg font-black text-slate-800">Tất cả bài đăng tìm bạn ở ghép ({listings.length})</h3>
                {listings.length === 0 ? (
                  <div className="text-center py-10 bg-slate-50 rounded-2xl"><p className="text-slate-500 font-bold">Chưa có bài đăng nào.</p></div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {listings.map(rm => <UserCard key={rm.id} rm={rm} isBanned={rm.user_id ? bannedUsers.includes(rm.user_id) : bannedUsers.includes(rm.id)} />)}
                  </div>
                )}
              </div>
            )}

            {/* TAB: USERS (profiles) */}
            {activeTab === "users" && (
              <div className="space-y-6">
                <h3 className="text-lg font-black text-slate-800">Hồ sơ người dùng ({profiles.length})</h3>
                {profiles.length === 0 ? (
                  <div className="text-center py-10 bg-slate-50 rounded-2xl"><p className="text-slate-500 font-bold">Chưa có hồ sơ nào.</p></div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {profiles.map(rm => <UserCard key={rm.id} rm={rm} isBanned={rm.user_id ? bannedUsers.includes(rm.user_id) : bannedUsers.includes(rm.id)} />)}
                  </div>
                )}
              </div>
            )}

            {/* TAB: ROOMS */}
            {activeTab === "rooms" && (
              <div className="space-y-6">
                <h3 className="text-lg font-black text-slate-800">Quản lý tin đăng phòng ({rooms.length})</h3>
                {rooms.length === 0 ? (
                  <div className="text-center py-10 bg-slate-50 rounded-2xl"><p className="text-slate-500 font-bold">Chưa có tin phòng nào.</p></div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {rooms.map(room => (
                      <div key={room.id} className="border border-slate-200 p-4 rounded-2xl flex gap-4">
                        <img src={room.images?.[0] || (room as any).hostAvatar} className="w-16 h-16 rounded-xl object-cover" alt={room.title} />
                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                          <div>
                            <p className="font-bold text-slate-800 text-sm line-clamp-2">{room.title}</p>
                            <p className="text-xs text-slate-500 truncate">{room.district}</p>
                            <p className="text-[10px] text-slate-400 mt-1 font-mono truncate">UID: {(room as any).user_id || (room as any).postedBy || 'Mẫu hệ thống'}</p>
                          </div>
                          <div className="flex justify-between items-center mt-2">
                             <span className="text-xs font-bold text-emerald-600">{(room.price/1000000).toFixed(1)} tr/tháng</span>
                             <button onClick={() => handleDeleteListing('rooms', room.id)} className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-lg transition-colors"><Trash2 className="w-3 h-3" /></button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB: AGREEMENTS */}
            {activeTab === "agreements" && (
              <div className="space-y-6">
                <h3 className="text-lg font-black text-slate-800">Quản lý Hợp đồng & Thỏa thuận ({agreements.length})</h3>
                {agreements.length === 0 ? (
                  <div className="text-center py-10 bg-slate-50 rounded-2xl"><p className="text-slate-500 font-bold">Chưa có hợp đồng nào.</p></div>
                ) : (
                  <div className="space-y-4">
                    {agreements.map((ag) => (
                      <div key={ag.id} className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm flex items-center justify-between">
                        <div>
                          <p className="font-bold text-slate-800 flex items-center gap-2">
                             Mã HĐ: {ag.id.substring(0, 8).toUpperCase()}
                             <span className={`px-2 py-0.5 text-[10px] uppercase font-black rounded-md ${ag.type === 'signed' ? 'bg-emerald-100 text-emerald-700' : ag.type === 'cancelled' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                               {ag.type === 'signed' ? 'Đã Ký' : ag.type === 'cancelled' ? 'Đã Hủy' : 'Chờ Ký'}
                             </span>
                          </p>
                          <p className="text-sm text-slate-500 mt-1">Ngày tạo/ký: {new Date(ag.timestamp).toLocaleString("vi-VN")}</p>
                          {ag.rules && <p className="text-xs text-slate-400 mt-1 line-clamp-1">Điều khoản: {JSON.stringify(ag.rules)}</p>}
                        </div>
                        <button onClick={() => handleDeleteAgreement(ag.id)} className="p-2 text-rose-500 bg-rose-50 hover:bg-rose-100 rounded-xl">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
