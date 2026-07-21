import { useState, useEffect, useRef } from "react";
import html2pdf from "html2pdf.js";
import {
  Sparkles,
  User,
  Clock,
  CheckSquare,
  Users,
  CreditCard,
  FileText,
  BadgeCheck,
  Calendar,
  AlertCircle,
  Check,
  RotateCcw,
  Heart,
  Lock,
  X,
  FileEdit,
  Send,
  Eye,
  Download
} from "lucide-react";
import { Roommate } from "../types";
import { supabase } from "../lib/supabase";
import { useDialog } from "./ui/DialogProvider";
import {
  buildAgreementHistory,
  findRoommateByIdentity,
  getRoommateAuthId,
  updateRoomStatusBasedOnAgreements
} from "../utils/agreements";

interface AgreementViewProps {
  roommates: Roommate[];
  currentUserProfile: any;
  preSelectedRoommateId?: string | null;
  currentUser?: any;
  onRequireAuth?: () => void;
  onRequireProfile?: () => void;
  pendingAgreementPayload?: any;
  rooms?: any[];
}

export const QUIET_OPTIONS = [
  { id: "chuan", label: "Khung giờ chuẩn: Yên tĩnh từ 23:00 đến 6:00 sáng hôm sau (Phù hợp với lịch học tập, ngủ nghỉ cơ bản)." },
  { id: "cudemo", label: "Khung giờ cú đêm: Yên tĩnh muộn từ 01:00 đến 7:00 sáng hôm sau (Phù hợp với team chạy deadline, làm việc đêm)." },
  { id: "tudo", label: "Tự do hoàn toàn: Không cố định giờ yên tĩnh, chủ yếu dựa trên sự tôn trọng không gian riêng của nhau." },
  { id: "khac", label: "Quy định khác..." }
];

export const CLEANING_OPTIONS = [
  { id: "tuan", label: "Chia lịch luân phiên theo tuần (Tuần này người A dọn, tuần sau người B dọn)." },
  { id: "co_dinh", label: "Chia việc cố định theo khu vực (Ví dụ: Người A lau sàn, Người B dọn nhà vệ sinh)." },
  { id: "tu_giac", label: "Tự giác cá nhân: Không phân chia lịch, bày ra đâu tự dọn sạch ở đó." },
  { id: "lao_cong", label: "Góp quỹ chung: Cùng đóng tiền thuê dịch vụ dọn dẹp định kỳ (1-2 tuần/lần)." },
  { id: "khac", label: "Quy định khác..." }
];

export const VISITORS_OPTIONS = [
  { id: "khong_dan", label: "Không dẫn bạn về phòng: Không gian chung chỉ dành riêng cho việc ở và học tập cá nhân." },
  { id: "ban_ngay", label: "Được dẫn bạn về ban ngày: Cho phép khách đến chơi hoặc học nhóm ban ngày, tuyệt đối không ở lại qua đêm." },
  { id: "qua_dem_co_han", label: "Cho phép ở lại qua đêm (Có giới hạn): Phải báo trước để xin phép và không quá 2 lần/tuần." },
  { id: "cung_gioi", label: "Chỉ cho phép khách cùng giới tính ngủ lại qua đêm." },
  { id: "khac", label: "Quy định khác..." }
];

export const BILL_OPTIONS = [
  { id: "chia_deu", label: "Chia đều 100%: Tất cả chi phí phòng, điện, nước, wifi, phí dịch vụ được chia đều đặn mỗi tháng." },
  { id: "thuc_te", label: "Chia theo số ngày ở thực tế: Tiền phòng chia đều, tiền điện nước tính theo số ngày có mặt thực tế." },
  { id: "thiet_bi", label: "Chia theo công suất thiết bị: Ai sử dụng thêm các thiết bị công suất lớn (như máy tính bàn) sẽ đóng thêm phụ phí." },
  { id: "khac", label: "Quy định khác..." }
];

export const PET_OPTIONS = [
  { id: "nghiem_cam", label: "Tuyệt đối không nuôi thú cưng để đảm bảo vệ sinh chung." },
  { id: "cho_phep", label: "Cho phép nuôi thú cưng: Yêu cầu tự quản lý, dọn dẹp vệ sinh và khử mùi thường xuyên." },
  { id: "thu_nho", label: "Chỉ cho phép nuôi thú cưng nhỏ trong lồng/bể (chim, cá cảnh, hamster...)." },
  { id: "khac", label: "Quy định khác..." }
];

export default function AgreementView({
  roommates,
  currentUserProfile,
  preSelectedRoommateId = null,
  currentUser,
  onRequireAuth,
  onRequireProfile,
  pendingAgreementPayload,
  rooms
}: AgreementViewProps) {
  const { confirm, toast } = useDialog();
  const [roommateName, setRoommateName] = useState("");
  const [quietHours, setQuietHours] = useState("");
  const [cleaningText, setCleaningText] = useState("");
  const [visitorsText, setVisitorsText] = useState("");
  const [billsText, setBillsText] = useState("");
  const [petsText, setPetsText] = useState("");
  const [otherNotesText, setOtherNotesText] = useState("");
  const pdfRef = useRef<HTMLDivElement>(null);
  
  // Fetch agreements from Supabase
  const [agreements, setAgreements] = useState<any[]>([]);

  // Fetch agreements when component mounts
  useEffect(() => {
    if (!import.meta.env.VITE_SUPABASE_URL || !currentUserProfile || !currentUser) return;
    
    const fetchAgreements = async () => {
      // CRITICAL FIX: Use auth UUID (currentUser.id) not profile ID
      const myAuthId = currentUser.id;
      
      // Fetch messages that contain AGREEMENT tags for the current user
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .like('chat_id', `%${myAuthId}%`)
        .like('text', '%[AGREEMENT_%');
      
      console.log('[AgreementView] Fetched agreements:', { count: data?.length, myAuthId });
      
      if (!error && data) {
        const ownMessages = data.filter((message) =>
          message.chat_id?.split("_").includes(myAuthId)
        );
        setAgreements(buildAgreementHistory(ownMessages, myAuthId));
      }
    };
    
    fetchAgreements();
    
    // ✅ REALTIME SYNC: Subscribe to new agreement messages
    const myAuthId = currentUser.id;
    const channel = supabase
      .channel('agreements-realtime')
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages',
          filter: `chat_id=like.*${myAuthId}*`
        },
        (payload) => {
          console.log('[AgreementView] Realtime agreement message:', payload);
          const msg = payload.new;
          if (msg.text && msg.text.includes('[AGREEMENT_')) {
            // Refetch all agreements to rebuild the map correctly
            fetchAgreements();
          }
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserProfile?.id, currentUser?.id]);

  // Radioactive option ids and local input states
  const [quietOption, setQuietOption] = useState("chuan");
  const [quietOther, setQuietOther] = useState("");

  const [cleaningOption, setCleaningOption] = useState("tuan");
  const [cleaningOther, setCleaningOther] = useState("");

  const [visitorsOption, setVisitorsOption] = useState("khong_dan");
  const [visitorsOther, setVisitorsOther] = useState("");

  const [billsOption, setBillsOption] = useState("chia_deu");
  const [billsOther, setBillsOther] = useState("");

  const [petsOption, setPetsOption] = useState("nghiem_cam");
  const [petsOther, setPetsOther] = useState("");

  // Sync state values hooks
  useEffect(() => {
    if (quietOption === "khac") {
      setQuietHours(quietOther);
    } else {
      const selected = QUIET_OPTIONS.find(o => o.id === quietOption);
      setQuietHours(selected ? selected.label : "");
    }
  }, [quietOption, quietOther]);

  useEffect(() => {
    if (cleaningOption === "khac") {
      setCleaningText(cleaningOther);
    } else {
      const selected = CLEANING_OPTIONS.find(o => o.id === cleaningOption);
      setCleaningText(selected ? selected.label : "");
    }
  }, [cleaningOption, cleaningOther]);

  useEffect(() => {
    if (visitorsOption === "khac") {
      setVisitorsText(visitorsOther);
    } else {
      const selected = VISITORS_OPTIONS.find(o => o.id === visitorsOption);
      setVisitorsText(selected ? selected.label : "");
    }
  }, [visitorsOption, visitorsOther]);

  useEffect(() => {
    if (billsOption === "khac") {
      setBillsText(billsOther);
    } else {
      const selected = BILL_OPTIONS.find(o => o.id === billsOption);
      setBillsText(selected ? selected.label : "");
    }
  }, [billsOption, billsOther]);

  useEffect(() => {
    if (petsOption === "khac") {
      setPetsText(petsOther);
    } else {
      const selected = PET_OPTIONS.find(o => o.id === petsOption);
      setPetsText(selected ? selected.label : "");
    }
  }, [petsOption, petsOther]);

  // Sign states
  const [isAgreed, setIsAgreed] = useState(false);
  const [fullName, setFullName] = useState("");
  const [isAutoFilling, setIsAutoFilling] = useState(false);
  const [isSigned, setIsSigned] = useState(false); // Used to lock form
  const [isEditingDraft, setIsEditingDraft] = useState(false);
  const isFormLocked = isSigned && !isEditingDraft;
  const [signedDate, setSignedDate] = useState<string>("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Sync prop to local state so we can clear it when user clicks "Tạo mới"
  // IMPORTANT: must be declared before ANY useEffect that references localPendingPayload
  const [localPendingPayload, setLocalPendingPayload] = useState<any>(null);
  useEffect(() => {
    setLocalPendingPayload(pendingAgreementPayload);
  }, [pendingAgreementPayload]);

  useEffect(() => {
    if (localPendingPayload) {
      applyLoadedFields(localPendingPayload.rules);
      setOtherNotesText(localPendingPayload.rules.otherNotes || "");
      // Logic khóa form dựa vào status:
      // - 'signed': form bị khóa hoàn toàn, không edit
      // - 'pending' và gửi từ bên kia (sender_id khác): form editable nhưng không ký ngay, chỉ có thể từ chối hoặc sửa
      // - 'pending' và tạo bởi mình: form editable, chờ bên kia ký
      if (localPendingPayload.status === 'signed') {
         setIsSigned(true); // Lock form if signed
      }
      if (localPendingPayload.status === 'signed') {
         setSignedDate(new Date(localPendingPayload.timestamp).toLocaleDateString("vi-VN", {
            year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit"
         }));
      }
    }
  }, [localPendingPayload?.id, currentUserProfile?.id]);

  // Dynamic templates matching each roommate's lifestyle or the default requested requirements
  const getRoommateAgreementFields = (roommate: Roommate) => {
    // Determine custom hours depending on sleep profile
    let quiet = QUIET_OPTIONS[0].label;
    if (roommate.lifestyle?.sleep === "Cú đêm") {
      quiet = QUIET_OPTIONS[1].label;
    }

    // Determine cleaning schedule based on neatness
    let cleaning = CLEANING_OPTIONS[0].label;
    if (roommate.lifestyle?.neatness === "Ngăn nắp") {
      cleaning = CLEANING_OPTIONS[1].label;
    }

    // Determine visitors rule depending on interaction preference
    let visitors = VISITORS_OPTIONS[0].label;
    if (roommate.lifestyle?.interaction === "Hướng ngoại") {
      visitors = VISITORS_OPTIONS[1].label;
    }

    // Determine pets rule depending on pet preference
    let pets = PET_OPTIONS[0].label;
    const petPref = roommate.lifestyle?.pets?.toLowerCase() || "";
    if (petPref.includes("mèo") || petPref.includes("chó") || petPref.includes("thoải mái")) {
      pets = PET_OPTIONS[1].label;
    }

    return {
      quiet,
      cleaning,
      visitors,
      bills: BILL_OPTIONS[0].label,
      pets,
    };
  };

  const applyLoadedFields = (fields: { quiet: string; cleaning: string; visitors: string; bills: string; pets: string; }) => {
    // 1. Quiet
    const matchedQuiet = QUIET_OPTIONS.find(o => o.label === fields.quiet);
    if (matchedQuiet) {
      setQuietOption(matchedQuiet.id);
    } else {
      setQuietOption("khac");
      setQuietOther(fields.quiet);
    }

    // 2. Cleaning
    const matchedCleaning = CLEANING_OPTIONS.find(o => o.label === fields.cleaning);
    if (matchedCleaning) {
      setCleaningOption(matchedCleaning.id);
    } else {
      setCleaningOption("khac");
      setCleaningOther(fields.cleaning);
    }

    // 3. Visitors
    const matchedVisitors = VISITORS_OPTIONS.find(o => o.label === fields.visitors);
    if (matchedVisitors) {
      setVisitorsOption(matchedVisitors.id);
    } else {
      setVisitorsOption("khac");
      setVisitorsOther(fields.visitors);
    }

    // 4. Bills
    const matchedBills = BILL_OPTIONS.find(o => o.label === fields.bills);
    if (matchedBills) {
      setBillsOption(matchedBills.id);
    } else {
      setBillsOption("khac");
      setBillsOther(fields.bills);
    }

    // 5. Pets
    const matchedPets = PET_OPTIONS.find(o => o.label === fields.pets);
    if (matchedPets) {
      setPetsOption(matchedPets.id);
    } else {
      setPetsOption("khac");
      setPetsOther(fields.pets);
    }
  };

  const matchedRoommate = roommateName ? (() => {
    const exactRm = roommates.find((r) => r.name.toLowerCase() === roommateName.toLowerCase());
    if (exactRm) return exactRm;
    const partialRm = roommates.find((r) => r.name.toLowerCase().includes(roommateName.toLowerCase()));
    if (partialRm) return partialRm;
    
    if (rooms) {
      const exactRoom = rooms.find((r: any) => (r.contactName || "Chủ phòng").toLowerCase() === roommateName.toLowerCase());
      if (exactRoom) return findRoommateByIdentity(roommates, exactRoom.user_id || exactRoom.postedBy || exactRoom.auth_id, rooms);
      const partialRoom = rooms.find((r: any) => (r.contactName || "Chủ phòng").toLowerCase().includes(roommateName.toLowerCase()));
      if (partialRoom) return findRoommateByIdentity(roommates, partialRoom.user_id || partialRoom.postedBy || partialRoom.auth_id, rooms);
    }

    try {
      const savedProfileStr = sessionStorage.getItem('roomiematch_preselected_partner_profile');
      if (savedProfileStr) {
        const savedProfile = JSON.parse(savedProfileStr);
        const savedName = (savedProfile.name || "Người dùng").toLowerCase();
        if (savedName === roommateName.toLowerCase() || savedName.includes(roommateName.toLowerCase())) {
          return {
            id: savedProfile.id,
            name: savedProfile.name || "Người dùng",
            avatar: savedProfile.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop",
            role: savedProfile.role || "Bạn cùng phòng",
            user_id: savedProfile.user_id || savedProfile.auth_id,
            auth_id: savedProfile.user_id || savedProfile.auth_id
          } as any as Roommate;
        }
      }
    } catch (e) {
      // Ignore
    }
    
    return null;
  })() : null;
  const partnerAuthId = getRoommateAuthId(matchedRoommate);

  const latestAgreementInDb = agreements.find(
    a => (a.creator_id === currentUser?.id && a.partner_id === partnerAuthId) ||
         (a.partner_id === currentUser?.id && a.creator_id === partnerAuthId)
  );

  const activeAgreement = localPendingPayload || (latestAgreementInDb?.status !== 'cancelled' ? latestAgreementInDb : null);

  // Pre-load default or pre-selected roommate and their active agreement
  useEffect(() => {
    let idealId = preSelectedRoommateId;
    
    let targetRoommate = findRoommateByIdentity(roommates, idealId || undefined, rooms);

    if (targetRoommate) {
      setRoommateName(targetRoommate.name);
    }
  }, [preSelectedRoommateId, roommates]);

  useEffect(() => {
    if (activeAgreement && activeAgreement.status !== 'cancelled') {
      applyLoadedFields(activeAgreement.rules);
      setIsSigned(true);
      setSignedDate(new Date(activeAgreement.created_at || activeAgreement.timestamp).toLocaleDateString("vi-VN", {
        year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit"
      }));
    } else if (matchedRoommate) {
      const draftJson = sessionStorage.getItem(`agreement_draft_${matchedRoommate.id}`);
      if (draftJson) {
        const draft = JSON.parse(draftJson);
        setQuietOption(draft.quietOption || "chuan");
        setQuietOther(draft.quietOther || "");
        setCleaningOption(draft.cleaningOption || "tuan");
        setCleaningOther(draft.cleaningOther || "");
        setVisitorsOption(draft.visitorsOption || "khong_dan");
        setVisitorsOther(draft.visitorsOther || "");
        setBillsOption(draft.billsOption || "chia_deu");
        setBillsOther(draft.billsOther || "");
        setPetsOption(draft.petsOption || "khong_nuoi");
        setPetsOther(draft.petsOther || "");
      } else {
        const fields = getRoommateAgreementFields(matchedRoommate);
        applyLoadedFields(fields);
      }
      if (!localPendingPayload) {
        setIsSigned(false);
        setSignedDate("");
      }
    }
    if (!localPendingPayload) {
      setIsEditingDraft(false);
    }
  }, [matchedRoommate?.id, activeAgreement?.id, localPendingPayload?.id]);

  useEffect(() => {
    if (!matchedRoommate || localPendingPayload) return;
    const draft = {
      quietOption, quietOther,
      cleaningOption, cleaningOther,
      visitorsOption, visitorsOther,
      billsOption, billsOther,
      petsOption, petsOther
    };
    sessionStorage.setItem(`agreement_draft_${matchedRoommate.id}`, JSON.stringify(draft));
  }, [quietOption, quietOther, cleaningOption, cleaningOther, visitorsOption, visitorsOther, billsOption, billsOther, petsOption, petsOther, matchedRoommate?.id, localPendingPayload?.id]);

  const handleRoommateNameChange = (val: string) => {
    setRoommateName(val);
    
    // Auto-fill based on matched name in roommates list if they typed something matching
    const matched = roommates.find((r) => r.name.toLowerCase() === val.toLowerCase()) ||
                    roommates.find((r) => r.name.toLowerCase().includes(val.toLowerCase() || "__NOMATCH__"));
    if (matched) {
      const fields = getRoommateAgreementFields(matched);
      applyLoadedFields(fields);
    }
  };

  const handleSignAgreement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAgreed) { toast('Vui lòng tích chọn đồng ý với các quy định sống chung!', 'warning'); return; }
    if (!fullName.trim()) { toast('Vui lòng nhập họ và tên đầy đủ để tiến hành ký kết!', 'warning'); return; }
    if (!matchedRoommate) return;

    let payload: any;
    let messagePrefix = "";

    const agreementToSign = localPendingPayload || (activeAgreement?.status === 'pending' ? activeAgreement : null);

    if (agreementToSign) {
      // Xác nhận hợp đồng nhận được
      payload = {
        ...agreementToSign,
        status: 'signed',
        creator_id: agreementToSign.creator_id || currentUser.id,
        partner_id: agreementToSign.partner_id || partnerAuthId,
        signed_by: currentUser.id,
        signed_by_name: fullName.trim(),
        signed_at: new Date().toISOString(),
        timestamp: new Date().toISOString()
      };
      messagePrefix = "[AGREEMENT_SIGNED]";
    } else {
      // Tạo hợp đồng mới
      const rules = {
        quiet: quietOption === 'khac' ? quietOther : QUIET_OPTIONS.find(o => o.id === quietOption)?.label,
        cleaning: cleaningOption === 'khac' ? cleaningOther : CLEANING_OPTIONS.find(o => o.id === cleaningOption)?.label,
        visitors: visitorsOption === 'khac' ? visitorsOther : VISITORS_OPTIONS.find(o => o.id === visitorsOption)?.label,
        bills: billsOption === 'khac' ? billsOther : BILL_OPTIONS.find(o => o.id === billsOption)?.label,
        pets: petsOption === 'khac' ? petsOther : PET_OPTIONS.find(o => o.id === petsOption)?.label,
        otherNotes: otherNotesText
      };
      payload = {
        id: crypto.randomUUID(),
        status: 'pending',
        rules,
        creator_id: currentUser.id,
        partner_id: partnerAuthId,
        creator_name: currentUserProfile.name,
        partner_name: matchedRoommate.name,
        creator_avatar: currentUserProfile.avatar,
        partner_avatar: matchedRoommate.avatar,
        created_at: new Date().toISOString(),
        timestamp: new Date().toISOString()
      };
      messagePrefix = "[AGREEMENT_DRAFT]";
    }

    // CRITICAL: Use auth UUID (currentUser.id) not profile ID to match ChatView logic
    const chatId = [currentUser.id, partnerAuthId].sort().join('_');
    const { error } = await supabase.from('messages').insert({
      chat_id: chatId,
      sender_id: currentUser.id,
      text: `${messagePrefix} ${JSON.stringify(payload)}`
    });

    if (!error) {
       if (messagePrefix === "[AGREEMENT_SIGNED]") {
         await supabase.from('roommates').update({ status: 'Đã tìm được' }).in('user_id', [currentUser.id, partnerAuthId]);
         
         // Update capacity statuses for both users
         await updateRoomStatusBasedOnAgreements(currentUser.id, supabase);
         await updateRoomStatusBasedOnAgreements(partnerAuthId, supabase);
         
         // ✅ Show success toast notification
         toast('🎉 Ký thỏa thuận thành công! Chúc bạn có trải nghiệm ở ghép vui vẻ!', 'success', 5000);
       } else {
         // Draft sent successfully
         toast('📝 Đã gửi bản thỏa thuận cho đối tác!', 'success', 3000);
       }
       setShowSuccessModal(true);
       setSignedDate(new Date().toLocaleDateString("vi-VN", {
         year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit"
       }));
       setIsSigned(true);
       
       if (messagePrefix === "[AGREEMENT_SIGNED]") {
         // Auto download PDF after a short delay to allow React state to update UI
         setTimeout(() => {
           if (typeof window !== 'undefined') {
             const pdfBtn = document.getElementById('auto-download-pdf-btn');
             if (pdfBtn) pdfBtn.click();
           }
         }, 800);
       }
    } else {
       toast('Lỗi khi xử lý thỏa thuận! Vui lòng thử lại.', 'error');
       console.error(error);
    }
  };

  const handleCancelAgreement = async () => {
    const ok = await confirm({ title: 'Hủy thỏa thuận', message: 'Bạn có chắc chắn muốn Hủy / Từ chối hợp đồng này?', confirmText: 'Hủy hợp đồng', type: 'error' });
    if (ok) {
      const targetPayload = localPendingPayload || activeAgreement;
      if (targetPayload && matchedRoommate) {
        const payload = {
          ...targetPayload,
          status: 'cancelled',
          cancelled_by: currentUser.id,
          cancelled_at: new Date().toISOString(),
          timestamp: new Date().toISOString()
        };
        const chatId = [currentUser.id, partnerAuthId].sort().join('_');
        await supabase.from('messages').insert({
          chat_id: chatId,
          sender_id: currentUser.id,
          text: `[AGREEMENT_CANCELLED] ${JSON.stringify(payload)}`
        });
        
        if (targetPayload.status === 'signed') {
          await supabase.from('roommates').update({ status: 'Đang tìm' }).in('user_id', [currentUser.id, partnerAuthId]);
          
          // Re-evaluate capacity status for both users
          await updateRoomStatusBasedOnAgreements(currentUser.id, supabase);
          await updateRoomStatusBasedOnAgreements(partnerAuthId, supabase);
        }
      }
      toast('Đã từ chối thỏa thuận!', 'info');
      handleReset();
    }
  };

  const handleSendCounterOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAgreed) { toast('Vui lòng tích chọn đồng ý với các quy định sống chung!', 'warning'); return; }
    if (!fullName.trim()) { toast('Vui lòng nhập họ và tên đầy đủ để tiến hành ký kết!', 'warning'); return; }
    if (!matchedRoommate) return;

    const targetPayload = localPendingPayload || activeAgreement;
    // CRITICAL: Use auth UUID (currentUser.id) not profile ID
    const chatId = [currentUser.id, partnerAuthId].sort().join('_');
    
    // 1. Cancel the old draft
    if (targetPayload) {
      const cancelPayload = {
        ...targetPayload,
        status: 'cancelled',
        cancelled_by: currentUser.id,
        cancelled_at: new Date().toISOString(),
        timestamp: new Date().toISOString()
      };
      await supabase.from('messages').insert({
        chat_id: chatId,
        sender_id: currentUser.id,
        text: `[AGREEMENT_CANCELLED] ${JSON.stringify(cancelPayload)}`
      });
    }

    // 2. Send the new draft
    const rules = {
      quiet: quietOption === 'khac' ? quietOther : QUIET_OPTIONS.find(o => o.id === quietOption)?.label,
      cleaning: cleaningOption === 'khac' ? cleaningOther : CLEANING_OPTIONS.find(o => o.id === cleaningOption)?.label,
      visitors: visitorsOption === 'khac' ? visitorsOther : VISITORS_OPTIONS.find(o => o.id === visitorsOption)?.label,
      bills: billsOption === 'khac' ? billsOther : BILL_OPTIONS.find(o => o.id === billsOption)?.label,
      pets: petsOption === 'khac' ? petsOther : PET_OPTIONS.find(o => o.id === petsOption)?.label,
      otherNotes: otherNotesText
    };
    const draftPayload = {
      id: crypto.randomUUID(),
      status: 'pending',
      rules,
      creator_id: currentUser.id,
      partner_id: partnerAuthId,
      creator_name: currentUserProfile.name,
      partner_name: matchedRoommate.name,
      creator_avatar: currentUserProfile.avatar,
      partner_avatar: matchedRoommate.avatar,
      created_at: new Date().toISOString(),
      timestamp: new Date().toISOString()
    };
    
    const { error } = await supabase.from('messages').insert({
      chat_id: chatId,
      sender_id: currentUser.id,
      text: `[AGREEMENT_DRAFT] ${JSON.stringify(draftPayload)}`
    });

    if (!error) {
       setIsEditingDraft(false);
       setShowSuccessModal(true);
       setSignedDate(new Date().toLocaleDateString("vi-VN", {
         year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit"
       }));
       // ✅ Show success toast for counter offer
       toast('📝 Đã gửi bản thỏa thuận chỉnh sửa cho đối tác!', 'success', 3000);
    } else {
       toast('Lỗi khi xử lý thỏa thuận! Vui lòng thử lại.', 'error');
    }
  };

  const handleReset = () => {
    if (localPendingPayload && localPendingPayload.status === 'signed') {
      toast('Hợp đồng này đã được lưu. Vui lòng bấm Hủy Hợp Đồng trước khi tạo mới.', 'warning');
      return;
    }
    setLocalPendingPayload(null);
    setIsSigned(false);
    setIsAgreed(false);
    setFullName("");
    setSignedDate("");
    setOtherNotesText("");
  };

  const handleDownloadPDF = () => {
    if (!pdfRef.current) return;
    const element = pdfRef.current;
    
    // Make visible for rendering
    element.style.display = 'block';
    
    const opt = {
      margin:       15,
      filename:     `Thoa_Thuan_RoomieMatch_${selectedRoommate?.name || 'ban'}.pdf`,
      image:        { type: 'jpeg' as const, quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
    };
    
    html2pdf().set(opt).from(element).save().then(() => {
      element.style.display = 'none';
      toast('Đã tải xuống file PDF thành công!', 'success');
    });
  };

  const selectedRoommate = {
    name: roommateName || "Chưa nhập tên",
    avatar: (matchedRoommate && roommateName) ? matchedRoommate.avatar : "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop",
    role: (matchedRoommate && roommateName) ? matchedRoommate.role : "Bạn cùng phòng",
  };

  if (!currentUser) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 min-h-[60vh] animate-fade-in">
        <div className="bg-white p-10 rounded-[32px] shadow-[0_10px_40px_rgba(15,23,42,0.06)] border border-slate-100 max-w-md text-center">
          <div className="w-20 h-20 bg-sky-50 text-sky-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
             <Lock className="h-10 w-10" />
          </div>
          <h3 className="text-2xl font-black text-slate-800 mb-3 tracking-tight">Yêu cầu đăng nhập</h3>
          <p className="text-slate-500 mb-8 leading-relaxed">Bạn cần đăng nhập để xem và lập bản cam kết sống chung điện tử với các bạn cùng phòng.</p>
          <button 
            onClick={() => onRequireAuth && onRequireAuth()} 
            className="w-full py-4 bg-[#006590] hover:bg-[#005176] text-white font-bold rounded-2xl shadow-lg shadow-[#006590]/20 transition-all duration-200 cursor-pointer text-base"
          >
            Đăng nhập ngay
          </button>
        </div>
      </div>
    );
  }

  if (!currentUserProfile) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 min-h-[60vh] animate-fade-in">
        <div className="bg-white p-10 rounded-[32px] shadow-[0_10px_40px_rgba(15,23,42,0.06)] border border-slate-100 max-w-md text-center">
          <div className="w-20 h-20 bg-sky-50 text-sky-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
             <BadgeCheck className="h-10 w-10" />
          </div>
          <h3 className="text-2xl font-black text-slate-800 mb-3 tracking-tight">Cần tạo hồ sơ</h3>
          <p className="text-slate-500 mb-8 leading-relaxed">Bạn cần thiết lập hồ sơ cá nhân của mình trước khi có thể lập thỏa thuận sống chung.</p>
          <button 
            onClick={() => onRequireProfile && onRequireProfile()} 
            className="w-full py-4 bg-[#006590] hover:bg-[#005176] text-white font-bold rounded-2xl shadow-lg shadow-[#006590]/20 transition-all duration-200 cursor-pointer text-base"
          >
            Tạo hồ sơ ngay
          </button>
        </div>
      </div>
    );
  }

  if (!matchedRoommate) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 min-h-[60vh] animate-fade-in">
        <div className="bg-white p-10 rounded-[32px] shadow-[0_10px_40px_rgba(15,23,42,0.06)] border border-slate-100 max-w-md text-center">
          <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
             <FileText className="h-10 w-10" />
          </div>
          <h3 className="text-2xl font-black text-slate-800 mb-3 tracking-tight">Chưa chọn bạn cùng phòng</h3>
          <p className="text-slate-500 mb-8 leading-relaxed">Bạn cần chọn một người bạn từ mục Tin nhắn hoặc Tìm bạn để bắt đầu lập thỏa thuận sống chung.</p>
        </div>
      </div>
    );
  }

  const isReceivingDraft = localPendingPayload && localPendingPayload.status === 'pending' && localPendingPayload.sender_id !== currentUser.id;

  // Find pending agreements where user is the receiver (need to sign)
  const pendingToSign = agreements.filter(a => 
    a.status === 'pending' && a.creator_id !== currentUser.id
  );

  return (
    <div className="space-y-8 animate-fade-in pb-16 relative">
      {/* PENDING AGREEMENTS SECTION - Show agreements waiting for user signature */}
      {pendingToSign.length > 0 && (
        <div className="max-w-5xl mx-auto">
          <div className="bg-amber-50 border-2 border-amber-300 rounded-[24px] p-6 space-y-4 shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-xl flex items-center justify-center animate-pulse">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-amber-900">🔔 Thỏa Thuận Chờ Ký Kết</h2>
                  <p className="text-sm text-amber-800">Bạn có {pendingToSign.length} thỏa thuận chờ bạn ký kết</p>
                </div>
              </div>
            </div>

            <div className="grid gap-3">
              {pendingToSign.map((agreement, idx) => {
                const partner = findRoommateByIdentity(roommates, agreement.creator_id, rooms);
                return (
                  <button
                    key={idx}
                    onClick={() => {
                      // Auto-select this partner and load their agreement
                      if (partner) {
                        setRoommateName(partner.name);
                        setLocalPendingPayload(agreement);
                      }
                    }}
                    className="flex items-center justify-between p-4 rounded-xl bg-white border-2 border-amber-200 hover:border-amber-400 hover:shadow-md transition-all group"
                  >
                    <div className="flex items-center gap-4 text-left">
                      <img src={partner?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb"} alt="" className="w-12 h-12 rounded-full object-cover border border-slate-200" />
                      <div>
                        <p className="font-bold text-slate-800 group-hover:text-amber-700 transition-colors">{partner?.name || "Người lạ"}</p>
                        <p className="text-xs text-slate-500">Gửi vào {new Date(agreement.created_at).toLocaleDateString('vi-VN')}</p>
                      </div>
                    </div>
                    <div className="text-amber-700 font-bold text-sm">
                      Ký kết →
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
      
      {/* 2 Column Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: Main Form */}
        <div className="lg:col-span-8 space-y-6 relative">
          <div className="bg-white rounded-[24px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] p-6 sm:p-8 space-y-6">
            
            {/* Header Title and Badge */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-100">
              <div>
                <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                  Bản Cam Kết Sống Chung
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  Thỏa thuận nếp sống, trật tự và tài chính minh bạch cho cuộc sống hài hòa.
                </p>
              </div>
              <div className="self-start sm:self-center flex flex-col gap-2 items-end">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-[#006590]/10 text-[#006590] border border-[#006590]/15">
                  <BadgeCheck className="h-4 w-4" />
                  Tiêu chuẩn RoomieMatch
                </span>
                {/* Status Badge */}
                {(localPendingPayload?.status || activeAgreement?.status) && (
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider ${
                    (localPendingPayload?.status || activeAgreement?.status) === 'signed' 
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : (localPendingPayload?.status || activeAgreement?.status) === 'pending'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : 'bg-slate-50 text-slate-600 border border-slate-200'
                  }`}>
                    {(localPendingPayload?.status || activeAgreement?.status) === 'signed' && (
                      <>
                        <CheckSquare className="h-4 w-4" />
                        Đã Ký Hiệu Lực
                      </>
                    )}
                    {(localPendingPayload?.status || activeAgreement?.status) === 'pending' && (
                      <>
                        <Clock className="h-4 w-4 animate-pulse" />
                        Chờ Ký Kết
                      </>
                    )}
                    {(localPendingPayload?.status || activeAgreement?.status) === 'cancelled' && (
                      <>
                        <X className="h-4 w-4" />
                        Đã Hủy
                      </>
                    )}
                  </span>
                )}
              </div>
            </div>

            {/* Roommate selector block */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-700">
                Chọn bạn cùng phòng để lập thỏa thuận
              </label>
              <input
                type="text"
                value={roommateName}
                onChange={(e) => handleRoommateNameChange(e.target.value)}
                disabled={isFormLocked}
                placeholder="Nhập tên bạn cùng phòng..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-[#006590] focus:ring-1 focus:ring-[#006590] focus:bg-white duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>

            {/* Form Fields - Grid of 2 columns */}
            <div className="relative">
              {isAutoFilling && (
                <div className="absolute inset-0 bg-white/70 backdrop-blur-sm z-10 flex flex-col items-center justify-center gap-2.5 rounded-2xl animate-fade-in">
                  <div className="relative flex items-center justify-center">
                    <div className="h-10 w-10 border-4 border-slate-200 border-t-[#006590] rounded-full animate-spin" />
                    <Sparkles className="h-4 w-4 text-[#006590] absolute animate-pulse" />
                  </div>
                  <span className="text-xs font-bold text-[#006590] tracking-wide animate-pulse">
                    Đang phân tích thói quen và tự động điền...
                  </span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* 1. Giờ giấc yên tĩnh chung */}
                <div className="bg-white border border-slate-100 shadow-sm rounded-[20px] p-5 space-y-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-slate-600 stroke-[2.5]" />
                    <span className="text-[12px] font-black uppercase tracking-widest text-slate-700">
                      Giờ giấc yên tĩnh chung
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    {QUIET_OPTIONS.map((opt) => (
                      <label
                        key={opt.id}
                        className={`group flex items-start gap-3.5 p-3.5 rounded-xl border transition-all duration-200 cursor-pointer ${
                          quietOption === opt.id
                            ? "border-[#006590]/40 bg-sky-50/20 shadow-sm"
                            : "bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50/50"
                        }`}
                      >
                        <div className={`mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${quietOption === opt.id ? "border-[#006590]" : "border-slate-300 bg-white group-hover:border-slate-400"}`}>
                           {quietOption === opt.id && <div className="w-2 h-2 rounded-full bg-[#006590]" />}
                        </div>
                        <input
                          type="radio"
                          name="quietOptionRadio"
                          checked={quietOption === opt.id}
                          onChange={() => setQuietOption(opt.id)}
                          disabled={isFormLocked}
                          className="sr-only"
                        />
                        <div className="flex flex-col mt-[-2px]">
                          {opt.label.includes(": ") ? (
                            <>
                              <span className={`font-bold text-[13px] leading-tight ${quietOption === opt.id ? "text-slate-800" : "text-slate-700"}`}>
                                {opt.label.split(": ")[0]}
                              </span>
                              <span className="text-[12px] text-slate-500 leading-relaxed mt-1">
                                {opt.label.split(": ").slice(1).join(": ")}
                              </span>
                            </>
                          ) : (
                            <span className={`font-bold text-[13px] leading-tight ${quietOption === opt.id ? "text-slate-800" : "text-slate-700"}`}>
                                {opt.label}
                            </span>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>

                  {quietOption === "khac" && (
                    <textarea
                      rows={2}
                      value={quietOther}
                      onChange={(e) => setQuietOther(e.target.value)}
                      disabled={isFormLocked}
                      className="w-full bg-white border border-slate-200 focus:border-[#006590] focus:ring-1 focus:ring-[#006590] rounded-xl px-3 py-2 text-xs text-slate-700 outline-none resize-none duration-150 mt-2 font-medium"
                      placeholder="Quy định khác..."
                    />
                  )}
                </div>

                {/* 2. Phân chia ca dọn vệ sinh */}
                <div className="bg-white border border-slate-100 shadow-sm rounded-[20px] p-5 space-y-4">
                  <div className="flex items-center gap-2">
                    <CheckSquare className="h-4 w-4 text-slate-600 stroke-[2.5]" />
                    <span className="text-[12px] font-black uppercase tracking-widest text-slate-700">
                      Phân chia ca dọn vệ sinh
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    {CLEANING_OPTIONS.map((opt) => (
                      <label
                        key={opt.id}
                        className={`group flex items-start gap-3.5 p-3.5 rounded-xl border transition-all duration-200 cursor-pointer ${
                          cleaningOption === opt.id
                            ? "border-[#006590]/40 bg-sky-50/20 shadow-sm"
                            : "bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50/50"
                        }`}
                      >
                        <div className={`mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${cleaningOption === opt.id ? "border-[#006590]" : "border-slate-300 bg-white group-hover:border-slate-400"}`}>
                           {cleaningOption === opt.id && <div className="w-2 h-2 rounded-full bg-[#006590]" />}
                        </div>
                        <input
                          type="radio"
                          name="cleaningOptionRadio"
                          checked={cleaningOption === opt.id}
                          onChange={() => setCleaningOption(opt.id)}
                          disabled={isFormLocked}
                          className="sr-only"
                        />
                        <div className="flex flex-col mt-[-2px]">
                          {opt.label.includes(": ") ? (
                            <>
                              <span className={`font-bold text-[13px] leading-tight ${cleaningOption === opt.id ? "text-slate-800" : "text-slate-700"}`}>
                                {opt.label.split(": ")[0]}
                              </span>
                              <span className="text-[12px] text-slate-500 leading-relaxed mt-1">
                                {opt.label.split(": ").slice(1).join(": ")}
                              </span>
                            </>
                          ) : (
                            <span className={`font-bold text-[13px] leading-tight ${cleaningOption === opt.id ? "text-slate-800" : "text-slate-700"}`}>
                                {opt.label}
                            </span>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>

                  {cleaningOption === "khac" && (
                    <textarea
                      rows={2}
                      value={cleaningOther}
                      onChange={(e) => setCleaningOther(e.target.value)}
                      disabled={isFormLocked}
                      className="w-full bg-white border border-slate-200 focus:border-[#006590] focus:ring-1 focus:ring-[#006590] rounded-xl px-3 py-2 text-xs text-slate-700 outline-none resize-none duration-150 mt-2 font-medium"
                      placeholder="Quy định khác..."
                    />
                  )}
                </div>

                {/* 3. Nội quy đón khách và bạn bè */}
                <div className="bg-white border border-slate-100 shadow-sm rounded-[20px] p-5 space-y-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-slate-600 stroke-[2.5]" />
                    <span className="text-[12px] font-black uppercase tracking-widest text-slate-700">
                      Nội quy đón khách và bạn bè
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    {VISITORS_OPTIONS.map((opt) => (
                      <label
                        key={opt.id}
                        className={`group flex items-start gap-3.5 p-3.5 rounded-xl border transition-all duration-200 cursor-pointer ${
                          visitorsOption === opt.id
                            ? "border-[#006590]/40 bg-sky-50/20 shadow-sm"
                            : "bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50/50"
                        }`}
                      >
                        <div className={`mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${visitorsOption === opt.id ? "border-[#006590]" : "border-slate-300 bg-white group-hover:border-slate-400"}`}>
                           {visitorsOption === opt.id && <div className="w-2 h-2 rounded-full bg-[#006590]" />}
                        </div>
                        <input
                          type="radio"
                          name="visitorsOptionRadio"
                          checked={visitorsOption === opt.id}
                          onChange={() => setVisitorsOption(opt.id)}
                          disabled={isFormLocked}
                          className="sr-only"
                        />
                        <div className="flex flex-col mt-[-2px]">
                          {opt.label.includes(": ") ? (
                            <>
                              <span className={`font-bold text-[13px] leading-tight ${visitorsOption === opt.id ? "text-slate-800" : "text-slate-700"}`}>
                                {opt.label.split(": ")[0]}
                              </span>
                              <span className="text-[12px] text-slate-500 leading-relaxed mt-1">
                                {opt.label.split(": ").slice(1).join(": ")}
                              </span>
                            </>
                          ) : (
                            <span className={`font-bold text-[13px] leading-tight ${visitorsOption === opt.id ? "text-slate-800" : "text-slate-700"}`}>
                                {opt.label}
                            </span>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>

                  {visitorsOption === "khac" && (
                    <textarea
                      rows={2}
                      value={visitorsOther}
                      onChange={(e) => setVisitorsOther(e.target.value)}
                      disabled={isFormLocked}
                      className="w-full bg-white border border-slate-200/80 focus:border-[#006590] focus:ring-1 focus:ring-[#006590] rounded-xl px-3 py-2 text-xs text-slate-700 outline-none resize-none duration-150 mt-2 font-medium"
                      placeholder="Quy định khác..."
                    />
                  )}
                </div>

                {/* 4. Phương án chia sẻ chi phí */}
                <div className="bg-white border border-slate-100 shadow-sm rounded-[20px] p-5 space-y-4">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-slate-600 stroke-[2.5]" />
                    <span className="text-[12px] font-black uppercase tracking-widest text-slate-700">
                      Phương án chia sẻ chi phí
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    {BILL_OPTIONS.map((opt) => (
                      <label
                        key={opt.id}
                        className={`group flex items-start gap-3.5 p-3.5 rounded-xl border transition-all duration-200 cursor-pointer ${
                          billsOption === opt.id
                            ? "border-[#006590]/40 bg-sky-50/20 shadow-sm"
                            : "bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50/50"
                        }`}
                      >
                        <div className={`mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${billsOption === opt.id ? "border-[#006590]" : "border-slate-300 bg-white group-hover:border-slate-400"}`}>
                           {billsOption === opt.id && <div className="w-2 h-2 rounded-full bg-[#006590]" />}
                        </div>
                        <input
                          type="radio"
                          name="billsOptionRadio"
                          checked={billsOption === opt.id}
                          onChange={() => setBillsOption(opt.id)}
                          disabled={isFormLocked}
                          className="sr-only"
                        />
                        <div className="flex flex-col mt-[-2px]">
                          {opt.label.includes(": ") ? (
                            <>
                              <span className={`font-bold text-[13px] leading-tight ${billsOption === opt.id ? "text-slate-800" : "text-slate-700"}`}>
                                {opt.label.split(": ")[0]}
                              </span>
                              <span className="text-[12px] text-slate-500 leading-relaxed mt-1">
                                {opt.label.split(": ").slice(1).join(": ")}
                              </span>
                            </>
                          ) : (
                            <span className={`font-bold text-[13px] leading-tight ${billsOption === opt.id ? "text-slate-800" : "text-slate-700"}`}>
                                {opt.label}
                            </span>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>

                  {billsOption === "khac" && (
                    <textarea
                      rows={2}
                      value={billsOther}
                      onChange={(e) => setBillsOther(e.target.value)}
                      disabled={isFormLocked}
                      className="w-full bg-white border border-slate-200/80 focus:border-[#006590] focus:ring-1 focus:ring-[#006590] rounded-xl px-3 py-2 text-xs text-slate-700 outline-none resize-none duration-150 mt-2 font-medium"
                      placeholder="Quy định khác..."
                    />
                  )}
                </div>

                {/* 5. Quy chế vật nuôi trong phòng - Full width */}
                <div className="md:col-span-2 bg-white border border-slate-100 shadow-sm rounded-[20px] p-5 space-y-4">
                  <div className="flex items-center gap-2">
                    <Heart className="h-4 w-4 text-slate-600 stroke-[2.5]" />
                    <span className="text-[12px] font-black uppercase tracking-widest text-slate-700">
                      Quy chế vật nuôi trong phòng
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {PET_OPTIONS.map((opt) => (
                      <label
                        key={opt.id}
                        className={`group flex items-start gap-3.5 p-3.5 rounded-xl border transition-all duration-200 cursor-pointer h-full ${
                          petsOption === opt.id
                            ? "border-[#006590]/40 bg-sky-50/20 shadow-sm"
                            : "bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50/50"
                        }`}
                      >
                        <div className={`mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${petsOption === opt.id ? "border-[#006590]" : "border-slate-300 bg-white group-hover:border-slate-400"}`}>
                           {petsOption === opt.id && <div className="w-2 h-2 rounded-full bg-[#006590]" />}
                        </div>
                        <input
                          type="radio"
                          name="petsOptionRadio"
                          checked={petsOption === opt.id}
                          onChange={() => setPetsOption(opt.id)}
                          disabled={isFormLocked}
                          className="sr-only"
                        />
                        <div className="flex flex-col mt-[-2px]">
                          {opt.label.includes(": ") ? (
                            <>
                              <span className={`font-bold text-[13px] leading-tight ${petsOption === opt.id ? "text-slate-800" : "text-slate-700"}`}>
                                {opt.label.split(": ")[0]}
                              </span>
                              <span className="text-[12px] text-slate-500 leading-relaxed mt-1">
                                {opt.label.split(": ").slice(1).join(": ")}
                              </span>
                            </>
                          ) : (
                            <span className={`font-bold text-[13px] leading-tight ${petsOption === opt.id ? "text-slate-800" : "text-slate-700"}`}>
                                {opt.label}
                            </span>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>

                  {petsOption === "khac" && (
                    <textarea
                      rows={2}
                      value={petsOther}
                      onChange={(e) => setPetsOther(e.target.value)}
                      disabled={isFormLocked}
                      className="w-full bg-white border border-slate-200/80 focus:border-[#006590] focus:ring-1 focus:ring-[#006590] rounded-xl px-3 py-2 text-xs text-slate-700 outline-none resize-none duration-150 mt-2 font-medium"
                      placeholder="Quy định khác..."
                    />
                  )}
                </div>

                {/* 6. Thỏa thuận khác - Full width */}
                <div className="md:col-span-2 bg-white border border-slate-100 shadow-sm rounded-[20px] p-5 space-y-4">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-slate-600 stroke-[2.5]" />
                    <span className="text-[12px] font-black uppercase tracking-widest text-slate-700">
                      Thỏa thuận khác
                    </span>
                  </div>
                  
                  <textarea
                    rows={4}
                    value={otherNotesText}
                    onChange={(e) => setOtherNotesText(e.target.value)}
                    disabled={isFormLocked}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#006590] focus:bg-white focus:ring-4 focus:ring-[#006590]/10 rounded-xl px-4 py-3 text-[13px] text-slate-700 outline-none resize-none duration-150 font-medium"
                    placeholder="Nhập các thỏa thuận hoặc quy định bổ sung khác tại đây..."
                  />
                </div>
              </div>
            </div>

            {/* Signature Block (card nhỏ nền xanh nhạt) */}
            <form onSubmit={handleSignAgreement} className="bg-emerald-50/50 border border-emerald-100/80 rounded-[20px] p-6 space-y-5">
              <h4 className="text-[13px] font-black text-emerald-800 flex items-center gap-2 uppercase tracking-widest">
                ✒️ Phần ký xác nhận cam kết
              </h4>
              
              <div className="flex items-start gap-3 bg-white p-3.5 rounded-xl border border-emerald-100/50">
                <input
                  type="checkbox"
                  id="agreeCheckbox"
                  checked={isAgreed}
                  onChange={(e) => setIsAgreed(e.target.checked)}
                  disabled={isFormLocked}
                  className="mt-0.5 accent-emerald-500 h-4.5 w-4.5 cursor-pointer rounded border-emerald-300 focus:ring-emerald-300 disabled:opacity-60 shrink-0"
                />
                <label htmlFor="agreeCheckbox" className="text-[13px] text-slate-600 font-medium leading-relaxed select-none cursor-pointer">
                  Tôi đồng ý với các quy định sống chung đã liệt kê ở trên và tự nguyện hợp tác để tạo môi trường tích cực.
                </label>
              </div>

              <div className="space-y-1.5">
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={
                    (activeAgreement?.status === 'signed') || 
                    (activeAgreement?.status === 'pending' && activeAgreement.creator_id === currentUser.id) ||
                    (localPendingPayload?.status === 'signed') ||
                    (localPendingPayload?.status === 'pending' && localPendingPayload.sender_id === currentUser.id)
                  }
                  placeholder="Nhập họ tên đầy đủ để ký số..."
                  className="w-full bg-white border border-emerald-200 rounded-xl px-4 py-3.5 text-[14px] focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-slate-800 font-bold placeholder-slate-400 disabled:opacity-70 disabled:bg-slate-50 transition-all duration-200"
                />
              </div>

              {!activeAgreement ? (
                <button
                  type="submit"
                  disabled={!isAgreed || !fullName.trim() || !matchedRoommate}
                  className="w-full py-4 text-[13px] font-black uppercase tracking-widest text-white bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 rounded-xl shadow-lg shadow-emerald-200/50 transition-all duration-300 active:scale-[0.99] cursor-pointer disabled:from-slate-200 disabled:to-slate-300 disabled:text-slate-400 disabled:shadow-none disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <BadgeCheck className="h-5 w-5" />
                  Ký kết & Gửi bản thỏa thuận
                </button>
              ) : activeAgreement.status === 'pending' ? (
                <div className="bg-white border border-dashed border-amber-300 p-4 rounded-xl flex items-center justify-between gap-3 shadow-sm">
                  <div className="flex items-center gap-2.5 text-[13px] font-bold text-amber-700">
                    <span className="p-1.5 bg-amber-100 rounded-full text-amber-600">
                      <Clock className="h-4 w-4 animate-pulse" />
                    </span>
                    Đang chờ {activeAgreement.creator_id === currentUser.id ? 'đối tác' : 'bạn'} ký duyệt...
                  </div>
                  <button
                    type="button"
                    onClick={handleCancelAgreement}
                    className="text-xs font-bold text-red-600 hover:text-red-800 flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-red-50 transition-colors cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                    Hủy nháp
                  </button>
                </div>
              ) : activeAgreement.status === 'signed' ? (
                <div className="bg-white border border-dashed border-emerald-300 p-4 rounded-xl flex items-center justify-between gap-3 shadow-sm">
                  <div className="flex items-center gap-2.5 text-[13px] font-bold text-emerald-700">
                    <span className="p-1.5 bg-emerald-100 rounded-full text-emerald-600">
                      <Check className="h-4 w-4" />
                    </span>
                    Hợp đồng đã có hiệu lực
                  </div>
                  <button
                    type="button"
                    onClick={handleCancelAgreement}
                    className="text-xs font-bold text-slate-500 hover:text-red-700 flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-50 transition-colors cursor-pointer"
                  >
                    Chấm dứt
                  </button>
                </div>
              ) : (
                <div className="bg-white border border-dashed border-slate-300 p-4 rounded-xl flex items-center justify-between gap-3 shadow-sm">
                  <div className="flex items-center gap-2.5 text-[13px] font-bold text-slate-600">
                    Thỏa thuận đã bị hủy.
                  </div>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="text-xs font-bold text-sky-700 flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-sky-50 transition-colors cursor-pointer"
                  >
                    Tạo mới
                  </button>
                </div>
              )}
            </form>

          </div>
        </div>

        {/* RIGHT COLUMN: Active Agreement Card */}
        <div className="lg:col-span-4 space-y-5 lg:sticky lg:top-8">
          <div className="bg-[#003B55] rounded-[20px] p-6 shadow-xl shadow-slate-200/50 flex flex-col gap-6 text-white relative">
            <h3 className="text-[11px] font-black tracking-widest uppercase text-sky-100/70">
              THỎA THUẬN CÓ HIỆU LỰC
            </h3>
            
            {/* Roommate Info Box */}
            <div className="bg-[#004B6B] rounded-xl p-4 flex items-center gap-3 border border-[#005A7D] shadow-inner">
              <img src={selectedRoommate.avatar} alt="Avatar" className="w-12 h-12 rounded-full object-cover border-2 border-white/10" />
              <div className="flex-1">
                <p className="font-bold text-[14px] leading-tight text-white">{selectedRoommate.name}</p>
                <p className="text-[11px] text-sky-200/80 mt-0.5">{selectedRoommate.role}</p>
                <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-widest mt-2 text-slate-300">
                  {isSigned ? <Check className="w-3.5 h-3.5 text-[#82ecea]" /> : <Clock className="w-3.5 h-3.5 opacity-60" />}
                  <span className={isSigned ? "text-[#82ecea]" : "opacity-60"}>{isSigned ? "Đã ký kết" : "Chưa ký kết"}</span>
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="space-y-3.5 text-[13px] border-b border-white/10 pb-6 mt-2">
              <div className="flex justify-between text-sky-100/60">
                <span className="font-medium">Họ tên của bạn:</span>
                <span className="font-bold text-white text-right">{fullName || "---"}</span>
              </div>
              <div className="flex justify-between text-sky-100/60">
                <span className="font-medium">Đối tác ký:</span>
                <span className="font-bold text-white text-right">{selectedRoommate.name}</span>
              </div>
              <div className="flex justify-between text-sky-100/60">
                <span className="font-medium">Ngày ký:</span>
                <span className="font-bold text-white text-right">{signedDate || "---"}</span>
              </div>
            </div>

            {/* Checklist */}
            <div className="space-y-4">
              <p className="text-[10px] uppercase font-black text-sky-100/50 tracking-widest">Danh mục quản lý quy định</p>
              <div className="space-y-3 text-[12px] text-sky-100/80">
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#82ecea]" />
                  <span>Giờ sinh hoạt: <span className="text-white font-bold ml-1">
                    {quietOption === 'chuan' ? 'Chuẩn' : quietOption === 'cudemo' ? 'Cú đêm' : quietOption === 'tudo' ? 'Tự do' : 'Tùy chỉnh'}
                  </span></span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#82ecea]" />
                  <span>Phân chia việc nhà: <span className="text-white font-bold ml-1">
                    {cleaningOption === 'tuan' ? 'Theo tuần' : cleaningOption === 'co_dinh' ? 'Cố định' : cleaningOption === 'tu_giac' ? 'Tự giác' : cleaningOption === 'lao_cong' ? 'Thuê người' : 'Tùy chỉnh'}
                  </span></span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#82ecea]" />
                  <span>Khách đến chơi: <span className="text-white font-bold ml-1">
                    {visitorsOption === 'khong_dan' ? 'Không dẫn khách' : visitorsOption === 'ban_ngay' ? 'Chỉ ban ngày' : visitorsOption === 'qua_dem_co_han' ? 'Qua đêm có hạn' : visitorsOption === 'cung_gioi' ? 'Chỉ cùng giới' : 'Tùy chỉnh'}
                  </span></span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#82ecea]" />
                  <span>Chia chi phí: <span className="text-white font-bold ml-1">
                    {billsOption === 'chia_deu' ? 'Chia đều 100%' : billsOption === 'thuc_te' ? 'Theo ngày ở' : billsOption === 'thiet_bi' ? 'Theo thiết bị' : 'Tùy chỉnh'}
                  </span></span>
                </div>
              </div>
            </div>

            {isSigned && !isEditingDraft && (
              <div className="mt-4 space-y-3">
                <button
                  type="button"
                  id="auto-download-pdf-btn"
                  onClick={handleDownloadPDF}
                  className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-black rounded-xl text-[14px] transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20"
                >
                  <Download className="w-5 h-5" /> Tải Xuống Bản In (PDF)
                </button>
              </div>
            )}

            {((localPendingPayload?.status === 'pending' && localPendingPayload.sender_id !== currentUser.id) ||
              (!localPendingPayload && activeAgreement?.status === 'pending' && activeAgreement.creator_id !== currentUser.id)) && !isEditingDraft && (
              <div className="mt-4 space-y-3">
                <button
                  type="button"
                  onClick={handleSignAgreement}
                  className="w-full py-3.5 bg-[#82ecea] hover:bg-[#68d8d6] text-[#003B55] font-black rounded-xl text-[14px] transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#82ecea]/10"
                >
                  <Check className="w-5 h-5" /> Ký Chấp Nhận
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingDraft(true)}
                  className="w-full py-3.5 bg-amber-400 hover:bg-amber-500 text-amber-950 font-black rounded-xl text-[14px] transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-400/20"
                >
                  <FileEdit className="w-5 h-5" /> Chỉnh sửa & Đề xuất lại
                </button>
                <button
                  type="button"
                  onClick={handleCancelAgreement}
                  className="w-full py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl text-[13px] transition-all duration-200 cursor-pointer"
                >
                  Từ chối thỏa thuận
                </button>
              </div>
            )}

            {isEditingDraft && (
              <div className="mt-4 space-y-3">
                <button
                  type="button"
                  onClick={handleSendCounterOffer}
                  disabled={!isAgreed || !fullName.trim()}
                  className="w-full py-3.5 bg-sky-400 hover:bg-sky-500 text-sky-950 font-black rounded-xl text-[14px] transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-sky-400/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-5 h-5" /> Lưu & Gửi Đề Xuất Mới
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingDraft(false)}
                  className="w-full py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl text-[13px] transition-all duration-200 cursor-pointer"
                >
                  Hủy chỉnh sửa
                </button>
              </div>
            )}
          </div>



          {/* Promo Card */}
          <div className="bg-slate-50/80 rounded-2xl border border-slate-100 p-5 relative overflow-hidden">
            <div className="absolute -right-4 -top-4 opacity-5">
              <BadgeCheck className="w-24 h-24" />
            </div>
            <h4 className="text-[13px] font-black text-slate-800 mb-1.5 relative z-10">Ưu đãi tân gia!</h4>
            <p className="text-[12px] text-slate-500 leading-relaxed font-medium relative z-10">
              Ký thỏa thuận thành công để nhận Voucher 200k khi mua đồ dùng tại RoomieShop.
            </p>
          </div>
        </div>

      </div>

      {/* SUCCESS POPUP MODAL */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-[#020617]/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-8 text-center space-y-6 shadow-2xl animate-fade-in relative overflow-hidden">
            {/* Celebration sparkles background decorator */}
            <div className="absolute -top-10 -left-10 h-32 w-32 bg-purple-100 rounded-full blur-3xl opacity-60" />
            <div className="absolute -bottom-10 -right-10 h-32 w-32 bg-sky-100 rounded-full blur-3xl opacity-60" />

            <div className="relative flex justify-center">
              <div className="h-20 w-20 bg-emerald-50 border-4 border-emerald-100 rounded-full flex items-center justify-center text-emerald-600 shadow-inner">
                <BadgeCheck className="h-10 w-10 animate-bounce" />
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-black text-slate-800">
                Thỏa Thuận Thành Công! 🎉
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Biểu quyết sống chung hòa hợp đã chính thức có đầy đủ chữ ký điện tử và được lưu giữ an toàn trên hệ thống <b>RoomieMatch</b>.
              </p>
            </div>

            {/* Contract Summary Recap grid details */}
            <div className="bg-slate-50 border border-slate-100 text-left p-4 rounded-2xl text-xs space-y-2.5">
              <p className="font-bold text-slate-700 pb-1.5 border-b border-slate-200 flex items-center justify-between">
                <span>Thông tin thỏa thuận</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-1.5 py-0.5 rounded uppercase">Đã chứng thực</span>
              </p>
              <div className="flex justify-between">
                <span className="text-slate-400">Bạn ở ghép:</span>
                <span className="font-extrabold text-slate-800">{fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Bạn ở cùng phòng:</span>
                <span className="font-extrabold text-slate-800">{selectedRoommate.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Giời yên tĩnh:</span>
                <span className="font-semibold text-slate-700 truncate max-w-[200px]">{quietHours}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Giờ kích hoạt:</span>
                <span className="font-semibold text-slate-600">{signedDate}</span>
              </div>
              {otherNotesText.trim() && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Thỏa thuận khác:</span>
                  <span className="font-semibold text-slate-700 truncate max-w-[200px]">{otherNotesText}</span>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowSuccessModal(false);
                  handleReset();
                }}
                className="flex-1 py-3 text-xs font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-xl transition duration-150 cursor-pointer"
              >
                Tạo thỏa thuận khác
              </button>
              <button
                type="button"
                onClick={() => setShowSuccessModal(false)}
                className="flex-1 py-3 text-xs font-extrabold text-white bg-[#006590] hover:bg-[#005176] rounded-xl transition duration-150 shadow-md cursor-pointer"
              >
                Đóng
              </button>
            </div>

          </div>
        </div>
      )}

      {/* QUẢN LÝ HỢP ĐỒNG SECTION - Show all agreements history */}
      {agreements.length > 0 && (
        <div className="max-w-5xl mx-auto mt-12">
          <div className="bg-white border border-slate-200 rounded-[24px] p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-sky-50 text-sky-600 rounded-xl flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900">📋 Lịch Sử Thỏa Thuận</h2>
                  <p className="text-xs text-slate-500">Tổng cộng {agreements.length} hợp đồng</p>
                </div>
              </div>
            </div>

            <div className="grid gap-3">
              {agreements.map((agreement, idx) => {
                const partnerId = agreement.creator_id === currentUser.id ? agreement.partner_id : agreement.creator_id;
                const partner = findRoommateByIdentity(roommates, partnerId);
                
                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-sky-300 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <img 
                        src={partner?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb"} 
                        alt="" 
                        className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm" 
                      />
                      <div className="flex-1">
                        <p className="font-bold text-slate-800">{partner?.name || "Người lạ"}</p>
                        <p className="text-xs text-slate-500">
                          {new Date(agreement.created_at).toLocaleDateString('vi-VN')} • 
                          <span className={`ml-1 font-bold ${
                            agreement.status === 'signed' ? 'text-emerald-600' :
                            agreement.status === 'pending' ? 'text-amber-600' :
                            'text-slate-400'
                          }`}>
                            {agreement.status === 'signed' ? 'Đã ký kết' :
                             agreement.status === 'pending' ? 'Chờ ký' :
                             'Đã hủy'}
                          </span>
                        </p>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => {
                        if (partner) {
                          setRoommateName(partner.name);
                          setLocalPendingPayload(agreement);
                        }
                      }}
                      className="px-4 py-2 bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold text-sm rounded-xl border border-sky-200 hover:border-sky-300 transition-all cursor-pointer flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      Xem chi tiết
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* HIDDEN PDF TEMPLATE FOR PRINTING */}
      <div ref={pdfRef} style={{ display: 'none', backgroundColor: '#fff', color: '#000', padding: '20px', fontFamily: 'sans-serif' }}>
        <div style={{ textAlign: 'center', marginBottom: '30px', borderBottom: '2px solid #000', paddingBottom: '10px' }}>
          <h1 style={{ fontSize: '24px', margin: '0 0 10px 0', textTransform: 'uppercase' }}>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</h1>
          <h2 style={{ fontSize: '18px', margin: '0 0 10px 0' }}>Độc lập - Tự do - Hạnh phúc</h2>
          <br/>
          <h1 style={{ fontSize: '22px', margin: '20px 0 10px 0' }}>THỎA THUẬN SỐNG CHUNG (ROOMIEMATCH)</h1>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ fontSize: '16px', borderBottom: '1px solid #ccc', paddingBottom: '5px' }}>I. THÔNG TIN CÁC BÊN</h3>
          <p style={{ margin: '10px 0' }}><strong>Bên A (Đại diện/Người khởi tạo):</strong> {fullName || currentUserProfile?.name || '..............................'}</p>
          <p style={{ margin: '10px 0' }}><strong>Bên B (Bạn cùng phòng):</strong> {selectedRoommate?.name || '..............................'}</p>
          <p style={{ margin: '10px 0' }}><strong>Ngày ký kết hiệu lực:</strong> {signedDate || '..............................'}</p>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ fontSize: '16px', borderBottom: '1px solid #ccc', paddingBottom: '5px' }}>II. CÁC ĐIỀU KHOẢN QUY ĐỊNH CHUNG</h3>
          <ul style={{ lineHeight: '1.8' }}>
            <li><strong>Giờ yên tĩnh:</strong> {quietHours || (quietOption === 'chuan' ? 'Chuẩn' : quietOption === 'cudemo' ? 'Cú đêm' : quietOption === 'tudo' ? 'Tự do' : 'Tùy chỉnh')}</li>
            <li><strong>Phân chia việc nhà:</strong> {cleaningText || (cleaningOption === 'tuan' ? 'Theo tuần' : cleaningOption === 'co_dinh' ? 'Cố định' : cleaningOption === 'tu_giac' ? 'Tự giác' : cleaningOption === 'lao_cong' ? 'Thuê người' : 'Tùy chỉnh')}</li>
            <li><strong>Khách đến chơi:</strong> {visitorsText || (visitorsOption === 'khong_dan' ? 'Không dẫn khách' : visitorsOption === 'ban_ngay' ? 'Chỉ ban ngày' : visitorsOption === 'qua_dem_co_han' ? 'Qua đêm có hạn' : visitorsOption === 'cung_gioi' ? 'Chỉ cùng giới' : 'Tùy chỉnh')}</li>
            <li><strong>Chia chi phí:</strong> {billsText || (billsOption === 'chia_deu' ? 'Chia đều 100%' : billsOption === 'thuc_te' ? 'Theo ngày ở' : billsOption === 'thiet_bi' ? 'Theo thiết bị' : 'Tùy chỉnh')}</li>
            <li><strong>Nuôi thú cưng:</strong> {petsText || (petsOption === 'khong_nuoi' ? 'Không nuôi' : 'Tùy chỉnh')}</li>
          </ul>
        </div>

        {otherNotesText.trim() && (
          <div style={{ marginBottom: '30px' }}>
            <h3 style={{ fontSize: '16px', borderBottom: '1px solid #ccc', paddingBottom: '5px' }}>III. THỎA THUẬN KHÁC</h3>
            <p style={{ fontStyle: 'italic' }}>{otherNotesText}</p>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '50px', textAlign: 'center' }}>
          <div style={{ width: '45%' }}>
            <h4 style={{ margin: '0 0 50px 0' }}>ĐẠI DIỆN BÊN A</h4>
            <p><strong>{fullName || currentUserProfile?.name || ''}</strong></p>
            <p style={{ fontSize: '12px', color: '#666' }}>(Đã ký điện tử xác nhận)</p>
          </div>
          <div style={{ width: '45%' }}>
            <h4 style={{ margin: '0 0 50px 0' }}>ĐẠI DIỆN BÊN B</h4>
            <p><strong>{selectedRoommate?.name || ''}</strong></p>
            <p style={{ fontSize: '12px', color: '#666' }}>(Đã ký điện tử xác nhận)</p>
          </div>
        </div>
        
        <div style={{ marginTop: '50px', fontSize: '10px', textAlign: 'center', color: '#888' }}>
          Văn bản được tạo và chứng thực tự động bởi hệ thống RoomieMatch.
        </div>
      </div>

    </div>
  );
}
