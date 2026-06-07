import { useState, useEffect, useRef } from "react";
import { Send, CheckCircle2, AlertCircle, Sparkles, MessageSquare, PhoneCall, Image, FileText, X, Lock, BadgeCheck, PencilLine, Lightbulb, ShieldCheck } from "lucide-react";
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
}: ChatViewProps) {
  // Chat records list
  const [chats, setChats] = useState<{ [roommateId: string]: Message[] }>(() => {
    const records: { [roommateId: string]: Message[] } = {};
    initialChats.forEach((chat) => {
      records[chat.roommateId] = chat.messages;
    });
    return records;
  });

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

  // Set first roommate active by default if none selected
  useEffect(() => {
    if (!activeRoommateId && roommates.length > 0) {
      setActiveRoommateId(roommates[0].id);
    }
  }, [activeRoommateId, roommates, setActiveRoommateId]);

  // Scroll to bottom on updates
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: "smooth"
      });
    }
  }, [chats, activeRoommateId, isTyping]);

  const activeRoommate = roommates.find((r) => r.id === activeRoommateId) || roommates[0];
  const activeMessages = activeRoommateId ? chats[activeRoommateId] || [] : [];
  
  const chatId = currentUserProfile && activeRoommateId 
    ? [currentUserProfile.id, activeRoommateId].sort().join("_")
    : null;

  // Supabase Real-time Fetch & Subscribe
  useEffect(() => {
    if (!chatId || !import.meta.env.VITE_SUPABASE_URL) return;

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('timestamp', { ascending: true });
        
      if (!error && data) {
        setChats(prev => ({
          ...prev,
          [activeRoommateId!]: data.map((d: any) => ({
             id: d.id,
             chatId: d.chat_id,
             senderId: d.sender_id,
             text: d.text,
             imageUrl: d.image_url,
             timestamp: d.timestamp
          }))
        }));
      }
    };
    fetchMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel(`messages:${chatId}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages',
        filter: `chat_id=eq.${chatId}`
      }, (payload) => {
        const newMsg = payload.new;
        setChats(prev => {
          const currentChats = prev[activeRoommateId!] || [];
          if (currentChats.some(m => m.id === newMsg.id)) return prev;
          
          return {
            ...prev,
            [activeRoommateId!]: [...currentChats, {
              id: newMsg.id,
              chatId: newMsg.chat_id,
              senderId: newMsg.sender_id,
              text: newMsg.text,
              imageUrl: newMsg.image_url,
              timestamp: newMsg.timestamp
            }]
          };
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatId, activeRoommateId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!inputText.trim() && !attachedImage) || !activeRoommateId || !currentUserProfile) return;

    const userMessageText = inputText.trim();
    const sentImage = attachedImage;
    setInputText("");
    setAttachedImage(null);

    const newMsgId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString();
    const newMsg: Message = {
      id: newMsgId,
      chatId: activeRoommateId,
      senderId: currentUserProfile.id,
      text: userMessageText,
      imageUrl: sentImage || undefined,
      timestamp: new Date().toISOString(),
    };

    // Optimistic UI Update
    const updatedMessages = [...activeMessages, newMsg];
    setChats((prev) => ({
      ...prev,
      [activeRoommateId]: updatedMessages,
    }));

    if (import.meta.env.VITE_SUPABASE_URL) {
      // Send to Supabase
      const { error } = await supabase.from('messages').insert({
        id: newMsg.id,
        chat_id: chatId,
        sender_id: currentUserProfile.id,
        text: userMessageText,
        image_url: sentImage || undefined,
      });
      if (error) console.error("Error sending message to Supabase", error);
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

        {/* Roommates chat list wrapper */}
        <div className="flex-grow overflow-y-auto p-3 space-y-1.5 scrollbar-thin">
          {roommates
            .filter(r => r.name.toLowerCase().includes(friendSearchQuery.toLowerCase()))
            .map((r) => {
            const isActive = r.id === activeRoommateId;
            const history = chats[r.id] || [];
            const lastMsg = history[history.length - 1]?.text || "Chưa có tin nhắn hội thoại";
            return (
              <div
                key={r.id}
                onClick={() => setActiveRoommateId(r.id)}
                className={`flex gap-3 p-3.5 rounded-2xl cursor-pointer duration-150 items-center ${
                  isActive
                    ? "bg-[#dff6ff] border border-sky-100 shadow-sm"
                    : "hover:bg-slate-100/60 border border-transparent"
                }`}
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
                    </h4>
                    <span className="text-[10px] font-bold text-sky-700 bg-white border border-sky-100 px-1.5 py-0.5 rounded-full">
                      {r.matchScore}%
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 truncate leading-snug font-medium select-none">{lastMsg}</p>
                </div>
              </div>
            );
          })}
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
                <div className="hidden sm:inline-flex items-center gap-1.5 bg-[#dff6ff] text-[#006590] px-3.5 py-1 rounded-full text-xs font-bold border border-sky-100">
                  <Sparkles className="h-3.5 w-3.5" />
                  Độ tương thích: {activeRoommate.matchScore}%
                </div>
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
                  onClick={() => onNavigateToTab && onNavigateToTab('agreement')}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#006590] to-sky-600 hover:shadow-lg hover:-translate-y-0.5 text-white text-[13px] font-bold transition-all duration-300 cursor-pointer flex items-center gap-2"
                >
                  <BadgeCheck className="h-4 w-4" />
                  <span className="hidden sm:inline">Lập Thỏa Thuận</span>
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
                activeMessages.map((msg) => {
                  const isMe = msg.senderId === "me" || msg.senderId === currentUserProfile.id;
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isMe ? "justify-end" : "justify-start"} animate-fade-in`}
                    >
                      <div
                        className={`max-w-[70%] px-4 py-3 rounded-2xl text-[14.5px] leading-relaxed shadow-[0_2px_4px_rgba(15,23,42,0.01)] ${
                          isMe
                            ? "bg-[#006590] text-white rounded-br-none font-medium"
                            : "bg-white text-slate-800 border border-slate-100 rounded-bl-none font-medium"
                        }`}
                      >
                        {msg.imageUrl && (
                          <div className="mb-2 max-w-full overflow-hidden rounded-xl border border-slate-100/10 dark:border-slate-800">
                            <img src={msg.imageUrl} alt="Đính kèm" className="max-h-60 object-cover w-full rounded-lg" referrerPolicy="no-referrer" />
                          </div>
                        )}
                        {msg.text && <p>{msg.text}</p>}
                        <span
                          className={`block text-[9.5px] mt-1 text-right  ${
                            isMe ? "text-sky-200" : "text-slate-400"
                          }`}
                        >
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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

            {/* Text Send Form area with image sending */}
            <form onSubmit={handleSend} className="p-4 border-t border-slate-100 bg-white shrink-0 space-y-2">
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
                  className="bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-[#006590] w-12 h-12 rounded-full duration-150 flex items-center justify-center cursor-pointer transition-all shrink-0"
                  title="Gửi hình ảnh"
                >
                  <Image className="h-5 w-5" />
                </label>

                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={`Nhắn tin cùng ${activeRoommate.name}...`}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-full px-5 py-3.5 text-sm outline-none focus:border-sky-500/50 focus:bg-white transition-all shadow-inner"
                />
                <button
                  type="submit"
                  disabled={(!inputText.trim() && !attachedImage) || isTyping}
                  className="bg-gradient-to-r from-sky-500 to-[#006590] text-white w-12 h-12 rounded-full hover:shadow-lg disabled:opacity-50 disabled:from-slate-300 disabled:to-slate-400 duration-150 flex items-center justify-center cursor-pointer transition-all hover:scale-105 shrink-0"
                >
                  <Send className="h-5 w-5 -ml-0.5 mt-0.5" />
                </button>
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
              <p className="text-[12px] text-sky-600 font-extrabold uppercase tracking-widest mt-1 bg-sky-50 inline-block px-3 py-1 rounded-full">{activeRoommate.role}</p>
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
    </div>
  );
}
