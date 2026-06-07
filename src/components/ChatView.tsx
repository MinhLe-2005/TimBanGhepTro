import { useState, useEffect, useRef } from "react";
import { Send, CheckCircle2, AlertCircle, Sparkles, MessageSquare, PhoneCall, Image, FileText, X } from "lucide-react";
import { Roommate, Message } from "../types";

interface ChatViewProps {
  roommates: Roommate[];
  initialChats: { roommateId: string; messages: Message[] }[];
  activeRoommateId: string | null;
  setActiveRoommateId: (id: string | null) => void;
}

export default function ChatView({
  roommates,
  initialChats,
  activeRoommateId,
  setActiveRoommateId,
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
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chats, activeRoommateId, isTyping]);

  const activeRoommate = roommates.find((r) => r.id === activeRoommateId) || roommates[0];
  const activeMessages = activeRoommateId ? chats[activeRoommateId] || [] : [];

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!inputText.trim() && !attachedImage) || !activeRoommateId) return;

    const userMessageText = inputText.trim();
    const sentImage = attachedImage;
    setInputText("");
    setAttachedImage(null);

    const newMsg: Message = {
      id: Math.random().toString(),
      chatId: activeRoommateId,
      senderId: "me",
      text: userMessageText,
      imageUrl: sentImage || undefined,
      timestamp: new Date().toISOString(),
    };

    // Update state with User message
    const updatedMessages = [...activeMessages, newMsg];
    setChats((prev) => ({
      ...prev,
      [activeRoommateId]: updatedMessages,
    }));

    // Trigger AI Typing status
    setIsTyping(true);

    try {
      // API call to Express backend `/api/chat`
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roommate: activeRoommate,
          messages: updatedMessages,
        }),
      });

      if (!response.ok) {
        throw new Error("Lỗi mạng máy chủ");
      }

      const data = await response.json();
      const aiReplyText = data.text;

      const aiMsg: Message = {
        id: Math.random().toString(),
        chatId: activeRoommateId,
        senderId: activeRoommateId,
        text: aiReplyText,
        timestamp: new Date().toISOString(),
      };

      setChats((prev) => ({
        ...prev,
        [activeRoommateId]: [...(prev[activeRoommateId] || []), aiMsg],
      }));
    } catch (err) {
      console.warn("Express endpoint failed, using local fallback", err);
      // Simulate fallback
      setTimeout(() => {
        const fallMsg: Message = {
          id: Math.random().toString(),
          chatId: activeRoommateId,
          senderId: activeRoommateId,
          text: `Cảm ơn tin nhắn của bạn nhé! Mình vừa nhận được tin. Cùng thống nhất các điều khoản sống chung hay hẹn gặp nhé! 😄`,
          timestamp: new Date().toISOString(),
        };
        setChats((prev) => ({
          ...prev,
          [activeRoommateId]: [...(prev[activeRoommateId] || []), fallMsg],
        }));
      }, 1000);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="bg-white rounded-[24px] border border-gray-100 overflow-hidden shadow-[0_10px_30px_rgba(15,23,42,0.02)] h-[75vh] flex divide-x divide-slate-100 animate-fade-in">
      {/* Left Column: Matches list */}
      <div className="w-80 h-full flex flex-col bg-slate-50/50 shrink-0 hidden md:flex">
        <div className="p-5 border-b border-slate-100 bg-white">
          <h3 className="text-lg font-extrabold text-[#0f172a] tracking-tight">Trò Chuyện Đang Chạy</h3>
          <p className="text-xs text-slate-500 mt-0.5">Nơi thỏa thuận quy tắc sinh hoạt cùng roommate tiềm năng.</p>
        </div>

        {/* Roommates chat list wrapper */}
        <div className="flex-grow overflow-y-auto p-3 space-y-1.5 scrollbar-thin">
          {roommates.map((r) => {
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
                  onClick={() => alert(`Tính năng gọi video cùng ${activeRoommate.name} sẽ khả dụng sau khi hai bạn đạt thỏa thuận ở ghép!`)}
                  className="p-2.5 rounded-xl border border-slate-200 text-[#006590] hover:bg-slate-50 duration-150 cursor-pointer"
                  title="Call roommate"
                >
                  <PhoneCall className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Message bubbles wrapper container */}
            <div className="flex-grow p-6 overflow-y-auto space-y-4">
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
                  const isMe = msg.senderId === "me";
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

              <div className="flex gap-2 items-center">
                <input
                  type="file"
                  id="chat-image-input"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />
                <label
                  htmlFor="chat-image-input"
                  className="bg-slate-50 hover:bg-slate-100 border border-slate-150 text-[#006590] p-3.5 rounded-xl duration-150 flex items-center justify-center cursor-pointer transition-all hover:scale-105"
                  title="Gửi hình ảnh"
                >
                  <Image className="h-4.5 w-4.5" />
                </label>

                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={`Nhắn tin thầm kín, thương lượng cùng ${activeRoommate.name}...`}
                  className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#006590] focus:bg-white duration-150"
                />
                <button
                  type="submit"
                  disabled={(!inputText.trim() && !attachedImage) || isTyping}
                  className="bg-[#006590] text-white p-3.5 rounded-xl hover:bg-[#005176] disabled:bg-slate-200 disabled:text-slate-400 duration-150 flex items-center justify-center cursor-pointer shadow-md shadow-sky-900/10"
                >
                  <Send className="h-4.5 w-4.5" />
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
        <div className="w-80 h-full bg-slate-50/30 p-5 flex flex-col justify-between shrink-0 hidden lg:flex border-l border-slate-100 overflow-y-auto">
          <div className="space-y-4">
            <div className="text-center pb-4 border-b border-slate-100">
              <div className="w-16 h-16 rounded-full overflow-hidden border border-slate-200 shadow-inner mx-auto mb-2">
                <img src={activeRoommate.avatar} alt={activeRoommate.name} className="w-full h-full object-cover" />
              </div>
              <h4 className="text-sm font-extrabold text-[#0f172a] tracking-tight">{activeRoommate.name}</h4>
              <p className="text-[11px] text-slate-500 font-medium leading-none mt-1">{activeRoommate.role}</p>
            </div>

            {/* Private Notes form */}
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <h5 className="text-xs font-bold text-amber-800 flex items-center gap-1 select-none">
                  <span>📝 Ghi chú cá nhân</span>
                </h5>
                {isSavingChatNote && (
                  <span className="text-[9px] text-emerald-600 font-extrabold bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200 animate-pulse">
                    ✓ Đã lưu
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-500 leading-normal font-semibold">
                Ghi lại lịch hẹn, điều kiện giá, số điện thoại riêng của {activeRoommate.name}... Chỉ mình bạn có thể thấy.
              </p>
              <textarea
                rows={5}
                placeholder={`Nhập ghi chú cá nhân của bạn về ${activeRoommate.name}...`}
                value={chatPrivateNote}
                onChange={(e) => handleChatPrivateNoteChange(e.target.value)}
                className="w-full bg-white border border-amber-200/60 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-slate-700 outline-none duration-250 resize-none font-medium shadow-inner"
              />
            </div>

            {/* Roommate details snippet for handy view while chatting */}
            <div className="space-y-2">
              <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">💡 Tóm tắt lối sống</h5>
              <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                <div className="bg-white border border-slate-100 p-2 rounded-xl text-slate-600">
                  <span className="block text-[9px] text-slate-400 font-bold uppercase">Giấc ngủ</span>
                  <span className="font-bold text-[#006590]">{activeRoommate.lifestyle?.sleep || "Đúng giờ"}</span>
                </div>
                <div className="bg-white border border-slate-100 p-2 rounded-xl text-slate-600">
                  <span className="block text-[9px] text-slate-400 font-bold uppercase">Thú cưng</span>
                  <span className="font-bold text-[#006590]">{activeRoommate.lifestyle?.pets || "Thoải mái"}</span>
                </div>
                <div className="bg-white border border-slate-100 p-2 rounded-xl text-slate-600 col-span-2">
                  <span className="block text-[9px] text-slate-400 font-bold uppercase">Ngân sách tối đa</span>
                  <span className="font-extrabold text-[#006590]">{activeRoommate.budget ? `${(activeRoommate.budget / 1000000).toFixed(1)} tr/tháng` : "Liên hệ"}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="text-[10px] text-slate-400 text-center font-bold px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl mt-4 leading-normal">
            ⚙️ Dữ liệu được bảo mật an toàn trên bộ nhớ thiết bị của bạn.
          </div>
        </div>
      )}
    </div>
  );
}
