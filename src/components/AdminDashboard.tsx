import { useState, useEffect } from "react";
import { Users, AlertTriangle, Shield, Trash2, Ban, ShieldCheck, FileText, UserCheck, Flag, Check, Star, RefreshCw, Search, Image as ImageIcon, X } from "lucide-react";
import { supabase } from "../lib/supabase";
import { Roommate, Room } from "../types";
import { useDialog } from "./ui/DialogProvider";
import {
  CHAT_REPORT_PREFIX,
  REVIEW_REPORT_PREFIX,
  isModerationChannel,
} from "../lib/moderation";
import { removePublicStorageUrls } from "../lib/storage";

interface AdminDashboardProps {
  currentUser: any;
  roommates: Roommate[];
  rooms: Room[];
  onDeleteRoommate?: (id: string) => void;
  onDeleteRoom?: (id: string) => void;
  onApproveListing?: (table: 'roommates' | 'rooms', id: string) => void;
  onRejectListing?: (table: 'roommates' | 'rooms', id: string, reason: string) => void;
  onReviewDeleted?: (id: string) => void;
  onViewRoommate?: (roommate: Roommate) => void;
  onViewRoom?: (room: Room) => void;
}

export default function AdminDashboard({ currentUser, roommates, rooms, onDeleteRoommate, onDeleteRoom, onApproveListing, onRejectListing, onReviewDeleted, onViewRoommate, onViewRoom }: AdminDashboardProps) {
  const { confirm, toast, previewImage } = useDialog();
  const [activeTab, setActiveTab] = useState<"reports" | "reviewReports" | "pendingListings" | "users" | "listings" | "rooms" | "agreements">("reviewReports");
  const [reports, setReports] = useState<any[]>([]);
  const [reviewReports, setReviewReports] = useState<any[]>([]);
  const [bannedUsers, setBannedUsers] = useState<string[]>([]);
  const [agreements, setAgreements] = useState<any[]>([]);
  const [allSupabaseRoommates, setAllSupabaseRoommates] = useState<any[]>([]);
  const [allSupabaseRooms, setAllSupabaseRooms] = useState<any[]>(rooms || []);
  const [isLoading, setIsLoading] = useState(true);
  const [adminUserIds, setAdminUserIds] = useState<string[]>([]);
  const [rejectingItem, setRejectingItem] = useState<{ table: 'roommates' | 'rooms'; item: any } | null>(null);
  const [rejectReasonInput, setRejectReasonInput] = useState('');

  useEffect(() => {
    if (rooms && rooms.length > 0) {
      setAllSupabaseRooms(rooms);
    }
  }, [rooms]);

  const fetchAdminData = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    try {
      // Fetch ALL roommates from Supabase (both profiles and listings)
      const { data: allRoommatesData } = await supabase
        .from('roommates')
        .select('*')
        .order('createdAt', { ascending: false });
      if (allRoommatesData) setAllSupabaseRoommates(allRoommatesData);

      // Fetch ALL rooms from Supabase
      const { data: allRoomsData } = await supabase
        .from('rooms')
        .select('*')
        .order('createdAt', { ascending: false });
      if (allRoomsData) setAllSupabaseRooms(allRoomsData);

      // Fetch admin roles
      const { data: adminRoles } = await supabase.from('admin_roles').select('user_id');
      if (adminRoles) setAdminUserIds(adminRoles.map((r: any) => r.user_id));

      // Fetch Reports
      const { data: reportMsgs, error: reportError } = await supabase
        .from('messages')
        .select('*')
        .like('chat_id', `${CHAT_REPORT_PREFIX}%`);

      if (reportError) {
        console.error('[Admin] Cannot load chat reports:', reportError);
        toast(`Không thể tải báo cáo chat: ${reportError.message}`, 'error', 5000);
      }

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
        })
          .filter(r => r.target_id)
          .sort(
            (a, b) =>
              new Date(b.created_at || 0).getTime() -
              new Date(a.created_at || 0).getTime()
          );
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
        .like('chat_id', `${REVIEW_REPORT_PREFIX}%`);

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
      const legacyBannedIds = banMsgs ? banMsgs.map(m => m.text.replace('[BAN]', '').trim()) : [];
      
      const nowIso = new Date().toISOString();
      const { data: lockedRoommates } = await supabase.from('roommates').select('id, user_id, locked_until').or(`is_locked.eq.true,locked_until.gt.${nowIso}`);
      const dbLockedIds = lockedRoommates ? lockedRoommates.map(r => r.user_id || r.id).filter(Boolean) : [];
      
      const combinedBannedUsers = [...new Set([...legacyBannedIds, ...dbLockedIds])];
      setBannedUsers(combinedBannedUsers);

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
    if (showLoading) setIsLoading(false);
  };

  useEffect(() => {
    fetchAdminData();

    const refreshReports = () => fetchAdminData(false);
    const reportChannel = supabase
      .channel('admin-report-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages' },
        (payload) => {
          const row = (payload.new && Object.keys(payload.new).length > 0)
            ? payload.new
            : payload.old;
          if (
            isModerationChannel(row?.chat_id, CHAT_REPORT_PREFIX) ||
            isModerationChannel(row?.chat_id, REVIEW_REPORT_PREFIX)
          ) {
            refreshReports();
          }
        }
      )
      .subscribe();

    window.addEventListener('focus', refreshReports);
    document.addEventListener('visibilitychange', refreshReports);

    return () => {
      supabase.removeChannel(reportChannel);
      window.removeEventListener('focus', refreshReports);
      document.removeEventListener('visibilitychange', refreshReports);
    };
  }, []);

  // Listings = is_listing is not false; Profiles = is_listing is false
  const activeRooms = allSupabaseRooms.length > 0 ? allSupabaseRooms : rooms;
  const listings = allSupabaseRoommates.filter(r => r.is_listing !== false && String(r.is_listing) !== 'false');
  const profiles = allSupabaseRoommates.filter(r => r.is_listing === false || String(r.is_listing) === 'false');
  
  const pendingListings = listings.filter(r => (r.isVerified === false || String(r.isVerified) === 'false') && !r.rejectReason);
  const pendingRooms = activeRooms.filter(r => (r.isVerifiedRoom === false || String(r.isVerifiedRoom) === 'false') && !r.rejectReason);

  const approvedListings = listings.filter(r => r.isVerified === true || String(r.isVerified) === 'true' || (r.isVerified === undefined && !r.rejectReason));
  const approvedRooms = activeRooms.filter(r => r.isVerifiedRoom === true || String(r.isVerifiedRoom) === 'true' || (r.isVerifiedRoom === undefined && !r.rejectReason));

  const handleBanUser = async (userId: string) => {
    const ok = await confirm({ title: 'Khóa tài khoản', message: 'Bạn có chắc muốn khóa vĩnh viễn tài khoản này?', confirmText: 'Khóa ngay', type: 'error' });
    if (!ok) return false;

    // Gọi hàm RPC bỏ qua RLS để ép khóa tài khoản
    const { error: rpcError } = await supabase.rpc('admin_ban_user', { target_user_id: userId });
    if (rpcError) {
      console.error("Error calling admin_ban_user RPC:", rpcError);
      // Fallback nếu người dùng chưa kịp chạy file SQL
      await supabase.from('profiles').update({ is_locked: true }).eq('auth_id', userId);
      await supabase.from('roommates').update({ is_locked: true }).eq('user_id', userId);
    }

    const { error } = await supabase.from('messages').insert({
      chat_id: 'SYSTEM_BANS', sender_id: currentUser.id, text: `[BAN] ${userId}`
    });
    if (!error) {
      setBannedUsers(previous =>
        previous.includes(userId) ? previous : [...previous, userId]
      );
      toast('Đã khóa người dùng thành công.', 'success');
      return true;
    }
    toast('Không thể khóa người dùng.', 'error');
    return false;
  };

  const removeReportEvidence = async (report: any) => {
    const evidenceUrls = [
      report.image,
      report.evidence_url,
      report.evidence_image_url,
      report.screenshot_url,
      ...(Array.isArray(report.evidence_images) ? report.evidence_images : []),
    ].filter(Boolean);

    if (evidenceUrls.length === 0) return true;

    try {
      await removePublicStorageUrls(evidenceUrls, "reports");
      return true;
    } catch (storageError) {
      console.error("[Admin] Could not remove report evidence:", storageError);
      toast(
        "Không thể xóa ảnh minh chứng trên Storage. Báo cáo vẫn được giữ lại để tránh tồn ảnh rác.",
        "error",
        5000
      );
      return false;
    }
  };

  const resolveChatReport = async (report: any) => {
    const reportMessageId = report.report_message_id || report.id;
    if (!reportMessageId) return false;

    const evidenceRemoved = await removeReportEvidence(report);
    if (!evidenceRemoved) return false;

    const { error } = await supabase.from('messages').delete().eq('id', reportMessageId);
    if (error) return false;
    setReports(previous =>
      previous.filter(item => (item.report_message_id || item.id) !== reportMessageId)
    );
    return true;
  };

  const handleDismissChatReport = async (report: any) => {
    const ok = await confirm({
      title: 'Bỏ qua báo cáo',
      message: 'Tin nhắn này không vi phạm và báo cáo sẽ được đóng?',
      confirmText: 'Bỏ qua',
      type: 'success',
    });
    if (!ok) return;
    const resolved = await resolveChatReport(report);
    if (!resolved) {
      toast('Không thể đóng báo cáo.', 'error');
      return;
    }
    toast('Đã đóng báo cáo.', 'success');
  };

  const handleDeleteReportedMessage = async (report: any) => {
    const messageIds = Array.isArray(report.reported_messages)
      ? report.reported_messages.map((message: any) => message.id).filter(Boolean)
      : report.reported_message_id
        ? [report.reported_message_id]
        : [];
    if (messageIds.length === 0) {
      toast('Báo cáo cũ không gắn ID tin nhắn nên không thể xóa chính xác.', 'warning');
      return;
    }

    const ok = await confirm({
      title: 'Xóa tin nhắn vi phạm',
      message: `Xóa vĩnh viễn ${messageIds.length} tin nhắn được báo cáo khỏi cuộc trò chuyện?`,
      confirmText: `Xóa ${messageIds.length} tin`,
      type: 'error',
    });
    if (!ok) return;

    const { error } = await supabase.from('messages').delete().in('id', messageIds);
    if (error) {
      toast('Không thể xóa tin nhắn.', 'error');
      return;
    }

    const resolved = await resolveChatReport(report);
    if (!resolved) {
      toast(
        `Đã xóa ${messageIds.length} tin nhắn nhưng chưa thể đóng báo cáo. Vui lòng thử lại.`,
        "warning",
        5000
      );
      return;
    }
    toast(`Đã xóa ${messageIds.length} tin nhắn vi phạm.`, 'success');
  };

  const handleBanReportedUser = async (report: any, targetAccountId: string) => {
    const banned = await handleBanUser(targetAccountId);
    if (!banned) return;
    const resolved = await resolveChatReport(report);
    if (!resolved) {
      toast(
        "Đã khóa tài khoản nhưng chưa thể đóng báo cáo. Vui lòng thử lại.",
        "warning",
        5000
      );
    }
  };

  const resolveReviewReport = async (report: any, _status: 'dismissed' | 'review_deleted' | 'user_banned') => {
    const evidenceRemoved = await removeReportEvidence(report);
    if (!evidenceRemoved) return false;

    let error = null;
    if (report.source === 'table') {
      ({ error } = await supabase.from('review_reports').delete().eq('id', report.id));
    } else {
      ({ error } = await supabase.from('messages').delete().eq('id', report.id));
    }
    if (error) return false;
    setReviewReports(previous =>
      previous.filter(item => !(item.source === report.source && item.id === report.id))
    );
    return true;
  };

  const handleDismissReviewReport = async (report: any) => {
    const ok = await confirm({
      title: 'Bỏ qua báo cáo',
      message: 'Feedback này bình thường và không cần xử lý?',
      confirmText: 'Bỏ qua',
      type: 'success',
    });
    if (!ok) return;
    const resolved = await resolveReviewReport(report, 'dismissed');
    if (!resolved) {
      toast('Không thể đóng báo cáo feedback.', 'error');
      return;
    }
    toast('Đã bỏ qua báo cáo.', 'success');
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
    const resolved = await resolveReviewReport(report, 'review_deleted');
    if (!resolved) {
      toast(
        "Đã xóa feedback nhưng chưa thể đóng báo cáo. Vui lòng thử lại.",
        "warning",
        5000
      );
      return;
    }
    onReviewDeleted?.(report.review_id);
    toast('Đã xóa feedback phản cảm.', 'success');
  };

  const handleBanReviewAuthor = async (report: any) => {
    const reviewerId = report.review?.reviewer_id;
    if (!reviewerId) {
      toast('Feedback cũ chưa gắn tài khoản nên không thể khóa chính xác người viết.', 'warning');
      return;
    }
    const banned = await handleBanUser(reviewerId);
    if (!banned) return;
    const resolved = await resolveReviewReport(report, 'user_banned');
    if (!resolved) {
      toast(
        "Đã khóa tài khoản nhưng chưa thể đóng báo cáo feedback. Vui lòng thử lại.",
        "warning",
        5000
      );
    }
  };

  const handleUnbanUser = async (userId: string) => {
    const ok = await confirm({ title: 'Mở khóa tài khoản', message: 'Bạn có chắc muốn mở khóa tài khoản này?', confirmText: 'Mở khóa', type: 'success' });
    if (!ok) return;

    // 1. Unlock in profiles
    await supabase.from('profiles').update({ is_locked: false, locked_until: null }).eq('id', userId);
    await supabase.from('profiles').update({ is_locked: false, locked_until: null }).eq('auth_id', userId);

    // 2. Unlock in roommates
    await supabase.from('roommates').update({ is_locked: false, locked_until: null }).eq('id', userId);
    await supabase.from('roommates').update({ is_locked: false, locked_until: null }).eq('user_id', userId);

    // 3. Unlock in rooms
    await supabase.from('rooms').update({ locked_until: null }).eq('postedBy', userId);
    await supabase.from('rooms').update({ locked_until: null }).eq('user_id', userId);

    // 4. Clear report history in user_reports to reset report count
    await supabase.from('user_reports').delete().eq('reported_id', userId);

    const { data: banMsgs } = await supabase.from('messages').select('id, text').eq('chat_id', 'SYSTEM_BANS');
    if (banMsgs) {
       const msgsToDelete = banMsgs
         .filter(m => m.text.replace('[BAN]', '').trim() === userId)
         .map(m => m.id);
       if (msgsToDelete.length > 0) {
         const { error } = await supabase.from('messages').delete().in('id', msgsToDelete);
         if (error) {
           toast('Không thể mở khóa tài khoản.', 'error');
           return;
         }
       }
    }
    setBannedUsers(previous => previous.filter(id => id !== userId));
    toast('✅ Đã mở khóa tài khoản.', 'success');
  };

  const handleDeleteListing = async (table: 'roommates' | 'rooms', id: string, typeName: string = 'bài đăng') => {
    const ok = await confirm({ title: `Xóa ${typeName}`, message: `Xóa vĩnh viễn ${typeName} này? Hành động không thể hoàn tác.`, confirmText: 'Xóa ngay', type: 'error' });
    if (!ok) return;
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) {
      toast(`Không thể xóa ${typeName}.`, 'error');
      return;
    }
    if (table === 'roommates' && onDeleteRoommate) onDeleteRoommate(id);
    if (table === 'rooms' && onDeleteRoom) onDeleteRoom(id);
    if (table === 'roommates') {
      setAllSupabaseRoommates(previous => previous.filter(item => item.id !== id));
    }
    toast(`🗑️ Đã xóa ${typeName}.`, 'info');
  };

  const handleDeleteAgreement = async (id: string) => {
    const ok = await confirm({ title: 'Hủy hợp đồng', message: 'Bạn có chắc chắn muốn hủy bỏ hợp đồng này?', confirmText: 'Hủy hợp đồng', type: 'warning' });
    if (!ok) return;
    const target = agreements.find(a => a.id === id);
    if (target) {
       await supabase.from('messages').insert({ chat_id: target.chat_id, sender_id: currentUser.id, text: `[AGREEMENT_CANCELLED] {"id":"${id}"}` });
       const ids = target.chat_id.split('_');
       if (ids.length === 2) await supabase.from('roommates').update({ status: 'Đang tìm' }).in('id', ids);
       setAgreements(previous =>
         previous.map(agreement =>
           agreement.id === id ? { ...agreement, type: 'cancelled' } : agreement
         )
       );
       toast('✅ Đã hủy hợp đồng thành công.', 'success');
    }
  };

  const handleApproveListing = async (table: 'roommates' | 'rooms', id: string) => {
    // 1. Optimistic local state update in AdminDashboard
    if (table === 'roommates') {
      setAllSupabaseRoommates(prev => prev.map(item => item.id === id ? { ...item, isVerified: true, rejectReason: undefined } : item));
    } else {
      setAllSupabaseRooms(prev => prev.map(item => item.id === id ? { ...item, isVerifiedRoom: true, rejectReason: undefined } : item));
    }

    // 2. Notify parent App component to update its state
    onApproveListing?.(table, id);

    // 3. Update Supabase database (try RPC first to bypass RLS, fallback to direct update)
    let updateSuccess = false;
    try {
      const { error: rpcErr } = await supabase.rpc('admin_approve_listing', { p_table: table, p_id: id });
      if (!rpcErr) updateSuccess = true;
    } catch (e) {
      console.warn("RPC admin_approve_listing fallback to direct table update");
    }

    if (!updateSuccess) {
      const field = table === 'roommates' ? 'isVerified' : 'isVerifiedRoom';
      const { error } = await supabase.from(table).update({ [field]: true, rejectReason: null }).eq('id', id).select();
      if (error) {
        console.error("Lỗi duyệt bài trên Supabase:", error);
        toast('Không thể duyệt bài viết trên CSĐL.', 'error');
        fetchAdminData(false);
        return;
      }
    }
    toast('✅ Đã duyệt bài viết thành công!', 'success');
    fetchAdminData(false);
  };

  const handleRejectListing = (table: 'roommates' | 'rooms', item: any) => {
    setRejectingItem({ table, item });
    setRejectReasonInput('');
  };

  const confirmRejectListing = async () => {
    if (!rejectingItem) return;
    const { table, item } = rejectingItem;
    const finalReason = rejectReasonInput.trim();
    if (!finalReason) {
      toast('Vui lòng nhập lý do từ chối.', 'warning');
      return;
    }

    const id = item.id;

    // 1. Optimistic local state update in AdminDashboard
    if (table === 'roommates') {
      setAllSupabaseRoommates(prev => prev.map(r => r.id === id ? { ...r, isVerified: false, rejectReason: finalReason } : r));
    } else {
      setAllSupabaseRooms(prev => prev.map(r => r.id === id ? { ...r, isVerifiedRoom: false, rejectReason: finalReason } : r));
    }

    // 2. Notify parent App component
    onRejectListing?.(table, id, finalReason);

    // 3. Close modal
    setRejectingItem(null);
    setRejectReasonInput('');

    // 4. Update Supabase database (try RPC first to bypass RLS)
    let updateSuccess = false;
    try {
      const { error: rpcErr } = await supabase.rpc('admin_reject_listing', { p_table: table, p_id: id, p_reason: finalReason });
      if (!rpcErr) updateSuccess = true;
    } catch (e) {
      console.warn("RPC admin_reject_listing fallback to direct table update");
    }

    if (!updateSuccess) {
      const { error } = await supabase.from(table).update({ rejectReason: finalReason }).eq('id', id).select();
      if (error) {
        console.error("Lỗi từ chối bài viết trên Supabase:", error);
        toast('Không thể từ chối bài viết trên CSĐL.', 'error');
        fetchAdminData(false);
        return;
      }
    }

    // 5. Send notification message to user chat channel if owner userId exists
    const ownerUserId = item.user_id || item.postedBy || item.auth_id;
    const itemTitle = item.title || item.name || (table === 'roommates' ? 'Bài đăng tìm bạn ở ghép' : 'Tin đăng phòng trọ');

    if (ownerUserId) {
      const chatId = [ownerUserId, currentUser?.id || 'ADMIN'].sort().join('_');
      await supabase.from('messages').insert({
        chat_id: chatId,
        sender_id: currentUser?.id || 'ADMIN',
        text: `🔴 [HỆ THỐNG PHẢN HỒI] Bài viết "${itemTitle}" của bạn không được duyệt.\n\n📌 Lý do từ chối: "${finalReason}"\n\n💡 Hướng dẫn: Vui lòng vào trang quản lý bài viết của bạn để chỉnh sửa thông tin phù hợp và gửi duyệt lại.`
      });
    }

    toast('✅ Đã từ chối bài viết và gửi thông báo phản hồi về cho người dùng!', 'success');
    fetchAdminData(false);
  };

  const handlePromoteAdmin = async (userId: string, userName: string) => {
    const ok = await confirm({ title: 'Cấp quyền Admin', message: `Bạn có chắc muốn cấp quyền Admin cho "${userName}" không?\nHọ sẽ có toàn quyền quản trị hệ thống.`, confirmText: 'Cấp quyền', type: 'warning' });
    if (!ok) return;
    const { error } = await supabase.from('admin_roles').insert({ user_id: userId });
    if (error) { toast('Lỗi: ' + error.message, 'error'); return; }
    setAdminUserIds(prev => [...prev, userId]);
    toast(`✅ Đã cấp quyền Admin cho ${userName}!`, 'success');
  };

  const handleDemoteAdmin = async (userId: string, userName: string) => {
    const ok = await confirm({ title: 'Thu hồi quyền Admin', message: `Bạn có chắc muốn thu hồi quyền Admin của "${userName}" không?`, confirmText: 'Thu hồi', type: 'error' });
    if (!ok) return;
    const { error } = await supabase.from('admin_roles').delete().eq('user_id', userId);
    if (error) { toast('Lỗi: ' + error.message, 'error'); return; }
    setAdminUserIds(prev => prev.filter(id => id !== userId));
    toast(`✅ Đã thu hồi quyền Admin của ${userName}.`, 'success');
  };

  const tabBtn = (tab: typeof activeTab, label: string, count: number, icon: React.ReactNode, color: string) => (
    <button onClick={() => setActiveTab(tab)}
      className={`px-5 py-3 rounded-xl font-bold flex items-center gap-2 transition-all ${activeTab === tab ? color : "bg-white text-slate-600 hover:bg-slate-50"}`}>
      {icon} {label} ({count})
    </button>
  );

  const UserCard = ({ rm, isBanned, itemType = 'bài đăng' }: { rm: any; isBanned: boolean; itemType?: string }) => {
    const uid = rm.user_id || rm.id;
    const isThisAdmin = adminUserIds.includes(uid);
    return (
      <div 
        className="border border-slate-200 p-4 rounded-2xl flex items-start gap-4 relative overflow-hidden cursor-pointer hover:border-sky-300 hover:shadow-md transition-all group"
        onClick={() => onViewRoommate?.(rm)}
      >
        {isBanned && <div className="absolute inset-0 bg-slate-900/10 backdrop-blur-[1px] z-10 flex items-center justify-center pointer-events-none"><span className="bg-rose-600 text-white px-3 py-1 rounded-full text-xs font-black shadow-lg">BANNED</span></div>}
        {isThisAdmin && <div className="absolute top-2 left-2 z-10 bg-amber-400 text-white text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1"><Star className="w-3 h-3" /> ADMIN</div>}
        <img 
          src={rm.avatar} 
          className="w-12 h-12 rounded-full object-cover shrink-0 cursor-zoom-in hover:opacity-80 transition-opacity" 
          alt={rm.name} 
          onClick={(e) => {
            e.stopPropagation();
            previewImage(rm.avatar);
          }}
        />
        <div className="flex-1 min-w-0">
          <p className="font-bold text-slate-800 truncate group-hover:text-sky-700 transition-colors">{rm.name}</p>
          <p className="text-xs text-slate-500 truncate">{rm.role} · {rm.district}</p>
          <div className="text-xs text-slate-600 truncate mt-1 flex flex-col gap-0.5">
            <span className="truncate" title={rm.email || "Chưa cập nhật email"}>✉️ {rm.email || "Chưa cập nhật email"}</span>
            <span className="truncate" title={rm.phoneNumber || "Chưa cập nhật SĐT"}>📞 {rm.phoneNumber || "Chưa cập nhật SĐT"}</span>
          </div>
          {rm.budget ? <p className="text-xs text-[#006590] font-semibold mt-0.5">{(rm.budget/1000000).toFixed(1)} tr/tháng</p> : null}
          <p className="text-[10px] text-slate-400 mt-1 truncate font-mono">UID: {rm.user_id || rm.postedBy || '—'}</p>
          {rm.createdAt && <p className="text-[10px] text-slate-400">Đăng: {new Date(rm.createdAt).toLocaleString('vi-VN')}</p>}
        </div>
        <div className="flex flex-col gap-1.5 z-20 shrink-0" onClick={e => e.stopPropagation()}>
          {/* Promote / Demote Admin */}
          {uid && (
            isThisAdmin ? (
              <button onClick={() => handleDemoteAdmin(uid, rm.name)} className="p-2 bg-amber-50 text-amber-600 hover:bg-amber-600 hover:text-white rounded-xl transition-colors" title="Thu hồi quyền Admin">
                <Star className="w-4 h-4" />
              </button>
            ) : (
              <button onClick={() => handlePromoteAdmin(uid, rm.name)} className="p-2 bg-slate-50 text-slate-400 hover:bg-amber-100 hover:text-amber-600 rounded-xl transition-colors" title="Cấp quyền Admin">
                <Star className="w-4 h-4" />
              </button>
            )
          )}
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
          <button onClick={() => handleDeleteListing('roommates', rm.id, itemType)} className="p-2 bg-slate-50 text-slate-400 hover:bg-slate-200 hover:text-slate-700 rounded-xl transition-colors" title="Xóa">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

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
        {tabBtn("pendingListings", "Duyệt bài đăng", pendingListings.length + pendingRooms.length, <Check className="w-5 h-5" />, "bg-indigo-100 text-indigo-700")}
        {tabBtn("listings", "Bài đăng tìm bạn", approvedListings.length, <Users className="w-5 h-5" />, "bg-sky-100 text-[#006590]")}
        {tabBtn("users", "Hồ sơ người dùng", profiles.length, <UserCheck className="w-5 h-5" />, "bg-purple-100 text-purple-700")}
        {tabBtn("rooms", "Tin đăng phòng", approvedRooms.length, <FileText className="w-5 h-5" />, "bg-emerald-100 text-emerald-700")}
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
                      const reporterUser = allSupabaseRoommates.find(r => r.id === report.reporter_id || r.user_id === report.reporter_id);
                      const reporterName = reporterUser?.name || report.reporter_id;
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
                                  className="w-10 h-10 rounded-full object-cover border border-slate-200 cursor-zoom-in hover:opacity-80"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    previewImage(review.reviewer_avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=100&auto=format&fit=crop");
                                  }}
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
                                <p><span className="font-bold">Người báo cáo:</span> <span className="font-semibold text-emerald-700">{reporterName}</span></p>
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
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-black text-slate-800">Lịch sử Báo Cáo</h3>
                    <p className="text-sm text-slate-500 mt-1">Quản lý và xử lý các báo cáo vi phạm tiêu chuẩn cộng đồng.</p>
                  </div>
                  <button
                    onClick={() => fetchAdminData(true)}
                    disabled={isLoading}
                    className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50"
                  >
                    <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    Tải lại
                  </button>
                </div>

                {/* DEBUG PANEL */}
                <div className="mb-6 p-4 border border-rose-300 bg-rose-50 rounded-xl">
                  <h4 className="font-bold text-rose-700 mb-2">Công cụ nội soi Database (Dành cho Developer)</h4>
                  <button 
                    onClick={async () => {
                      try {
                        const name = "Sơn Tùng MTP";
                        const p = await supabase.from('profiles').select('*').ilike('name', `%${name}%`);
                        const r = await supabase.from('roommates').select('*').ilike('name', `%${name}%`);
                        const targetIds = [...(r.data||[]).map((x:any)=>x.id), ...(r.data||[]).map((x:any)=>x.user_id), ...(r.data||[]).map((x:any)=>x.postedBy)].filter(Boolean);
                        let u = { data: [] };
                        if (targetIds.length > 0) {
                          u = await supabase.from('user_reports').select('*').in('reported_id', targetIds);
                        }
                        const m = await supabase.from('messages').select('*').eq('chat_id', 'SYSTEM_REPORTS');
                        
                        alert(JSON.stringify({ 
                          profiles: p.data, 
                          roommates: r.data, 
                          user_reports: u.data,
                          msg_reports: m.data?.filter(x => x.text.includes(name) || x.text.includes(targetIds[0]))
                        }, null, 2));
                      } catch (err: any) {
                        alert("Lỗi nội soi: " + err.message);
                      }
                    }}
                    className="bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 rounded text-sm font-bold transition-colors"
                  >
                    Nội soi dữ liệu "Sơn Tùng MTP"
                  </button>
                  <p className="text-xs text-rose-600 mt-2">Bấm nút này, copy toàn bộ chữ hiện ra trong bảng thông báo (hoặc chụp ảnh) gửi cho AI để tìm nguyên nhân gốc rễ vì sao tài khoản này có thể lách luật.</p>
                </div>
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
                      const reporterUser = allSupabaseRoommates.find(r => r.id === report.sender_id || r.user_id === report.sender_id);
                      const reporterName = reporterUser?.name || report.sender_id;
                      const isBanned = bannedUsers.includes(targetAccountId);
                      const reportedMessages = Array.isArray(report.reported_messages)
                        ? report.reported_messages
                        : report.reported_message_id
                          ? [{
                              id: report.reported_message_id,
                              text: report.reported_message_text,
                              image_url: report.reported_message_image,
                              timestamp: report.reported_message_timestamp,
                            }]
                          : [];
                      return (
                        <div key={report.report_message_id || report.id} className="border border-rose-100 bg-rose-50/30 p-5 rounded-2xl flex flex-col md:flex-row gap-5 items-start">
                          <div className="flex-1 space-y-3">
                            <div className="flex items-center gap-2">
                              <span className="bg-rose-100 text-rose-700 px-3 py-1 rounded-full text-xs font-black">REPORT</span>
                              <span className="text-xs text-slate-500">{new Date(report.created_at).toLocaleString('vi-VN')}</span>
                            </div>
                            <p className="text-sm"><span className="font-bold text-slate-700">Người bị report: </span><span className="text-rose-600 font-black">{targetUser?.name || report.target_id}</span></p>
                            <p className="text-xs text-slate-500"><span className="font-bold">Người báo cáo: </span><span className="font-semibold text-emerald-700">{reporterName}</span></p>
                            <p className="text-sm"><span className="font-bold text-slate-700">Lý do: </span>{report.reason}</p>
                            {reportedMessages.length > 0 && (
                              <div className="rounded-xl border border-rose-200 bg-white p-4">
                                <p className="mb-3 text-[11px] font-black uppercase tracking-wider text-rose-600">
                                  {reportedMessages.length} tin nhắn bị báo cáo
                                </p>
                                <div className="space-y-2">
                                  {reportedMessages.map((message: any, index: number) => (
                                    <div key={message.id || index} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                                      <p className="break-words text-sm font-semibold text-slate-700">
                                        {message.text || 'Đã gửi một hình ảnh'}
                                      </p>
                                      {message.image_url && (
                                        <img
                                          src={message.image_url}
                                          alt={`Tin nhắn bị báo cáo ${index + 1}`}
                                          className="mt-2 max-h-40 rounded-lg border border-slate-200 object-contain cursor-zoom-in hover:opacity-90"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            previewImage(message.image_url);
                                          }}
                                        />
                                      )}
                                      {message.timestamp && (
                                        <p className="mt-2 text-[10px] text-slate-400">
                                          {new Date(message.timestamp).toLocaleString('vi-VN')}
                                        </p>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {report.image && (
                              <div className="mt-3">
                                <span className="font-bold text-slate-700 text-sm block mb-2">Ảnh minh chứng:</span>
                                <img 
                                  src={report.image} 
                                  alt="Proof" 
                                  className="w-48 h-auto rounded-lg border border-slate-200 cursor-zoom-in hover:opacity-90" 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    previewImage(report.image);
                                  }}
                                />
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
                              disabled={reportedMessages.length === 0}
                              className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold py-2.5 rounded-xl text-sm transition-colors disabled:cursor-not-allowed"
                              title={reportedMessages.length === 0 ? 'Báo cáo cũ chưa gắn tin nhắn cụ thể' : undefined}
                            >
                              Xóa {reportedMessages.length || ''} tin nhắn
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
                <h3 className="text-lg font-black text-slate-800">Tất cả bài đăng tìm bạn ở ghép ({approvedListings.length})</h3>
                {approvedListings.length === 0 ? (
                  <div className="text-center py-10 bg-slate-50 rounded-2xl"><p className="text-slate-500 font-bold">Chưa có bài đăng nào được duyệt.</p></div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {approvedListings.map(rm => <UserCard key={rm.id} rm={rm} isBanned={rm.user_id ? bannedUsers.includes(rm.user_id) : bannedUsers.includes(rm.id)} itemType="bài đăng tìm bạn" />)}
                  </div>
                )}
              </div>
            )}

            {/* TAB: PENDING LISTINGS */}
            {activeTab === "pendingListings" && (
              <div className="space-y-6">
                <h3 className="text-lg font-black text-slate-800">Duyệt bài đăng ({pendingListings.length + pendingRooms.length})</h3>
                {pendingListings.length === 0 && pendingRooms.length === 0 ? (
                  <div className="text-center py-10 bg-slate-50 rounded-2xl"><p className="text-slate-500 font-bold">Không có bài đăng nào cần duyệt.</p></div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {pendingListings.map(rm => (
                      <div key={rm.id} className="relative">
                        <UserCard rm={rm} isBanned={rm.user_id ? bannedUsers.includes(rm.user_id) : bannedUsers.includes(rm.id)} itemType="bài đăng tìm bạn" />
                        <div className="absolute bottom-2 right-12 flex gap-2">
                          <button onClick={() => handleApproveListing('roommates', rm.id)} className="p-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-xl transition-colors shadow-sm" title="Duyệt bài">
                            <Check className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleRejectListing('roommates', rm)} className="p-2 bg-orange-50 text-orange-600 hover:bg-orange-600 hover:text-white rounded-xl transition-colors shadow-sm" title="Từ chối">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                    {pendingRooms.map(room => (
                      <div 
                        key={room.id} 
                        className="border border-slate-200 p-4 rounded-2xl flex gap-4 cursor-pointer hover:border-sky-300 hover:shadow-md transition-all relative"
                        onClick={() => onViewRoom?.(room)}
                      >
                        <img 
                          src={room.images?.[0] || (room as any).hostAvatar} 
                          className="w-16 h-16 rounded-xl object-cover shrink-0 cursor-zoom-in" 
                          alt={room.title} 
                          onClick={(e) => {
                            e.stopPropagation();
                            previewImage(room.images?.[0] || (room as any).hostAvatar);
                          }}
                        />
                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                          <div>
                            <p className="font-bold text-slate-800 text-sm line-clamp-2">{room.title}</p>
                            <p className="text-xs text-slate-500 truncate">{room.district}</p>
                            {room.utilityImage && (
                              <div className="mt-2 flex items-center gap-2">
                                <button 
                                  onClick={(e) => { e.stopPropagation(); previewImage(room.utilityImage!); }}
                                  className="text-[11px] font-bold bg-amber-100 text-amber-700 px-2 py-1 rounded hover:bg-amber-200 transition-colors flex items-center gap-1"
                                >
                                  <ImageIcon className="w-3 h-3" /> Xem hóa đơn
                                </button>
                                <a 
                                  href={`https://lens.google.com/uploadbyurl?url=${encodeURIComponent(room.utilityImage)}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-[11px] font-bold bg-sky-100 text-sky-700 px-2 py-1 rounded hover:bg-sky-200 transition-colors flex items-center gap-1"
                                  title="Tìm kiếm hình ảnh trên Google để check ảnh mạng"
                                >
                                  <Search className="w-3 h-3" /> Check ảnh mạng
                                </a>
                              </div>
                            )}
                          </div>
                          <div className="flex justify-between items-center mt-2">
                             <span className="text-xs font-bold text-emerald-600">{(room.price/1000000).toFixed(1)} tr/tháng</span>
                          </div>
                        </div>
                        <div className="absolute bottom-2 right-2 flex gap-2">
                          <button onClick={(e) => { e.stopPropagation(); handleApproveListing('rooms', room.id); }} className="p-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-xl transition-colors shadow-sm" title="Duyệt bài">
                            <Check className="w-4 h-4" />
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); handleRejectListing('rooms', room); }} className="p-2 bg-orange-50 text-orange-600 hover:bg-orange-600 hover:text-white rounded-xl transition-colors shadow-sm" title="Từ chối">
                            <X className="w-4 h-4" />
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); handleDeleteListing('rooms', room.id, 'tin đăng phòng'); }} className="p-2 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-xl transition-colors shadow-sm" title="Xóa">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
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
                    {profiles.map(rm => <UserCard key={rm.id} rm={rm} isBanned={rm.user_id ? bannedUsers.includes(rm.user_id) : bannedUsers.includes(rm.id)} itemType="hồ sơ" />)}
                  </div>
                )}
              </div>
            )}

            {/* TAB: ROOMS */}
            {activeTab === "rooms" && (
              <div className="space-y-6">
                <h3 className="text-lg font-black text-slate-800">Quản lý tin đăng phòng ({approvedRooms.length})</h3>
                {approvedRooms.length === 0 ? (
                  <div className="text-center py-10 bg-slate-50 rounded-2xl"><p className="text-slate-500 font-bold">Chưa có tin phòng nào được duyệt.</p></div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {approvedRooms.map(room => {
                      const isApproved = room.isVerifiedRoom === true || String(room.isVerifiedRoom) === 'true';
                      const isRejected = !!room.rejectReason;
                      return (
                        <div 
                          key={room.id} 
                          className="border border-slate-200 p-4 rounded-2xl flex flex-col justify-between cursor-pointer hover:border-sky-300 hover:shadow-md transition-all group bg-white"
                          onClick={() => onViewRoom?.(room)}
                        >
                          <div className="flex gap-4">
                            <img 
                              src={room.images?.[0] || (room as any).hostAvatar || "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=300&auto=format&fit=crop"} 
                              className="w-16 h-16 rounded-xl object-cover shrink-0 cursor-zoom-in hover:opacity-80" 
                              alt={room.title} 
                              onClick={(e) => {
                                e.stopPropagation();
                                previewImage(room.images?.[0] || (room as any).hostAvatar);
                              }}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-slate-800 text-sm line-clamp-2 group-hover:text-sky-700 transition-colors">{room.title}</p>
                              <p className="text-xs text-slate-500 truncate mt-0.5">{room.district || room.location}</p>
                              
                              <div className="flex items-center gap-1.5 mt-1.5">
                                {isRejected ? (
                                  <span className="px-2 py-0.5 text-[10px] uppercase font-black rounded-md bg-rose-100 text-rose-700">❌ Từ chối</span>
                                ) : isApproved ? (
                                  <span className="px-2 py-0.5 text-[10px] uppercase font-black rounded-md bg-emerald-100 text-emerald-700">✓ Đã duyệt</span>
                                ) : (
                                  <span className="px-2 py-0.5 text-[10px] uppercase font-black rounded-md bg-amber-100 text-amber-700">⏳ Chờ duyệt</span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-100">
                             <span className="text-xs font-black text-emerald-600">{(room.price / 1000000).toFixed(1)} tr/tháng</span>
                             <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                               {(!isApproved || isRejected) && (
                                 <button 
                                   onClick={() => handleApproveListing('rooms', room.id)} 
                                   className="px-2.5 py-1 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1"
                                   title="Duyệt bài ngay"
                                 >
                                   <Check className="w-3.5 h-3.5" />
                                   Duyệt
                                 </button>
                               )}
                               <button 
                                 onClick={() => handleDeleteListing('rooms', room.id, 'tin đăng phòng')} 
                                 className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-lg transition-colors"
                                 title="Xóa tin đăng"
                               >
                                 <Trash2 className="w-3.5 h-3.5" />
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

      {/* Modal Nhập Lý Do Từ Chối */}
      {rejectingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-100 space-y-5 animate-scale-up">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-black text-rose-600 flex items-center gap-2">
                  <X className="w-6 h-6 p-1 bg-rose-100 rounded-full text-rose-600" />
                  Từ Chối Duyệt Bài Đăng
                </h3>
                <p className="text-xs text-slate-500 font-bold mt-1">
                  Bài viết: <span className="text-slate-800 font-extrabold">{rejectingItem.item.title || rejectingItem.item.name || 'Bài đăng'}</span>
                </p>
              </div>
              <button
                onClick={() => setRejectingItem(null)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5">
              <label className="block text-xs font-black uppercase tracking-wider text-slate-600">
                Chọn nhanh lý do phổ biến:
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  "Thông tin không chính xác / thiếu chi tiết",
                  "Hình ảnh không rõ ràng / vi phạm quy định",
                  "Số điện thoại liên hệ không đúng",
                  "Mức giá hoặc mô tả không khớp thực tế",
                  "Nội dung vi phạm quy chuẩn cộng đồng / Spam"
                ].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setRejectReasonInput(preset)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                      rejectReasonInput === preset
                        ? "bg-rose-50 text-rose-700 border-rose-300 font-bold shadow-xs"
                        : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    + {preset}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
                Lý do từ chối cụ thể (Sẽ gửi phản hồi trực tiếp tới User):
              </label>
              <textarea
                rows={4}
                value={rejectReasonInput}
                onChange={(e) => setRejectReasonInput(e.target.value)}
                placeholder="Nhập lý do chi tiết để người dùng biết cần chỉnh sửa lại điều gì..."
                className="w-full bg-slate-50 border-2 border-slate-200 focus:border-rose-500 focus:bg-white rounded-2xl p-4 text-sm font-medium outline-none transition-all placeholder:text-slate-400 resize-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRejectingItem(null)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-sm cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={confirmRejectListing}
                className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <X className="w-4 h-4" />
                Gửi từ chối &amp; Phản hồi User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
