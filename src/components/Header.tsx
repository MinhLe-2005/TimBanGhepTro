import { useState, useEffect } from "react";
import { Menu, X, Sparkles, MessageSquare, FileText, Users, Home, Building, LogIn, LogOut, ChevronDown, Chrome, Facebook, User, Mail, Info, Shield } from "lucide-react";

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenCreateProfile?: () => void;
  currentUserProfile?: any;
  isAdmin?: boolean;
  currentUser: {
    name: string;
    email: string;
    avatar: string;
    provider: "google" | "facebook" | "email";
    id?: string;
  } | null;
  onOpenLogin: () => void;
  onLogout: () => void;
  hasUnreadMessages?: boolean;
  hasPendingAgreement?: boolean;
}

export default function Header({
  activeTab,
  setActiveTab,
  onOpenCreateProfile,
  currentUserProfile,
  currentUser,
  onOpenLogin,
  onLogout,
  hasUnreadMessages = false,
  hasPendingAgreement = false,
}: HeaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const adminEmail = import.meta.env.VITE_ADMIN_EMAIL || "admin@roomiematch.com";
  const isAdmin = currentUser?.email === adminEmail || currentUser?.email === "quanly@roomiematch.com" || currentUser?.id === "7a1b28ab-058f-49b6-85bb-3cb61406db31";

  const baseNavItems = [
    { id: "home", label: "Trang Chủ", icon: Home },
    { id: "roommates", label: "Tìm Bạn", icon: Users },
    { id: "rooms", label: "Phòng Trọ", icon: Building },
    { id: "chat", label: "Tin Nhắn", icon: MessageSquare },
    { id: "agreement", label: "Thỏa Thuận", icon: FileText },
    { id: "history", label: "Lịch Sử Thỏa Thuận", icon: FileText },
    ...(isAdmin ? [{ id: "admin", label: "Quản Trị (Admin)", icon: Shield }] : []),
    { 
      id: "info", 
      label: "Hỗ Trợ", 
      icon: Info,
      subItems: [
        { id: "about", label: "Về chúng tôi" },
        { id: "help", label: "Trung tâm trợ giúp" },
        { id: "safety", label: "Hướng dẫn an toàn" },
        { id: "faq", label: "Câu hỏi thường gặp" },
        { id: "terms", label: "Điều khoản & Bảo mật" }
      ]
    },
  ];

  const navItems = baseNavItems.filter(item => {
    if (!currentUser && (item.id === "chat" || item.id === "agreement" || item.id === "history")) {
      return false;
    }
    return true;
  });

  const handleNavClick = (id: string) => {
    setActiveTab(id);
    setIsOpen(false);
  };

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled 
          ? "bg-white/70 backdrop-blur-xl shadow-[0_4px_30px_rgba(0,0,0,0.05)] border-b border-slate-200/50" 
          : "bg-white border-b border-transparent"
      }`}
    >
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* relative container: logo left, nav absolutely centered, buttons right */}
        <div className={`relative flex items-center justify-between transition-all duration-500 ${isScrolled ? "h-16" : "h-20"}`}>

          {/* Logo */}
          <div className="flex items-center h-full cursor-pointer group" onClick={() => handleNavClick("home")}>
            <div className="relative flex items-center justify-center w-8 h-8 mr-2 transition-transform duration-300 group-hover:scale-105 group-active:scale-95">
              <div className="absolute left-0 w-5 h-5 rounded-full bg-rose-500 mix-blend-multiply opacity-90 shadow-sm" />
              <div className="absolute right-0 w-5 h-5 rounded-full bg-[#004e70] mix-blend-multiply opacity-90 shadow-sm" />
            </div>
            <span className="text-[26px] tracking-tight flex items-baseline">
              <span className="font-black text-slate-900">Roomie</span>
              <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-orange-400">Match</span>
            </span>
          </div>

          {/* Desktop Navigation - Absolutely centered on the full header */}
          <nav className="hidden lg:absolute lg:left-1/2 lg:-translate-x-1/2 lg:flex items-center gap-6 h-full">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;

              if (item.subItems) {
                return (
                  <div key={item.id} className="group relative h-full">
                    <button
                      onClick={() => handleNavClick(item.id)}
                      className={`relative h-full flex items-center gap-1 px-2 text-[15px] font-bold transition-colors duration-200 cursor-pointer whitespace-nowrap ${
                        isActive ? "text-[#004e70]" : "text-slate-500 hover:text-[#004e70]"
                      }`}
                    >
                      {item.label}
                      <ChevronDown className="h-4 w-4 opacity-70 group-hover:rotate-180 transition-transform duration-200" />
                      <span
                        className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-[2.5px] bg-[#004e70] rounded-t-full transition-all duration-300 ease-out ${
                          isActive ? "w-full opacity-100" : "w-0 opacity-0 group-hover:w-full group-hover:opacity-100"
                        }`}
                      />
                    </button>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-0 w-56 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pt-2 z-50">
                      <div className="bg-white rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.08)] border border-slate-100 overflow-hidden flex flex-col py-2">
                        {item.subItems.map(subItem => (
                          <a
                            key={subItem.id}
                            href={`#info?tab=${subItem.id}`}
                            className="px-5 py-3 text-sm font-semibold text-slate-600 hover:text-[#004e70] hover:bg-slate-50 transition-colors text-left flex items-center"
                          >
                            {subItem.label}
                          </a>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`group relative h-full flex items-center px-2 text-[15px] font-bold transition-colors duration-200 cursor-pointer whitespace-nowrap ${
                    isActive ? "text-[#004e70]" : "text-slate-500 hover:text-[#004e70]"
                  }`}
                >
                  <div className="relative">
                    {item.label}
                    {item.id === "chat" && hasUnreadMessages && (
                      <span className="absolute -top-1 -right-2.5 w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
                    )}
                    {item.id === "agreement" && hasPendingAgreement && (
                      <span className="absolute -top-1 -right-2.5 flex items-center justify-center">
                        <span className="w-4 h-4 bg-rose-500 rounded-full animate-pulse text-white text-[8px] font-black flex items-center justify-center">!</span>
                      </span>
                    )}
                  </div>
                  <span
                    className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-[2.5px] bg-[#004e70] rounded-t-full transition-all duration-300 ease-out ${
                      isActive ? "w-full opacity-100" : "w-0 opacity-0 group-hover:w-full group-hover:opacity-100"
                    }`}
                  />
                </button>
              );
            })}
          </nav>

          {/* Action Buttons & Profile */}
          <div className="hidden lg:flex items-center gap-3 relative">
            {!currentUser ? (
              <>
                <button
                  onClick={onOpenLogin}
                  className="flex items-center gap-2 text-[13px] font-bold text-[#004e70] border-2 border-[#004e70]/20 hover:border-[#004e70]/60 hover:bg-sky-50 px-5 py-2 rounded-full transition-all duration-200 cursor-pointer"
                >
                  <User className="h-4 w-4" />
                  Tạo Hồ Sơ
                </button>
                <button
                  onClick={onOpenLogin}
                  className="bg-[#004e70] hover:bg-[#003852] text-white px-7 py-2.5 rounded-full text-[14px] font-bold shadow-md hover:shadow-lg active:scale-95 transition-all duration-200 cursor-pointer"
                >
                  Đăng Nhập
                </button>
              </>
            ) : (
              <div className="flex items-center gap-4">
                {!isAdmin && (
                  <button
                    onClick={onOpenCreateProfile}
                    className="bg-[#004e70] hover:bg-[#003852] text-white px-6 py-2 rounded-full text-[13px] font-bold shadow-md hover:shadow-lg active:scale-95 transition-all duration-200 cursor-pointer"
                  >
                    Hồ Sơ Của Tôi
                  </button>
                )}

                <div className="relative">
                  <div
                    className="flex items-center gap-1.5 cursor-pointer select-none"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  >
                    <div className="w-10 h-10 rounded-full border-2 border-white shadow-sm overflow-hidden hover:border-sky-200 transition-colors duration-200">
                      <img
                        src={currentUserProfile?.avatar || currentUser?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&auto=format&fit=crop"}
                        alt="My Avatar"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  </div>

                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-3 w-72 bg-white rounded-3xl shadow-xl border border-slate-100 py-4 px-4 z-50 animate-fade-in">
                      <div className="flex items-center gap-3 pb-3 border-b border-slate-150">
                        <img
                          src={currentUserProfile?.avatar || currentUser?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&auto=format&fit=crop"}
                          alt=""
                          className="w-11 h-11 rounded-full object-cover border border-slate-100"
                          referrerPolicy="no-referrer"
                        />
                        <div className="overflow-hidden">
                          <p className="text-sm font-extrabold text-slate-800 leading-tight truncate">
                            {currentUserProfile?.name || currentUser?.name || "Thành viên Roomie"}
                          </p>
                          <p className="text-[11px] font-semibold text-slate-400 truncate">
                            {currentUser?.email || "Chưa cập nhật email"}
                          </p>
                        </div>
                      </div>

                      {currentUser && (
                        <div className="mt-2.5 px-2 py-1.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-bold">
                          <span>Đăng nhập qua:</span>
                          <span className="flex items-center gap-1 text-[#006590]">
                            {currentUser.provider === "google" && (<><Chrome className="h-3 w-3 text-red-500" /> Google</>)}
                            {currentUser.provider === "facebook" && (<><Facebook className="h-3 w-3 text-[#1877F2]" /> Facebook</>)}
                            {currentUser.provider === "email" && (<><Mail className="h-3 w-3 text-emerald-500" /> Email</>)}
                          </span>
                        </div>
                      )}

                      <div className="mt-3.5 space-y-1.5">
                        {!isAdmin && (
                        <button
                          onClick={() => { onOpenCreateProfile(); setIsDropdownOpen(false); }}
                          className="w-full text-left px-3.5 py-2.5 rounded-2xl text-xs font-semibold text-slate-600 hover:text-[#006590] hover:bg-slate-50 duration-200 flex items-center gap-2 cursor-pointer"
                        >
                          <User className="h-4 w-4" />
                          Cập nhật hồ sơ ghép đôi
                        </button>
                      )}
                        <button
                          onClick={() => { onLogout(); setIsDropdownOpen(false); }}
                          className="w-full text-left px-3.5 py-2.5 rounded-2xl text-xs font-bold text-red-600 hover:bg-red-50 duration-200 flex items-center gap-2 cursor-pointer border-t border-slate-100 mt-1"
                        >
                          <LogOut className="h-4 w-4" />
                          Đăng xuất tài khoản
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex lg:hidden items-center gap-3">
            {currentUser && (
              <div className="w-9 h-9 rounded-full border border-sky-200 overflow-hidden cursor-pointer" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
                <img
                  src={currentUser?.avatar || currentUserProfile?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&auto=format&fit=crop"}
                  alt="My Avatar"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            )}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-slate-600 hover:text-slate-900 p-2 rounded-lg hover:bg-slate-100 cursor-pointer"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="lg:hidden absolute top-full left-0 right-0 border-t border-gray-100 bg-white/95 backdrop-blur-md px-4 pt-2 pb-6 space-y-2 animate-fade-in shadow-xl">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;

            if (item.subItems) {
              return (
                <div key={item.id} className="flex flex-col">
                  <button
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full text-left px-4 py-3.5 rounded-xl text-sm font-bold flex items-center justify-between transition-colors ${
                      isActive ? "text-[#004e70] bg-sky-50" : "text-slate-600 hover:text-[#004e70] hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">{item.label}</div>
                    <ChevronDown className={`h-4 w-4 transition-transform ${isActive ? "rotate-180" : ""}`} />
                  </button>
                  {isActive && (
                    <div className="pl-6 pr-4 py-2 space-y-1">
                      {item.subItems.map(subItem => (
                        <a
                          key={subItem.id}
                          href={`#info?tab=${subItem.id}`}
                          onClick={() => setIsOpen(false)}
                          className="block px-4 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:text-[#004e70] hover:bg-slate-50 transition-colors"
                        >
                          {subItem.label}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full text-left px-4 py-3.5 rounded-xl text-sm font-bold flex items-center gap-3 transition-colors ${
                  isActive ? "text-[#004e70] bg-sky-50" : "text-slate-600 hover:text-[#004e70] hover:bg-slate-50"
                }`}
              >
                <div className="relative">
                  <item.icon className="h-5 w-5" />
                  {item.id === "chat" && hasUnreadMessages && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-rose-500 rounded-full" />
                  )}
                  {item.id === "agreement" && hasPendingAgreement && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full text-white text-[8px] font-black flex items-center justify-center">!</span>
                  )}
                </div>
                {item.label}
              </button>
            );
          })}
          <div className="pt-4 border-t border-slate-100 flex flex-col gap-3">
            {!currentUser ? (
              <>
                <button
                  onClick={() => { onOpenLogin(); setIsOpen(false); }}
                  className="w-full bg-slate-50 border border-slate-200 text-[#004e70] px-5 py-3.5 rounded-xl text-center text-sm font-bold flex items-center justify-center gap-2 cursor-pointer hover:bg-slate-100"
                >
                  <User className="h-4 w-4" />
                  Tạo Hồ Sơ
                </button>
                <button
                  onClick={() => { onOpenLogin(); setIsOpen(false); }}
                  className="w-full bg-[#004e70] hover:bg-[#003852] text-white px-5 py-3.5 rounded-xl text-center text-sm font-extrabold shadow-md cursor-pointer"
                >
                  Đăng Nhập
                </button>
              </>
            ) : (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500">Đã đăng nhập:</span>
                  <span className="text-xs font-extrabold text-slate-800">{currentUser.name}</span>
                </div>
                {!isAdmin && (
                  <button
                    onClick={() => { onOpenCreateProfile(); setIsOpen(false); }}
                    className="w-full bg-[#004e70] hover:bg-[#003852] text-white px-5 py-3 rounded-xl text-center text-xs font-extrabold shadow-sm cursor-pointer"
                  >
                    Hồ Sơ Của Tôi
                  </button>
                )}
                <button
                  onClick={() => { onLogout(); setIsOpen(false); }}
                  className="w-full bg-red-50 text-red-600 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <LogOut className="h-4 w-4" /> Đăng xuất tài khoản
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
