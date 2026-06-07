import { useState, useEffect } from "react";
import { X, Sparkles, Mail, Lock, LogIn, Chrome, Facebook, CheckCircle2, Loader2, ArrowRight } from "lucide-react";

interface LoginModalProps {
  onClose: () => void;
  onLoginSuccess: (user: {
    name: string;
    email: string;
    avatar: string;
    provider: "google" | "facebook" | "email";
  }) => void;
}

export default function LoginModal({ onClose, onLoginSuccess }: LoginModalProps) {
  const [authStep, setAuthStep] = useState<"choose" | "simulating" | "success">("choose");
  const [provider, setProvider] = useState<"google" | "facebook" | "email">("google");
  
  // Custom inputs for mock profiles
  const [nameInput, setNameInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  
  // Pre-configured rich mock profiles for quick demonstration
  const mockAvatars = {
    google: [
      { name: "Minh Anh Nguyễn", email: "minhanh.nguyen@gmail.com", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=150&auto=format&fit=crop" },
      { name: "Hoàng Lâm Trần", email: "lam.hoangtran@gmail.com", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150&auto=format&fit=crop" },
      { name: "Thảo Vy Phạm", email: "thaovy.pham99@gmail.com", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150&auto=format&fit=crop" }
    ],
    facebook: [
      { name: "Quốc Bảo Đặng", email: "bao.dangquoc.fb@gmail.com", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=150&auto=format&fit=crop" },
      { name: "Khánh Linh Vũ", email: "linhvu.khanh.active@gmail.com", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop" },
      { name: "Đức Huy Lê", email: "huy.leduc.vietnam@gmail.com", avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=150&auto=format&fit=crop" }
    ]
  };

  const [selectedMockIndex, setSelectedMockIndex] = useState(0);

  // Initialize selected values on provider switch
  useEffect(() => {
    if (provider !== "email") {
      const list = mockAvatars[provider];
      const selected = list[selectedMockIndex];
      setNameInput(selected.name);
      setEmailInput(selected.email);
    } else {
      setNameInput("Bạn Đăng Nhập Email");
      setEmailInput("");
    }
  }, [provider, selectedMockIndex]);

  const handleProviderSelect = (selectedProvider: "google" | "facebook") => {
    setProvider(selectedProvider);
    setSelectedMockIndex(0);
    setAuthStep("simulating");
  };

  const startEmailLogin = () => {
    setProvider("email");
    setAuthStep("simulating");
  };

  const handleExecuteLogin = () => {
    if (provider === "email") {
      if (!emailInput.trim()) {
        setErrorMessage("Vui lòng nhập Email của bạn");
        return;
      }
      if (!passwordInput.trim()) {
        setErrorMessage("Vui lòng nhập mật khẩu");
        return;
      }
    }
    
    setAuthStep("success");
  };

  const handleCompleteAuth = () => {
    // Generate avatar seed or select pre-configured
    let finalAvatar = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop";
    
    if (provider !== "email") {
      finalAvatar = mockAvatars[provider][selectedMockIndex].avatar;
    } else {
      // Just a dynamic colored placeholder avatar or standard
      finalAvatar = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=150&auto=format&fit=crop";
    }

    onLoginSuccess({
      name: nameInput || "Người dùng Roomie",
      email: emailInput || "user@roomiematch.vn",
      avatar: finalAvatar,
      provider: provider,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-[28px] shadow-2xl border border-slate-100 max-w-md w-full overflow-hidden flex flex-col relative animate-scale-up">
        
        {/* Close Button Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:bg-slate-50 hover:text-slate-600 duration-200 z-10 cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Auth Choosing screen */}
        {authStep === "choose" && (
          <div className="p-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-1.5 bg-[#dff6ff] p-2 rounded-2xl mb-4">
                <Sparkles className="h-6 w-6 text-[#006590] fill-sky-200" />
              </div>
              <h3 className="text-2xl font-extrabold text-slate-800 tracking-tight">Đăng Nhập RoomieMatch</h3>
              <p className="text-xs font-semibold text-slate-400 mt-1.5 leading-relaxed">
                Đăng nhập nhanh để tìm bạn ở ghép hoàn hảo, viết đánh giá roommate và thiết lập bản thỏa thuận chung.
              </p>
            </div>

            <div className="space-y-3.5">
              {/* Google Login Button */}
              <button
                onClick={() => handleProviderSelect("google")}
                className="w-full flex items-center justify-center gap-3 bg-white border border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50 px-5 py-4 rounded-2xl text-[14px] font-extrabold shadow-sm active:scale-[0.98] duration-200 cursor-pointer"
              >
                <Chrome className="h-5 w-5 text-red-500 shrink-0" />
                Tiếp tục bằng tài khoản Google
              </button>

              {/* Facebook Login Button */}
              <button
                onClick={() => handleProviderSelect("facebook")}
                className="w-full flex items-center justify-center gap-3 bg-[#1877F2] hover:bg-[#166FE5] text-white px-5 py-4 rounded-2xl text-[14px] font-extrabold shadow-sm active:scale-[0.98] duration-200 cursor-pointer"
              >
                <Facebook className="h-5 w-5 shrink-0" />
                Tiếp tục bằng tài khoản Facebook
              </button>
            </div>

            {/* Separator Section */}
            <div className="flex items-center gap-3 my-7 text-xs font-bold text-slate-300 uppercase">
              <hr className="flex-grow border-slate-100" />
              <span>Hoặc email</span>
              <hr className="flex-grow border-slate-100" />
            </div>

            {/* Email login launch */}
            <button
              onClick={startEmailLogin}
              className="w-full flex items-center justify-center gap-2 bg-slate-50 border border-slate-150 text-slate-600 hover:bg-slate-100 hover:text-slate-700 px-5 py-3.5 rounded-2xl text-[13px] font-semibold active:scale-[0.98] duration-200 cursor-pointer"
            >
              <Mail className="h-4 w-4" />
              Sử dụng địa chỉ Email / Mật khẩu
            </button>

            {/* Shield Footer Note */}
            <div className="mt-8 text-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <p className="text-[11px] font-medium text-slate-400 leading-normal">
                🔒 RoomieMatch cam kết bảo mật 100% dữ liệu. Chúng tôi tuyệt đối không tự ý đăng thông tin lên trang cá nhân của bạn.
              </p>
            </div>
          </div>
        )}

        {/* Simulated OAuth screen */}
        {authStep === "simulating" && (
          <div className="p-8">
            <div className="border border-slate-100 rounded-3xl p-5 mb-6 bg-slate-50/50">
              {/* Fake OAuth Window Header */}
              <div className="flex items-center gap-2 mb-5 pb-3 border-b border-slate-200/60">
                {provider === "google" && (
                  <>
                    <Chrome className="h-5 w-5 text-red-500 fill-red-105" />
                    <span className="text-xs font-extrabold text-slate-600">Đăng nhập qua Google Accounts</span>
                  </>
                )}
                {provider === "facebook" && (
                  <>
                    <Facebook className="h-5 w-5 text-[#1877F2]" />
                    <span className="text-xs font-extrabold text-slate-600">Xác thực ứng dụng Facebook</span>
                  </>
                )}
                {provider === "email" && (
                  <>
                    <Mail className="h-5 w-5 text-[#006590]" />
                    <span className="text-xs font-extrabold text-slate-600">Đăng nhập tài khoản cá nhân</span>
                  </>
                )}
              </div>

              {provider !== "email" ? (
                /* Google & Facebook Profile Selector */
                <div className="space-y-4">
                  <p className="text-xs font-semibold text-slate-500">
                    Chọn nhanh một tài khoản Google/Facebook mô phỏng bên dưới để trải nghiệm ngay hệ thống RoomieMatch:
                  </p>

                  <div className="space-y-2.5">
                    {mockAvatars[provider].map((mock, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedMockIndex(idx)}
                        className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all duration-200 cursor-pointer ${
                          selectedMockIndex === idx
                            ? "bg-white border-[#006590] shadow-sm ring-1 ring-[#006590]"
                            : "bg-white border-slate-200/70 hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-center gap-3 text-left">
                          <img
                            src={mock.avatar}
                            alt=""
                            className="w-10 h-10 rounded-full object-cover border border-slate-100"
                            referrerPolicy="no-referrer"
                          />
                          <div>
                            <p className="text-sm font-extrabold text-slate-800 leading-tight">{mock.name}</p>
                            <p className="text-[11px] font-medium text-slate-400 font-mono">{mock.email}</p>
                          </div>
                        </div>
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          selectedMockIndex === idx ? "border-[#006590] bg-[#006590]" : "border-slate-300"
                        }`}>
                          {selectedMockIndex === idx && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Manual custom adjustments */}
                  <div className="pt-2 border-t border-slate-200/40">
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Hoặc tùy chỉnh tên theo ý bạn</label>
                    <input
                      type="text"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      placeholder="Nhập tên của bạn để hiển thị"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs outline-none focus:border-[#006590] font-bold text-slate-800"
                    />
                  </div>
                </div>
              ) : (
                /* Email & Password Input fields */
                <div className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Địa chỉ Email</label>
                    <input
                      type="email"
                      value={emailInput}
                      onChange={(e) => {
                        setEmailInput(e.target.value);
                        setErrorMessage("");
                      }}
                      placeholder="vidu@gmail.com"
                      className="w-full bg-white border border border-slate-200 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-[#006590] text-slate-800 font-semibold"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Mật khẩu</label>
                    <input
                      type="password"
                      value={passwordInput}
                      onChange={(e) => {
                        setPasswordInput(e.target.value);
                        setErrorMessage("");
                      }}
                      placeholder="••••••••"
                      className="w-full bg-white border border border-slate-200 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-[#006590] text-slate-800"
                    />
                  </div>

                  <div className="flex items-center gap-1.5 pt-1">
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wide">Nhập tên hiển thị:</label>
                    <input
                      type="text"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      className="flex-grow bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs outline-none"
                    />
                  </div>

                  {errorMessage && (
                    <p className="text-xs text-red-500 font-bold">{errorMessage}</p>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setAuthStep("choose")}
                className="w-1/3 bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-3 rounded-2xl text-xs font-extrabold duration-200 cursor-pointer"
              >
                Quay lại
              </button>
              
              <button
                onClick={handleExecuteLogin}
                className="flex-grow bg-[#006590] hover:bg-[#005176] text-white px-5 py-3 rounded-2xl text-xs font-extrabold shadow-sm duration-200 cursor-pointer flex items-center justify-center gap-2 active:scale-98"
              >
                Đồng ý & Đăng nhập
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Auth success screen */}
        {authStep === "success" && (
          <div className="p-8 text-center flex flex-col items-center justify-center min-h-[300px]">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-6 animate-pulse">
              <CheckCircle2 className="h-10 w-10" />
            </div>

            <h3 className="text-2xl font-black text-slate-800 tracking-tight mb-2">Đăng Nhập Thành Công!</h3>
            <p className="text-sm font-semibold text-[#006590] mb-1">
              {provider === "google" && "🔑 Liên kết Google thành công"}
              {provider === "facebook" && "🔑 Liên kết Facebook thành công"}
              {provider === "email" && "🔑 Đăng nhập Email thành công"}
            </p>
            
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 my-4 flex items-center gap-3.5 max-w-[320px] w-full text-left">
              <img
                src={
                  provider !== "email"
                    ? mockAvatars[provider][selectedMockIndex].avatar
                    : "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=150&auto=format&fit=crop"
                }
                alt=""
                className="w-10 h-10 rounded-full border border-slate-200 object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="overflow-hidden">
                <p className="text-sm font-extrabold text-slate-800 truncate">{nameInput || "Thành viên Roomie"}</p>
                <p className="text-xs text-slate-400 font-mono truncate">{emailInput || "user@roomiematch.vn"}</p>
              </div>
            </div>

            <p className="text-xs text-slate-400 font-medium max-w-sm mb-6 leading-relaxed">
              Chào mừng bạn quay trở lại RoomieMatch Đà Nẵng. Bây giờ bạn có thể trải nghiệm toàn diện các tính năng ở ghép của chúng tôi!
            </p>

            <button
              onClick={handleCompleteAuth}
              className="w-full bg-[#006590] hover:bg-[#005176] text-white py-4 rounded-2xl text-xs font-black shadow-md duration-200 cursor-pointer active:scale-95"
            >
              Bắt đầu Khám Phá Ngay
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
