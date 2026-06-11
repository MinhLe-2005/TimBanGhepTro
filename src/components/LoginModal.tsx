import { useState } from "react";
import { X, Mail, CheckCircle2, ArrowRight, Eye, EyeOff, KeyRound, ShieldAlert } from "lucide-react";

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
  const [authStep, setAuthStep] = useState<"form" | "success" | "verify_otp" | "forgot_password" | "reset_password">("form");
  
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [confirmPasswordInput, setConfirmPasswordInput] = useState("");
  const [nameInput, setNameInput] = useState("");
  
  const [otpInput, setOtpInput] = useState("");
  const [newPasswordInput, setNewPasswordInput] = useState("");
  const [otpType, setOtpType] = useState<"signup" | "recovery">("signup");
  
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      const callbackUrl = window.location.origin;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: callbackUrl }
      });
      if (error) throw error;
    } catch (err: any) {
      setErrorMessage("Lỗi kết nối: " + err.message);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!emailInput.trim() || !passwordInput.trim()) {
      return setErrorMessage("Vui lòng nhập đầy đủ Email và Mật khẩu.");
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailInput.trim())) {
      return setErrorMessage("Định dạng email không hợp lệ (ví dụ đúng: ten@gmail.com).");
    }

    setIsLoading(true);

    try {
      if (activeTab === "register") {
        if (!nameInput.trim()) { setIsLoading(false); return setErrorMessage("Vui lòng nhập Họ và Tên của bạn."); }
        if (passwordInput !== confirmPasswordInput) { setIsLoading(false); return setErrorMessage("Mật khẩu xác nhận không khớp."); }
        if (passwordInput.length < 6) { setIsLoading(false); return setErrorMessage("Mật khẩu phải có ít nhất 6 ký tự."); }

        const { data, error } = await supabase.auth.signUp({
          email: emailInput,
          password: passwordInput,
          options: { data: { full_name: nameInput } }
        });
        
        if (error) throw error;
        
        if (data.user && !data.session) {
          setOtpType("signup");
          setAuthStep("verify_otp");
        } else if (data.session) {
          setAuthStep("success");
        }
      } else {
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

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    if (otpInput.length < 8) return setErrorMessage("Vui lòng nhập đủ mã OTP gồm 8 chữ số.");
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email: emailInput,
        token: otpInput,
        type: otpType,
      });
      if (error) throw error;
      if (otpType === "signup") {
        setAuthStep("success");
      } else if (otpType === "recovery") {
        setAuthStep("reset_password");
      }
    } catch (err: any) {
      setErrorMessage(err.message.includes("Token has expired or is invalid") ? "Mã OTP không hợp lệ hoặc đã hết hạn." : err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    if (!emailInput.trim()) return setErrorMessage("Vui lòng nhập Email đã đăng ký.");
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(emailInput);
      if (error) throw error;
      setOtpType("recovery");
      setAuthStep("verify_otp");
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    if (newPasswordInput.length < 6) return setErrorMessage("Mật khẩu phải có ít nhất 6 ký tự.");
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPasswordInput });
      if (error) throw error;
      setAuthStep("success");
    } catch (err: any) {
      setErrorMessage(err.message);
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
                  {activeTab === "login" && (
                    <div className="flex justify-end mt-1.5">
                      <button
                        type="button"
                        onClick={() => { setAuthStep("forgot_password"); setErrorMessage(""); }}
                        className="text-[11px] font-bold text-[#006590] hover:underline cursor-pointer"
                      >
                        Quên mật khẩu?
                      </button>
                    </div>
                  )}

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

              <div>
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  className="w-full flex items-center justify-center gap-2 bg-white border-2 border-slate-100 text-slate-700 hover:border-slate-200 hover:bg-slate-50 py-3.5 rounded-xl text-sm font-bold shadow-[0_2px_10px_rgba(0,0,0,0.02)] active:scale-95 transition-all cursor-pointer"
                >
                  <GoogleIcon />
                  Đăng nhập bằng Google
                </button>
              </div>
            </div>
          </div>
        )}

        {authStep === "forgot_password" && (
          <div className="p-8 text-center flex flex-col items-center justify-center min-h-[350px]">
            <div className="w-16 h-16 rounded-full bg-slate-50 text-slate-600 flex items-center justify-center mb-6">
              <KeyRound className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-black text-slate-800 tracking-tight mb-2">Quên Mật Khẩu</h3>
            <p className="text-sm text-slate-500 font-medium mb-6 leading-relaxed">
              Nhập email bạn đã đăng ký để nhận mã OTP khôi phục mật khẩu.
            </p>
            
            {errorMessage && (
              <div className="w-full bg-red-50 text-red-600 p-3 rounded-xl text-xs font-bold text-center mb-4">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleForgotPassword} className="w-full space-y-4">
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="Nhập địa chỉ email..."
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3.5 text-sm outline-none focus:bg-white focus:border-[#006590] focus:ring-4 focus:ring-[#006590]/10 transition-all text-slate-800 font-bold placeholder:text-slate-400"
              />
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#006590] hover:bg-[#005176] disabled:opacity-70 text-white py-3.5 rounded-xl text-sm font-extrabold shadow-md duration-200 cursor-pointer"
              >
                {isLoading ? "Đang gửi..." : "Gửi mã OTP"}
              </button>
            </form>
            
            <button onClick={() => setAuthStep("form")} className="mt-6 text-[13px] font-bold text-slate-400 hover:text-slate-600 cursor-pointer">
              ← Quay lại Đăng nhập
            </button>
          </div>
        )}

        {authStep === "verify_otp" && (
          <div className="p-8 text-center flex flex-col items-center justify-center min-h-[350px]">
            <div className="w-16 h-16 rounded-full bg-blue-50 text-[#006590] flex items-center justify-center mb-6">
              <ShieldAlert className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-black text-slate-800 tracking-tight mb-2">Nhập Mã Xác Thực</h3>
            <p className="text-sm text-slate-500 font-medium mb-6 leading-relaxed">
              Mã OTP 6 chữ số đã được gửi tới email <br/><strong>{emailInput}</strong>
            </p>

            {errorMessage && (
              <div className="w-full bg-red-50 text-red-600 p-3 rounded-xl text-xs font-bold text-center mb-4">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleVerifyOtp} className="w-full space-y-4">
              <input
                type="text"
                maxLength={8}
                value={otpInput}
                onChange={(e) => setOtpInput(e.target.value.replace(/[^0-9]/g, ""))}
                placeholder="Nhập mã 8 số"
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-4 text-center text-2xl tracking-[0.4em] outline-none focus:bg-white focus:border-[#006590] focus:ring-4 focus:ring-[#006590]/10 transition-all text-slate-800 font-black placeholder:text-slate-300"
              />
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#006590] hover:bg-[#005176] disabled:opacity-70 text-white py-3.5 rounded-xl text-sm font-extrabold shadow-md duration-200 cursor-pointer"
              >
                {isLoading ? "Đang kiểm tra..." : "Xác nhận mã OTP"}
              </button>
            </form>

            <button onClick={() => setAuthStep(otpType === "signup" ? "form" : "forgot_password")} className="mt-6 text-[13px] font-bold text-slate-400 hover:text-slate-600 cursor-pointer">
              ← Trở về bước trước
            </button>
          </div>
        )}

        {authStep === "reset_password" && (
          <div className="p-8 text-center flex flex-col items-center justify-center min-h-[350px]">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-6">
              <KeyRound className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-black text-slate-800 tracking-tight mb-2">Tạo Mật Khẩu Mới</h3>
            <p className="text-sm text-slate-500 font-medium mb-6 leading-relaxed">
              Mã xác thực hợp lệ. Vui lòng tạo mật khẩu mới cho tài khoản của bạn.
            </p>

            {errorMessage && (
              <div className="w-full bg-red-50 text-red-600 p-3 rounded-xl text-xs font-bold text-center mb-4">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleResetPassword} className="w-full space-y-4">
              <div className="relative text-left">
                <input
                  type={showPassword ? "text" : "password"}
                  value={newPasswordInput}
                  onChange={(e) => setNewPasswordInput(e.target.value)}
                  placeholder="Mật khẩu mới (ít nhất 6 ký tự)"
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 pr-12 text-sm outline-none focus:bg-white focus:border-[#006590] focus:ring-4 focus:ring-[#006590]/10 transition-all text-slate-800 font-bold tracking-widest placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer p-1"
                >
                  {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                </button>
              </div>
              
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#006590] hover:bg-[#005176] disabled:opacity-70 text-white py-3.5 rounded-xl text-sm font-extrabold shadow-md duration-200 cursor-pointer"
              >
                {isLoading ? "Đang lưu..." : "Lưu mật khẩu & Đăng nhập"}
              </button>
            </form>
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
