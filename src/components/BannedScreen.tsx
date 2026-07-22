import React, { useState, useEffect } from "react";
import { ShieldAlert, LogOut, Upload, Send, CheckCircle2 } from "lucide-react";
import { supabase } from "../lib/supabase";
import { uploadInlineImage } from "../lib/storage";

interface BannedScreenProps {
  currentUser: any;
  onLogout: () => void;
}

export default function BannedScreen({ currentUser, onLogout }: BannedScreenProps) {
  const [appealReason, setAppealReason] = useState("");
  const [appealImage, setAppealImage] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [appealSent, setAppealSent] = useState(false);
  const [isCheckingAppeal, setIsCheckingAppeal] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const checkAppeal = async () => {
      if (!currentUser?.id) return;
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('id')
          .eq('chat_id', 'SYSTEM_APPEALS')
          .eq('sender_id', currentUser.id)
          .limit(1);
        if (!error && data && data.length > 0) {
          setAppealSent(true);
        }
      } catch (err) {
        console.error("Error checking appeal:", err);
      } finally {
        setIsCheckingAppeal(false);
      }
    };
    checkAppeal();
  }, [currentUser?.id]);

  const handleAppeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appealReason.trim()) {
      setErrorMsg("Vui lòng nhập lý do kháng cáo.");
      return;
    }
    
    setIsSubmitting(true);
    setErrorMsg("");

    try {
      let imageUrl = "";
      if (appealImage) {
        // Upload image
        const reader = new FileReader();
        reader.readAsDataURL(appealImage);
        
        const base64Promise = new Promise<string>((resolve) => {
          reader.onloadend = () => {
            resolve(reader.result as string);
          };
        });
        const base64Data = await base64Promise;
        
        const fileName = `appeal_${currentUser?.id || 'guest'}_${Date.now()}.png`;
        imageUrl = await uploadInlineImage("room-images", fileName, base64Data);
      }

      // Format appeal message
      const appealText = `[KHÁNG CÁO]\nLý do: ${appealReason}\nMinh chứng: ${imageUrl || "Không có"}`;

      // Insert into messages
      const { error } = await supabase.from('messages').insert({
        chat_id: 'SYSTEM_APPEALS',
        sender_id: currentUser?.id || "unknown",
        text: appealText,
      });

      if (error) throw error;
      setAppealSent(true);
    } catch (err: any) {
      console.error("Lỗi gửi kháng cáo:", err);
      setErrorMsg(err.message || "Có lỗi xảy ra, vui lòng thử lại sau.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-rose-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-3xl w-full max-w-lg shadow-xl border border-rose-100 flex flex-col relative overflow-hidden">
        {/* Decorative Top Banner */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-rose-400 to-red-600" />
        
        <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShieldAlert className="w-10 h-10 text-rose-600" />
        </div>
        
        <h2 className="text-2xl font-black text-rose-600 mb-3 text-center tracking-tight">
          Tài khoản đã bị khóa
        </h2>
        
        <p className="text-slate-600 text-center mb-8 leading-relaxed font-medium">
          Tài khoản của bạn đã bị khóa do vi phạm tiêu chuẩn cộng đồng của RoomieMatch. 
          Bạn không thể tiếp tục sử dụng dịch vụ lúc này.
        </p>

        {isCheckingAppeal ? (
          <div className="flex justify-center mb-8">
            <div className="w-6 h-6 border-2 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : appealSent ? (
          <div className="bg-emerald-50 rounded-2xl p-6 text-center border border-emerald-100 mb-8">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
            <h3 className="text-emerald-700 font-bold text-lg mb-2">Đã gửi kháng cáo</h3>
            <p className="text-emerald-600 text-sm">
              Quản trị viên sẽ xem xét yêu cầu của bạn và phản hồi sớm nhất. Vui lòng quay lại sau!
            </p>
          </div>
        ) : (
          <form onSubmit={handleAppeal} className="mb-8 space-y-4 bg-slate-50 p-6 rounded-2xl border border-slate-100">
            <div>
              <h3 className="font-bold text-slate-800 mb-1">Gửi yêu cầu xem xét lại</h3>
              <p className="text-xs text-slate-500 mb-4">Nếu bạn cho rằng đây là sự nhầm lẫn, hãy gửi minh chứng cho chúng tôi.</p>
            </div>
            
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Lý do giải trình <span className="text-rose-500">*</span></label>
              <textarea
                value={appealReason}
                onChange={e => setAppealReason(e.target.value)}
                placeholder="Trình bày chi tiết lý do bạn cho rằng tài khoản không vi phạm..."
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-100 outline-none transition-all h-28 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Ảnh minh chứng (tùy chọn)</label>
              <label className={`flex items-center justify-center gap-2 w-full border-2 border-dashed ${appealImage ? 'border-emerald-400 bg-emerald-50 text-emerald-700' : 'border-slate-300 bg-white text-slate-500 hover:bg-slate-50'} rounded-xl p-4 cursor-pointer transition-colors duration-200`}>
                <Upload className="w-5 h-5" />
                <span className="font-semibold text-sm truncate max-w-[200px]">
                  {appealImage ? appealImage.name : "Tải ảnh lên"}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => {
                    if (e.target.files?.[0]) setAppealImage(e.target.files[0]);
                  }}
                />
              </label>
            </div>

            {errorMsg && (
              <p className="text-sm font-bold text-rose-600">{errorMsg}</p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm hover:shadow active:scale-[0.98]"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              {isSubmitting ? "Đang gửi..." : "Gửi Phản Hồi"}
            </button>
          </form>
        )}

        <button
          onClick={onLogout}
          className="flex items-center justify-center gap-2 w-full py-3 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl font-bold transition-colors text-sm"
        >
          <LogOut className="w-4 h-4" /> Đăng xuất
        </button>
      </div>
    </div>
  );
}
