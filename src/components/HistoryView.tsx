import { useState, useEffect } from "react";
import { FileText, Check, Clock, X, BadgeCheck, AlertCircle, Eye } from "lucide-react";
import { supabase } from "../lib/supabase";
import { Roommate } from "../types";

export default function HistoryView({ currentUserProfile, currentUser, roommates, onRequireAuth, onRequireProfile }: { currentUserProfile: any, currentUser?: any, roommates: Roommate[], onRequireAuth?: () => void, onRequireProfile?: () => void }) {
  const [agreements, setAgreements] = useState<any[]>([]);
  const [selectedAgreement, setSelectedAgreement] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    if (!currentUserProfile || !currentUser) return;
    
    const fetchAgreements = async () => {
      // CRITICAL FIX: Fetch from messages table using auth UUID
      const myAuthId = currentUser.id;
      
      const { data } = await supabase
        .from('messages')
        .select('*')
        .like('chat_id', `%${myAuthId}%`)
        .like('text', '%[AGREEMENT_%')
        .order('timestamp', { ascending: false });
      
      console.log('[HistoryView] Fetched agreements:', { count: data?.length, myAuthId });
      
      if (data) {
        // Group by agreement ID, keep only SIGNED ones for history
        const aggrMap = new Map<string, any>();
        
        data.forEach(msg => {
          let payload: any = null;
          try {
            if (msg.text.startsWith('[AGREEMENT_DRAFT]')) payload = JSON.parse(msg.text.replace('[AGREEMENT_DRAFT]', '').trim());
            if (msg.text.startsWith('[AGREEMENT_SIGNED]')) payload = JSON.parse(msg.text.replace('[AGREEMENT_SIGNED]', '').trim());
            if (msg.text.startsWith('[AGREEMENT_CANCELLED]')) payload = JSON.parse(msg.text.replace('[AGREEMENT_CANCELLED]', '').trim());
          } catch(e) {}
          
          if (payload) {
            const partner_id = msg.chat_id.replace(myAuthId, '').replace('_', '');
            
            // Show both signed AND pending agreements in history
            if (payload.status === 'signed' || payload.status === 'pending') {
              if (!aggrMap.has(payload.id)) {
                aggrMap.set(payload.id, {
                  id: payload.id,
                  creator_id: msg.sender_id,
                  partner_id: msg.sender_id === myAuthId ? partner_id : myAuthId,
                  status: payload.status,
                  rules: payload.rules,
                  created_at: payload.timestamp || msg.timestamp || msg.created_at
                });
              }
            }
          }
        });
        
        setAgreements(Array.from(aggrMap.values()));
      }
    };
    
    fetchAgreements();

    // Realtime updates
    const sub = supabase.channel('history_channel')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `text=ilike.%[AGREEMENT_SIGNED]%` }, fetchAgreements)
      .subscribe();
    return () => { supabase.removeChannel(sub); };
  }, [currentUserProfile, currentUser]);

  if (!currentUser) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 min-h-[60vh]">
        <div className="bg-white p-10 rounded-[32px] border border-slate-100 max-w-md text-center shadow-sm">
          <AlertCircle className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-400 font-bold mb-6">Vui lòng đăng nhập để xem lịch sử hợp đồng.</p>
          <button 
            onClick={() => onRequireAuth && onRequireAuth()} 
            className="w-full py-3 bg-[#006590] hover:bg-[#005176] text-white font-bold rounded-xl transition-all duration-200"
          >
            Đăng nhập ngay
          </button>
        </div>
      </div>
    );
  }

  if (!currentUserProfile) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 min-h-[60vh]">
        <div className="bg-white p-10 rounded-[32px] border border-slate-100 max-w-md text-center shadow-sm">
          <BadgeCheck className="h-10 w-10 text-sky-500 mx-auto mb-3" />
          <p className="text-slate-600 font-bold mb-6">Bạn cần thiết lập hồ sơ cá nhân để xem lịch sử hợp đồng.</p>
          <button 
            onClick={() => onRequireProfile && onRequireProfile()} 
            className="w-full py-3 bg-[#006590] hover:bg-[#005176] text-white font-bold rounded-xl transition-all duration-200"
          >
            Tạo hồ sơ ngay
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in pb-16 pt-6">
      <div className="bg-white rounded-[24px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] p-6 sm:p-8">
        <div className="flex items-center gap-3 pb-6 border-b border-slate-100">
          <div className="w-12 h-12 bg-[#006590]/10 text-[#006590] rounded-xl flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800">Quản Lý Hợp Đồng</h1>
            <p className="text-sm text-slate-500">Lịch sử các bản thỏa thuận sống chung của bạn</p>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {agreements.length === 0 ? (
            <div className="text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-bold">Chưa có hợp đồng nào</p>
              <p className="text-xs text-slate-400 mt-1">Hãy bắt đầu tạo thỏa thuận với các bạn cùng phòng.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {agreements.map((a, i) => {
                const partner = a.creator_id === currentUserProfile.id ? roommates.find(r => r.id === a.partner_id) : roommates.find(r => r.id === a.creator_id);
                const isPending = a.status === 'pending';
                const isSigned = a.status === 'signed';
                const isCreator = a.creator_id === currentUserProfile.id;

                return (
                  <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-2xl border border-slate-100 bg-white hover:border-sky-200 hover:shadow-md transition-all gap-4">
                    <div className="flex items-center gap-4">
                      <img src={partner?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb"} alt="" className="w-12 h-12 rounded-full object-cover border border-slate-200" />
                      <div>
                        <h4 className="text-base font-bold text-slate-800">{partner?.name || "Người lạ"}</h4>
                        <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                          Ngày tạo: {new Date(a.created_at).toLocaleDateString('vi-VN')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {isSigned ? (
                        <span className="px-3.5 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5" /> Đã Ký Hiệu Lực
                        </span>
                      ) : isPending ? (
                        <span className="px-3.5 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 animate-pulse" /> {isCreator ? "Đang chờ đối tác ký" : "Cần bạn ký"}
                        </span>
                      ) : (
                        <span className="px-3.5 py-1.5 bg-slate-50 text-slate-600 border border-slate-200 rounded-full text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                          <X className="w-3.5 h-3.5" /> Đã Hủy
                        </span>
                      )}
                      <button
                        onClick={() => {
                          setSelectedAgreement({...a, partner});
                          setShowDetailModal(true);
                        }}
                        className="px-4 py-2 bg-[#006590] hover:bg-[#005176] text-white text-[11px] font-bold rounded-lg transition-colors"
                      >
                        Xem Chi Tiết
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedAgreement && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-[28px] shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8 space-y-6 animate-scale-in border border-slate-100">
            {/* Header */}
            <div className="flex items-center justify-between pb-6 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-[#006590]/10 text-[#006590] rounded-xl flex items-center justify-center">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-800">Chi Tiết Hợp Đồng</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Bản cam kết sống chung</p>
                </div>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="w-10 h-10 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center justify-center transition-colors"
              >
                <X className="h-5 w-5 text-slate-600" />
              </button>
            </div>

            {/* Partner Info */}
            <div className="bg-slate-50 rounded-2xl p-6 flex items-center gap-4">
              <img src={selectedAgreement.partner?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb"} alt="" className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md" />
              <div>
                <h3 className="text-lg font-bold text-slate-800">{selectedAgreement.partner?.name || "Người lạ"}</h3>
                <p className="text-sm text-slate-600 mt-1">Ngày tạo: {new Date(selectedAgreement.created_at).toLocaleDateString('vi-VN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</p>
              </div>
            </div>

            {/* Status */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-3">
              <p className="text-sm font-bold text-slate-700">Trạng thái:</p>
              {selectedAgreement.status === 'signed' ? (
                <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 px-4 py-3 rounded-xl border border-emerald-200">
                  <Check className="w-5 h-5" />
                  <span className="font-bold">Đã Ký Hiệu Lực</span>
                </div>
              ) : selectedAgreement.status === 'pending' ? (
                <div className="flex items-center gap-2 text-amber-700 bg-amber-50 px-4 py-3 rounded-xl border border-amber-200">
                  <Clock className="w-5 h-5 animate-pulse" />
                  <span className="font-bold">Chờ Ký Kết</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-slate-600 bg-slate-50 px-4 py-3 rounded-xl border border-slate-200">
                  <X className="w-5 h-5" />
                  <span className="font-bold">Đã Hủy</span>
                </div>
              )}
            </div>

            {/* Rules */}
            {selectedAgreement.rules && (
              <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
                <h3 className="text-lg font-bold text-slate-800">Các Điều Khoản</h3>
                
                {selectedAgreement.rules.quiet && (
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-slate-700">🕐 Giờ giấc yên tĩnh:</p>
                    <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">{selectedAgreement.rules.quiet}</p>
                  </div>
                )}
                
                {selectedAgreement.rules.cleaning && (
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-slate-700">🧹 Dọn dẹp:</p>
                    <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">{selectedAgreement.rules.cleaning}</p>
                  </div>
                )}
                
                {selectedAgreement.rules.visitors && (
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-slate-700">👥 Khách thăm:</p>
                    <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">{selectedAgreement.rules.visitors}</p>
                  </div>
                )}
                
                {selectedAgreement.rules.bills && (
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-slate-700">💰 Chia tiền:</p>
                    <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">{selectedAgreement.rules.bills}</p>
                  </div>
                )}
                
                {selectedAgreement.rules.pets && (
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-slate-700">🐾 Thú cưng:</p>
                    <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">{selectedAgreement.rules.pets}</p>
                  </div>
                )}
                
                {selectedAgreement.rules.otherNotes && (
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-slate-700">📝 Ghi chú khác:</p>
                    <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">{selectedAgreement.rules.otherNotes}</p>
                  </div>
                )}
              </div>
            )}

            {/* Close Button */}
            <button
              onClick={() => setShowDetailModal(false)}
              className="w-full py-3 bg-[#006590] hover:bg-[#005176] text-white font-bold rounded-xl transition-colors"
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
