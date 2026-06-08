import { useState, useEffect } from "react";
import { Users, AlertTriangle, Shield, Trash2, Ban, ShieldCheck, FileText } from "lucide-react";
import { supabase } from "../lib/supabase";
import { Roommate, Room } from "../types";

interface AdminDashboardProps {
  currentUser: any;
  roommates: Roommate[];
  rooms: Room[];
  onDeleteRoommate?: (id: string) => void;
  onDeleteRoom?: (id: string) => void;
}

export default function AdminDashboard({ currentUser, roommates, rooms, onDeleteRoommate, onDeleteRoom }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<"reports" | "users" | "rooms" | "agreements">("reports");
  const [reports, setReports] = useState<any[]>([]);
  const [bannedUsers, setBannedUsers] = useState<string[]>([]);
  const [agreements, setAgreements] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAdminData = async () => {
    setIsLoading(true);
    try {
      // Fetch Reports
      const { data: reportMsgs } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', 'SYSTEM_REPORTS')
        .order('created_at', { ascending: false });

      if (reportMsgs) {
        const parsedReports = reportMsgs.map(msg => {
           let payload = null;
           try { payload = JSON.parse(msg.text.replace('[REPORT]', '').trim()); } catch {}
           return {
             id: msg.id,
             sender_id: msg.sender_id,
             created_at: msg.created_at,
             ...payload
           };
        }).filter(r => r.target_id);
        setReports(parsedReports);
      }

      // Fetch Bans
      const { data: banMsgs } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', 'SYSTEM_BANS');

      if (banMsgs) {
        setBannedUsers(banMsgs.map(m => m.text.replace('[BAN]', '').trim()));
      }

      // Fetch Agreements
      const { data: agreementMsgs } = await supabase
        .from('messages')
        .select('*')
        .like('text', '%[AGREEMENT_%')
        .order('created_at', { ascending: false });

      if (agreementMsgs) {
         const aggrMap = new Map();
         agreementMsgs.forEach(msg => {
            if (msg.text.startsWith('[AGREEMENT_SIGNED]')) {
               try {
                 const payload = JSON.parse(msg.text.replace('[AGREEMENT_SIGNED]', '').trim());
                 if (!aggrMap.has(payload.id)) aggrMap.set(payload.id, { ...payload, chat_id: msg.chat_id, type: 'signed' });
               } catch (e) {}
            } else if (msg.text.startsWith('[AGREEMENT_CANCELLED]')) {
               try {
                 const payload = JSON.parse(msg.text.replace('[AGREEMENT_CANCELLED]', '').trim());
                 if (!aggrMap.has(payload.id)) aggrMap.set(payload.id, { ...payload, chat_id: msg.chat_id, type: 'cancelled' });
               } catch (e) {}
            } else if (msg.text.startsWith('[AGREEMENT_DRAFT]')) {
               try {
                 const payload = JSON.parse(msg.text.replace('[AGREEMENT_DRAFT]', '').trim());
                 if (!aggrMap.has(payload.id)) aggrMap.set(payload.id, { ...payload, chat_id: msg.chat_id, type: 'pending' });
               } catch (e) {}
            }
         });
         setAgreements(Array.from(aggrMap.values()));
      }
    } catch (e) {
      console.error("Admin fetch error", e);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleBanUser = async (userId: string) => {
    if (!confirm("Khóa vĩnh viễn tài khoản này?")) return;
    const { error } = await supabase.from('messages').insert({
      id: 'msg_' + Date.now(),
      chat_id: 'SYSTEM_BANS',
      sender_id: currentUser.id,
      text: `[BAN] ${userId}`
    });
    if (!error) {
       alert("Đã khóa người dùng thành công.");
       fetchAdminData();
    }
  };

  const handleUnbanUser = async (userId: string) => {
    if (!confirm("Mở khóa tài khoản này?")) return;
    // Xóa các tin nhắn BAN của userId này
    const { data: banMsgs } = await supabase.from('messages').select('id, text').eq('chat_id', 'SYSTEM_BANS');
    if (banMsgs) {
       const msgsToDelete = banMsgs.filter(m => m.text.includes(userId)).map(m => m.id);
       for (const id of msgsToDelete) {
         await supabase.from('messages').delete().eq('id', id);
       }
    }
    alert("Đã mở khóa tài khoản.");
    fetchAdminData();
  };

  const handleDeleteListing = async (table: 'roommates' | 'rooms', id: string) => {
    if (!confirm("Xóa vĩnh viễn bài đăng này? Hành động không thể hoàn tác.")) return;
    await supabase.from(table).delete().eq('id', id);
    // Sync back to App state so all views update immediately
    if (table === 'roommates' && onDeleteRoommate) onDeleteRoommate(id);
    if (table === 'rooms' && onDeleteRoom) onDeleteRoom(id);
    alert("Đã xóa tin đăng.");
  };

  const handleDeleteAgreement = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn hủy bỏ hợp đồng này? Hai bên sẽ bị hủy trạng thái ghép đôi.")) return;
    
    const target = agreements.find(a => a.id === id);
    if (target) {
       await supabase.from('messages').insert({
         chat_id: target.chat_id,
         sender_id: currentUser.id,
         text: `[AGREEMENT_CANCELLED] {"id":"${id}"}`
       });
       
       const ids = target.chat_id.split('_');
       if (ids.length === 2) {
          await supabase.from('roommates').update({ status: 'Đang tìm' }).in('id', ids);
       }
       alert("Đã hủy hợp đồng thành công.");
       fetchAdminData();
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 mt-16 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
          <Shield className="w-8 h-8 text-rose-600" />
          Bảng Điều Khiển Quản Trị
        </h1>
        <p className="text-slate-500 mt-2">Hệ thống quản lý nội dung, tài khoản và xử lý vi phạm</p>
      </div>

      <div className="flex gap-4 mb-8">
        <button
          onClick={() => setActiveTab("reports")}
          className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all ${
            activeTab === "reports" ? "bg-rose-100 text-rose-700" : "bg-white text-slate-600 hover:bg-slate-50"
          }`}
        >
          <AlertTriangle className="w-5 h-5" />
          Báo cáo vi phạm ({reports.length})
        </button>
        <button
          onClick={() => setActiveTab("users")}
          className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all ${
            activeTab === "users" ? "bg-sky-100 text-[#006590]" : "bg-white text-slate-600 hover:bg-slate-50"
          }`}
        >
          <Users className="w-5 h-5" />
          Hồ sơ ứng viên
        </button>
        <button
          onClick={() => setActiveTab("rooms")}
          className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all ${
            activeTab === "rooms" ? "bg-emerald-100 text-emerald-700" : "bg-white text-slate-600 hover:bg-slate-50"
          }`}
        >
          <FileText className="w-5 h-5" />
          Tin đăng phòng
        </button>
        <button
          onClick={() => setActiveTab("agreements")}
          className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all ${
            activeTab === "agreements" ? "bg-amber-100 text-amber-700" : "bg-white text-slate-600 hover:bg-slate-50"
          }`}
        >
          <FileText className="w-5 h-5" />
          Hợp đồng ({agreements.length})
        </button>
      </div>

      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100">
        {isLoading ? (
          <div className="text-center py-20 text-slate-400 font-bold animate-pulse">Đang tải dữ liệu...</div>
        ) : (
          <>
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
                      const targetUser = roommates.find(r => r.id === report.target_id || r.user_id === report.target_id);
                      const isBanned = bannedUsers.includes(report.target_id);
                      return (
                        <div key={report.id} className="border border-rose-100 bg-rose-50/30 p-5 rounded-2xl flex flex-col md:flex-row gap-5 items-start">
                          <div className="flex-1 space-y-3">
                            <div className="flex items-center gap-2">
                              <span className="bg-rose-100 text-rose-700 px-3 py-1 rounded-full text-xs font-black">REPORT</span>
                              <span className="text-xs text-slate-500">{new Date(report.created_at).toLocaleString('vi-VN')}</span>
                            </div>
                            <p className="text-sm">
                              <span className="font-bold text-slate-700">Người bị report: </span>
                              <span className="text-rose-600 font-black">{targetUser?.name || report.target_id}</span>
                            </p>
                            <p className="text-sm">
                              <span className="font-bold text-slate-700">Lý do: </span>
                              {report.reason}
                            </p>
                            {report.image && (
                              <div className="mt-3">
                                <span className="font-bold text-slate-700 text-sm block mb-2">Ảnh minh chứng:</span>
                                <img src={report.image} alt="Proof" className="w-48 h-auto rounded-lg border border-slate-200" />
                              </div>
                            )}
                          </div>
                          
                          <div className="flex flex-col gap-2 min-w-[140px]">
                            {isBanned ? (
                              <button onClick={() => handleUnbanUser(report.target_id)} className="w-full bg-emerald-100 hover:bg-emerald-200 text-emerald-700 font-bold py-2.5 rounded-xl text-sm transition-colors">Mở khóa User</button>
                            ) : (
                              <button onClick={() => handleBanUser(report.target_id)} className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 rounded-xl text-sm transition-colors">Khóa Tài Khoản</button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB: USERS */}
            {activeTab === "users" && (
              <div className="space-y-6">
                <h3 className="text-lg font-black text-slate-800">Quản lý hồ sơ ứng viên ({roommates.length})</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {roommates.map(rm => {
                    const isBanned = rm.user_id ? bannedUsers.includes(rm.user_id) : bannedUsers.includes(rm.id);
                    return (
                      <div key={rm.id} className="border border-slate-200 p-4 rounded-2xl flex items-center gap-4 relative overflow-hidden">
                        {isBanned && <div className="absolute inset-0 bg-slate-900/10 backdrop-blur-[1px] z-10 flex items-center justify-center pointer-events-none"><span className="bg-rose-600 text-white px-3 py-1 rounded-full text-xs font-black shadow-lg">BANNED</span></div>}
                        <img src={rm.avatar} className="w-12 h-12 rounded-full object-cover" />
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-slate-800 truncate">{rm.name}</p>
                          <p className="text-xs text-slate-500 truncate">{rm.role}</p>
                        </div>
                        <div className="flex gap-1.5 z-20">
                           {!isBanned && (rm.user_id || rm.id) && (
                             <button onClick={() => handleBanUser(rm.user_id || rm.id)} className="p-2 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-xl transition-colors" title="Khóa user">
                               <Ban className="w-4 h-4" />
                             </button>
                           )}
                           <button onClick={() => handleDeleteListing('roommates', rm.id)} className="p-2 bg-slate-50 text-slate-400 hover:bg-slate-200 hover:text-slate-700 rounded-xl transition-colors" title="Xóa hồ sơ này">
                             <Trash2 className="w-4 h-4" />
                           </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB: ROOMS */}
            {activeTab === "rooms" && (
              <div className="space-y-6">
                <h3 className="text-lg font-black text-slate-800">Quản lý tin đăng phòng ({rooms.length})</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {rooms.map(room => (
                      <div key={room.id} className="border border-slate-200 p-4 rounded-2xl flex gap-4">
                        <img src={room.images[0] || room.hostAvatar} className="w-16 h-16 rounded-xl object-cover" />
                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                          <div>
                            <p className="font-bold text-slate-800 text-sm line-clamp-2">{room.title}</p>
                            <p className="text-xs text-slate-500 truncate">{room.district}</p>
                          </div>
                          <div className="flex justify-between items-center mt-2">
                             <span className="text-xs font-bold text-emerald-600">{(room.price/1000000).toFixed(1)} tr/tháng</span>
                             <button onClick={() => handleDeleteListing('rooms', room.id)} className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-lg transition-colors" title="Xóa tin này">
                               <Trash2 className="w-3 h-3" />
                             </button>
                          </div>
                        </div>
                      </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: AGREEMENTS */}
            {activeTab === "agreements" && (
              <div className="space-y-6">
                <h3 className="text-lg font-black text-slate-800">Quản lý Hợp đồng & Thỏa thuận ({agreements.length})</h3>
                {agreements.length === 0 ? (
                  <div className="text-center py-10 bg-slate-50 rounded-2xl">
                    <p className="text-slate-500 font-bold">Chưa có hợp đồng nào.</p>
                  </div>
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
                        <div className="flex gap-2">
                          <button onClick={() => handleDeleteAgreement(ag.id)} className="p-2 text-rose-500 bg-rose-50 hover:bg-rose-100 rounded-xl" title="Hủy / Xóa hợp đồng">
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
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
