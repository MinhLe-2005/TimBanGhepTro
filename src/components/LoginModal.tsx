import { useState } from "react";
import { X, Sparkles, Mail, Facebook, CheckCircle2, ArrowRight, Eye, EyeOff } from "lucide-react";

const GoogleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.7 17.74 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
  </svg>
);
import { supabase } from "../lib/supabase";

interface LoginModalProps {
  onClose: () => void;
  onLoginSuccess: (user: any) => void;
}

export default function LoginModal({ onClose, onLoginSuccess }: LoginModalProps) {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [authStep, setAuthStep] = useState<"form" | "success" | "check_email" | "mock_oauth">("form");
  const [mockProvider, setMockProvider] = useState<"google" | "facebook" | null>(null);
  
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [confirmPasswordInput, setConfirmPasswordInput] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleProviderSelect = async (provider: "google" | "facebook") => {
    // Ứng dụng Facebook/Google đang trong chế độ Development nên OAuth thật sẽ bị chặn với người dùng thường.
    // Chuyển hướng người dùng sang giao diện Mock OAuth để họ có thể test ứng dụng dễ dàng.
    setMockProvider(provider);
    setAuthStep("mock_oauth");
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!emailInput.trim() || !passwordInput.trim()) {
      setErrorMessage("Vui lòng nhập đầy đủ Email và Mật khẩu.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailInput.trim())) {
      setErrorMessage("Định dạng email không hợp lệ (ví dụ đúng: ten@gmail.com).");
      return;
    }

    setIsLoading(true);

    try {
      if (activeTab === "register") {
        if (!nameInput.trim()) {
          setErrorMessage("Vui lòng nhập Họ và Tên của bạn.");
          setIsLoading(false);
          return;
        }
        if (passwordInput !== confirmPasswordInput) {
          setErrorMessage("Mật khẩu xác nhận không khớp.");
          setIsLoading(false);
          return;
        }
        if (passwordInput.length < 6) {
          setErrorMessage("Mật khẩu phải có ít nhất 6 ký tự.");
          setIsLoading(false);
          return;
        }

        const { data, error } = await supabase.auth.signUp({
          email: emailInput,
          password: passwordInput,
          options: {
            data: {
              full_name: nameInput,
            }
          }
        });
        
        if (error) throw error;
        
        // Supabase trả về user nhưng không có session nếu yêu cầu xác nhận email
        if (data.user && !data.session) {
          setAuthStep("check_email");
        } else if (data.session) {
          setAuthStep("success");
        }
      } else {
        // Xử lý đăng nhập
        const { data, error } = await supabase.auth.signInWithPassword({
          email: emailInput,
          password: passwordInput,
        });
        
        if (error) throw error;
        if (data.session) {
          setAuthStep("success");
        }
      }
    } catch (err: any) {
      if (err.message.includes("Invalid login credentials")) {
         setErrorMessage("Email hoặc mật khẩu không chính xác.");
      } else if (err.message.includes("User already registered")) {
         setErrorMessage("Email này đã được đăng ký. Vui lòng đăng nhập.");
      } else {
         setErrorMessage(err.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        onLoginSuccess({
          id: session.user.id,
          email: session.user.email,
          name: session.user.user_metadata?.full_name || "Thành viên Roomie",
          avatar: session.user.user_metadata?.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=150&auto=format&fit=crop",
        });
      }
    } catch (e) {
      console.log("Session retrieval error");
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-[28px] shadow-2xl border border-slate-100 max-w-md w-full overflow-hidden flex flex-col relative animate-scale-up">
        
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:bg-slate-50 hover:text-slate-600 duration-200 z-10 cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        {authStep === "form" && (
          <div className="flex flex-col h-full">
            <div className="flex border-b-2 border-slate-100">
              <button
                onClick={() => { setActiveTab("login"); setErrorMessage(""); }}
                className={`flex-1 py-5 text-[15px] font-black transition-colors relative ${activeTab === "login" ? "text-[#006590]" : "text-slate-500 hover:text-slate-700"}`}
              >
                Đăng Nhập
                {activeTab === "login" && <div className="absolute bottom-[-2px] left-0 right-0 h-1 bg-[#006590] rounded-t-full"></div>}
              </button>
              <button
                onClick={() => { setActiveTab("register"); setErrorMessage(""); }}
                className={`flex-1 py-5 text-[15px] font-black transition-colors relative ${activeTab === "register" ? "text-[#006590]" : "text-slate-500 hover:text-slate-700"}`}
              >
                Đăng Ký
                {activeTab === "register" && <div className="absolute bottom-[-2px] left-0 right-0 h-1 bg-[#006590] rounded-t-full"></div>}
              </button>
            </div>

            <div className="p-8">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                  {activeTab === "login" ? "Chào mừng trở lại!" : "Tạo tài khoản Roomie"}
                </h3>
                <p className="text-[13px] font-semibold text-slate-600 mt-2">
                  {activeTab === "login" ? "Đăng nhập để kết nối với những người bạn cùng phòng tuyệt vời." : "Chỉ mất 1 phút để tạo hồ sơ tìm người ở ghép của riêng bạn."}
                </p>
              </div>

              {errorMessage && (
                <div className="bg-red-50 text-red-600 p-3 rounded-xl text-xs font-bold text-center mb-4">
                  {errorMessage}
                </div>
              )}

              <form onSubmit={handleEmailAuth} className="space-y-4">
                {activeTab === "register" && (
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-2">Họ và Tên</label>
                    <input
                      type="text"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      placeholder="Nhập họ và tên thật của bạn"
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-sm outline-none focus:bg-white focus:border-[#006590] focus:ring-4 focus:ring-[#006590]/10 transition-all text-slate-800 font-bold placeholder:text-slate-400/80"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-2">Địa chỉ Email</label>
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="ví dụ: hello@roomiematch.vn"
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-sm outline-none focus:bg-white focus:border-[#006590] focus:ring-4 focus:ring-[#006590]/10 transition-all text-slate-800 font-bold placeholder:text-slate-400/80"
                  />
                </div>
                
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-2">Mật khẩu</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 pr-12 text-sm outline-none focus:bg-white focus:border-[#006590] focus:ring-4 focus:ring-[#006590]/10 transition-all text-slate-800 font-bold tracking-widest placeholder:text-slate-400/80"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer p-1"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                    </button>
                  </div>
                </div>

                {activeTab === "register" && (
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-2">Xác nhận mật khẩu</label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPasswordInput}
                        onChange={(e) => setConfirmPasswordInput(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 pr-12 text-sm outline-none focus:bg-white focus:border-[#006590] focus:ring-4 focus:ring-[#006590]/10 transition-all text-slate-800 font-bold tracking-widest placeholder:text-slate-400/80"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer p-1"
                        tabIndex={-1}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                      </button>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-2 bg-[#006590] hover:bg-[#005176] disabled:opacity-70 text-white py-3.5 rounded-xl text-sm font-extrabold shadow-md shadow-sky-900/10 duration-200 cursor-pointer flex items-center justify-center gap-2 active:scale-[0.98]"
                >
                  {isLoading ? "Đang xử lý..." : (activeTab === "login" ? "Đăng Nhập" : "Đăng Ký Tài Khoản")}
                  {!isLoading && <ArrowRight className="h-4 w-4" />}
                </button>
              </form>

              <div className="flex items-center gap-4 my-7 text-[10px] font-extrabold text-slate-400 uppercase">
                <hr className="flex-grow border-slate-200" />
                <span className="tracking-widest">Hoặc tiếp tục bằng</span>
                <hr className="flex-grow border-slate-200" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleProviderSelect("google")}
                  className="flex items-center justify-center gap-2 bg-white border-2 border-slate-100 text-slate-700 hover:border-slate-200 hover:bg-slate-50 py-3 rounded-xl text-sm font-bold shadow-[0_2px_10px_rgba(0,0,0,0.02)] active:scale-95 transition-all cursor-pointer"
                >
                  <GoogleIcon />
                  Google
                </button>
                <button
                  type="button"
                  onClick={() => handleProviderSelect("facebook")}
                  className="flex items-center justify-center gap-2 bg-[#1877F2] text-white hover:bg-[#166FE5] border-2 border-[#1877F2] hover:border-[#166FE5] py-3 rounded-xl text-sm font-bold shadow-[0_2px_10px_rgba(24,119,242,0.2)] active:scale-95 transition-all cursor-pointer"
                >
                  <Facebook className="h-5 w-5 fill-white" />
                  Facebook
                </button>
              </div>
            </div>
          </div>
        )}

        {authStep === "check_email" && (
          <div className="p-8 text-center flex flex-col items-center justify-center min-h-[350px]">
            <div className="w-16 h-16 rounded-full bg-blue-50 text-[#006590] flex items-center justify-center mb-6">
              <Mail className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-black text-slate-800 tracking-tight mb-3">Kiểm tra Email của bạn</h3>
            <p className="text-sm text-slate-500 font-medium leading-relaxed mb-6">
              Chúng tôi vừa gửi một liên kết xác nhận đến <strong>{emailInput}</strong>. <br/><br/>
              Vui lòng kiểm tra hộp thư đến (hoặc thư mục Spam) và nhấp vào liên kết để kích hoạt tài khoản của bạn.
            </p>
            <button
              onClick={onClose}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-3.5 rounded-xl text-sm font-bold duration-200 cursor-pointer"
            >
              Đóng cửa sổ này
            </button>
          </div>
        )}

        {authStep === "mock_oauth" && (
          <div className="p-8 flex flex-col h-full min-h-[400px] animate-fade-in relative">
             {isLoading && (
               <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 flex items-center justify-center rounded-[28px]">
                  <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
               </div>
             )}
             <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-white border-2 border-slate-100 shadow-sm mb-4">
                  {mockProvider === "google" ? <GoogleIcon /> : <Facebook className="w-7 h-7 text-[#1877F2] fill-[#1877F2]" />}
                </div>
                <h3 className="text-xl font-black text-slate-800 tracking-tight">Đăng nhập bằng {mockProvider === "google" ? "Google" : "Facebook"}</h3>
                <p className="text-sm text-slate-500 mt-2 font-medium">Vì ứng dụng đang trong giai đoạn phát triển, tính năng đăng nhập thật tạm khóa. Chọn tài khoản mẫu để tiếp tục trải nghiệm ngay.</p>
             </div>
             
             <div className="space-y-3 mt-2">
               {[
                 { email: "minhle.work@gmail.com", name: "Lê Quang Minh", avatar: "https://i.pravatar.cc/150?u=minh" },
                 { email: "hoangnam.dev99@gmail.com", name: "Hoàng Nam", avatar: "https://i.pravatar.cc/150?u=nam" }
               ].map((acc, idx) => (
                 <button 
                   key={idx}
                   onClick={() => {
                     setIsLoading(true);
                     setTimeout(() => {
                        onLoginSuccess({
                          id: "mock-" + idx,
                          email: acc.email,
                          name: acc.name,
                          avatar: acc.avatar
                        });
                        setAuthStep("success");
                        setIsLoading(false);
                     }, 1000);
                   }}
                   className="w-full flex items-center gap-4 p-4 border-2 border-slate-100 rounded-2xl hover:bg-slate-50 hover:border-blue-200 transition-all text-left group cursor-pointer"
                 >
                   <img src={acc.avatar} alt={acc.name} className="w-10 h-10 rounded-full bg-slate-200 border border-slate-200" />
                   <div>
                     <p className="font-bold text-slate-800 text-[14px] group-hover:text-blue-700 transition-colors">{acc.name}</p>
                     <p className="text-slate-500 text-[12px]">{acc.email}</p>
                   </div>
                 </button>
               ))}
             </div>
             
             <button 
               onClick={() => setAuthStep("form")}
               className="mt-auto pt-6 text-[13px] text-slate-500 font-bold hover:text-slate-800 cursor-pointer"
             >
               ← Quay lại phương thức khác
             </button>
          </div>
        )}

        {authStep === "success" && (
          <div className="p-8 text-center flex flex-col items-center justify-center min-h-[350px]">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-6 animate-bounce">
              <CheckCircle2 className="h-10 w-10" />
            </div>

            <h3 className="text-2xl font-black text-slate-800 tracking-tight mb-2">Thành Công!</h3>
            
            <p className="text-sm text-slate-500 font-medium mb-8 leading-relaxed">
              Tuyệt vời! Bạn đã đăng nhập thành công vào hệ thống.
            </p>

            <button
              onClick={handleCompleteAuth}
              className="w-full bg-[#006590] hover:bg-[#005176] text-white py-4 rounded-xl text-sm font-black shadow-lg shadow-sky-900/20 duration-200 cursor-pointer active:scale-[0.98]"
            >
              Bắt đầu Khám Phá Ngay
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
