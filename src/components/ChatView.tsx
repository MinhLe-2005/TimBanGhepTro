import { useState, useEffect, useRef, useMemo } from "react";
import { Send, CheckCircle2, AlertCircle, Sparkles, MessageSquare, PhoneCall, Image as ImageIcon, FileText, X, Lock, BadgeCheck, PencilLine, Lightbulb, ShieldCheck, Ban, AlertOctagon, UploadCloud, Clock, CheckSquare, Users, CreditCard, Heart, Check } from "lucide-react";
import { Roommate, Message } from "../types";
import { supabase } from "../lib/supabase";

interface ChatViewProps {
  roommates: Roommate[];
  initialChats: { roommateId: string; messages: Message[] }[];
  activeRoommateId: string | null;
  setActiveRoommateId: (id: string | null) => void;
  currentUserProfile?: any;
  currentUser?: any;
  onRequireAuth?: () => void;
  onRequireProfile?: () => void;
  onNavigateToTab?: (tabId: string) => void;
  onStartAgreement?: (roommateId: string, payload?: any) => void;
  onViewProfile?: (roommate: any) => void;
}

export default function ChatView({
  roommates,
  initialChats,
  activeRoommateId,
  setActiveRoommateId,
  currentUserProfile,
  currentUser,
  onRequireAuth,
  onRequireProfile,
  onNavigateToTab,
  onStartAgreement,
  onViewProfile,
}: ChatViewProps) {
  // Chat records list
  const [chats, setChats] = useState<{ [roommateId: string]: Message[] }>(() => {
    const records: { [roommateId: string]: Message[] } = {};
    initialChats.forEach((chat) => {
      records[chat.roommateId] = chat.messages;
    });
    return records;
  });

  const [conversations, setConversations] = useState<any[]>([]);
  const fetchInboxRef = useRef<(() => void) | null>(null);
  
  // Hidden conversations (local only, not deleted from DB)
  // Store as { partnerId: hideTimestamp } to check if new messages arrived after hiding
  const [hiddenConversations, setHiddenConversations] = useState<Record<string, number>>(() => {
    try {
      return JSON.parse(localStorage.getItem('roomiematch_hidden_conversations') || '{}');
    } catch { return {}; }
  });

  // Track conversations with unread agreements
  const [conversationsWithAgreements, setConversationsWithAgreements] = useState<Record<string, boolean>>({});

  const [inputText, setInputText] = useState("");
  const [friendSearchQuery, setFriendSearchQuery] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // States for Image sending
  const [attachedImage, setAttachedImage] = useState<string | null>(null);

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

  // Signature modal for agreement signing
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [signatureName, setSignatureName] = useState("");

  const handleSendReport = async () => {
    if (!reportReason.trim() || !reportImageFile) {
      alert("Vui lòng nhập lý do và đính kèm ảnh minh chứng để báo cáo.");
      return;
    }
    const myId = currentUser?.id || currentUserProfile?.id;
    if (myId && activeRoommateId && import.meta.env.VITE_SUPABASE_URL) {
       // Anti-spam check: Did this user already report this target?
       const { data: existingReports } = await supabase
         .from('messages')
         .select('text')
         .eq('chat_id', 'SYSTEM_REPORTS')
         .eq('sender_id', myId);
       
       if (existingReports && existingReports.length > 0) {
         const hasReported = existingReports.some(msg => {
           try {
             const payload = JSON.parse(msg.text.replace('[REPORT]', '').trim());
             return payload.target_id === activeRoommateId;
           } catch { return false; }
         });
         
         if (hasReported) {
           alert("Bạn đã báo cáo người dùng này rồi. Vui lòng chờ Ban quản trị xử lý!");
           return;
         }
       }

       setIsUploadingReport(true);
       let finalImageUrl = "";

       try {
         const fileExt = reportImageFile.name.split('.').pop();
         const fileName = `${myId}_report_${Date.now()}.${fileExt}`;
         
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
         alert("Lỗi tải ảnh lên! Bạn đã tạo Storage bucket 'reports' trên Supabase chưa?");
         setIsUploadingReport(false);
         return;
       }

       const payload = {
         target_id: activeRoommateId,
         reason: reportReason,
         image: finalImageUrl
       };
       await supabase.from('messages').insert({
         id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
         chat_id: 'SYSTEM_REPORTS',
         sender_id: myId,
         text: `[REPORT] ${JSON.stringify(payload)}`
       });
       alert("Báo cáo của bạn đã được gửi đến ban quản trị.");
       setIsReportModalOpen(false);
       setReportReason("");
       setReportImageFile(null);
       setReportImagePreview(null);
       setIsUploadingReport(false);
    } else {
       alert("Lỗi hệ thống, không thể gửi báo cáo lúc này.");
    }
  };

  const isActiveUserBlocked = activeRoommateId ? blockedUsers.includes(activeRoommateId) : false;

  const handleUnblock = async (userId: string) => {
    const updated = blockedUsers.filter(id => id !== userId);
    setBlockedUsers(updated);
    localStorage.setItem('roomiematch_blocked_users', JSON.stringify(updated));

    const myId = currentUser?.id || currentUserProfile?.id;
    if (myId && import.meta.env.VITE_SUPABASE_URL) {
      const chatId = [myId, userId].sort().join('_');
      await supabase.from('messages').insert({
        id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        chat_id: chatId,
        sender_id: myId,
        text: "[SYSTEM_UNBLOCK]"
      });
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
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
  
  console.log('[Chat] Active roommate:', {
    id: activeRoommate?.id,
    name: activeRoommate?.name,
    budget: activeRoommate?.budget,
    lifestyle: activeRoommate?.lifestyle,
    hasFullData: !!(activeRoommate?.budget && activeRoommate?.lifestyle?.sleep !== 'Bình thường')
  });
  
  const activeMessages = activeRoommate ? (chats[activeRoommateId!] || chats[activeRoommate.id] || []) : [];

  // Check if partner has blocked us via system message
  const myTempId = currentUser?.id || currentUserProfile?.id;
  const partnerBlockMsgs = activeMessages.filter(m => m.senderId !== "me" && m.senderId !== myTempId && (m.text === "[SYSTEM_BLOCK]" || m.text === "[SYSTEM_UNBLOCK]"));
  const lastPartnerBlockMsg = partnerBlockMsgs[partnerBlockMsgs.length - 1];
  const isBlockedByPartner = lastPartnerBlockMsg?.text === "[SYSTEM_BLOCK]";  
  // Auth UUID = ID cố định từ Google, không thay đổi dù đăng nhập máy nào
  const myAuthId = currentUser?.id;
  const myProfileId = currentUserProfile?.id;
  // Luôn dùng Auth UUID cho chat_id để đồng bộ mọi thiết bị
  const myChatId = myAuthId || myProfileId;
  
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
  
  console.log('[Chat] Chat IDs:', {
    myChatId,
    activeRoommateId,
    partnerChatId,
    finalChatId: chatId,
    activeRoommateName: activeRoommate?.name,
    isListingId: activeRoommate?.id?.startsWith('rm-')
  });
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
            text: d.text, imageUrl: d.image_url, timestamp: d.timestamp
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
          setChats(prev => {
            const cur = prev[activeRoommateId] || [];
            if (cur.some(m => m.id === newMsg.id)) return prev;
            // Insert and sort to ensure chronological order when merging streams
            const updated = [...cur, { id: newMsg.id, chatId: newMsg.chat_id, senderId: newMsg.sender_id, text: newMsg.text, imageUrl: newMsg.image_url, timestamp: newMsg.timestamp }];
            return { ...prev, [activeRoommateId]: updated.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()) };
          });
        })
        .subscribe();
    });

    return () => { channels.forEach(ch => supabase.removeChannel(ch)); };
  }, [activeRoommateId, activeRoommate, myChatId]);

  // Fetch Inbox Conversations


  // Fetch Inbox Conversations
  useEffect(() => {
    if (!import.meta.env.VITE_SUPABASE_URL) return;
    if (!myAuthId) {
      console.log('[Chat] myAuthId is undefined, cannot fetch inbox');
      return;
    }

    console.log('[Chat] Fetching inbox for myAuthId:', myAuthId);

    const fetchInbox = async () => {
      // Chỉ cần tìm bằng Auth UUID - đơn giản, đáng tin cậy
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .ilike('chat_id', `%${myAuthId}%`)
        .order('timestamp', { ascending: false });

      console.log('[Chat] Inbox query result:', { 
        dataCount: data?.length, 
        error,
        myAuthId,
        sampleChatIds: data?.slice(0, 3).map(m => m.chat_id)
      });

      if (!error && data) {
        console.log('[Chat] Found', data.length, 'messages in inbox');
        const conversationMap = new Map();

        // Collect all unique partner IDs
        const partnerIds = new Set<string>();
        data.forEach(msg => {
          const ids = msg.chat_id.split('_');
          const partnerId = ids[0] === myAuthId ? ids[1] : ids[0];
          if (partnerId !== myAuthId) partnerIds.add(partnerId);
        });

        // Fetch partner profiles - prioritize roommates table (has full data)
        const dbPartnerMap = new Map();
        
        if (partnerIds.size > 0) {
          const partnerArr = Array.from(partnerIds);
          
          console.log('[Chat] Fetching profiles for partners:', partnerArr);
          
          // Batch fetch ALL fields from roommates table (has full data)
          // Priority: roommates (full data with budget, lifestyle, bio) > profiles (basic data only)
          const [roommatesById, roommatesByUserId, profilesById, profilesByAuthId] = await Promise.all([
            supabase.from('roommates').select('*').in('id', partnerArr),
            supabase.from('roommates').select('*').in('user_id', partnerArr),
            supabase.from('profiles').select('*').in('id', partnerArr),
            supabase.from('profiles').select('*').in('auth_id', partnerArr)
          ]);
          
          console.log('[Chat] Fetch results:', {
            roommatesById: roommatesById.data?.length,
            roommatesByUserId: roommatesByUserId.data?.length,
            profilesById: profilesById.data?.length,
            profilesByAuthId: profilesByAuthId.data?.length
          });
          
          // Map roommates first (priority - has full lifestyle, bio, budget, etc.)
          [...(roommatesById.data || []), ...(roommatesByUserId.data || [])].forEach(r => {
            console.log('[Chat] Roommate from DB:', {
              id: r.id,
              name: r.name,
              user_id: r.user_id,
              budget: r.budget,
              hasLifestyle: !!r.lifestyle,
              bio: r.bio?.substring(0, 30),
              avatar: r.avatar?.substring(0, 50), // Log avatar
              avatarType: r.avatar?.startsWith('data:') ? 'base64' : r.avatar?.startsWith('http') ? 'url' : 'unknown'
            });
            if (!dbPartnerMap.has(r.id)) dbPartnerMap.set(r.id, r);
            if (r.user_id && !dbPartnerMap.has(r.user_id)) dbPartnerMap.set(r.user_id, r);
          });
          
          console.log('[Chat] Found in roommates table:', dbPartnerMap.size);
          
          // Fallback to profiles for missing (basic info only)
          [...(profilesById.data || []), ...(profilesByAuthId.data || [])].forEach(p => {
            if (!dbPartnerMap.has(p.id)) dbPartnerMap.set(p.id, p);
            if (p.auth_id && !dbPartnerMap.has(p.auth_id)) dbPartnerMap.set(p.auth_id, p);
          });
          
          console.log('[Chat] Total profiles loaded:', dbPartnerMap.size);
        }

        // Track agreements for badge notifications
        const agreementMap: Record<string, boolean> = {};

        data.forEach(msg => {
          const ids = msg.chat_id.split('_');
          const partnerId = ids[0] === myAuthId ? ids[1] : ids[0];
          if (partnerId === myAuthId) return;

          // Check if message is an unread agreement draft
          if (msg.text?.startsWith('[AGREEMENT_DRAFT]') && msg.sender_id !== myAuthId) {
            agreementMap[partnerId] = true;
          }

          console.log('[Chat] Processing message from partner:', partnerId, 'existing:', conversationMap.has(partnerId));

          // Try to get partner - PRIORITIZE database over props
          // 1. Try database first (most up-to-date)
          let partner = dbPartnerMap.get(partnerId);
          
          // 2. Fallback to roommates list from props
          if (!partner) {
            partner = roommates.find(r => r.id === partnerId || r.user_id === partnerId);
          }
          
          if (!partner) {
            console.warn('[Chat] Partner not found in any table, using fallback for:', partnerId);
            // Default fallback (should rarely happen)
            partner = { 
              id: partnerId, 
              name: 'Người dùng', 
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
          
          // NORMALIZE to a single canonical ID (prefer auth-based IDs)
          // This ensures all messages from the same person use the same key
          const canonicalId = partner.user_id || partner.auth_id || partner.id || partnerId;
          
          console.log('[Chat] Canonical ID for', partner.name, ':', canonicalId, '(from partnerId:', partnerId, ')');
          
          // Check if this canonical ID already has a conversation
          if (conversationMap.has(canonicalId)) {
            // Update existing conversation if this message is newer
            const existing = conversationMap.get(canonicalId);
            if (new Date(msg.timestamp) > new Date(existing.timestamp)) {
              conversationMap.set(canonicalId, {
                partner,
                lastMessage: msg.text || 'Đã gửi đính kèm',
                timestamp: msg.timestamp,
                chatId: msg.chat_id
              });
              console.log('[Chat] Updated existing conversation for canonical ID:', canonicalId);
            }
          } else {
            // New conversation - use canonical ID
            conversationMap.set(canonicalId, {
              partner,
              lastMessage: msg.text || 'Đã gửi đính kèm',
              timestamp: msg.timestamp,
              chatId: msg.chat_id
            });
            console.log('[Chat] Created new conversation with canonical ID:', canonicalId);
          }
        });

        // Đảm bảo activeRoommateId luôn có trong list
        if (activeRoommateId) {
          let activePartner = roommates.find(r => r.id === activeRoommateId || r.user_id === activeRoommateId) || dbPartnerMap.get(activeRoommateId);
          
          if (activePartner) {
            // Normalize to canonical ID
            const canonicalId = activePartner.user_id || activePartner.auth_id || activePartner.id || activeRoommateId;
            
            if (!conversationMap.has(canonicalId)) {
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
                lastMessage: 'Bắt đầu cuộc trò chuyện...',
                timestamp: new Date().toISOString(),
                chatId: [myAuthId, activeRoommateId].sort().join('_')
              });
              
              console.log('[Chat] Added active roommate with canonical ID:', canonicalId);
            }
          }
        }

        // Convert to array - now using single canonical ID per person, no deduplication needed
        const conversationsArray = Array.from(conversationMap.values())
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        
        console.log('[Chat] Setting conversations:', conversationsArray.length, 'conversations (', conversationMap.size, 'map entries)');
        setConversations(conversationsArray);
        setConversationsWithAgreements(agreementMap);
        
        // Auto-unhide conversations that have NEW messages (after hide timestamp)
        const hiddenMap = JSON.parse(localStorage.getItem('roomiematch_hidden_conversations') || '{}');
        if (Object.keys(hiddenMap).length > 0) {
          const updatedHidden = { ...hiddenMap };
          let changed = false;
          
          conversationsArray.forEach(conv => {
            const canonicalId = conv.partner.user_id || conv.partner.id;
            const hideTimestamp = hiddenMap[canonicalId];
            
            if (hideTimestamp) {
              const lastMessageTime = new Date(conv.timestamp).getTime();
              // Only unhide if last message is AFTER the hide timestamp
              if (lastMessageTime > hideTimestamp) {
                console.log('[Chat] Auto-unhiding conversation:', conv.partner.name, '(new message after hide)');
                delete updatedHidden[canonicalId];
                changed = true;
              }
            }
          });
          
          if (changed) {
            localStorage.setItem('roomiematch_hidden_conversations', JSON.stringify(updatedHidden));
            setHiddenConversations(updatedHidden);
          }
        }
      } else if (error) {
        console.error('[Chat] Error fetching inbox:', error);
      }

    };
    fetchInbox();

    const inboxChannel = supabase
      .channel('inbox_updates')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const newMsg = payload.new as any;
        if (newMsg.chat_id?.includes(myAuthId)) {
          // When new message arrives, unhide the conversation if it was hidden
          const ids = newMsg.chat_id.split('_');
          const partnerId = ids[0] === myAuthId ? ids[1] : ids[0];
          
          const hiddenMap = JSON.parse(localStorage.getItem('roomiematch_hidden_conversations') || '{}');
          if (hiddenMap[partnerId]) {
            const newMsgTime = new Date(newMsg.timestamp).getTime();
            const hideTime = hiddenMap[partnerId];
            
            // Only unhide if this message is AFTER the hide timestamp
            if (newMsgTime > hideTime) {
              delete hiddenMap[partnerId];
              localStorage.setItem('roomiematch_hidden_conversations', JSON.stringify(hiddenMap));
              setHiddenConversations(hiddenMap);
              console.log('[Chat] Auto-unhiding conversation from:', partnerId, '(new message received)');
            }
          }
          
          fetchInbox();
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(inboxChannel); };
  }, [myAuthId, roommates, activeRoommateId]);




  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!inputText.trim() && !attachedImage) || !activeRoommateId || !currentUserProfile) return;
    if (isActiveUserBlocked || isBlockedByPartner) return;

    const userMessageText = inputText.trim();
    const sentImage = attachedImage;
    setInputText("");
    setAttachedImage(null);

    const newMsgId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString();
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
          {conversations.length === 0 ? (
            <div className="text-center py-8 text-slate-400 font-medium text-sm">
              Chưa có cuộc trò chuyện nào.
            </div>
          ) : (
            conversations
              .filter(conv => {
                // Filter by search query
                if (!conv.partner.name.toLowerCase().includes(friendSearchQuery.toLowerCase())) {
                  return false;
                }
                // Filter out hidden conversations
                const canonicalId = conv.partner.user_id || conv.partner.id;
                return !hiddenConversations[canonicalId]; // Check if exists in hidden map
              })
              .map((conv) => {
              const r = conv.partner;
              const isActive = r.id === activeRoommateId;
              const lastMsg = conv.lastMessage;
              const canonicalId = r.user_id || r.id;
              const hasAgreement = conversationsWithAgreements[canonicalId];
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
                    <div className="w-12 h-12 rounded-full overflow-hidden border border-slate-200 shadow-inner shrink-0 relative">
                      <img src={r.avatar} alt={r.name} className="w-full h-full object-cover" />
                      <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-green-400 ring-2 ring-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-0.5">
                        <h4 className="text-sm font-bold text-slate-800 leading-tight tracking-tight truncate flex items-center gap-1">
                          {r.name}
                          {r.isVerified && <CheckCircle2 className="h-3.5 w-3.5 text-sky-500 fill-sky-50 shrink-0" />}
                          {blockedUsers.includes(r.id) && <span title="Đã chặn"><Ban className="h-3 w-3 text-red-400 shrink-0" /></span>}
                        </h4>
                        {r.matchScore > 0 && (
                          <span className="text-[10px] font-bold text-sky-700 bg-white border border-sky-100 px-1.5 py-0.5 rounded-full">
                            {r.matchScore}%
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 truncate leading-snug font-medium select-none">{lastMsg}</p>
                    </div>
                  </div>
                  
                  {/* Agreement badge notification */}
                  {hasAgreement && (
                    <div className="shrink-0">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" title="Có thỏa thuận mới" />
                    </div>
                  )}
                  
                  {/* Delete conversation button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm(`Ẩn cuộc trò chuyện với ${r.name}? Tin nhắn vẫn được giữ, sẽ hiện lại khi có tin nhắn mới.`)) {
                        // Hide conversation (add to hidden list)
                        const canonicalId = r.user_id || r.id;
                        const updated = { ...hiddenConversations, [canonicalId]: Date.now() };
                        setHiddenConversations(updated);
                        localStorage.setItem('roomiematch_hidden_conversations', JSON.stringify(updated));
                        console.log('[Chat] Hiding conversation:', canonicalId);
                      }
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-red-50 rounded-lg text-red-500 shrink-0"
                    title="Ẩn cuộc trò chuyện"
                  >
                    <X className="h-4 w-4" />
                  </button>
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
                <div className="w-11 h-11 rounded-full overflow-hidden border border-slate-200 shrink-0">
                  <img src={activeRoommate.avatar} alt={activeRoommate.name} className="w-full h-full object-cover" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#0f172a] leading-none tracking-tight flex items-center gap-1.5">
                    {activeRoommate.name}
                    {activeRoommate.isVerified && <CheckCircle2 className="h-4.5 w-4.5 text-sky-500 fill-sky-50" />}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    {activeRoommate.role} • {activeRoommate.location}
                  </p>
                </div>
              </div>

              {/* Status or compatibility */}
              <div className="flex items-center gap-2">
                {activeRoommate.matchScore && activeRoommate.matchScore > 0 ? (
                  <div className="hidden sm:inline-flex items-center gap-1.5 bg-gradient-to-r from-[#dff6ff] to-sky-50 text-[#006590] px-3.5 py-1.5 rounded-full text-xs font-black border border-sky-200 shadow-sm">
                    <Sparkles className="h-3.5 w-3.5 fill-sky-200" />
                    <span className="bg-clip-text">Độ tương thích: {activeRoommate.matchScore}%</span>
                  </div>
                ) : null}
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
                    
                    // Open agreement modal directly in chat
                    setAgreementModalPayload(null);
                    setIsAgreementModalOpen(true);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#006590] to-sky-600 hover:shadow-lg hover:-translate-y-0.5 text-white text-[13px] font-bold transition-all duration-300 cursor-pointer flex items-center gap-2"
                >
                  <BadgeCheck className="h-4 w-4" />
                  <span className="hidden sm:inline">Lập Thỏa Thuận</span>
                </button>
                <button
                  onClick={() => setIsReportModalOpen(true)}
                  className="px-3.5 py-2.5 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700 transition-colors duration-200 cursor-pointer flex items-center gap-2 font-bold text-[13px]"
                  title="Báo cáo người dùng"
                >
                  <AlertOctagon className="h-4 w-4" />
                </button>
              </div>
            </div>

            {activeMessages.some(m => m.text?.startsWith('[AGREEMENT_SIGNED]')) && (
              <div className="bg-emerald-50 text-emerald-700 px-6 py-3 border-b border-emerald-100 flex items-center justify-center gap-2 shadow-sm shrink-0 font-bold text-[13px] animate-fade-in z-10">
                <BadgeCheck className="w-5 h-5 text-emerald-600" />
                🎉 Hai bạn đã ký thỏa thuận sống chung thành công!
              </div>
            )}

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
                  const statusText = timeElapsed < 5000 ? "Đã gửi" : (timeElapsed < 15000 ? "Đã nhận" : "Đã xem");
                  
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

                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isMe ? "justify-end" : "justify-start"} animate-fade-in`}
                    >
                      <div
                        className={`max-w-[85%] px-4 py-3 rounded-2xl text-[14.5px] leading-relaxed shadow-[0_2px_4px_rgba(15,23,42,0.01)] ${
                          isSpecialMessage 
                            ? (isAgreementSigned ? "bg-emerald-50 text-emerald-900 border border-emerald-200" : isAgreementCancelled ? "bg-red-50 text-red-900 border border-red-200" : "bg-sky-50 text-sky-900 border border-sky-200")
                            : (isMe
                                ? "bg-[#006590] text-white rounded-br-none font-medium"
                                : "bg-white text-slate-800 border border-slate-100 rounded-bl-none font-medium")
                        }`}
                      >
                        {msg.imageUrl && (
                          <div className="mb-2 max-w-full overflow-hidden rounded-xl border border-slate-100/10 dark:border-slate-800">
                            <img src={msg.imageUrl} alt="Đính kèm" className="max-h-60 object-cover w-full rounded-lg" referrerPolicy="no-referrer" />
                          </div>
                        )}
                        {isSpecialMessage && agreementPayload ? (
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2 font-bold mb-1">
                              {isAgreementSigned ? <BadgeCheck className="w-5 h-5 text-emerald-600" /> : isAgreementCancelled ? <X className="w-5 h-5 text-red-600" /> : <FileText className="w-5 h-5 text-sky-600" />}
                              <span>
                                {isAgreementSigned ? "Bản cam kết đã được ký" : isAgreementCancelled ? "Thỏa thuận đã bị từ chối" : isMe ? "Bạn đã gửi bản thỏa thuận" : "Đối tác đã gửi thỏa thuận"}
                              </span>
                            </div>
                            <div className={`p-3 rounded-xl text-sm font-medium ${isAgreementSigned ? "bg-emerald-100/50" : isAgreementCancelled ? "bg-red-100/50" : "bg-white/60"}`}>
                              {isAgreementSigned ? "Hợp đồng sống chung đã có hiệu lực. Bạn có thể xem lại chi tiết trong phần Thỏa Thuận." : isAgreementCancelled ? "Thỏa thuận này đã bị vô hiệu hóa. Bạn có thể tạo thỏa thuận mới để thương lượng lại." : "Hãy xem qua các điều khoản và ký xác nhận nếu bạn đồng ý."}
                            </div>
                            <button
                              onClick={() => {
                                // Mark agreement as read for this partner
                                const partnerId = activeRoommate.user_id || activeRoommate.id;
                                setConversationsWithAgreements(prev => ({ ...prev, [partnerId]: false }));
                                
                                if (isAgreementCancelled) {
                                  // For cancelled agreements, navigate to agreement tab to create new one
                                  onNavigateToTab && onNavigateToTab('agreement');
                                } else {
                                  // Open agreement modal with payload
                                  setAgreementModalPayload(agreementPayload);
                                  setIsAgreementModalOpen(true);
                                }
                              }}
                              className={`mt-2 py-2.5 px-4 w-full rounded-xl text-sm font-bold flex justify-center items-center gap-2 transition-all ${
                                isAgreementSigned 
                                  ? "bg-emerald-600 hover:bg-emerald-700 text-white" 
                                  : isAgreementCancelled
                                    ? "bg-amber-600 hover:bg-amber-700 text-white shadow-md"
                                    : "bg-sky-600 hover:bg-sky-700 text-white shadow-md"
                              }`}
                            >
                              {isAgreementSigned ? "Xem bản ký kết" : isAgreementCancelled ? "Tạo thỏa thuận mới" : "Xem & Ký Thỏa Thuận"}
                            </button>
                          </div>
                        ) : (
                          msg.text && <p>{msg.text}</p>
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
                  onClick={() => activeRoommateId && handleUnblock(activeRoommateId)}
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

            {/* Text Send Form area with image sending */}
            <form onSubmit={handleSend} className={`p-4 border-t border-slate-100 bg-white shrink-0 space-y-2 ${isBlockedByPartner ? 'opacity-50 pointer-events-none' : ''}`}>
              {attachedImage && (
                <div className="p-2.5 bg-slate-50 border border-slate-150 rounded-xl flex items-center justify-between animate-fade-in">
                  <div className="flex items-center gap-2.5">
                    <div className="w-12 h-12 object-cover rounded-lg border border-slate-200 overflow-hidden shrink-0">
                      <img src={attachedImage} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                    <span className="text-xs text-slate-500 font-medium font-mono">Đã load xong 1 ảnh</span>
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
                  className={`bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-[#006590] w-12 h-12 rounded-full duration-150 flex items-center justify-center cursor-pointer transition-all shrink-0 ${isActiveUserBlocked ? 'opacity-40 pointer-events-none' : ''}`}
                  title="Gửi hình ảnh"
                >
                  <ImageIcon className="h-5 w-5" />
                </label>

                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={isActiveUserBlocked ? 'Bạn đã chặn người dùng này' : `Nhắn tin cùng ${activeRoommate.name}...`}
                  disabled={isActiveUserBlocked}
                  className={`flex-1 bg-slate-50 border border-slate-200 rounded-full px-5 py-3.5 text-sm outline-none focus:border-sky-500/50 focus:bg-white transition-all shadow-inner ${isActiveUserBlocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                />
                {isActiveUserBlocked ? (
                  <button
                    type="button"
                    onClick={() => activeRoommateId && handleUnblock(activeRoommateId)}
                    className="bg-gradient-to-r from-red-500 to-red-600 text-white px-4 h-12 rounded-full hover:shadow-lg duration-150 flex items-center justify-center cursor-pointer transition-all hover:scale-105 shrink-0 text-xs font-bold gap-1"
                  >
                    <Ban className="h-4 w-4" />
                    Hủy chặn
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={(!inputText.trim() && !attachedImage) || isTyping}
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
            <div>
              <AlertCircle className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-400 font-bold text-base">Chưa có cuộc trò chuyện nào</p>
              <p className="text-xs text-slate-500 mt-1 max-w-xs leading-normal">
                Hãy ghé qua tab **Tìm Bạn Ở Ghép**, chọn một roommate lý tưởng và bấm **Bắt đầu Trò Chuyện** để kết nối ngay nhé!
              </p>
            </div>
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
              <p className="text-[12px] text-sky-600 font-extrabold uppercase tracking-widest mt-1 bg-sky-50 inline-block px-3 py-1 rounded-full mb-3">{activeRoommate.role}</p>
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
          </div>
          
          <div className="text-[11px] text-slate-400 font-bold px-4 py-3.5 bg-slate-100/50 rounded-2xl mt-6 leading-relaxed border border-slate-200/50 backdrop-blur-sm flex items-start gap-2.5">
            <ShieldCheck className="h-4 w-4 text-slate-400 shrink-0" />
            <span>Mọi ghi chú được lưu an toàn trên thiết bị của bạn.</span>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsReportModalOpen(false)} />
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md relative overflow-hidden animate-in fade-in zoom-in-95 p-6 space-y-5">
             <div className="flex justify-between items-center border-b border-slate-100 pb-4">
               <h3 className="text-xl font-black text-rose-600 flex items-center gap-2">
                 <AlertOctagon className="w-6 h-6" /> Báo cáo vi phạm
               </h3>
               <button onClick={() => setIsReportModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                 <X className="w-5 h-5" />
               </button>
             </div>
             
             <div className="space-y-4">
               <div>
                 <label className="block text-sm font-bold text-slate-700 mb-1.5">Lý do báo cáo <span className="text-rose-500">*</span></label>
                 <textarea
                   className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none transition-all h-28 resize-none"
                   placeholder="Nhập lý do chi tiết..."
                   value={reportReason}
                   onChange={e => setReportReason(e.target.value)}
                 />
               </div>
               <div>
                 <label className="block text-sm font-bold text-slate-700 mb-1.5">Ảnh minh chứng <span className="text-rose-500">*</span></label>
                 <label className="w-full flex flex-col items-center justify-center bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl px-4 py-6 hover:bg-slate-100 hover:border-rose-400 transition-all cursor-pointer">
                   <input
                     type="file"
                     accept="image/*"
                     className="hidden"
                     disabled={isUploadingReport}
                     onChange={e => {
                       if (e.target.files && e.target.files[0]) {
                         const file = e.target.files[0];
                         setReportImageFile(file);
                         // Create preview
                         const reader = new FileReader();
                         reader.onloadend = () => {
                           setReportImagePreview(reader.result as string);
                         };
                         reader.readAsDataURL(file);
                       }
                     }}
                   />
                   {reportImageFile && reportImagePreview ? (
                     <div className="flex flex-col items-center gap-3 w-full">
                       {/* Image Preview */}
                       <div className="w-full max-w-xs rounded-lg overflow-hidden border-2 border-emerald-500 shadow-md">
                         <img src={reportImagePreview} alt="Preview" className="w-full h-auto object-contain max-h-48" />
                       </div>
                       <div className="flex flex-col items-center gap-1">
                         <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                         <span className="text-sm font-bold text-emerald-600 truncate max-w-[200px]">{reportImageFile.name}</span>
                         <span className="text-xs text-slate-500">Nhấn để chọn ảnh khác</span>
                       </div>
                     </div>
                   ) : (
                     <div className="flex flex-col items-center gap-2 text-slate-500">
                       <UploadCloud className="w-8 h-8 text-slate-400" />
                       <span className="text-sm font-bold">Nhấn để tải ảnh lên</span>
                       <span className="text-xs">Hỗ trợ JPG, PNG, GIF</span>
                     </div>
                   )}
                 </label>
               </div>
             </div>

             <div className="flex gap-3 pt-2">
               <button disabled={isUploadingReport} onClick={() => setIsReportModalOpen(false)} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors disabled:opacity-50">Hủy</button>
               <button disabled={isUploadingReport} onClick={handleSendReport} className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                 {isUploadingReport ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
                 {isUploadingReport ? "Đang gửi..." : "Gửi Báo Cáo"}
               </button>
             </div>
          </div>
        </div>
      )}
      
      {/* Agreement Modal - Displayed inline in chat */}
      {isAgreementModalOpen && activeRoommate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
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
                            const chatId = [currentUserProfile.id, activeRoommate.id].sort().join('_');
                            await supabase.from('messages').insert({
                              chat_id: chatId,
                              sender_id: currentUserProfile.id,
                              text: `[AGREEMENT_CANCELLED] ${JSON.stringify(cancelPayload)}`
                            });

                            // Send new draft with edits
                            const newDraft = {
                              id: crypto.randomUUID ? crypto.randomUUID() : `agr_${Date.now()}`,
                              status: 'pending',
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
                              sender_id: currentUserProfile.id,
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
                    ) : agreementModalPayload.status === 'pending' && agreementModalPayload.sender_id !== currentUserProfile.id ? (
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
                            if (confirm('Bạn có chắc muốn từ chối thỏa thuận này?')) {
                              const payload = { ...agreementModalPayload, status: 'cancelled', timestamp: new Date().toISOString() };
                              const chatId = [currentUserProfile.id, activeRoommate.id].sort().join('_');
                              await supabase.from('messages').insert({
                                chat_id: chatId,
                                sender_id: currentUserProfile.id,
                                text: `[AGREEMENT_CANCELLED] ${JSON.stringify(payload)}`
                              });
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
                    ) : agreementModalPayload.status === 'pending' && agreementModalPayload.sender_id === currentUserProfile.id ? (
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
                            if (confirm('Bạn có chắc muốn hủy thỏa thuận này?')) {
                              const payload = { ...agreementModalPayload, status: 'cancelled', timestamp: new Date().toISOString() };
                              const chatId = [currentUserProfile.id, activeRoommate.id].sort().join('_');
                              await supabase.from('messages').insert({
                                chat_id: chatId,
                                sender_id: currentUserProfile.id,
                                text: `[AGREEMENT_CANCELLED] ${JSON.stringify(payload)}`
                              });
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
                    ) : agreementModalPayload.status === 'signed' ? (
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
        </div>
      )}

      {/* Signature Modal for Agreement Signing */}
      {isSignatureModalOpen && (
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
                    alert("Vui lòng nhập họ và tên đầy đủ!");
                    return;
                  }

                  // Check if name matches profile (case insensitive)
                  const normalizedSignature = signatureName.trim().toLowerCase().replace(/\s+/g, ' ');
                  const normalizedProfile = currentUserProfile?.name?.trim().toLowerCase().replace(/\s+/g, ' ');
                  
                  if (normalizedSignature !== normalizedProfile) {
                    alert(`Tên không khớp! Vui lòng nhập đúng tên trong hồ sơ: "${currentUserProfile?.name}"`);
                    return;
                  }

                  // All validation passed - proceed with signing
                  try {
                    const signedPayload = {
                      ...agreementModalPayload,
                      status: 'signed',
                      signedBy: currentUserProfile.id,
                      signedByName: signatureName.trim(),
                      timestamp: new Date().toISOString()
                    };

                    // CRITICAL FIX: Use auth UUID consistently
                    const myChatId = currentUser?.id || currentUserProfile?.id;
                    const partnerChatId = activeRoommate?.user_id || activeRoommate?.auth_id || activeRoommate?.id;
                    const chatId = [myChatId, partnerChatId].sort().join('_');

                    console.log('[Signature] Signing agreement:', {
                      chatId,
                      myChatId,
                      partnerChatId,
                      signedByName: signatureName.trim()
                    });

                    const { error } = await supabase.from('messages').insert({
                      id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                      chat_id: chatId,
                      sender_id: myChatId,
                      text: `[AGREEMENT_SIGNED] ${JSON.stringify(signedPayload)}`
                    });

                    if (error) {
                      console.error('[Signature] Error signing agreement:', error);
                      alert('Lỗi khi ký kết thỏa thuận! Vui lòng thử lại.');
                      return;
                    }

                    // Update roommate status to "Đã tìm được"
                    await supabase.from('roommates')
                      .update({ status: 'Đã tìm được' })
                      .in('user_id', [myChatId, partnerChatId]);

                    alert('✅ Ký kết thành công! Thỏa thuận đã có hiệu lực.');
                    
                    // Close modals
                    setIsSignatureModalOpen(false);
                    setSignatureName("");
                    setIsAgreementModalOpen(false);
                    setAgreementModalPayload(null);
                  } catch (err) {
                    console.error('[Signature] Unexpected error:', err);
                    alert('Lỗi không xác định! Vui lòng thử lại.');
                  }
                }}
                className="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-bold rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
              >
                <Check className="h-5 w-5" />
                Xác nhận ký
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
