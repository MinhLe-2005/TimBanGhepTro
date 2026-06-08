import { useState, useEffect, useRef } from "react";
import { Send, CheckCircle2, AlertCircle, Sparkles, MessageSquare, PhoneCall, Image, FileText, X, Lock, BadgeCheck, PencilLine, Lightbulb, ShieldCheck, Ban, AlertOctagon, UploadCloud } from "lucide-react";
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

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportImageFile, setReportImageFile] = useState<File | null>(null);
  const [isUploadingReport, setIsUploadingReport] = useState(false);

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
  const chatId = myChatId && activeRoommateId ? [myChatId, activeRoommateId].sort().join("_") : null;
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
              bio: r.bio?.substring(0, 30)
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

        data.forEach(msg => {
          const ids = msg.chat_id.split('_');
          const partnerId = ids[0] === myAuthId ? ids[1] : ids[0];
          if (partnerId === myAuthId) return;

          console.log('[Chat] Processing message from partner:', partnerId, 'existing:', conversationMap.has(partnerId));

          // Try to get partner from: 1. roommates list, 2. Supabase profiles/roommates, 3. default
          let partner = roommates.find(r => r.id === partnerId || r.user_id === partnerId);
          
          if (!partner) {
            partner = dbPartnerMap.get(partnerId);
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
          
          // Use MULTIPLE keys to deduplicate - prioritize auth-based IDs
          const possibleKeys = [
            partner.user_id,      // Auth UUID from Google (most reliable)
            partner.auth_id,      // Alternative auth ID
            partner.id,           // Profile ID
            partnerId             // Message partner ID (fallback)
          ].filter(Boolean);      // Remove null/undefined
          
          // Find if any key already exists
          let existingKey = null;
          for (const key of possibleKeys) {
            if (conversationMap.has(key)) {
              existingKey = key;
              break;
            }
          }
          
          // Use the first available key as canonical key
          const canonicalKey = possibleKeys[0] || partnerId;
          
          if (existingKey) {
            // Update existing conversation if this message is newer
            const existing = conversationMap.get(existingKey);
            if (new Date(msg.timestamp) > new Date(existing.timestamp)) {
              // Update using SAME key to avoid duplication
              conversationMap.set(existingKey, {
                partner,
                lastMessage: msg.text || 'Đã gửi đính kèm',
                timestamp: msg.timestamp,
                chatId: msg.chat_id
              });
              console.log('[Chat] Updated existing conversation:', existingKey);
            }
          } else {
            // New conversation - use canonical key
            conversationMap.set(canonicalKey, {
              partner,
              lastMessage: msg.text || 'Đã gửi đính kèm',
              timestamp: msg.timestamp,
              chatId: msg.chat_id
            });
            console.log('[Chat] Created new conversation with key:', canonicalKey);
          }
        });

        // Đảm bảo activeRoommateId luôn có trong list
        if (activeRoommateId) {
          let activePartner = roommates.find(r => r.id === activeRoommateId || r.user_id === activeRoommateId) || dbPartnerMap.get(activeRoommateId);
          
          if (activePartner) {
            const activeKeys = [
              activePartner.user_id,
              activePartner.auth_id,
              activePartner.id,
              activeRoommateId
            ].filter(Boolean);
            
            const alreadyExists = activeKeys.some(key => conversationMap.has(key));
            
            if (!alreadyExists) {
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
              
              conversationMap.set(activeKeys[0] || activeRoommateId, {
                partner: activePartner,
                lastMessage: 'Bắt đầu cuộc trò chuyện...',
                timestamp: new Date().toISOString(),
                chatId: [myAuthId, activeRoommateId].sort().join('_')
              });
            }
          }
        }

        const conversationsArray = Array.from(conversationMap.values()).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        console.log('[Chat] Setting conversations:', conversationsArray.length, 'conversations');
        setConversations(conversationsArray);
      } else if (error) {
        console.error('[Chat] Error fetching inbox:', error);
      }

    };
    fetchInbox();

    const inboxChannel = supabase
      .channel('inbox_updates')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        if ((payload.new as any).chat_id?.includes(myAuthId)) fetchInbox();
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
              .filter(conv => conv.partner.name.toLowerCase().includes(friendSearchQuery.toLowerCase()))
              .map((conv) => {
              const r = conv.partner;
              const isActive = r.id === activeRoommateId;
              const lastMsg = conv.lastMessage;
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
                  {/* Delete conversation button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm(`Xóa cuộc trò chuyện với ${r.name}? Tin nhắn sẽ không bị xóa, chỉ ẩn khỏi danh sách.`)) {
                        setConversations(prev => prev.filter(c => c.partner.id !== r.id));
                      }
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-red-50 rounded-lg text-red-500 shrink-0"
                    title="Xóa cuộc trò chuyện"
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
                  onClick={() => onStartAgreement ? onStartAgreement(activeRoommate.id) : (onNavigateToTab && onNavigateToTab('agreement'))}
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
                              {isAgreementSigned ? "Hợp đồng sống chung đã có hiệu lực. Bạn có thể xem lại chi tiết trong phần Thỏa Thuận." : isAgreementCancelled ? "Thỏa thuận này đã bị vô hiệu hóa." : "Hãy xem qua các điều khoản và ký xác nhận nếu bạn đồng ý."}
                            </div>
                            {!isAgreementCancelled && (
                              <button
                                onClick={() => onStartAgreement ? onStartAgreement(activeRoommate.id, agreementPayload) : undefined}
                                className={`mt-2 py-2.5 px-4 w-full rounded-xl text-sm font-bold flex justify-center items-center gap-2 transition-all ${
                                  isAgreementSigned 
                                    ? "bg-emerald-600 hover:bg-emerald-700 text-white" 
                                    : "bg-sky-600 hover:bg-sky-700 text-white shadow-md"
                                }`}
                              >
                                {isAgreementSigned ? "Xem bản ký kết" : "Xem & Ký Thỏa Thuận"}
                              </button>
                            )}
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
                  <Image className="h-5 w-5" />
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
              
              {onViewProfile && activeRoommate && (
                <button 
                  onClick={() => {
                    console.log('[Chat] View profile clicked for:', activeRoommate.id, activeRoommate.name);
                    // Pass the full activeRoommate object instead of just ID
                    onViewProfile(activeRoommate);
                  }}
                  className="w-full bg-slate-900 hover:bg-[#006590] text-white text-[13px] font-bold py-2.5 rounded-xl transition-colors duration-200 shadow-md cursor-pointer"
                >
                  Xem hồ sơ chi tiết
                </button>
              )}
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
                         setReportImageFile(e.target.files[0]);
                       }
                     }}
                   />
                   {reportImageFile ? (
                     <div className="flex flex-col items-center gap-2">
                       <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                       <span className="text-sm font-bold text-emerald-600 truncate max-w-[200px]">{reportImageFile.name}</span>
                       <span className="text-xs text-slate-500">Nhấn để chọn ảnh khác</span>
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
    </div>
  );
}
