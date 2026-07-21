import { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { Send, CheckCircle2, AlertCircle, MessageSquare, PhoneCall, Image as ImageIcon, FileText, X, Lock, BadgeCheck, PencilLine, Lightbulb, ShieldCheck, Ban, AlertOctagon, UploadCloud, Clock, CheckSquare, Users, CreditCard, Heart, Check, Star, FileEdit, ChevronLeft, ChevronRight, Flag, Search } from "lucide-react";
import { Roommate, Message } from "../types";
import { supabase } from "../lib/supabase";
import { useConfirmDialog } from "../hooks/useConfirmDialog";
import { useDialog } from "./ui/DialogProvider";
import MessageReactions from "./MessageReactions";
import { CHAT_REPORT_PREFIX, getModerationChannel, isSystemChannel } from "../lib/moderation";
import { removePublicStorageUrls, uploadInlineImage } from "../lib/storage";

interface ChatViewProps {
  roommates: Roommate[];
  initialChats: { roommateId: string; messages: Message[] }[];
  activeRoommateId: string | null;
  setActiveRoommateId: (id: string | null) => void;
  currentUserProfile?: any;
  currentUser?: any;
  bannedUserIds?: string[];
  onRequireAuth?: () => void;
  onRequireProfile?: () => void;
  onNavigateToTab?: (tabId: string) => void;
  onStartAgreement?: (roommateId: string, payload?: any) => void;
  onViewProfile?: (roommate: any) => void;
}

import { updateRoomStatusBasedOnAgreements } from "../utils/agreements";

export default function ChatView({
  roommates,
  initialChats,
  activeRoommateId,
  setActiveRoommateId,
  currentUserProfile,
  currentUser,
  bannedUserIds = [],
  onRequireAuth,
  onRequireProfile,
  onNavigateToTab,
  onStartAgreement,
  onViewProfile,
}: ChatViewProps) {
  // Auth UUID = ID cố định từ Google, không thay đổi dù đăng nhập máy nào
  const myAuthId = currentUser?.id;
  const myProfileId = currentUserProfile?.id;
  const myRoommateId = roommates?.find(r => r.user_id === myAuthId || r.auth_id === myAuthId)?.id;
  
  // Luôn dùng Auth UUID cho chat_id để đồng bộ mọi thiết bị
  const myChatId = myAuthId || myProfileId;

  // Confirm Dialog Hook
  const { confirm, Dialog: ConfirmDialogComponent } = useConfirmDialog();
  const { toast, previewImage } = useDialog();
  
  // Blocked users tab
  const [showBlockedUsers, setShowBlockedUsers] = useState(false);
  
  // Chat records list
  const [chats, setChats] = useState<{ [roommateId: string]: Message[] }>(() => {
    const records: { [roommateId: string]: Message[] } = {};
    initialChats.forEach((chat) => {
      records[chat.roommateId] = chat.messages;
    });
    return records;
  });

  const [conversations, setConversations] = useState<any[]>([]);
  const [isInboxLoading, setIsInboxLoading] = useState(true);
  const fetchInboxRef = useRef<(() => void) | null>(null);
  const roommatesRef = useRef(roommates);
  const activeRoommateIdRef = useRef(activeRoommateId);

  useEffect(() => {
    roommatesRef.current = roommates;
  }, [roommates]);

  useEffect(() => {
    activeRoommateIdRef.current = activeRoommateId;
  }, [activeRoommateId]);

  useEffect(() => {
    if (!currentUser?.id) {
      setConversations([]);
      setIsInboxLoading(false);
      return;
    }

    try {
      const cached = JSON.parse(
        localStorage.getItem(`roomiematch_inbox_${currentUser.id}`) || "[]"
      );
      if (Array.isArray(cached)) {
        setConversations(cached);
        setIsInboxLoading(cached.length === 0);
      }
    } catch {
      setIsInboxLoading(true);
    }
  }, [currentUser?.id]);
  
  useEffect(() => {
    localStorage.removeItem("roomiematch_hidden_conversations");
  }, []);

  // Track conversations with unread agreements
  const [conversationsWithAgreements, setConversationsWithAgreements] = useState<Record<string, boolean>>({});
  
  // Track if chat has 2-way messages (to show phone number)
  const [hasTwoWayMessages, setHasTwoWayMessages] = useState(false);
  
  // Track last read timestamps for red dots
  const [lastReadTimestamps, setLastReadTimestamps] = useState<Record<string, number>>(() => {
    try {
      return JSON.parse(localStorage.getItem(`roomiematch_read_ts_${currentUser?.id || 'guest'}`) || '{}');
    } catch {
      return {};
    }
  });

  // Track if signed agreement exists (to show review button)
  const [hasSignedAgreement, setHasSignedAgreement] = useState(false);

  const [inputText, setInputText] = useState("");
  const [friendSearchQuery, setFriendSearchQuery] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // States for Image sending
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState<number | null>(null);

  // States for Private Notes
  const [chatPrivateNote, setChatPrivateNote] = useState("");
  const [isSavingChatNote, setIsSavingChatNote] = useState(false);
  const [showMobileNote, setShowMobileNote] = useState(false);

  // Block state
  const [blockedUsers, setBlockedUsers] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('roomiematch_blocked_users') || '[]');
    } catch { return []; }
  });

  // Agreement modal state
  const [isAgreementModalOpen, setIsAgreementModalOpen] = useState(false);
  const [agreementModalPayload, setAgreementModalPayload] = useState<any>(null);
  const [isEditingAgreement, setIsEditingAgreement] = useState(false);
  
  // Editable agreement fields
  const [editQuiet, setEditQuiet] = useState('');
  const [editCleaning, setEditCleaning] = useState('');
  const [editVisitors, setEditVisitors] = useState('');
  const [editBills, setEditBills] = useState('');
  const [editPets, setEditPets] = useState('');
  const [editOtherNotes, setEditOtherNotes] = useState('');

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportImageFile, setReportImageFile] = useState<File | null>(null);
  const [reportImagePreview, setReportImagePreview] = useState<string | null>(null);
  const [isUploadingReport, setIsUploadingReport] = useState(false);
  const [selectedReportedMessageIds, setSelectedReportedMessageIds] = useState<string[]>([]);
  const [reportMessageSearch, setReportMessageSearch] = useState("");

  // Signature modal for agreement signing
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [signatureName, setSignatureName] = useState("");
  const [isSigningAgreement, setIsSigningAgreement] = useState(false);

  const closeReportModal = () => {
    setIsReportModalOpen(false);
    setReportReason("");
    setReportImageFile(null);
    setReportImagePreview(null);
    setSelectedReportedMessageIds([]);
    setReportMessageSearch("");
    setIsUploadingReport(false);
  };

  const handleSendReport = async () => {
    if (!reportReason.trim() || selectedReportedMessageIds.length === 0) {
      toast("Vui lòng chọn từ 1 đến 3 tin nhắn và nhập lý do báo cáo.", "warning", 4000);
      return;
    }
    const myId = currentUser?.id || currentUserProfile?.id;
    const activeRoommate = roommates.find(r => r.id === activeRoommateId);
    const activeMessages = chats[activeRoommateId || ""] || [];
    const chatId = [myId, activeRoommateId].sort().join('_');

    if (myId && activeRoommateId && import.meta.env.VITE_SUPABASE_URL) {
       const targetAccountId =
         activeRoommate?.user_id ||
         activeRoommate?.auth_id ||
         activeRoommate?.id ||
         activeRoommateId;

       // Check if already reported in user_reports or legacy messages
       const { data: existingTableReports } = await supabase
         .from('user_reports')
         .select('id')
         .eq('reporter_id', myId)
         .eq('reported_id', targetAccountId);

       const { data: existingReports } = await supabase
         .from('messages')
         .select('id')
         .eq('chat_id', CHAT_REPORT_PREFIX + myId)
         .eq('sender_id', myId)
         .like('text', `%[REPORT]%`)
         .like('text', `%"target_id":"${targetAccountId}"%`);

       if ((existingTableReports && existingTableReports.length > 0) || (existingReports && existingReports.length > 0)) {
         toast("Bạn đã báo cáo người dùng này rồi. Quản trị viên đang xem xét.", "warning", 5000);
         closeReportModal();
         return;
       }

       setIsUploadingReport(true);
       let finalImageUrl = "";

       if (reportImageFile) {
         try {
           const fileExt = reportImageFile.name.split('.').pop();
           const fileName = `${myId}/${crypto.randomUUID()}.${fileExt}`;

           const { error: uploadError } = await supabase.storage
             .from('reports')
             .upload(fileName, reportImageFile);

           if (uploadError) throw uploadError;

           const { data: urlData } = supabase.storage
             .from('reports')
             .getPublicUrl(fileName);

           finalImageUrl = urlData.publicUrl;
         } catch (err: any) {
           console.error("Lỗi upload ảnh:", err);
           toast("Không thể tải ảnh minh chứng. Hãy thử lại hoặc gửi báo cáo không kèm ảnh.", "error", 5000);
           setIsUploadingReport(false);
           return;
         }
       }

       const reportedMessages = selectedReportedMessageIds
         .map(messageId => activeMessages.find(message => message.id === messageId))
         .filter(Boolean) as Message[];
       const primaryReportedMessage = reportedMessages[0];
       const payload = {
         target_id: targetAccountId,
         target_name: activeRoommate?.name,
         reported_chat_id: primaryReportedMessage?.chatId || chatId,
         reported_messages: reportedMessages.map(message => ({
           id: message.id,
           text: message.text,
           image_url: message.imageUrl,
           timestamp: message.timestamp,
         })),
         // Keep legacy fields so older admin builds can still display the first message.
         reported_message_id: primaryReportedMessage?.id,
         reported_message_text: primaryReportedMessage?.text,
         reported_message_image: primaryReportedMessage?.imageUrl,
         reported_message_timestamp: primaryReportedMessage?.timestamp,
         reason: reportReason,
         image: finalImageUrl
       };
       const { error: reportError } = await supabase.from('messages').insert({
         chat_id: getModerationChannel(CHAT_REPORT_PREFIX, myId),
         sender_id: myId,
         text: `[REPORT] ${JSON.stringify(payload)}`
       });
       if (reportError) {
         console.error("[Chat] Cannot send report:", reportError);
         await removePublicStorageUrls([finalImageUrl], "reports").catch(() => {});
         toast("Không thể gửi báo cáo lúc này. Vui lòng thử lại.", "error", 4500);
         setIsUploadingReport(false);
         return;
       }

       // Also insert into user_reports
       await supabase.from('user_reports').insert({
         reporter_id: myId,
         reported_id: targetAccountId,
         reason: reportReason
       });

       closeReportModal();
       toast("Đã gửi báo cáo đến ban quản trị.", "success", 4000);
    } else {
       toast("Lỗi hệ thống, không thể gửi báo cáo lúc này.", "error", 4500);
    }
  };

  const handleUnblock = async (userId: string) => {
    const myId = currentUser?.id || currentUserProfile?.id;
    const targetRoommate = roommates.find(
      (roommate) =>
        roommate.id === userId ||
        roommate.user_id === userId ||
        roommate.auth_id === userId
    );
    const partnerId =
      targetRoommate?.user_id ||
      targetRoommate?.auth_id ||
      userId;

    if (myId && partnerId && import.meta.env.VITE_SUPABASE_URL) {
      const chatId = [myId, partnerId].sort().join('_');
      const { error } = await supabase.from('messages').insert({
        chat_id: chatId,
        sender_id: myId,
        text: "[SYSTEM_UNBLOCK]"
      });

      if (error) {
        console.error("[Chat] Error unblocking user:", error);
        toast("Không thể hủy chặn lúc này. Vui lòng thử lại.", "error");
        return;
      }
    }

    const updated = blockedUsers.filter(id => id !== userId);
    setBlockedUsers(updated);
    localStorage.setItem('roomiematch_blocked_users', JSON.stringify(updated));
    toast("Đã hủy chặn người dùng.", "success");
  };

  // ✅ Message Reactions Handlers
  const handleAddReaction = async (messageId: string, emoji: string) => {
    if (!import.meta.env.VITE_SUPABASE_URL || !currentUser?.id) return;

    try {
      // Get current message
      const { data: message } = await supabase
        .from('messages')
        .select('reactions')
        .eq('id', messageId)
        .single();

      const currentReactions = message?.reactions || {};
      const updatedReactions = Object.entries(currentReactions).reduce<Record<string, string[]>>(
        (result, [reactionEmoji, users]) => {
          const remainingUsers = (users as string[]).filter((userId) => userId !== currentUser.id);
          if (remainingUsers.length > 0) result[reactionEmoji] = remainingUsers;
          return result;
        },
        {}
      );

      updatedReactions[emoji] = [
        ...(updatedReactions[emoji] || []),
        currentUser.id,
      ];

      const { error } = await supabase
        .from('messages')
        .update({ reactions: updatedReactions })
        .eq('id', messageId);

      if (error) throw error;
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  };

  const handleRemoveReaction = async (messageId: string, emoji: string) => {
    if (!import.meta.env.VITE_SUPABASE_URL || !currentUser?.id) return;

    try {
      // Get current message
      const { data: message } = await supabase
        .from('messages')
        .select('reactions')
        .eq('id', messageId)
        .single();

      const currentReactions = message?.reactions || {};
      const currentUsers = currentReactions[emoji] || [];
      
      // Remove user from reaction
      const updatedUsers = currentUsers.filter((userId: string) => userId !== currentUser.id);
      const updatedReactions = {
        ...currentReactions,
        [emoji]: updatedUsers
      };

      // Clean up empty reactions
      if (updatedUsers.length === 0) {
        delete updatedReactions[emoji];
      }

      await supabase
        .from('messages')
        .update({ reactions: updatedReactions })
        .eq('id', messageId);
    } catch (error) {
      console.error('Error removing reaction:', error);
    }
  };

  useEffect(() => {
    if (activeRoommateId) {
      setChatPrivateNote(localStorage.getItem(`chat_notes_${activeRoommateId}`) || "");
    }
  }, [activeRoommateId]);

  useEffect(() => {
    if (isSavingChatNote) {
      const timer = setTimeout(() => setIsSavingChatNote(false), 1200);
      return () => clearTimeout(timer);
    }
  }, [isSavingChatNote]);

  const handleChatPrivateNoteChange = (text: string) => {
    setChatPrivateNote(text);
    if (activeRoommateId) {
      localStorage.setItem(`chat_notes_${activeRoommateId}`, text);
      setIsSavingChatNote(true);
    }
  };

  const attachImageFile = (file: File, source: "picker" | "clipboard" = "picker") => {
    if (!file.type.startsWith("image/")) {
      toast("Chỉ hỗ trợ dán hoặc gửi tệp hình ảnh.", "warning");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast("Ảnh quá lớn. Vui lòng chọn ảnh dưới 5MB.", "warning");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setAttachedImage(reader.result as string);
      if (source === "clipboard") {
        toast("Đã dán ảnh từ clipboard.", "success");
      }
    };
    reader.onerror = () => toast("Không thể đọc ảnh. Vui lòng thử lại.", "error");
    reader.readAsDataURL(file);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isActiveUserBlocked || isBlockedByPartner || isActiveUserBanned) {
      e.target.value = "";
      return;
    }
    const file = e.target.files?.[0];
    if (file) attachImageFile(file);
    e.target.value = "";
  };

  const handleChatPaste = (e: React.ClipboardEvent<HTMLFormElement>) => {
    if (isActiveUserBlocked || isBlockedByPartner || isActiveUserBanned) {
      e.preventDefault();
      return;
    }
    const imageItem = Array.from(e.clipboardData.items).find((item) =>
      item.type.startsWith("image/")
    );
    if (!imageItem) return;

    const imageFile = imageItem.getAsFile();
    if (!imageFile) return;

    e.preventDefault();
    attachImageFile(imageFile, "clipboard");
  };

  // Set first conversation active by default if none selected
  useEffect(() => {
    if (!activeRoommateId && conversations.length > 0) {
      setActiveRoommateId(conversations[0].partner.id);
    }
  }, [activeRoommateId, conversations, setActiveRoommateId]);

  // Scroll to bottom on updates
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: "smooth"
      });
    }
  }, [chats, activeRoommateId, isTyping]);

  const activeRoommate = activeRoommateId 
    ? (roommates.find((r) => r.id === activeRoommateId || r.user_id === activeRoommateId) || conversations.find(c => c.partner.id === activeRoommateId || c.partner.user_id === activeRoommateId)?.partner)
    : conversations[0]?.partner;
  
  const isActiveUserBlocked = activeRoommate ? blockedUsers.includes(activeRoommate.id) : false;
  const activeUserIds = activeRoommate
    ? [
        activeRoommate.id,
        activeRoommate.user_id,
        activeRoommate.auth_id,
        (activeRoommate as any).postedBy,
        activeRoommateId,
      ].filter(Boolean)
    : [];
  const isActiveUserBanned = activeUserIds.some((id) => bannedUserIds.includes(String(id)));
  
  const rawActiveMessages = activeRoommate ? (chats[activeRoommateId!] || chats[activeRoommate.id] || []) : [];
  const activeMessages = useMemo(() => {
    return rawActiveMessages.filter((msg, idx) => {
      // 1. Kiểm tra visibleTo từ Database Trigger
      if (msg.visibleTo && msg.visibleTo !== myChatId && msg.visibleTo !== myAuthId && msg.visibleTo !== myProfileId && msg.visibleTo !== myRoommateId) {
        console.log('[ChatFilter] Hiding message (visibleTo mismatch):', msg.text, 'visibleTo:', msg.visibleTo, 'myIds:', [myChatId, myAuthId, myProfileId, myRoommateId]);
        return false;
      }
      
      // 2. Dự phòng (Fail-safe): Nếu tin nhắn này là tin nhắn hệ thống (isSystem)
      if (msg.isSystem) {
        // Tìm tin nhắn gần nhất phía trước nó (bỏ qua các tin nhắn hệ thống khác)
        let prevUserMsg = null;
        for (let i = idx - 1; i >= 0; i--) {
          if (!rawActiveMessages[i].isSystem && rawActiveMessages[i].text !== "[SYSTEM_BLOCK]" && rawActiveMessages[i].text !== "[SYSTEM_UNBLOCK]") {
            prevUserMsg = rawActiveMessages[i];
            break;
          }
        }
        
        console.log('[ChatFilter] System msg:', msg.text, 'prevUserMsg:', prevUserMsg?.text, 'senderId:', prevUserMsg?.senderId);
        
        // Nếu tin nhắn gần nhất phía trước được gửi bởi chính mình ("me" hoặc myChatId)
        if (prevUserMsg) {
          const isSenderMe = prevUserMsg.senderId === "me" || prevUserMsg.senderId === myChatId;
          console.log('[ChatFilter] isSenderMe:', isSenderMe, 'myChatId:', myChatId);
          if (isSenderMe) {
            // Kiểm tra xem tin nhắn đó có chứa từ khóa nhạy cảm hay không
            const suspiciousKeywords = ["đặt cọc", "chuyển tiền", "chuyển khoản", "tiền cọc", "cọc giữ chỗ", "gửi cọc", "chuyển khoản trước", "gửi cọc giữ chỗ", "chuyển tiền gấp"];
            const textLower = (prevUserMsg.text || "").toLowerCase();
            const isSuspicious = suspiciousKeywords.some(kw => textLower.includes(kw));
            console.log('[ChatFilter] isSuspicious:', isSuspicious, 'text:', textLower);
            if (isSuspicious) {
              console.log('[ChatFilter] Hiding system warning for sender:', msg.text);
              return false; // Ẩn cảnh báo đối với người gửi
            }
          }
        }
      }
      return true;
    });
  }, [rawActiveMessages, myChatId]);
  const activeAgreementState = useMemo(() => {
    const latestAgreementMessage = [...activeMessages]
      .reverse()
      .find(
        (message) =>
          message.text?.startsWith("[AGREEMENT_DRAFT]") ||
          message.text?.startsWith("[AGREEMENT_SIGNED]") ||
          message.text?.startsWith("[AGREEMENT_CANCELLED]")
      );

    if (!latestAgreementMessage?.text) {
      return { status: "none" as const, payload: null };
    }

    const status = latestAgreementMessage.text.startsWith("[AGREEMENT_SIGNED]")
      ? "signed"
      : latestAgreementMessage.text.startsWith("[AGREEMENT_CANCELLED]")
        ? "cancelled"
        : "pending";
    const prefix =
      status === "signed"
        ? "[AGREEMENT_SIGNED]"
        : status === "cancelled"
          ? "[AGREEMENT_CANCELLED]"
          : "[AGREEMENT_DRAFT]";

    try {
      return {
        status,
        payload: {
          ...JSON.parse(latestAgreementMessage.text.replace(prefix, "").trim()),
          sender_id: latestAgreementMessage.senderId,
        },
      };
    } catch {
      return { status, payload: null };
    }
  }, [activeMessages]);
  const agreementStatusById = useMemo(() => {
    const map: Record<string, "pending" | "signed" | "cancelled"> = {};
    activeMessages.forEach((message) => {
      if (!message.text) return;
      let prefix = "";
      if (message.text.startsWith("[AGREEMENT_DRAFT]")) prefix = "[AGREEMENT_DRAFT]";
      else if (message.text.startsWith("[AGREEMENT_SIGNED]")) prefix = "[AGREEMENT_SIGNED]";
      else if (message.text.startsWith("[AGREEMENT_CANCELLED]")) prefix = "[AGREEMENT_CANCELLED]";

      if (prefix) {
        try {
          const payload = JSON.parse(message.text.replace(prefix, "").trim());
          if (payload?.id) {
            const status =
              prefix === "[AGREEMENT_SIGNED]"
                ? "signed"
                : prefix === "[AGREEMENT_CANCELLED]"
                  ? "cancelled"
                  : "pending";
            map[payload.id] = status;
          }
        } catch {
          // ignore
        }
      }
    });
    return map;
  }, [activeMessages]);

  const chatImages = useMemo(
    () => activeMessages.filter((message) => Boolean(message.imageUrl)),
    [activeMessages]
  );
  const reportablePartnerMessages = useMemo(() => {
    const ownId = currentUser?.id || currentUserProfile?.id;
    return activeMessages
      .filter((message) => {
        const text = String(message.text || "");
        return (
          message.senderId !== ownId &&
          message.senderId !== "me" &&
          !text.startsWith("[")
        );
      })
      .slice(-20)
      .reverse();
  }, [activeMessages, currentUser?.id, currentUserProfile?.id]);
  const filteredReportableMessages = useMemo(() => {
    const normalizedSearch = reportMessageSearch
      .trim()
      .toLocaleLowerCase("vi")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    if (!normalizedSearch) return reportablePartnerMessages;

    return reportablePartnerMessages.filter((message) => {
      const searchableText = [
        message.text || "hình ảnh",
        new Date(message.timestamp).toLocaleString("vi-VN"),
      ]
        .join(" ")
        .toLocaleLowerCase("vi")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
      return searchableText.includes(normalizedSearch);
    });
  }, [reportMessageSearch, reportablePartnerMessages]);

  const openMessageReport = (messageId: string) => {
    setSelectedReportedMessageIds([messageId]);
    setReportMessageSearch("");
    setReportReason("");
    setReportImageFile(null);
    setReportImagePreview(null);
    setIsReportModalOpen(true);
  };

  useEffect(() => {
    if (activeImageIndex === null) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setActiveImageIndex(null);
      } else if (event.key === "ArrowLeft") {
        setActiveImageIndex((current) =>
          current === null ? null : (current - 1 + chatImages.length) % chatImages.length
        );
      } else if (event.key === "ArrowRight") {
        setActiveImageIndex((current) =>
          current === null ? null : (current + 1) % chatImages.length
        );
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeImageIndex, chatImages.length]);

  useEffect(() => {
    setActiveImageIndex(null);
  }, [activeRoommateId]);

  // Check if partner has blocked us via system message
  const partnerBlockMsgs = activeMessages.filter(m => m.senderId !== "me" && m.senderId !== myChatId && (m.text === "[SYSTEM_BLOCK]" || m.text === "[SYSTEM_UNBLOCK]"));
  const lastPartnerBlockMsg = partnerBlockMsgs[partnerBlockMsgs.length - 1];
  const isBlockedByPartner = lastPartnerBlockMsg?.text === "[SYSTEM_BLOCK]";  
  
  // CRITICAL FIX: Đảm bảo luôn dùng AUTH UUID của partner, KHÔNG PHẢI listing ID
  const partnerChatId = useMemo(() => {
    if (!activeRoommate) return activeRoommateId;
    
    // QUAN TRỌNG: user_id = auth UUID (người dùng thật)
    // Nếu không có user_id → tìm trong database bằng profile ID
    let authUuid = activeRoommate.user_id || activeRoommate.auth_id;
    
    // Nếu vẫn không có và activeRoommate.id là listing ID (bắt đầu bằng "rm-")
    // → PHẢI TÌM PROFILE THẬT của người này trong database
    if (!authUuid && activeRoommate.id?.startsWith('rm-')) {
      console.warn('[Chat] Partner ID is a listing ID, need to find real user_id:', activeRoommate.id);
      // Fallback: dùng activeRoommateId tạm (nhưng sẽ bị lỗi sync)
      // TODO: Query database để tìm user_id thật từ listing
      return activeRoommateId;
    }
    
    return authUuid || activeRoommate.id || activeRoommateId;
  }, [activeRoommate, activeRoommateId]);
  
  const chatId = myChatId && partnerChatId ? [myChatId, partnerChatId].sort().join("_") : null;

  // Handle read receipts when opening chat or receiving new message
  useEffect(() => {
    if (!activeRoommateId || !myChatId || activeMessages.length === 0) return;

    // 1. Update local read timestamps so sidebar indicator clears immediately
    const lastMsg = activeMessages[activeMessages.length - 1];
    const ts = new Date(lastMsg.timestamp).getTime();
    setLastReadTimestamps(prev => {
      const current1 = prev[activeRoommateId] || 0;
      const current2 = (partnerChatId && prev[partnerChatId]) || 0;
      const current = Math.max(current1, current2);
      if (ts > current) {
        const next = { ...prev, [activeRoommateId]: ts };
        if (partnerChatId) next[partnerChatId] = ts;
        localStorage.setItem(`roomiematch_read_ts_${currentUser?.id || 'guest'}`, JSON.stringify(next));
        return next;
      }
      return prev;
    });

    // 2. Sync read receipts to server for partner to see
    const unreadFromPartner = activeMessages.filter(
      msg => msg.senderId !== "me" && msg.senderId !== myChatId && !msg.reactions?.["read"]?.includes(myChatId)
    );
    if (unreadFromPartner.length > 0) {
      const lastUnread = unreadFromPartner[unreadFromPartner.length - 1];
      if (import.meta.env.VITE_SUPABASE_URL) {
        const currentReactions = lastUnread.reactions || {};
        const readUsers = currentReactions["read"] || [];
        if (!readUsers.includes(myChatId)) {
          const updatedReactions = { ...currentReactions, "read": [...readUsers, myChatId] };
          supabase.from('messages').update({ reactions: updatedReactions }).eq('id', lastUnread.id).then(({ error }) => {
            if (error) console.error("Error marking read receipt:", error);
          });
        }
      }
    }
  }, [activeMessages, activeRoommateId, partnerChatId, myChatId]);
  
  useEffect(() => {
    if (!activeRoommateId || !activeRoommate || !import.meta.env.VITE_SUPABASE_URL) return;

    // Determine all possible chat IDs for this partner to avoid losing history
    const possibleChatIds = [
      activeRoommate.user_id ? [myChatId, activeRoommate.user_id].sort().join("_") : null,
      activeRoommate.id ? [myChatId, activeRoommate.id].sort().join("_") : null,
      activeRoommate.auth_id ? [myChatId, activeRoommate.auth_id].sort().join("_") : null,
      chatId // The canonical one
    ].filter(Boolean) as string[];
    
    // Unique chat IDs
    const uniqueChatIds = Array.from(new Set(possibleChatIds));

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .in('chat_id', uniqueChatIds)
        .order('timestamp', { ascending: true });
        
      if (!error && data) {
        setChats(prev => ({
          ...prev,
          [activeRoommateId]: data.map((d: any) => ({
            id: d.id, chatId: d.chat_id, senderId: d.sender_id,
            text: d.text, imageUrl: d.image_url, timestamp: d.timestamp,
            reactions: d.reactions || {}, // ✅ Include reactions
            isSystem: d.is_system || false,
            visibleTo: d.visible_to || undefined
          }))
        }));
      }
    };
    fetchMessages();

    // Subscribe to all possible chat IDs for realtime updates
    const channels = uniqueChatIds.map(id => {
      return supabase
        .channel(`messages:${id}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `chat_id=eq.${id}` }, (payload) => {
          const newMsg = payload.new as any;
          
          // ✅ Show toast notification for agreement signed
          if (newMsg.text?.startsWith('[AGREEMENT_SIGNED]') && newMsg.sender_id !== myChatId) {
            toast('🎉 Thỏa thuận đã được ký thành công! Chúc bạn có trải nghiệm ở ghép vui vẻ!', 'success', 5000);
          }
          
          setChats(prev => {
            const cur = prev[activeRoommateId] || [];
            if (cur.some(m => m.id === newMsg.id)) return prev;
            // Insert and sort to ensure chronological order when merging streams
            const updated = [...cur, { 
              id: newMsg.id, 
              chatId: newMsg.chat_id, 
              senderId: newMsg.sender_id, 
              text: newMsg.text, 
              imageUrl: newMsg.image_url, 
              timestamp: newMsg.timestamp, 
              reactions: newMsg.reactions || {},
              isSystem: newMsg.is_system || false,
              visibleTo: newMsg.visible_to || undefined
            }];
            return { ...prev, [activeRoommateId]: updated.sort((a, b) => {
               const timeDiff = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
               if (timeDiff !== 0) return timeDiff;
               const aIsSystem = a.isSystem || a.senderId === 'system';
               const bIsSystem = b.isSystem || b.senderId === 'system';
               if (aIsSystem && !bIsSystem) return 1;
               if (!aIsSystem && bIsSystem) return -1;
               return 0;
             }) };
          });
        })
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages', filter: `chat_id=eq.${id}` }, (payload) => {
          // ✅ Handle reaction updates  
          const updatedMsg = payload.new as any;
          setChats(prev => {
            const cur = prev[activeRoommateId] || [];
            const updated = cur.map(msg => 
              msg.id === updatedMsg.id 
                ? { ...msg, reactions: updatedMsg.reactions || {} }
                : msg
            );
            return { ...prev, [activeRoommateId]: updated };
          });
        })
        .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'messages', filter: `chat_id=eq.${id}` }, (payload) => {
          const deletedMessage = payload.old as any;
          setChats(prev => ({
            ...prev,
            [activeRoommateId]: (prev[activeRoommateId] || []).filter(
              message => message.id !== deletedMessage.id
            ),
          }));
        })
        .subscribe();
    });

    return () => { channels.forEach(ch => supabase.removeChannel(ch)); };
  }, [activeRoommateId, activeRoommate, myChatId]);
  
  // Check if 2-way messages exist & signed agreement exists
  useEffect(() => {
    if (!activeRoommateId || !activeRoommate) {
      setHasTwoWayMessages(false);
      setHasSignedAgreement(false);
      return;
    }
    
    const messages = chats[activeRoommateId] || [];
    
    // Check 2-way messages
    const myMessages = messages.filter(m => m.senderId === myChatId);
    const theirMessages = messages.filter(m => m.senderId !== myChatId);
    const has2Way = myMessages.length > 0 && theirMessages.length > 0;
    
    // The agreement is active only when the latest event is SIGNED.
    const hasSigned = activeAgreementState.status === "signed";
    
    setHasTwoWayMessages(has2Way);
    setHasSignedAgreement(hasSigned);
  }, [activeRoommateId, activeRoommate, chats, myChatId, activeAgreementState.status]);

  // Fetch Inbox Conversations


  // Fetch Inbox Conversations
  useEffect(() => {
    if (!import.meta.env.VITE_SUPABASE_URL) return;
    if (!myAuthId) {
      setIsInboxLoading(false);
      return;
    }

    let cancelled = false;
    let refreshTimer: ReturnType<typeof setTimeout> | null = null;

    const fetchInbox = async () => {
      // Chỉ cần tìm bằng Auth UUID - đơn giản, đáng tin cậy
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .ilike('chat_id', `%${myAuthId}%`)
        .order('timestamp', { ascending: false })
        .limit(500);

      if (!error && data) {
        // Phân loại tin nhắn theo chat_id để lọc fail-safe trước
        const messagesByChat: Record<string, any[]> = {};
        data.forEach(msg => {
          if (isSystemChannel(msg.chat_id)) return;
          if (!messagesByChat[msg.chat_id]) {
            messagesByChat[msg.chat_id] = [];
          }
          messagesByChat[msg.chat_id].push(msg);
        });

        const filteredList: any[] = [];
        Object.keys(messagesByChat).forEach(cId => {
          // Sắp xếp thời gian tăng dần để áp dụng bộ lọc fail-safe
          const msgs = messagesByChat[cId].sort((a, b) => {
            const timeDiff = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
            if (timeDiff !== 0) return timeDiff;
            const aIsSystem = a.is_system || a.isSystem || a.sender_id === 'system' || a.senderId === 'system';
            const bIsSystem = b.is_system || b.isSystem || b.sender_id === 'system' || b.senderId === 'system';
            if (aIsSystem && !bIsSystem) return 1;
            if (!aIsSystem && bIsSystem) return -1;
            return 0;
          });
          const filtered = msgs.filter((msg, idx) => {
            // 1. Kiểm tra visible_to
            if (msg.is_system && msg.visible_to && msg.visible_to !== myAuthId && msg.visible_to !== myProfileId && msg.visible_to !== myRoommateId) {
              return false;
            }
            // 2. Dự phòng (Fail-safe): Nếu tin nhắn này là tin nhắn hệ thống (is_system)
            if (msg.is_system) {
              let prevUserMsg = null;
              for (let i = idx - 1; i >= 0; i--) {
                if (!msgs[i].is_system && msgs[i].text !== "[SYSTEM_BLOCK]" && msgs[i].text !== "[SYSTEM_UNBLOCK]") {
                  prevUserMsg = msgs[i];
                  break;
                }
              }
              if (prevUserMsg) {
                const isSenderMe = prevUserMsg.sender_id === myAuthId || prevUserMsg.sender_id === myProfileId;
                if (isSenderMe) {
                  const suspiciousKeywords = ["đặt cọc", "chuyển tiền", "chuyển khoản", "tiền cọc", "cọc giữ chỗ", "gửi cọc", "chuyển khoản trước", "gửi cọc giữ chỗ", "chuyển tiền gấp"];
                  const textLower = (prevUserMsg.text || "").toLowerCase();
                  const isSuspicious = suspiciousKeywords.some(kw => textLower.includes(kw));
                  if (isSuspicious) {
                    return false;
                  }
                }
              }
            }
            return true;
          });
          filteredList.push(...filtered);
        });

        // Sắp xếp lại theo thời gian giảm dần (newest first) cho inbox
        const inboxMessages = filteredList.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        const conversationMap = new Map();

        // Collect all unique partner IDs
        const partnerIds = new Set<string>();
        inboxMessages.forEach(msg => {
          const ids = msg.chat_id.split('_');
          const partnerId = ids[0] === myAuthId ? ids[1] : ids[0];
          if (partnerId !== myAuthId) partnerIds.add(partnerId);
        });

        // Fetch partner profiles - prioritize roommates table (has full data)
        const dbPartnerMap = new Map();
        
        if (partnerIds.size > 0) {
          const partnerArr = Array.from(partnerIds);
          partnerArr.forEach(partnerId => {
            const cachedPartner = roommatesRef.current.find(roommate =>
              roommate.id === partnerId ||
              roommate.user_id === partnerId ||
              roommate.auth_id === partnerId
            );
            if (cachedPartner) dbPartnerMap.set(partnerId, cachedPartner);
          });
          const missingPartnerArr = partnerArr.filter(partnerId => !dbPartnerMap.has(partnerId));
          
          // Batch fetch ALL fields from roommates table (has full data)
          // Priority: roommates (full data with budget, lifestyle, bio) > profiles (basic data only)
          const emptyResult = { data: [] as any[] };
          const [roommatesById, roommatesByUserId, profilesById, profilesByAuthId, roommates_auth_id] =
            missingPartnerArr.length > 0
              ? await Promise.all([
                  supabase.from('roommates').select('*').in('id', missingPartnerArr),
                  supabase.from('roommates').select('*').in('user_id', missingPartnerArr),
                  supabase.from('profiles').select('*').in('id', missingPartnerArr),
                  supabase.from('profiles').select('*').in('auth_id', missingPartnerArr),
                  supabase.from('roommates').select('*').in('auth_id', missingPartnerArr)
                ])
              : [emptyResult, emptyResult, emptyResult, emptyResult, emptyResult];
          
          // Map roommates first (priority - has full lifestyle, bio, budget, etc.)
          [...(roommatesById.data || []), ...(roommatesByUserId.data || []), ...(roommates_auth_id.data || [])].forEach(r => {
            if (!dbPartnerMap.has(r.id)) dbPartnerMap.set(r.id, r);
            if (r.user_id && !dbPartnerMap.has(r.user_id)) dbPartnerMap.set(r.user_id, r);
            if (r.auth_id && !dbPartnerMap.has(r.auth_id)) dbPartnerMap.set(r.auth_id, r);
          });
          
          // Fallback to profiles for missing (basic info only)
          [...(profilesById.data || []), ...(profilesByAuthId.data || [])].forEach(p => {
            if (!dbPartnerMap.has(p.id)) dbPartnerMap.set(p.id, p);
            if (p.auth_id && !dbPartnerMap.has(p.auth_id)) dbPartnerMap.set(p.auth_id, p);
          });
          
        }

        // Track agreements for badge notifications
        const agreementMap: Record<string, boolean> = {};

        inboxMessages.forEach(msg => {
          const ids = msg.chat_id.split('_');
          const partnerId = ids[0] === myAuthId ? ids[1] : ids[0];
          if (partnerId === myAuthId) return;

          // Data is newest-first. Only the latest agreement event decides the badge.
          if (
            agreementMap[partnerId] === undefined &&
            (
              msg.text?.startsWith('[AGREEMENT_DRAFT]') ||
              msg.text?.startsWith('[AGREEMENT_SIGNED]') ||
              msg.text?.startsWith('[AGREEMENT_CANCELLED]')
            )
          ) {
            agreementMap[partnerId] =
              msg.sender_id !== myAuthId &&
              (msg.text?.startsWith('[AGREEMENT_DRAFT]') || false);
          }

          // Try to get partner - PRIORITIZE database over props
          // 1. Try database first (most up-to-date) - check by all ID types
          let partner = dbPartnerMap.get(partnerId);
          
          // 2. Fallback: try from roommates list from props
          if (!partner) {
            partner = roommatesRef.current.find(r => r.id === partnerId || r.user_id === partnerId || r.auth_id === partnerId);
          }
          
          if (!partner) {
            console.warn('[Chat] Partner not found in any table, using fallback for:', partnerId);
            // Fallback: try to find their name from any message they sent in the inbox
            const theirMsg = inboxMessages.find(m => m.chat_id === msg.chat_id && m.sender_id === partnerId && m.sender_name);
            const fallbackName = theirMsg?.sender_name || 'Người dùng';
            
            // Default fallback (should rarely happen)
            partner = { 
              id: partnerId, 
              user_id: partnerId,
              auth_id: partnerId,
              name: fallbackName, 
              avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop', 
              role: 'Thành viên', 
              isVerified: false, 
              matchScore: 0,
              budget: 0,
              gender: 'Khác',
              age: 20,
              location: '',
              tags: [],
              reputationScore: 0,
              bio: '',
              reviews: [],
              lifestyle: {
                sleep: 'Bình thường',
                pets: 'Thoải mái',
                smoke: 'Không hút thuốc',
                cook: 'Đôi khi nấu',
                interaction: 'Cân bằng',
                neatness: 'Sạch sẽ'
              }
            } as any;
          }
          
          // Ensure partner has complete data structure (defensive coding)
          if (!partner.lifestyle) {
            console.warn('[Chat] Partner missing lifestyle data, adding defaults for:', partner.name);
            partner.lifestyle = {
              sleep: 'Bình thường',
              pets: 'Thoải mái',
              smoke: 'Không hút thuốc',
              cook: 'Đôi khi nấu',
              interaction: 'Cân bằng',
              neatness: 'Sạch sẽ'
            };
          }
          
          if (!partner.budget) {
            console.warn('[Chat] Partner missing budget, setting to 0 for:', partner.name);
            partner.budget = 0;
          }
          
          if (!partner.bio) {
            partner.bio = '';
          }
          
          // NORMALIZE to a single canonical ID
          // Use partnerId (from chat_id split) as the key since:
          // - It's what's actually in the messages
          // - partner.id may be different if partner is retrieved from different tables
          const canonicalId = partnerId;
          
          // Check if this canonical ID already has a conversation
          if (conversationMap.has(canonicalId)) {
            // Update existing conversation if this message is newer
            const existing = conversationMap.get(canonicalId);
            if (new Date(msg.timestamp) > new Date(existing.timestamp)) {
              conversationMap.set(canonicalId, {
                partner,
                partnerId: canonicalId,
                lastMessage: msg.text || 'Đã gửi đính kèm',
                timestamp: msg.timestamp,
                chatId: msg.chat_id,
                senderId: msg.sender_id,
                reactions: msg.reactions || {}
              });
            }
          } else {
            // New conversation - use canonical ID
            conversationMap.set(canonicalId, {
              partner,
              partnerId: canonicalId, // Store canonical ID in conversation
              lastMessage: msg.text || 'Đã gửi đính kèm',
              timestamp: msg.timestamp,
              chatId: msg.chat_id,
              senderId: msg.sender_id,
              reactions: msg.reactions || {}
            });
          }
        });

        // Đảm bảo activeRoommateId luôn có trong list
        const selectedRoommateId = activeRoommateIdRef.current;
        if (selectedRoommateId) {
          let activePartner = roommatesRef.current.find(
            r => r.id === selectedRoommateId || r.user_id === selectedRoommateId
          ) || dbPartnerMap.get(selectedRoommateId);
          
          if (activePartner) {
            // Use activePartner's user_id or auth_id if available, otherwise fallback to activeRoommateId
            const canonicalId = activePartner.user_id || activePartner.auth_id || selectedRoommateId;
            
            // Also check if we already have a conversation with this partner under ANY key
            let hasExisting = false;
            for (const conv of conversationMap.values()) {
              if ((activePartner.user_id && conv.partner.user_id === activePartner.user_id) || 
                  (activePartner.auth_id && conv.partner.auth_id === activePartner.auth_id) || 
                  (activePartner.id && conv.partner.id === activePartner.id)) {
                hasExisting = true;
                break;
              }
            }
            
            if (!hasExisting && !conversationMap.has(canonicalId)) {
              // Ensure partner has complete data structure
              if (!activePartner.lifestyle) {
                console.warn('[Chat] Active partner missing lifestyle, adding defaults');
                activePartner.lifestyle = {
                  sleep: 'Bình thường', pets: 'Thoải mái', smoke: 'Không hút thuốc',
                  cook: 'Đôi khi nấu', interaction: 'Cân bằng', neatness: 'Sạch sẽ'
                };
              }
              if (!activePartner.budget) activePartner.budget = 0;
              if (!activePartner.bio) activePartner.bio = '';
              
              conversationMap.set(canonicalId, {
                partner: activePartner,
                partnerId: canonicalId,
                lastMessage: 'Bắt đầu cuộc trò chuyện...',
                timestamp: new Date().toISOString(),
                chatId: [myAuthId, selectedRoommateId].sort().join('_'),
                senderId: myAuthId,
                reactions: {}
              });
              
            }
          }
        }

        // Convert to array and DEDUPLICATE based on partner identity
        // Use a Set to track seen partners by their unique identifier combo (name + avatar + user_id/auth_id)
        const seenPartners = new Set<string>();
        const deduplicatedConversations: any[] = [];
        
        Array.from(conversationMap.values())
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .forEach((conv) => {
            // Create a unique key based on partner's actual identity markers
            const partnerKey = `${conv.partner.name}_${conv.partner.avatar || ''}_${conv.partner.user_id || conv.partner.auth_id || conv.partner.id}`;
            
            if (!seenPartners.has(partnerKey)) {
              seenPartners.add(partnerKey);
              deduplicatedConversations.push(conv);
            }
          });

        if (cancelled) return;
        setConversations(deduplicatedConversations);
        try {
          localStorage.setItem(
            `roomiematch_inbox_${myAuthId}`,
            JSON.stringify(deduplicatedConversations)
          );
        } catch (cacheError) {
          console.warn("[Chat] Could not cache inbox:", cacheError);
        }
        setConversationsWithAgreements(agreementMap);
        setIsInboxLoading(false);
        
      } else if (error) {
        console.error('[Chat] Error fetching inbox:', error);
        setIsInboxLoading(false);
      }

    };
    fetchInboxRef.current = fetchInbox;
    fetchInbox();

    const scheduleInboxRefresh = () => {
      if (refreshTimer) clearTimeout(refreshTimer);
      refreshTimer = setTimeout(fetchInbox, 150);
    };

    const inboxChannel = supabase
      .channel('inbox_updates')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const newMsg = payload.new as any;
        if (newMsg.chat_id?.includes(myAuthId) && !isSystemChannel(newMsg.chat_id)) {
          scheduleInboxRefresh();
        }
      })
      .subscribe();

    return () => {
      cancelled = true;
      if (refreshTimer) clearTimeout(refreshTimer);
      if (fetchInboxRef.current === fetchInbox) fetchInboxRef.current = null;
      supabase.removeChannel(inboxChannel);
    };
  }, [myAuthId]);




  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!inputText.trim() && !attachedImage) || !activeRoommateId || !currentUserProfile) return;
    // Kiểm tra trực tiếp Database để tránh trường hợp user chưa F5 trang web
    if (currentUser?.id) {
      const { data: dbCheck } = await supabase.from('profiles').select('locked_until, is_locked').eq('auth_id', currentUser.id).maybeSingle();
      const isLocked24h = dbCheck?.locked_until && new Date(dbCheck.locked_until).getTime() > Date.now();
      const isLockedPerm = dbCheck?.is_locked === true || dbCheck?.is_locked === 'true';
      if (isLocked24h || isLockedPerm) {
        toast("Tài khoản của bạn đã bị vô hiệu hóa vì nghi ngờ vi phạm", "error", 5000);
        return;
      }
    }
    if (isActiveUserBlocked || isBlockedByPartner || isActiveUserBanned) return;

    const userMessageText = inputText.trim();
    let sentImage = attachedImage;
    if (sentImage && sentImage.startsWith('data:image')) {
      try {
        sentImage = await uploadInlineImage('room-images', `chat_${Date.now()}_${myChatId}.png`, sentImage);
      } catch (err) {
        console.error("Failed to upload chat image", err);
      }
    }
    
    setInputText("");
    setAttachedImage(null);

    const generateUUID = () => typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8); return v.toString(16); });
    const newMsgId = generateUUID();
    const newMsg: Message = {
      id: newMsgId,
      chatId: activeRoommateId,
      senderId: myChatId,
      text: userMessageText,
      imageUrl: sentImage || undefined,
      timestamp: new Date().toISOString(),
    };

    console.log('[Chat] Sending message:', {
      newMsgId,
      chatId,
      myChatId,
      activeRoommateId,
      text: userMessageText
    });

    // Optimistic UI Update
    const updatedMessages = [...activeMessages, newMsg];
    setChats((prev) => ({
      ...prev,
      [activeRoommateId]: updatedMessages,
    }));

    if (import.meta.env.VITE_SUPABASE_URL) {
      // Send to Supabase
      const { data, error } = await supabase.from('messages').insert({
        id: newMsg.id,
        chat_id: chatId,
        sender_id: myChatId,
        text: userMessageText,
        image_url: sentImage || undefined,
      });
      
      if (error) {
        console.error("[Chat] Error sending message to Supabase:", error);
        setChats((previous) => ({
          ...previous,
          [activeRoommateId]: (previous[activeRoommateId] || []).filter(
            (message) => message.id !== newMsg.id
          ),
        }));
        toast(
          isActiveUserBanned
            ? "Người dùng này đã bị khóa nên không thể nhận tin nhắn."
            : "Không thể gửi tin nhắn lúc này. Vui lòng thử lại.",
          "error",
          4000
        );
      } else {
        console.log("[Chat] Message sent successfully to Supabase:", data);
      }
    } else {
      console.warn("[Chat] Supabase not configured, message not sent to server");
    }
  };

  if (!currentUser) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 min-h-[60vh] animate-fade-in">
        <div className="bg-white p-10 rounded-[32px] shadow-[0_10px_40px_rgba(15,23,42,0.06)] border border-slate-100 max-w-md text-center">
          <div className="w-20 h-20 bg-sky-50 text-sky-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
             <Lock className="h-10 w-10" />
          </div>
          <h3 className="text-2xl font-black text-slate-800 mb-3 tracking-tight">Yêu cầu đăng nhập</h3>
          <p className="text-slate-500 mb-8 leading-relaxed">Vui lòng đăng nhập để có thể trò chuyện an toàn và bảo mật với các bạn cùng phòng tiềm năng.</p>
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
          <p className="text-slate-500 mb-8 leading-relaxed">Bạn cần thiết lập hồ sơ cá nhân của mình trước khi có thể nhắn tin cho người khác.</p>
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

  return (
    <div className="bg-white rounded-[32px] border border-gray-100 overflow-hidden shadow-[0_15px_50px_rgba(15,23,42,0.04)] h-[calc(100vh-140px)] min-h-[600px] flex divide-x divide-slate-100 animate-fade-in relative">

      {/* Left Column: Matches list */}
      <div className="w-[300px] h-full flex flex-col bg-slate-50/50 shrink-0 hidden md:flex">
        <div className="p-5 border-b border-slate-100 bg-white">
          <h3 className="text-lg font-extrabold text-[#0f172a] tracking-tight mb-4">Tin Nhắn</h3>
          
          {/* Tab Toggle: Active / Blocked */}
          <div className="flex gap-1.5 mb-4">
            <button
              onClick={() => setShowBlockedUsers(false)}
              className={`flex-1 py-2 px-2 rounded-xl text-[11px] font-bold transition-all ${
                !showBlockedUsers
                  ? "bg-sky-100 text-sky-700 border-2 border-sky-300"
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200"
              }`}
            >
              Đang chat ({conversations.filter(c => !blockedUsers.includes(c.partner.id)).length})
            </button>
            <button
              onClick={() => setShowBlockedUsers(true)}
              className={`flex-1 py-2 px-2 rounded-xl text-[11px] font-bold transition-all ${
                showBlockedUsers
                  ? "bg-red-100 text-red-700 border-2 border-red-300"
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200"
              }`}
            >
              Đã chặn ({blockedUsers.length})
            </button>
          </div>
          
          {/* Search Bar */}
          <div className="relative group">
            <input
              type="text"
              placeholder="Tìm theo tên..."
              value={friendSearchQuery}
              onChange={(e) => setFriendSearchQuery(e.target.value)}
              className="w-full bg-slate-100/70 border border-slate-200/60 text-slate-800 text-[13px] rounded-2xl px-4 py-2.5 outline-none focus:bg-white focus:border-sky-300 focus:ring-4 focus:ring-sky-50 transition-all duration-300 font-medium placeholder:text-slate-400 group-hover:bg-slate-50"
            />
          </div>
        </div>

        {/* Inbox chat list wrapper */}
        <div className="flex-grow overflow-y-auto p-3 space-y-1.5 scrollbar-thin">
          {conversations.length === 0 && isInboxLoading ? (
            <div className="space-y-3 p-1">
              {[0, 1, 2].map(item => (
                <div key={item} className="flex animate-pulse items-center gap-3 rounded-2xl bg-white p-3">
                  <div className="h-11 w-11 shrink-0 rounded-full bg-slate-200" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-2/3 rounded bg-slate-200" />
                    <div className="h-2.5 w-1/2 rounded bg-slate-100" />
                  </div>
                </div>
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-8 text-slate-400 font-medium text-sm">
              Chưa có cuộc trò chuyện nào.
            </div>
          ) : showBlockedUsers ? (
            /* ✅ Show blocked users list */
            roommates
              .filter(r => blockedUsers.includes(r.id))
              .filter(r => r.name.toLowerCase().includes(friendSearchQuery.toLowerCase()))
              .map((r) => {
                const partnerId = r.id;
                return (
                  <div
                    key={r.id}
                    className="flex gap-3 p-3.5 rounded-2xl border border-red-100 bg-red-50/50 items-center group"
                  >
                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-red-200 shadow-inner shrink-0 relative opacity-60 cursor-zoom-in" onClick={(e) => { e.stopPropagation(); previewImage(r.avatar); }}>
                      <img src={r.avatar} alt={r.name} className="w-full h-full object-cover grayscale" />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                        <Ban className="h-5 w-5 text-white" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-red-700 leading-tight tracking-tight truncate">
                        {r.name}
                      </h4>
                      <p className="text-xs text-red-500 truncate leading-snug font-medium">
                        {r.role} • {r.location}
                      </p>
                    </div>
                    
                    {/* Unblock button */}
                    <button
                      onClick={async () => {
                        const confirmed = await confirm({
                          title: "Mở chặn người dùng",
                          message: `Bạn có chắc chắn muốn mở chặn ${r.name}? Bạn sẽ có thể nhắn tin lại với người này.`,
                          confirmText: "Mở chặn",
                          cancelText: "Hủy",
                          type: "warning"
                        });
                        
                        if (confirmed) {
                          handleUnblock(r.id);
                        }
                      }}
                      className="shrink-0 px-3 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-xs font-bold transition-colors"
                    >
                      Mở chặn
                    </button>
                  </div>
                );
              })
          ) : (
            conversations
              .filter(conv => {
                if (!conv.partner.name.toLowerCase().includes(friendSearchQuery.toLowerCase())) {
                  return false;
                }
                const partnerId = conv.partnerId || conv.partner.id;
                return !blockedUsers.includes(partnerId) && !blockedUsers.includes(conv.partner.id);
              })
              .map((conv) => {
              const r = conv.partner;
              const isActive = r.id === activeRoommateId;
              const lastMsg = conv.lastMessage;
              // Use canonical ID from conversation
              const partnerId = conv.partnerId || r.id;
              const hasAgreement = conversationsWithAgreements[partnerId];

              const myChatId = currentUser?.id || currentUserProfile?.id;
              const isUnread = !!conv.senderId 
                && conv.senderId !== "me" 
                && conv.senderId !== myChatId 
                && conv.lastMessage !== "[SYSTEM_BLOCK]"
                && conv.lastMessage !== "[SYSTEM_UNBLOCK]"
                && new Date(conv.timestamp).getTime() > (lastReadTimestamps[partnerId] || 0)
                && !isActive;
              
              return (
                <div
                  key={r.id}
                  className={`flex gap-3 p-3.5 rounded-2xl cursor-pointer duration-150 items-center group relative ${
                    isActive
                      ? "bg-[#dff6ff] border border-sky-100 shadow-sm"
                      : "hover:bg-slate-100/60 border border-transparent"
                  }`}
                >
                  <div 
                    onClick={() => setActiveRoommateId(r.id)}
                    className="flex gap-3 items-center flex-1 min-w-0"
                  >
                    <div className="w-12 h-12 rounded-full overflow-hidden border border-slate-200 shadow-inner shrink-0 relative cursor-zoom-in" onClick={(e) => { e.stopPropagation(); previewImage(r.avatar); }}>
                      <img src={r.avatar} alt={r.name} className="w-full h-full object-cover" />
                      <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-green-400 ring-2 ring-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-0.5">
                        <h4 className={`text-sm leading-tight tracking-tight truncate flex items-center gap-1 ${isUnread ? "text-slate-900 font-extrabold" : "text-slate-800 font-bold"}`}>
                          {r.name}
                          {blockedUsers.includes(r.id) && <span title="Đã chặn"><Ban className="h-3 w-3 text-red-400 shrink-0" /></span>}
                        </h4>
                      </div>
                      <p className={`text-xs truncate leading-snug select-none ${isUnread ? "text-black font-extrabold" : "text-slate-400 font-medium"}`}>{lastMsg}</p>
                    </div>
                  </div>
                  
                  {/* Unread dot indicator at the far right */}
                  {isUnread && (
                    <div className="shrink-0 pl-1 flex items-center">
                      <div className="w-3 h-3 bg-[#0084ff] rounded-full shadow-sm" title="Có tin nhắn mới" />
                    </div>
                  )}

                  {/* Agreement badge notification */}
                  {hasAgreement && !isUnread && (
                    <div className="shrink-0">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" title="Có thỏa thuận mới" />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right Column: Chat layout box */}
      <div className="flex-1 h-full flex flex-col bg-slate-55 bg-gradient-to-b from-white to-slate-50">
        {activeRoommate ? (
          <>
            {/* Top active bar */}
            <div className="px-6 py-4 border-b border-slate-100 bg-white flex items-center justify-between shadow-sm shrink-0">
              <div className="flex items-center gap-3">
                {/* Mobile back trigger to list, currently can keep simple. */}
                <div className="w-11 h-11 rounded-full overflow-hidden border border-slate-200 shrink-0 cursor-zoom-in" onClick={(e) => { e.stopPropagation(); previewImage(activeRoommate.avatar); }}>
                  <img src={activeRoommate.avatar} alt={activeRoommate.name} className="w-full h-full object-cover" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#0f172a] leading-none tracking-tight flex items-center gap-1.5">
                    {activeRoommate.name}
                    {/* Block Button - Right next to name */}
                    {isActiveUserBlocked ? (
                      <button
                        onClick={() => activeRoommate && handleUnblock(activeRoommate.id)}
                        className="ml-2 px-2.5 py-1 rounded-lg bg-red-100 hover:bg-red-50 text-red-600 transition-colors duration-200 cursor-pointer text-xs font-bold border border-red-200"
                        title="Hủy chặn người dùng"
                      >
                        <Ban className="h-3.5 w-3.5 inline mr-1" />
                        Đã chặn
                      </button>
                    ) : (
                      <button
                        onClick={async () => {
                          const confirmed = await confirm({
                            title: "Chặn người dùng",
                            message: `Bạn có chắc chắn muốn chặn ${activeRoommate.name}? Bạn sẽ không thể nhắn tin với người này nữa.`,
                            confirmText: "Chặn",
                            cancelText: "Hủy",
                            type: "danger"
                          });
                          
                          if (confirmed) {
                            const myId = currentUser?.id || currentUserProfile?.id;
                            if (myId && partnerChatId && activeRoommate && import.meta.env.VITE_SUPABASE_URL) {
                              const chatIdForBlock = [myId, partnerChatId].sort().join('_');
                              const { error } = await supabase.from('messages').insert({
                                chat_id: chatIdForBlock,
                                sender_id: myId,
                                text: "[SYSTEM_BLOCK]"
                              });

                              if (error) {
                                console.error("[Chat] Error blocking user:", error);
                                toast("Không thể chặn người dùng lúc này. Vui lòng thử lại.", "error");
                                return;
                              }

                              const partnerKey = activeRoommate.id;
                              const updated = blockedUsers.includes(partnerKey)
                                ? blockedUsers
                                : [...blockedUsers, partnerKey];
                              setBlockedUsers(updated);
                              localStorage.setItem('roomiematch_blocked_users', JSON.stringify(updated));
                              setAttachedImage(null);
                              setInputText("");
                              toast(`${activeRoommate.name} sẽ không thể nhắn tin cho bạn.`, "success");
                            }
                          }
                        }}
                        className="ml-2 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-600 transition-colors duration-200 cursor-pointer text-xs font-bold border border-slate-200 hover:border-red-200"
                        title="Chặn người dùng"
                      >
                        <Ban className="h-3.5 w-3.5 inline mr-1" />
                        Chặn
                      </button>
                    )}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    {activeRoommate.role} • {activeRoommate.location}
                  </p>
                </div>
              </div>

              {/* Conversation actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowMobileNote(!showMobileNote)}
                  className={`p-2.5 rounded-xl border lg:hidden duration-150 cursor-pointer ${
                    showMobileNote 
                      ? "bg-amber-500 text-white border-amber-500 shadow-sm" 
                      : "border-slate-200 text-[#006590] hover:bg-slate-50"
                  }`}
                  title="Ghi chú cá nhân"
                >
                  <FileText className="h-4 w-4" />
                </button>
                <button
                  onClick={() => {
                    // Mark agreement as read when opening from action button
                    const partnerId = activeRoommate.user_id || activeRoommate.id;
                    setConversationsWithAgreements(prev => ({ ...prev, [partnerId]: false }));

                    // A signed agreement opens the signed copy; otherwise start a new agreement.
                    setAgreementModalPayload(
                      activeAgreementState.status === "signed"
                        ? activeAgreementState.payload
                        : null
                    );
                    setIsAgreementModalOpen(true);
                  }}
                  className={`px-4 py-2.5 rounded-xl hover:shadow-lg hover:-translate-y-0.5 text-white text-[13px] font-bold transition-all duration-300 cursor-pointer flex items-center gap-2 ${
                    activeAgreementState.status === "signed"
                      ? "bg-gradient-to-r from-emerald-600 to-green-600"
                      : "bg-gradient-to-r from-[#006590] to-sky-600"
                  }`}
                >
                  {activeAgreementState.status === "signed" ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <BadgeCheck className="h-4 w-4" />
                  )}
                  <span className="hidden sm:inline">
                    {activeAgreementState.status === "signed" ? "Đã ký kết" : "Lập Thỏa Thuận"}
                  </span>
                </button>
                <button
                  onClick={() => {
                    const latestPartnerMessage = reportablePartnerMessages[0];
                    if (!latestPartnerMessage) {
                      toast("Chưa có tin nhắn nào từ người này để báo cáo.", "warning");
                      return;
                    }
                    openMessageReport(latestPartnerMessage.id);
                  }}
                  className="px-3.5 py-2.5 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700 transition-colors duration-200 cursor-pointer flex items-center gap-2 font-bold text-[13px] border border-rose-200 hover:border-rose-300"
                  title="Báo cáo vi phạm"
                >
                  <AlertOctagon className="h-4 w-4" />
                  <span className="hidden sm:inline">Báo cáo</span>
                </button>
              </div>
            </div>

            {/* Message bubbles wrapper container */}
            <div ref={scrollContainerRef} className="flex-grow p-6 overflow-y-auto space-y-4 scroll-smooth">
              {activeMessages.length === 0 ? (
                <div className="text-center py-12 max-w-sm mx-auto">
                  <div className="p-4 bg-sky-50 text-[#006590] rounded-2xl inline-flex mb-3">
                    <MessageSquare className="h-6 w-6" />
                  </div>
                  <p className="text-slate-400 font-bold mb-1">Bắt đầu trò chuyện!</p>
                  <p className="text-xs text-slate-500 leading-normal">
                    Hãy gửi tin nhắn đầu tiên chào hỏi và cùng thương thảo về giá phòng, thói quen nuôi thú cưng, giấc ngủ để tìm hiểu sâu hơn nhé.
                  </p>
                </div>
              ) : (
                activeMessages.map((msg, index) => {
                  const isMe = msg.senderId === "me" || msg.senderId === myChatId;
                  const isLast = index === activeMessages.length - 1;
                  const timeElapsed = Date.now() - new Date(msg.timestamp).getTime();
                  const hasPartnerRepliedAfter = activeMessages.slice(index + 1).some(m => m.senderId !== "me" && m.senderId !== myChatId && m.text !== "[SYSTEM_BLOCK]" && m.text !== "[SYSTEM_UNBLOCK]");
                  const isRead = msg.reactions?.["read"]?.includes(partnerChatId || "") || hasPartnerRepliedAfter;
                  const statusText = isRead ? "Đã xem" : "Đã gửi";
                  
                  let isAgreementDraft = false;
                  let isAgreementSigned = false;
                  let isAgreementCancelled = false;
                  let agreementPayload: any = null;
                  
                  if (msg.text?.startsWith('[AGREEMENT_DRAFT]')) {
                    isAgreementDraft = true;
                    try { agreementPayload = { ...JSON.parse(msg.text.replace('[AGREEMENT_DRAFT]', '').trim()), sender_id: msg.senderId }; } catch(e) {}
                  } else if (msg.text?.startsWith('[AGREEMENT_SIGNED]')) {
                    isAgreementSigned = true;
                    try { agreementPayload = { ...JSON.parse(msg.text.replace('[AGREEMENT_SIGNED]', '').trim()), sender_id: msg.senderId }; } catch(e) {}
                  } else if (msg.text?.startsWith('[AGREEMENT_CANCELLED]')) {
                    isAgreementCancelled = true;
                    try { agreementPayload = { ...JSON.parse(msg.text.replace('[AGREEMENT_CANCELLED]', '').trim()), sender_id: msg.senderId }; } catch(e) {}
                  }
                  
                  const isSpecialMessage = isAgreementDraft || isAgreementSigned || isAgreementCancelled;

                  const isSystemBlock = msg.text === "[SYSTEM_BLOCK]" || msg.text === "[SYSTEM_UNBLOCK]";
                  if (isSystemBlock) return null;

                  if (msg.isSystem) {
                    return (
                      <div key={msg.id} className="flex w-full justify-center mb-6 animate-fade-in">
                        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 max-w-[85%] text-xs sm:text-sm text-red-800 shadow-[0_2px_4px_rgba(244,63,94,0.05)] flex items-start gap-2.5">
                          <span className="text-base shrink-0 select-none">⚠️</span>
                          <div>
                            <span className="font-bold text-rose-700">Cảnh báo hệ thống: </span>
                            <span className="font-semibold text-rose-950">{msg.text.replace('⚠️ CẢNH BÁO AN TOÀN: ', '')}</span>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  const suspiciousKeywords = ["đặt cọc", "chuyển tiền", "chuyển khoản", "tiền cọc"];
                  const containsSuspicious = !isMe && msg.text && suspiciousKeywords.some(kw => msg.text.toLowerCase().includes(kw));

                  return (
                    <div
                      key={msg.id}
                      className={`flex w-full flex-col ${isMe ? "items-end" : "items-start"} animate-fade-in mb-6`}
                    >
                      <div className={`relative flex w-full flex-col ${isMe ? "items-end" : "items-start"}`}>
                        <div
                          className={`w-fit min-w-[64px] max-w-[78%] sm:max-w-[68%] px-4 py-3 rounded-2xl text-[14.5px] leading-relaxed break-words [overflow-wrap:anywhere] shadow-[0_2px_4px_rgba(15,23,42,0.01)] ${
                            isSpecialMessage 
                              ? (isAgreementSigned ? "bg-emerald-50 text-emerald-900 border border-emerald-200" : isAgreementCancelled ? "bg-red-50 text-red-900 border border-red-200" : "bg-sky-50 text-sky-900 border border-sky-200")
                              : (isMe
                                  ? "bg-[#006590] text-white rounded-br-none font-medium"
                                  : "bg-white text-slate-800 border border-slate-100 rounded-bl-none font-medium")
                          }`}
                        >
                        {msg.imageUrl && (
                          <button
                            type="button"
                            onClick={() => {
                              const imageIndex = chatImages.findIndex((image) => image.id === msg.id);
                              if (imageIndex >= 0) setActiveImageIndex(imageIndex);
                            }}
                            className="mb-2 block max-w-full cursor-zoom-in overflow-hidden rounded-xl border border-slate-100/10 bg-slate-900/5"
                            title="Mở ảnh"
                          >
                            <img src={msg.imageUrl} alt="Đính kèm" className="max-h-72 w-full object-contain transition-transform duration-200 hover:scale-[1.02]" referrerPolicy="no-referrer" />
                          </button>
                        )}
                        {isSpecialMessage && agreementPayload ? (
                          (() => {
                            const payloadId = agreementPayload.id;
                            const statusFromId = payloadId ? agreementStatusById[payloadId] : null;
                            const isEffectiveSigned =
                              isAgreementSigned ||
                              statusFromId === "signed" ||
                              (isAgreementDraft && activeAgreementState.status === "signed");
                            const isEffectiveCancelled =
                              !isEffectiveSigned &&
                              (isAgreementCancelled || statusFromId === "cancelled");

                            return (
                              <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-2 font-bold mb-1">
                                  {isEffectiveSigned ? (
                                    <BadgeCheck className="w-5 h-5 text-emerald-600" />
                                  ) : isEffectiveCancelled ? (
                                    <X className="w-5 h-5 text-red-600" />
                                  ) : (
                                    <FileText className="w-5 h-5 text-sky-600" />
                                  )}
                                  <span>
                                    {isEffectiveSigned
                                      ? "Bản cam kết đã được ký"
                                      : isEffectiveCancelled
                                      ? "Thỏa thuận đã bị từ chối"
                                      : isMe
                                      ? "Bạn đã gửi bản thỏa thuận"
                                      : "Đối tác đã gửi thỏa thuận"}
                                  </span>
                                </div>
                                <div
                                  className={`p-3 rounded-xl text-sm font-medium ${
                                    isEffectiveSigned
                                      ? "bg-emerald-100/50"
                                      : isEffectiveCancelled
                                      ? "bg-red-100/50"
                                      : "bg-white/60"
                                  }`}
                                >
                                  {isEffectiveSigned
                                    ? "Hợp đồng sống chung đã có hiệu lực. Bạn có thể xem lại chi tiết trong phần Thỏa Thuận."
                                    : isEffectiveCancelled
                                    ? "Thỏa thuận này đã bị vô hiệu hóa. Bạn có thể tạo thỏa thuận mới để thương lượng lại."
                                    : "Hãy xem qua các điều khoản và ký xác nhận nếu bạn đồng ý."}
                                </div>
                                <button
                                  onClick={() => {
                                    const partnerId = activeRoommate.user_id || activeRoommate.id;
                                    setConversationsWithAgreements((prev) => ({
                                      ...prev,
                                      [partnerId]: false,
                                    }));

                                    if (isEffectiveCancelled) {
                                      onNavigateToTab && onNavigateToTab("agreement");
                                    } else {
                                      const modalPayload = isEffectiveSigned
                                        ? { ...agreementPayload, status: "signed" }
                                        : agreementPayload;
                                      setAgreementModalPayload(modalPayload);
                                      setIsAgreementModalOpen(true);
                                    }
                                  }}
                                  className={`mt-2 py-2.5 px-4 w-full rounded-xl text-sm font-bold flex justify-center items-center gap-2 transition-all ${
                                    isEffectiveSigned
                                      ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                                      : isEffectiveCancelled
                                      ? "bg-amber-600 hover:bg-amber-700 text-white shadow-md"
                                      : "bg-sky-600 hover:bg-sky-700 text-white shadow-md"
                                  }`}
                                >
                                  {isEffectiveSigned
                                    ? "Xem bản ký kết"
                                    : isEffectiveCancelled
                                    ? "Tạo thỏa thuận mới"
                                    : "Xem & Ký Thỏa Thuận"}
                                </button>
                              </div>
                            );
                          })()
                        ) : (
                          msg.text && <p className="whitespace-pre-wrap">{msg.text}</p>
                        )}
                        <span
                          className={`flex items-center justify-end gap-1 text-[9.5px] mt-2 text-right  ${
                            isSpecialMessage ? (isAgreementSigned ? "text-emerald-700/60" : isAgreementCancelled ? "text-red-700/60" : "text-sky-700/60") : (isMe ? "text-sky-200" : "text-slate-400")
                          }`}
                        >
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {isMe && isLast && (
                            <span className="font-semibold ml-0.5 tracking-tight flex items-center gap-0.5">
                              {statusText === "Đã xem" ? (
                                <CheckCircle2 className={`w-3 h-3 ${isSpecialMessage ? "opacity-50" : "fill-sky-500/20"}`} />
                              ) : (
                                <CheckCircle2 className="w-3 h-3 opacity-50" />
                              )}
                              {statusText}
                            </span>
                          )}
                        </span>
                      </div>
                      
                      {/* Message reactions sit below the bubble so they never cover the timestamp. */}
                      {!isSpecialMessage && (
                        <div className={`mt-1 flex w-full items-center gap-1 px-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
                          <MessageReactions
                            messageId={msg.id}
                            reactions={msg.reactions}
                            currentUserId={currentUser?.id || ''}
                            currentUserName={currentUserProfile?.name || 'Bạn'}
                            currentUserAvatar={currentUserProfile?.avatar}
                            partnerName={activeRoommate?.name || 'Đối phương'}
                            partnerId={activeRoommate?.user_id || activeRoommate?.id}
                            partnerAvatar={activeRoommate?.avatar}
                            onAddReaction={(emoji) => handleAddReaction(msg.id, emoji)}
                            onRemoveReaction={(emoji) => handleRemoveReaction(msg.id, emoji)}
                            isMyMessage={isMe}
                          />
                          {!isMe && (
                            <button
                              type="button"
                              onClick={() => openMessageReport(msg.id)}
                              className="rounded-full p-1.5 text-slate-300 opacity-60 transition-all hover:bg-rose-50 hover:text-rose-500 hover:opacity-100"
                              title="Báo cáo tin nhắn này"
                            >
                              <Flag className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      )}

                      {/* System Safety Warning */}
                      {containsSuspicious && (
                        <div className="mt-2 flex w-full justify-start max-w-[85%]">
                          <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-[11px] sm:text-xs text-rose-700 shadow-sm flex items-start gap-2">
                            <ShieldCheck className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-bold">Cảnh báo an toàn: </span>
                              Tuyệt đối không chuyển tiền cọc trước khi xem phòng trực tiếp và ký hợp đồng minh bạch. 
                              <button onClick={() => openMessageReport(msg.id)} className="ml-1 text-rose-600 underline font-bold hover:text-rose-800">
                                Báo cáo nếu có dấu hiệu lừa đảo.
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                      </div>
                    </div>
                  );
                })
              )}

              {/* Bot typing bubble */}
              {isTyping && (
                <div className="flex justify-start items-center gap-2 select-none animate-pulse">
                  <div className="w-2.5 h-2.5 bg-sky-400 rounded-full animate-bounce" />
                  <div className="w-2.5 h-2.5 bg-sky-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <div className="w-2.5 h-2.5 bg-sky-600 rounded-full animate-bounce [animation-delay:0.4s]" />
                  <span className="text-xs font-semibold text-slate-400 ml-1 select-none">{activeRoommate.name} đang gõ...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Slide-down note panel for small screens */}
            {showMobileNote && (
              <div className="bg-amber-500/5 border-b border-amber-500/10 p-4 space-y-2 lg:hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-800">📝 Ghi chú cá nhân (Chỉ mình bạn thấy)</span>
                  {isSavingChatNote && (
                    <span className="text-[9px] text-emerald-600 font-extrabold bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                      ✓ Đã lưu
                    </span>
                  )}
                </div>
                <textarea
                  rows={2}
                  placeholder={`Ghi chú riêng tư về ${activeRoommate.name}...`}
                  value={chatPrivateNote}
                  onChange={(e) => handleChatPrivateNoteChange(e.target.value)}
                  className="w-full bg-white border border-amber-200/50 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-slate-700 outline-none"
                />
              </div>
            )}

            {/* Blocked banner */}
            {isActiveUserBlocked && (
              <div className="mx-4 mb-2 bg-red-50 border border-red-200 rounded-2xl px-5 py-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Ban className="h-5 w-5 text-red-500 shrink-0" />
                  <p className="text-sm font-bold text-red-700">Bạn đã chặn người dùng này</p>
                </div>
                <button
                  onClick={() => activeRoommate && handleUnblock(activeRoommate.id)}
                  className="text-xs font-bold bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl transition-colors shrink-0"
                >
                  Hủy chặn
                </button>
              </div>
            )}

            {/* Blocked banner (if partner blocked you) */}
            {isBlockedByPartner && (
              <div className="mx-4 mb-2 bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 flex items-center justify-center gap-3">
                <Ban className="h-5 w-5 text-slate-400 shrink-0" />
                <p className="text-sm font-bold text-slate-600">Người dùng này đã chặn bạn</p>
              </div>
            )}

            {isActiveUserBanned && (
              <div className="mx-4 mb-2 flex items-center justify-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
                <Lock className="h-5 w-5 shrink-0 text-amber-600" />
                <p className="text-sm font-bold text-amber-800">
                  Người dùng này đã bị quản trị viên khóa
                </p>
              </div>
            )}

            {/* Text Send Form area with image sending */}
            <form
              onSubmit={handleSend}
              onPaste={handleChatPaste}
              className={`p-4 border-t border-slate-100 bg-white shrink-0 space-y-2 ${
                isBlockedByPartner || isActiveUserBanned ? 'opacity-60' : ''
              }`}
            >
              {attachedImage && (
                <div className="p-2.5 bg-slate-50 border border-slate-150 rounded-xl flex items-center justify-between animate-fade-in">
                  <div className="flex items-center gap-2.5">
                    <div className="w-12 h-12 object-cover rounded-lg border border-slate-200 overflow-hidden shrink-0">
                      <img src={attachedImage} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                    <span className="text-xs text-slate-500 font-medium">Ảnh đã sẵn sàng để gửi</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAttachedImage(null)}
                    className="p-1 px-2 text-[#006590] hover:text-red-600 hover:bg-red-50 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1"
                  >
                    <X className="h-3 w-3" /> Hủy
                  </button>
                </div>
              )}

              <div className="flex gap-2.5 items-center">
                <input
                  type="file"
                  id="chat-image-input"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />
                <label
                  htmlFor="chat-image-input"
                  className={`bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-[#006590] w-12 h-12 rounded-full duration-150 flex items-center justify-center cursor-pointer transition-all shrink-0 ${
                    isActiveUserBlocked || isBlockedByPartner || isActiveUserBanned ? 'opacity-40 pointer-events-none' : ''
                  }`}
                  title="Chọn ảnh hoặc dán ảnh bằng Ctrl+V"
                >
                  <ImageIcon className="h-5 w-5" />
                </label>

                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={
                    isActiveUserBlocked
                      ? 'Bạn đã chặn người dùng này'
                      : isActiveUserBanned
                        ? 'Người dùng này đã bị khóa'
                      : isBlockedByPartner
                        ? 'Bạn không thể nhắn tin vì đã bị chặn'
                        : 'Nhắn tin hoặc dán ảnh bằng Ctrl+V...'
                  }
                  disabled={isActiveUserBlocked || isBlockedByPartner || isActiveUserBanned}
                  className={`flex-1 bg-slate-50 border border-slate-200 rounded-full px-5 py-3.5 text-sm outline-none focus:border-sky-500/50 focus:bg-white transition-all shadow-inner ${
                    isActiveUserBlocked || isBlockedByPartner || isActiveUserBanned ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                />
                {isActiveUserBlocked ? (
                  <button
                    type="button"
                    onClick={() => activeRoommate && handleUnblock(activeRoommate.id)}
                    className="bg-gradient-to-r from-red-500 to-red-600 text-white px-4 h-12 rounded-full hover:shadow-lg duration-150 flex items-center justify-center cursor-pointer transition-all hover:scale-105 shrink-0 text-xs font-bold gap-1"
                  >
                    <Ban className="h-4 w-4" />
                    Hủy chặn
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={(!inputText.trim() && !attachedImage) || isTyping || isBlockedByPartner || isActiveUserBanned}
                    className="bg-gradient-to-r from-sky-500 to-[#006590] text-white w-12 h-12 rounded-full hover:shadow-lg disabled:opacity-50 disabled:from-slate-300 disabled:to-slate-400 duration-150 flex items-center justify-center cursor-pointer transition-all hover:scale-105 shrink-0"
                  >
                    <Send className="h-5 w-5 -ml-0.5 mt-0.5" />
                  </button>
                )}
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center p-8 text-center scrollbar-none">
            {isInboxLoading ? (
              <div className="w-full max-w-md animate-pulse space-y-4">
                <div className="mx-auto h-14 w-14 rounded-full bg-slate-200" />
                <div className="mx-auto h-4 w-48 rounded bg-slate-200" />
                <div className="mx-auto h-3 w-72 max-w-full rounded bg-slate-100" />
              </div>
            ) : (
              <div>
                <AlertCircle className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-400 font-bold text-base">Chưa có cuộc trò chuyện nào</p>
                <p className="text-xs text-slate-500 mt-1 max-w-xs leading-normal">
                  Hãy ghé qua tab **Tìm Bạn Ở Ghép**, chọn một roommate lý tưởng và bấm **Bắt đầu Trò Chuyện** để kết nối ngay nhé!
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Third Column: Private notes and profile snapshot */}
      {activeRoommate && (
        <div className="w-[320px] h-full bg-gradient-to-b from-slate-50 to-white p-6 flex flex-col justify-between shrink-0 hidden lg:flex border-l border-slate-100 overflow-y-auto relative">
          
          <div className="space-y-6">
            {/* Profile Avatar Header */}
            <div className="text-center pb-5 border-b border-slate-100/80">
              <div className="w-24 h-24 rounded-full overflow-hidden border-[4px] border-white shadow-[0_10px_30px_rgba(15,23,42,0.08)] mx-auto mb-3">
                <img src={activeRoommate.avatar} alt={activeRoommate.name} className="w-full h-full object-cover" />
              </div>
              <h4 className="text-[18px] font-black text-[#0f172a] tracking-tight">{activeRoommate.name}</h4>
              <p className="text-[12px] text-sky-600 font-extrabold uppercase tracking-widest mt-1 bg-sky-50 inline-block px-3 py-1 rounded-full mb-2">{activeRoommate.role}</p>
              
              {/* View Profile Button */}
              <button
                onClick={() => onViewProfile && onViewProfile(activeRoommate)}
                className="mt-2 bg-white hover:bg-slate-50 text-[#006590] border-2 border-slate-200 hover:border-sky-300 py-2 px-4 rounded-xl text-xs font-bold transition-all duration-200 active:scale-95 cursor-pointer flex items-center gap-2 mx-auto"
              >
                <Users className="h-3.5 w-3.5" />
                Xem hồ sơ đầy đủ
              </button>
            </div>

            {/* Private Notes form */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50/30 border border-amber-200/50 rounded-[24px] p-5 space-y-3 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-amber-400/10 rounded-bl-full -z-0"></div>
              
              <div className="flex items-center justify-between relative z-10">
                <h5 className="text-[14px] font-black text-amber-900 flex items-center gap-2 select-none">
                  <span className="p-1.5 bg-white/60 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] text-amber-600">
                    <PencilLine className="h-4 w-4" />
                  </span>
                  Ghi chú riêng
                </h5>
                {isSavingChatNote && (
                  <span className="text-[10px] text-emerald-700 font-extrabold bg-emerald-100/80 px-2.5 py-1 rounded-full border border-emerald-200 animate-pulse backdrop-blur-sm">
                    ✓ Đã lưu
                  </span>
                )}
              </div>
              <p className="text-[11.5px] text-amber-800/70 leading-relaxed font-semibold relative z-10">
                Lưu lại lịch hẹn, mức giá, liên hệ... Chỉ mình bạn xem được.
              </p>
              <textarea
                rows={4}
                placeholder={`Nhập ghi chú cá nhân của bạn về ${activeRoommate.name}...`}
                value={chatPrivateNote}
                onChange={(e) => handleChatPrivateNoteChange(e.target.value)}
                className="w-full bg-white/80 backdrop-blur-md border border-amber-200 focus:border-amber-400 focus:ring-4 focus:ring-amber-400/20 rounded-2xl px-4 py-3 text-[13px] text-slate-800 outline-none transition-all duration-300 resize-none font-semibold shadow-inner relative z-10"
              />
            </div>

            {/* Roommate details snippet */}
            <div className="space-y-3">
              <h5 className="text-[12px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-amber-500" />
                Lối sống
              </h5>
              <div className="grid grid-cols-2 gap-2.5 text-[11px]">
                <div className="bg-white border border-slate-100/80 shadow-[0_2px_12px_rgba(0,0,0,0.02)] p-3 rounded-2xl text-slate-600 transition-all hover:border-sky-200 hover:shadow-md group">
                  <span className="block text-[10px] text-slate-400 font-bold uppercase mb-1 group-hover:text-sky-500 transition-colors">Giấc ngủ</span>
                  <span className="font-extrabold text-[#0f172a] text-[13px]">{activeRoommate.lifestyle?.sleep || "Đúng giờ"}</span>
                </div>
                <div className="bg-white border border-slate-100/80 shadow-[0_2px_12px_rgba(0,0,0,0.02)] p-3 rounded-2xl text-slate-600 transition-all hover:border-sky-200 hover:shadow-md group">
                  <span className="block text-[10px] text-slate-400 font-bold uppercase mb-1 group-hover:text-sky-500 transition-colors">Thú cưng</span>
                  <span className="font-extrabold text-[#0f172a] text-[13px]">{activeRoommate.lifestyle?.pets || "Thoải mái"}</span>
                </div>
                <div className="bg-white border border-slate-100/80 shadow-[0_2px_12px_rgba(0,0,0,0.02)] p-3.5 rounded-2xl text-slate-600 col-span-2 flex items-center justify-between transition-all hover:border-sky-200 hover:shadow-md group">
                  <span className="block text-[10px] text-slate-400 font-bold uppercase group-hover:text-sky-500 transition-colors">Ngân sách tối đa</span>
                  <span className="font-black text-[#006590] text-[14px] bg-[#dff6ff] px-3 py-1.5 rounded-xl border border-sky-100">{activeRoommate.budget ? `${(activeRoommate.budget / 1000000).toFixed(1)} tr/tháng` : "Liên hệ"}</span>
                </div>
              </div>
            </div>
            
            {/* Phone Number - Show when 2-way messages exist */}
            {hasTwoWayMessages && (
              <div className="bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-4 space-y-2">
                <h5 className="text-xs font-black text-emerald-900 uppercase tracking-wider flex items-center gap-2">
                  <PhoneCall className="h-4 w-4" />
                  Số điện thoại
                </h5>
                {activeRoommate.phoneNumber ? (
                  <a
                    href={`tel:${activeRoommate.phoneNumber.replace(/\s/g, "")}`}
                    className="block text-center bg-white hover:bg-emerald-50 text-emerald-700 font-black text-base py-3 rounded-xl border-2 border-emerald-300 hover:border-emerald-400 transition-all cursor-pointer"
                  >
                    📞 {activeRoommate.phoneNumber}
                  </a>
                ) : (
                  <div className="text-center bg-white text-slate-500 font-medium text-sm py-3 rounded-xl border-2 border-slate-200">
                    Chưa cập nhật SĐT
                  </div>
                )}
              </div>
            )}
            
            {/* Review Button - Show when signed agreement exists */}
            {hasSignedAgreement && onViewProfile && (
              <button
                onClick={() => onViewProfile(activeRoommate)}
                className="w-full bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold py-3 rounded-2xl border-2 border-amber-200 hover:border-amber-300 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                Đánh giá {activeRoommate.name}
              </button>
            )}
          </div>
          
          <div className="text-[11px] text-slate-400 font-bold px-4 py-3.5 bg-slate-100/50 rounded-2xl mt-6 leading-relaxed border border-slate-200/50 backdrop-blur-sm flex items-start gap-2.5">
            <ShieldCheck className="h-4 w-4 text-slate-400 shrink-0" />
            <span>Mọi ghi chú được lưu an toàn trên thiết bị của bạn.</span>
          </div>
        </div>
      )}

      {/* Report Modal - FULLSCREEN HORIZONTAL LAYOUT */}
      {isReportModalOpen && createPortal(
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-7xl h-[90vh] overflow-hidden relative animate-in fade-in zoom-in-95 flex flex-col">
             {/* Header */}
             <div className="flex justify-between items-center border-b border-slate-200 p-6 bg-gradient-to-r from-rose-50 to-white shrink-0">
               <h3 className="text-2xl font-black text-rose-600 flex items-center gap-3">
                 <AlertOctagon className="w-7 h-7" /> Báo cáo vi phạm
               </h3>
               <button onClick={closeReportModal} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-full transition-colors">
                 <X className="w-6 h-6" />
               </button>
             </div>
             
             {/* Main Content - Horizontal Layout */}
             <div className="flex-1 overflow-hidden flex">
               {/* Left Side - Form */}
               <div className="w-1/2 border-r border-slate-200 p-6 overflow-y-auto space-y-6">
                 {/* Message Selection */}
                 <div>
                   <label className="block text-base font-bold text-slate-700 mb-2">
                     Tin nhắn vi phạm <span className="text-rose-500">*</span>
                     <span className="ml-2 text-sm font-semibold text-slate-400">
                       ({selectedReportedMessageIds.length}/3)
                     </span>
                   </label>
                   <div className="relative mb-3">
                     <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                     <input
                       type="search"
                       value={reportMessageSearch}
                       onChange={(event) => setReportMessageSearch(event.target.value)}
                       placeholder="Tìm trong 20 tin nhắn gần nhất..."
                       className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none transition-all focus:border-rose-400 focus:bg-white focus:ring-2 focus:ring-rose-100"
                     />
                   </div>
                   {reportablePartnerMessages.length > 0 ? (
                     <div className="max-h-64 overflow-y-auto space-y-2 rounded-xl bg-slate-50 p-3 border border-slate-200">
                       {filteredReportableMessages.map(message => (
                         <button
                           key={message.id}
                           type="button"
                           onClick={() => {
                             setSelectedReportedMessageIds(previous => {
                               if (previous.includes(message.id)) {
                                 return previous.filter(id => id !== message.id);
                               }
                               if (previous.length >= 3) {
                                 toast("Chỉ được chọn tối đa 3 tin nhắn.", "warning");
                                 return previous;
                               }
                               return [...previous, message.id];
                             });
                           }}
                           className={`w-full rounded-xl border p-4 text-left transition-all ${
                             selectedReportedMessageIds.includes(message.id)
                               ? "border-rose-400 bg-rose-50 ring-2 ring-rose-100"
                               : "border-slate-200 bg-white hover:border-slate-300"
                           }`}
                         >
                           <div className="flex items-start justify-between gap-3">
                             <div className="min-w-0">
                               <p className="text-sm font-semibold text-slate-700 line-clamp-2 break-words">
                                 {message.text || "Đã gửi một hình ảnh"}
                               </p>
                               {message.imageUrl && (
                                 <img
                                   src={message.imageUrl}
                                   alt=""
                                   className="mt-2 h-16 w-24 rounded-lg object-cover border border-slate-200"
                                 />
                               )}
                             </div>
                             <span className="text-xs text-slate-400 shrink-0">
                               {selectedReportedMessageIds.includes(message.id)
                                 ? `Đã chọn ${selectedReportedMessageIds.indexOf(message.id) + 1}`
                                 : new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                             </span>
                           </div>
                         </button>
                       ))}
                       {filteredReportableMessages.length === 0 && (
                         <p className="p-4 text-center text-sm font-semibold text-slate-500">
                           Không tìm thấy tin nhắn phù hợp.
                         </p>
                       )}
                     </div>
                   ) : (
                     <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-700">
                       Chưa có tin nhắn nào từ người này để báo cáo.
                     </p>
                   )}
                 </div>
                 
                 {/* Reason Textarea */}
                 <div>
                   <label className="block text-base font-bold text-slate-700 mb-2">Lý do báo cáo <span className="text-rose-500">*</span></label>
                   <textarea
                     className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-100 outline-none transition-all h-32 resize-none"
                     placeholder="Nhập lý do chi tiết..."
                     value={reportReason}
                     onChange={e => setReportReason(e.target.value)}
                   />
                 </div>
               </div>
               
               {/* Right Side - Image Upload & Preview */}
               <div className="w-1/2 p-6 overflow-y-auto bg-slate-50">
                 <div>
                   <label className="block text-base font-bold text-slate-700 mb-2">Ảnh minh chứng <span className="font-medium text-slate-400">(không bắt buộc)</span></label>
                   <label className="w-full h-[calc(100%-3rem)] min-h-[400px] flex flex-col items-center justify-center bg-white border-2 border-dashed border-slate-300 rounded-2xl hover:bg-slate-50 hover:border-rose-400 transition-all cursor-pointer">
                     <input
                       type="file"
                       accept="image/*"
                       className="hidden"
                       disabled={isUploadingReport}
                       onChange={e => {
                         if (e.target.files && e.target.files[0]) {
                           const file = e.target.files[0];
                           setReportImageFile(file);
                           const reader = new FileReader();
                           reader.onloadend = () => {
                             setReportImagePreview(reader.result as string);
                           };
                           reader.readAsDataURL(file);
                         }
                       }}
                     />
                     {reportImageFile && reportImagePreview ? (
                       <div className="flex flex-col items-center gap-4 w-full h-full p-6">
                         {/* Large Image Preview */}
                         <div className="flex-1 w-full rounded-xl overflow-hidden border-2 border-emerald-500 shadow-lg flex items-center justify-center bg-slate-100">
                           <img src={reportImagePreview} alt="Preview" className="max-w-full max-h-full object-contain" />
                         </div>
                         <div className="flex flex-col items-center gap-2">
                           <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                           <span className="text-base font-bold text-emerald-600 truncate max-w-[300px]">{reportImageFile.name}</span>
                           <span className="text-sm text-slate-500">Nhấn để chọn ảnh khác</span>
                         </div>
                       </div>
                     ) : (
                       <div className="flex flex-col items-center gap-3 text-slate-500">
                         <UploadCloud className="w-16 h-16 text-slate-400" />
                         <span className="text-lg font-bold">Nhấn để tải ảnh lên</span>
                         <span className="text-sm">Hỗ trợ JPG, PNG, GIF</span>
                       </div>
                     )}
                   </label>
                 </div>
               </div>
             </div>

             {/* Footer - Action Buttons */}
             <div className="flex gap-4 p-6 border-t border-slate-200 bg-slate-50 shrink-0">
               <button disabled={isUploadingReport} onClick={closeReportModal} className="flex-1 py-3.5 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-xl transition-colors disabled:opacity-50 border border-slate-200 text-base">Hủy</button>
               <button disabled={isUploadingReport} onClick={handleSendReport} className="flex-1 py-3.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-base">
                 {isUploadingReport ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
                 {isUploadingReport ? "Đang gửi..." : "Gửi Báo Cáo"}
               </button>
              </div>
           </div>
         </div>,
         document.body
      )}
      
      {/* Agreement Modal - Displayed inline in chat */}
      {isAgreementModalOpen && activeRoommate && createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[200] p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-gradient-to-r from-sky-50 to-white">
              <div className="flex items-center gap-3">
                <FileText className="h-6 w-6 text-[#006590]" />
                <div>
                  <h2 className="text-xl font-black text-slate-800 tracking-tight">Thỏa Thuận Sống Chung</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Với {activeRoommate.name}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsAgreementModalOpen(false);
                  setAgreementModalPayload(null);
                }}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="h-5 w-5 text-slate-600" />
              </button>
            </div>

            {/* Modal Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {agreementModalPayload ? (
                <>
                  {/* Display existing agreement */}
                  <div className="bg-gradient-to-br from-sky-50 to-emerald-50 rounded-2xl p-6 border border-sky-200">
                    <div className="flex items-center gap-2 mb-4">
                      {agreementModalPayload.status === 'signed' ? (
                        <BadgeCheck className="h-5 w-5 text-emerald-600" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-sky-600" />
                      )}
                      <h3 className="font-bold text-slate-800">
                        {agreementModalPayload.status === 'signed' ? 'Hợp đồng đã được ký kết' : 'Đề xuất thỏa thuận'}
                      </h3>
                    </div>

                    {/* Agreement Rules - Editable or Display */}
                    <div className="space-y-3 bg-white rounded-xl p-4">
                      {isEditingAgreement ? (
                        <>
                          {/* Editable fields */}
                          <div className="flex gap-3">
                            <div className="w-8 h-8 bg-sky-100 rounded-lg flex items-center justify-center shrink-0">
                              <Clock className="h-4 w-4 text-sky-600" />
                            </div>
                            <div className="flex-1">
                              <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-2">Giờ yên tĩnh</p>
                              <textarea
                                value={editQuiet}
                                onChange={(e) => setEditQuiet(e.target.value)}
                                className="w-full text-sm text-slate-700 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                                rows={2}
                              />
                            </div>
                          </div>

                          <div className="flex gap-3">
                            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center shrink-0">
                              <CheckSquare className="h-4 w-4 text-green-600" />
                            </div>
                            <div className="flex-1">
                              <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-2">Dọn dẹp</p>
                              <textarea
                                value={editCleaning}
                                onChange={(e) => setEditCleaning(e.target.value)}
                                className="w-full text-sm text-slate-700 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                                rows={2}
                              />
                            </div>
                          </div>

                          <div className="flex gap-3">
                            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center shrink-0">
                              <Users className="h-4 w-4 text-purple-600" />
                            </div>
                            <div className="flex-1">
                              <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-2">Khách đến chơi</p>
                              <textarea
                                value={editVisitors}
                                onChange={(e) => setEditVisitors(e.target.value)}
                                className="w-full text-sm text-slate-700 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                                rows={2}
                              />
                            </div>
                          </div>

                          <div className="flex gap-3">
                            <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center shrink-0">
                              <CreditCard className="h-4 w-4 text-amber-600" />
                            </div>
                            <div className="flex-1">
                              <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-2">Chi phí</p>
                              <textarea
                                value={editBills}
                                onChange={(e) => setEditBills(e.target.value)}
                                className="w-full text-sm text-slate-700 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                                rows={2}
                              />
                            </div>
                          </div>

                          <div className="flex gap-3">
                            <div className="w-8 h-8 bg-rose-100 rounded-lg flex items-center justify-center shrink-0">
                              <Heart className="h-4 w-4 text-rose-600" />
                            </div>
                            <div className="flex-1">
                              <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-2">Thú cưng</p>
                              <textarea
                                value={editPets}
                                onChange={(e) => setEditPets(e.target.value)}
                                className="w-full text-sm text-slate-700 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                                rows={2}
                              />
                            </div>
                          </div>

                          <div className="flex gap-3">
                            <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
                              <FileText className="h-4 w-4 text-slate-600" />
                            </div>
                            <div className="flex-1">
                              <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-2">Ghi chú khác</p>
                              <textarea
                                value={editOtherNotes}
                                onChange={(e) => setEditOtherNotes(e.target.value)}
                                className="w-full text-sm text-slate-700 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                                rows={3}
                                placeholder="Thêm các quy định khác..."
                              />
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          {/* Display mode */}
                          {agreementModalPayload.rules?.quiet && (
                            <div className="flex gap-3">
                              <div className="w-8 h-8 bg-sky-100 rounded-lg flex items-center justify-center shrink-0">
                                <Clock className="h-4 w-4 text-sky-600" />
                              </div>
                              <div className="flex-1">
                                <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">Giờ yên tĩnh</p>
                                <p className="text-sm text-slate-700">{agreementModalPayload.rules.quiet}</p>
                              </div>
                            </div>
                          )}

                          {agreementModalPayload.rules?.cleaning && (
                            <div className="flex gap-3">
                              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center shrink-0">
                                <CheckSquare className="h-4 w-4 text-green-600" />
                              </div>
                              <div className="flex-1">
                                <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">Dọn dẹp</p>
                                <p className="text-sm text-slate-700">{agreementModalPayload.rules.cleaning}</p>
                              </div>
                            </div>
                          )}

                          {agreementModalPayload.rules?.visitors && (
                            <div className="flex gap-3">
                              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center shrink-0">
                                <Users className="h-4 w-4 text-purple-600" />
                              </div>
                              <div className="flex-1">
                                <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">Khách đến chơi</p>
                                <p className="text-sm text-slate-700">{agreementModalPayload.rules.visitors}</p>
                              </div>
                            </div>
                          )}

                          {agreementModalPayload.rules?.bills && (
                            <div className="flex gap-3">
                              <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center shrink-0">
                                <CreditCard className="h-4 w-4 text-amber-600" />
                              </div>
                              <div className="flex-1">
                                <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">Chi phí</p>
                                <p className="text-sm text-slate-700">{agreementModalPayload.rules.bills}</p>
                              </div>
                            </div>
                          )}

                          {agreementModalPayload.rules?.pets && (
                            <div className="flex gap-3">
                              <div className="w-8 h-8 bg-rose-100 rounded-lg flex items-center justify-center shrink-0">
                                <Heart className="h-4 w-4 text-rose-600" />
                              </div>
                              <div className="flex-1">
                                <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">Thú cưng</p>
                                <p className="text-sm text-slate-700">{agreementModalPayload.rules.pets}</p>
                              </div>
                            </div>
                          )}

                          {agreementModalPayload.rules?.otherNotes && (
                            <div className="flex gap-3">
                              <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
                                <FileText className="h-4 w-4 text-slate-600" />
                              </div>
                              <div className="flex-1">
                                <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">Ghi chú khác</p>
                                <p className="text-sm text-slate-700">{agreementModalPayload.rules.otherNotes}</p>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {agreementModalPayload.status === 'signed' && (
                      <div className="mt-4 p-3 bg-emerald-100 rounded-xl flex items-center gap-2">
                        <BadgeCheck className="h-5 w-5 text-emerald-600" />
                        <p className="text-sm font-bold text-emerald-800">
                          Đã ký kết vào {new Date(agreementModalPayload.timestamp).toLocaleDateString('vi-VN')}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-3 pt-2">
                    {isEditingAgreement ? (
                      <>
                        {/* Save edited agreement as new counter-offer */}
                        <button
                          onClick={async () => {
                            // Cancel old draft first
                            const cancelPayload = { ...agreementModalPayload, status: 'cancelled', timestamp: new Date().toISOString() };
                            // CRITICAL: Use auth UUID (currentUser.id) not profile ID to match AgreementView logic
                            const partnerAuthId = activeRoommate.user_id || activeRoommate.auth_id || activeRoommate.id;
                            const chatId = [currentUser.id, partnerAuthId].sort().join('_');
                            await supabase.from('messages').insert({
                              chat_id: chatId,
                              sender_id: currentUser.id,
                              text: `[AGREEMENT_CANCELLED] ${JSON.stringify(cancelPayload)}`
                            });

                            // Send new draft with edits
                            const newDraft = {
                              id: crypto.randomUUID ? crypto.randomUUID() : `agr_${Date.now()}`,
                              status: 'pending',
                              creator_id: currentUser.id,
                              partner_id: partnerAuthId,
                              creator_name: currentUserProfile.name,
                              partner_name: activeRoommate.name,
                              created_at: new Date().toISOString(),
                              rules: {
                                quiet: editQuiet,
                                cleaning: editCleaning,
                                visitors: editVisitors,
                                bills: editBills,
                                pets: editPets,
                                otherNotes: editOtherNotes
                              },
                              timestamp: new Date().toISOString()
                            };

                            await supabase.from('messages').insert({
                              chat_id: chatId,
                              sender_id: currentUser.id,
                              text: `[AGREEMENT_DRAFT] ${JSON.stringify(newDraft)}`
                            });

                            alert('Đã gửi đề xuất chỉnh sửa cho đối tác!');
                            setIsEditingAgreement(false);
                            setIsAgreementModalOpen(false);
                            setAgreementModalPayload(null);
                          }}
                          className="flex-1 py-3 bg-gradient-to-r from-[#006590] to-sky-600 hover:from-[#005176] hover:to-sky-700 text-white font-bold rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
                        >
                          <Send className="h-5 w-5" />
                          Gửi đề xuất chỉnh sửa
                        </button>
                        <button
                          onClick={() => {
                            setIsEditingAgreement(false);
                            // Restore original values
                            if (agreementModalPayload?.rules) {
                              setEditQuiet(agreementModalPayload.rules.quiet || '');
                              setEditCleaning(agreementModalPayload.rules.cleaning || '');
                              setEditVisitors(agreementModalPayload.rules.visitors || '');
                              setEditBills(agreementModalPayload.rules.bills || '');
                              setEditPets(agreementModalPayload.rules.pets || '');
                              setEditOtherNotes(agreementModalPayload.rules.otherNotes || '');
                            }
                          }}
                          className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors"
                        >
                          Hủy
                        </button>
                      </>
                    ) : agreementModalPayload.status === 'pending' && activeAgreementState.status !== 'signed' && (agreementModalPayload.id ? agreementStatusById[agreementModalPayload.id] !== 'signed' : true) && agreementModalPayload.sender_id !== currentUser.id ? (
                      <>
                        {/* Received pending agreement - can accept, edit, or reject */}
                        <button
                          onClick={() => {
                            // Open signature modal to confirm signing
                            setSignatureName(""); // Reset signature input
                            setIsSignatureModalOpen(true);
                          }}
                          className="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-bold rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
                        >
                          <Check className="h-5 w-5" />
                          Đồng ý & Ký kết
                        </button>
                        <button
                          onClick={() => {
                            // Enter edit mode
                            setIsEditingAgreement(true);
                            setEditQuiet(agreementModalPayload.rules?.quiet || '');
                            setEditCleaning(agreementModalPayload.rules?.cleaning || '');
                            setEditVisitors(agreementModalPayload.rules?.visitors || '');
                            setEditBills(agreementModalPayload.rules?.bills || '');
                            setEditPets(agreementModalPayload.rules?.pets || '');
                            setEditOtherNotes(agreementModalPayload.rules?.otherNotes || '');
                          }}
                          className="px-4 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition-colors flex items-center gap-2"
                        >
                          <PencilLine className="h-4 w-4" />
                          Sửa lại
                        </button>
                        <button
                          onClick={async () => {
                            const confirmed = await confirm({
                              title: "Từ chối thỏa thuận",
                              message: "Bạn có chắc muốn từ chối thỏa thuận này?",
                              confirmText: "Từ chối",
                              cancelText: "Hủy",
                              type: "danger"
                            });
                            
                            if (confirmed) {
                              const payload = {
                                ...agreementModalPayload,
                                status: 'cancelled',
                                cancelled_by: currentUser.id,
                                cancelled_at: new Date().toISOString(),
                                timestamp: new Date().toISOString()
                              };
                              // CRITICAL: Use auth UUID (currentUser.id) not profile ID
                              const partnerAuthId = activeRoommate.user_id || activeRoommate.auth_id || activeRoommate.id;
                              const chatId = [currentUser.id, partnerAuthId].sort().join('_');
                              await supabase.from('messages').insert({
                                chat_id: chatId,
                                sender_id: currentUser.id,
                                text: `[AGREEMENT_CANCELLED] ${JSON.stringify(payload)}`
                              });
                              
                              if (agreementModalPayload.status === 'signed') {
                                await supabase.from('roommates').update({ status: 'Đang tìm' }).in('user_id', [currentUser.id, partnerAuthId]);
                                await updateRoomStatusBasedOnAgreements(currentUser.id, supabase);
                                await updateRoomStatusBasedOnAgreements(partnerAuthId, supabase);
                              }

                              alert('Đã từ chối thỏa thuận!');
                              setIsAgreementModalOpen(false);
                              setAgreementModalPayload(null);
                            }
                          }}
                          className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors"
                        >
                          Từ chối
                        </button>
                      </>
                    ) : agreementModalPayload.status === 'pending' && activeAgreementState.status !== 'signed' && (agreementModalPayload.id ? agreementStatusById[agreementModalPayload.id] !== 'signed' : true) && agreementModalPayload.sender_id === currentUser.id ? (
                      <>
                        {/* Sent draft - can also edit (counter-counter-offer) or cancel */}
                        <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 mb-4 text-center">
                          <p className="text-sm font-bold text-sky-900">
                            ⏳ Đang chờ đối tác phản hồi...
                          </p>
                          <p className="text-xs text-sky-700 mt-1">
                            Bạn có thể chỉnh sửa lại đề xuất hoặc hủy thỏa thuận này
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            // Allow sender to edit their own draft (useful for counter-counter-offer)
                            setIsEditingAgreement(true);
                            setEditQuiet(agreementModalPayload.rules?.quiet || '');
                            setEditCleaning(agreementModalPayload.rules?.cleaning || '');
                            setEditVisitors(agreementModalPayload.rules?.visitors || '');
                            setEditBills(agreementModalPayload.rules?.bills || '');
                            setEditPets(agreementModalPayload.rules?.pets || '');
                            setEditOtherNotes(agreementModalPayload.rules?.otherNotes || '');
                          }}
                          className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                        >
                          <PencilLine className="h-4 w-4" />
                          Chỉnh sửa lại đề xuất
                        </button>
                        <button
                          onClick={async () => {
                            const confirmed = await confirm({
                              title: "Hủy thỏa thuận",
                              message: "Bạn có chắc muốn hủy thỏa thuận này?",
                              confirmText: "Hủy thỏa thuận",
                              cancelText: "Không",
                              type: "danger"
                            });
                            
                            if (confirmed) {
                              const payload = {
                                ...agreementModalPayload,
                                status: 'cancelled',
                                cancelled_by: currentUser.id,
                                cancelled_at: new Date().toISOString(),
                                timestamp: new Date().toISOString()
                              };
                              // CRITICAL: Use auth UUID (currentUser.id) not profile ID
                              const partnerAuthId = activeRoommate.user_id || activeRoommate.auth_id || activeRoommate.id;
                              const chatId = [currentUser.id, partnerAuthId].sort().join('_');
                              await supabase.from('messages').insert({
                                chat_id: chatId,
                                sender_id: currentUser.id,
                                text: `[AGREEMENT_CANCELLED] ${JSON.stringify(payload)}`
                              });
                              
                              if (agreementModalPayload.status === 'signed') {
                                await supabase.from('roommates').update({ status: 'Đang tìm' }).in('user_id', [currentUser.id, partnerAuthId]);
                                await updateRoomStatusBasedOnAgreements(currentUser.id, supabase);
                                await updateRoomStatusBasedOnAgreements(partnerAuthId, supabase);
                              }
                              
                              alert('Đã hủy thỏa thuận!');
                              setIsAgreementModalOpen(false);
                              setAgreementModalPayload(null);
                            }
                          }}
                          className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors"
                        >
                          Hủy thỏa thuận
                        </button>
                        <button
                          onClick={() => {
                            setIsAgreementModalOpen(false);
                            setAgreementModalPayload(null);
                          }}
                          className="px-4 py-3 bg-slate-600 hover:bg-slate-700 text-white font-bold rounded-xl transition-colors"
                        >
                          Đóng
                        </button>
                      </>
                    ) : (agreementModalPayload.status === 'signed' || activeAgreementState.status === 'signed' || (agreementModalPayload.id && agreementStatusById[agreementModalPayload.id] === 'signed')) ? (
                      <button
                        onClick={() => {
                          setIsAgreementModalOpen(false);
                          setAgreementModalPayload(null);
                        }}
                        className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors"
                      >
                        Đóng
                      </button>
                    ) : null}
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-slate-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                  <p className="font-bold mb-2">Chưa có thỏa thuận nào</p>
                  <p className="text-sm">Vui lòng chuyển sang tab "Thỏa Thuận" để tạo thỏa thuận mới</p>
                  <button
                    onClick={() => {
                      if (activeRoommate) {
                        sessionStorage.setItem('roomiematch_preselected_partner_profile', JSON.stringify(activeRoommate));
                      }
                      setIsAgreementModalOpen(false);
                      onNavigateToTab && onNavigateToTab('agreement');
                    }}
                    className="mt-4 px-6 py-2.5 bg-[#006590] hover:bg-[#005176] text-white font-bold rounded-xl transition-colors"
                  >
                    Đến trang Thỏa Thuận
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Signature Modal for Agreement Signing */}
      {isSignatureModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-[28px] shadow-2xl max-w-md w-full p-8 space-y-6 animate-scale-in border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                  <FileEdit className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-800">Xác nhận ký kết</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Vui lòng nhập tên đầy đủ của bạn</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsSignatureModalOpen(false);
                  setSignatureName("");
                }}
                className="w-10 h-10 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center justify-center transition-colors"
              >
                <X className="h-5 w-5 text-slate-600" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-sky-50 border border-sky-200 rounded-2xl p-4">
                <p className="text-sm text-sky-900 font-bold mb-2">📝 Xác thực chữ ký số</p>
                <p className="text-xs text-sky-700">
                  Bạn đang ký kết thỏa thuận sống chung với <span className="font-bold">{activeRoommate?.name}</span>. 
                  Vui lòng nhập tên đầy đủ của bạn để xác nhận.
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-700">
                  Họ và tên đầy đủ <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={signatureName}
                  onChange={(e) => setSignatureName(e.target.value)}
                  placeholder="Ví dụ: Nguyễn Văn A"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all"
                  autoFocus
                />
                <p className="text-xs text-slate-500">
                  Tên phải khớp với tên trong hồ sơ: <span className="font-bold text-slate-700">{currentUserProfile?.name}</span>
                </p>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={() => {
                  setIsSignatureModalOpen(false);
                  setSignatureName("");
                }}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={async () => {
                  // Validate signature name
                  if (!signatureName.trim()) {
                    toast("Vui lòng nhập họ và tên đầy đủ!", "warning");
                    return;
                  }

                  // Check if name matches profile (case insensitive)
                  const normalizedSignature = signatureName.trim().toLowerCase().replace(/\s+/g, ' ');
                  const normalizedProfile = currentUserProfile?.name?.trim().toLowerCase().replace(/\s+/g, ' ');
                  
                  if (normalizedSignature !== normalizedProfile) {
                    toast(`Tên không khớp! Vui lòng nhập đúng tên trong hồ sơ: "${currentUserProfile?.name}"`, "warning");
                    return;
                  }

                  // All validation passed - proceed with signing
                  if (
                    activeAgreementState.status === 'signed' ||
                    agreementModalPayload?.status === 'signed' ||
                    (agreementModalPayload?.id && agreementStatusById[agreementModalPayload.id] === 'signed')
                  ) {
                    toast('Thỏa thuận này đã được ký kết trước đó!', 'warning');
                    setIsSignatureModalOpen(false);
                    setIsAgreementModalOpen(false);
                    return;
                  }

                  try {
                    setIsSigningAgreement(true);
                    const signedPayload = {
                      ...agreementModalPayload,
                      status: 'signed',
                      signed_by: currentUser.id,
                      signed_by_name: signatureName.trim(),
                      signed_at: new Date().toISOString(),
                      timestamp: new Date().toISOString()
                    };

                    // CRITICAL FIX: Use auth UUID consistently
                    const myChatId = currentUser?.id || currentUserProfile?.id;
                    const partnerChatId = activeRoommate?.user_id || activeRoommate?.auth_id || activeRoommate?.id;

                    if (!myChatId || !partnerChatId) {
                      toast("Không xác định được tài khoản của hai bên. Vui lòng tải lại trang.", "error");
                      return;
                    }

                    const chatId = [myChatId, partnerChatId].sort().join('_');

                    console.log('[Signature] Signing agreement:', {
                      chatId,
                      myChatId,
                      partnerChatId,
                      signedByName: signatureName.trim()
                    });

                    const { error } = await supabase.from('messages').insert({
                      chat_id: chatId,
                      sender_id: myChatId,
                      text: `[AGREEMENT_SIGNED] ${JSON.stringify(signedPayload)}`
                    });

                    if (error) {
                      console.error('[Signature] Error signing agreement:', error);
                      toast(`Không thể ký thỏa thuận: ${error.message}`, "error");
                      return;
                    }

                    // Update roommate status to "Đã tìm được"
                    const { error: statusError } = await supabase.from('roommates')
                      .update({ status: 'Đã tìm được' })
                      .in('user_id', [myChatId, partnerChatId]);

                    if (statusError) {
                      console.warn('[Signature] Agreement signed but roommate status update failed:', statusError);
                    }
                    
                    // Update capacity statuses for both users
                    await updateRoomStatusBasedOnAgreements(myChatId, supabase);
                    await updateRoomStatusBasedOnAgreements(partnerChatId, supabase);

                    toast('Ký kết thành công! Thỏa thuận đã có hiệu lực.', "success", 5000);
                    
                    // Close modals
                    setIsSignatureModalOpen(false);
                    setSignatureName("");
                    setIsAgreementModalOpen(false);
                    setAgreementModalPayload(null);
                  } catch (err) {
                    console.error('[Signature] Unexpected error:', err);
                    toast('Lỗi không xác định khi ký thỏa thuận. Vui lòng thử lại.', "error");
                  } finally {
                    setIsSigningAgreement(false);
                  }
                }}
                disabled={isSigningAgreement}
                className="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 disabled:cursor-not-allowed disabled:opacity-60 text-white font-bold rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
              >
                {isSigningAgreement ? (
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                ) : (
                  <Check className="h-5 w-5" />
                )}
                {isSigningAgreement ? "Đang ký..." : "Xác nhận ký"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {activeImageIndex !== null && chatImages[activeImageIndex]?.imageUrl && createPortal(
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-sm"
          onClick={() => setActiveImageIndex(null)}
        >
          <div
            className="relative flex h-full w-full max-w-6xl items-center justify-center"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setActiveImageIndex(null)}
              className="absolute right-0 top-0 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
              aria-label="Đóng ảnh"
            >
              <X className="h-6 w-6" />
            </button>

            {chatImages.length > 1 && (
              <button
                type="button"
                onClick={() =>
                  setActiveImageIndex((activeImageIndex - 1 + chatImages.length) % chatImages.length)
                }
                className="absolute left-0 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white shadow-lg transition-all hover:scale-105 hover:bg-white/20"
                aria-label="Ảnh trước"
              >
                <ChevronLeft className="h-7 w-7" />
              </button>
            )}

            <img
              src={chatImages[activeImageIndex].imageUrl}
              alt={`Ảnh ${activeImageIndex + 1} trong cuộc trò chuyện`}
              className="max-h-[88vh] max-w-[88vw] rounded-xl object-contain shadow-2xl"
              referrerPolicy="no-referrer"
            />

            {chatImages.length > 1 && (
              <button
                type="button"
                onClick={() => setActiveImageIndex((activeImageIndex + 1) % chatImages.length)}
                className="absolute right-0 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white shadow-lg transition-all hover:scale-105 hover:bg-white/20"
                aria-label="Ảnh tiếp theo"
              >
                <ChevronRight className="h-7 w-7" />
              </button>
            )}

            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-black/45 px-3 py-1.5 text-xs font-bold text-white">
              {activeImageIndex + 1} / {chatImages.length}
            </div>
          </div>
        </div>,
        document.body
      )}
      
      {/* Confirm Dialog */}
      <ConfirmDialogComponent />
    </div>
  );
}
