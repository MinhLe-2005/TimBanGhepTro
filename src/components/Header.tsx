import { useState } from "react";
import { Menu, X, Sparkles, MessageSquare, FileText, Users, Home, Building, LogIn, LogOut, ChevronDown, Chrome, Facebook, User, Mail } from "lucide-react";

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenCreateProfile: () => void;
  currentUserProfile: any;
  currentUser: {
    name: string;
    email: string;
    avatar: string;
    provider: "google" | "facebook" | "email";
  } | null;
  onOpenLogin: () => void;
  onLogout: () => void;
}

export default function Header({
  activeTab,
  setActiveTab,
  onOpenCreateProfile,
  currentUserProfile,
  currentUser,
  onOpenLogin,
  onLogout,
}: HeaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const navItems = [
    { id: "home", label: "Trang Chủ", icon: Home },
    { id: "roommates", label: "Tìm Bạn Ở Ghép", icon: Users },
    { id: "rooms", label: "Phòng trọ đang tìm bạn", icon: Building },
    { id: "chat", label: "Trò Chuyện", icon: MessageSquare },
    { id: "agreement", label: "Thỏa thuận sống chung", icon: FileText },
  ];

  const handleNavClick = (id: string) => {
    setActiveTab(id);
    setIsOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm transition-all duration-300">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <div className="flex items-center cursor-pointer" onClick={() => handleNavClick("home")}>
            <span className="text-2xl font-extrabold text-[#006590] tracking-tight flex items-center gap-1">
              RoomieMatch
              <Sparkles className="h-5 w-5 text-sky-400 fill-sky-200 animate-pulse" />
            </span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-1 lg:space-x-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`relative px-4 py-2 rounded-full text-[15px] font-medium transition-all duration-200 flex items-center gap-2 cursor-pointer ${
                    isActive
                      ? "text-[#006590] bg-[#dff6ff] font-semibold"
                      : "text-gray-600 hover:text-[#006590] hover:bg-slate-50"
                  }`}
                >
                  <Icon className={`h-4.5 w-4.5 ${isActive ? "text-[#006590]" : "text-gray-400"}`} />
                  {item.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-1 bg-[#006590] rounded-full" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Action Buttons & Profile */}
          <div className="hidden md:flex items-center gap-4 relative">
            {/* Login button if not logged in */}
            {!currentUser ? (
              <button
                onClick={onOpenLogin}
                className="hover:bg-slate-50 border border-slate-200 text-slate-700 px-4.5 py-2.5 rounded-full text-sm font-bold flex items-center gap-2 duration-200 cursor-pointer"
              >
                <LogIn className="h-4 w-4 text-[#006590]" />
                Đăng Nhập
              </button>
            ) : null}

            <button
              onClick={onOpenCreateProfile}
              className="bg-[#006590] hover:bg-[#005176] text-white px-5 py-2.5 rounded-full text-sm font-semibold shadow-md shadow-sky-900/10 hover:shadow-lg hover:shadow-sky-900/20 active:scale-95 transition-all duration-200 flex items-center gap-2 cursor-pointer"
            >
              <Sparkles className="h-4 w-4" />
              Tạo Hồ Sơ Roommate
            </button>

            {/* User Profile Avatar with dropdown */}
            <div className="relative">
              <div 
                className="flex items-center gap-1 cursor-pointer select-none" 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                <div className="w-11 h-11 rounded-full border-2 border-sky-200 overflow-hidden shadow-inner hover:border-[#006590] transition-colors duration-200">
                  <img
                    src={
                      currentUser?.avatar ||
                      currentUserProfile?.avatar ||
                      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&auto=format&fit=crop"
                    }
                    alt="My Avatar"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <ChevronDown className="h-4 w-4 text-slate-400" />
              </div>

              {/* Account Dropdown panel */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-3 w-72 bg-white rounded-3xl shadow-xl border border-slate-100 py-4 px-4 z-50 animate-fade-in">
                  <div className="flex items-center gap-3 pb-3 border-b border-slate-150">
                    <img
                      src={
                        currentUser?.avatar ||
                        currentUserProfile?.avatar ||
                        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&auto=format&fit=crop"
                      }
                      alt=""
                      className="w-11 h-11 rounded-full object-cover border border-slate-100"
                      referrerPolicy="no-referrer"
                    />
                    <div className="overflow-hidden">
                      <p className="text-sm font-extrabold text-slate-800 leading-tight truncate">
                        {currentUser?.name || currentUserProfile?.name || "Thành viên Roomie"}
                      </p>
                      <p className="text-[11px] font-semibold text-slate-400 truncate">
                        {currentUser?.email || "Chưa cập nhật email"}
                      </p>
                    </div>
                  </div>

                  {/* Auth Provider badge */}
                  {currentUser && (
                    <div className="mt-2.5 px-2 py-1.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-bold">
                      <span>Đăng nhập qua:</span>
                      <span className="flex items-center gap-1 text-[#006590]">
                        {currentUser.provider === "google" && (
                          <>
                            <Chrome className="h-3 w-3 text-red-500" /> Google
                          </>
                        )}
                        {currentUser.provider === "facebook" && (
                          <>
                            <Facebook className="h-3 w-3 text-[#1877F2]" /> Facebook
                          </>
                        )}
                        {currentUser.provider === "email" && (
                          <>
                            <Mail className="h-3 w-3 text-emerald-500" /> Email
                          </>
                        )}
                      </span>
                    </div>
                  )}

                  <div className="mt-3.5 space-y-1.5">
                    <button
                      onClick={() => {
                        onOpenCreateProfile();
                        setIsDropdownOpen(false);
                      }}
                      className="w-full text-left px-3.5 py-2.5 rounded-2xl text-xs font-semibold text-slate-600 hover:text-[#006590] hover:bg-slate-50 duration-200 flex items-center gap-2 cursor-pointer"
                    >
                      <User className="h-4 w-4" />
                      Cập nhật hồ sơ ghép đôi
                    </button>

                    {currentUser ? (
                      <button
                        onClick={() => {
                          onLogout();
                          setIsDropdownOpen(false);
                        }}
                        className="w-full text-left px-3.5 py-2.5 rounded-2xl text-xs font-bold text-red-600 hover:bg-red-50 duration-200 flex items-center gap-2 cursor-pointer border-t border-slate-100 mt-1"
                      >
                        <LogOut className="h-4 w-4" />
                        Đăng xuất tài khoản
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          onOpenLogin();
                          setIsDropdownOpen(false);
                        }}
                        className="w-full text-left px-3.5 py-2.5 rounded-2xl text-xs font-bold text-[#006590] hover:bg-sky-50 duration-200 flex items-center gap-2 cursor-pointer mt-1"
                      >
                        <LogIn className="h-4 w-4" />
                        Đăng nhập tài khoản
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center gap-3">
            {/* Mobile Profile Thumbnail */}
            <div className="w-9 h-9 rounded-full border border-sky-200 overflow-hidden" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
              <img
                src={
                  currentUser?.avatar ||
                  currentUserProfile?.avatar ||
                  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&auto=format&fit=crop"
                }
                alt="My Avatar"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-500 hover:text-gray-900 p-2 rounded-lg hover:bg-gray-100"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white/95 backdrop-blur-md px-4 pt-2 pb-6 space-y-2 animate-fade-in shadow-lg">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full text-left px-4 py-3 rounded-xl text-base font-medium flex items-center gap-3 ${
                  isActive
                    ? "text-[#006590] bg-[#dff6ff] font-semibold"
                    : "text-gray-600 hover:text-[#006590] hover:bg-slate-50"
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? "text-[#006590]" : "text-gray-400"}`} />
                {item.label}
              </button>
            );
          })}
          <div className="pt-4 border-t border-gray-100 flex flex-col gap-3">
            {!currentUser ? (
              <button
                onClick={() => {
                  onOpenLogin();
                  setIsOpen(false);
                }}
                className="w-full bg-slate-50 border border-slate-200 text-slate-750 px-5 py-3 rounded-xl text-center font-bold flex items-center justify-center gap-2"
              >
                <LogIn className="h-4 w-4 text-[#006590]" />
                Đăng Nhập Tài Khoản
              </button>
            ) : (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500">Đã đăng nhập:</span>
                  <span className="text-xs font-extrabold text-slate-800">{currentUser.name}</span>
                </div>
                <button
                  onClick={() => {
                    onLogout();
                    setIsOpen(false);
                  }}
                  className="w-full bg-red-50 text-red-650 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
                >
                  <LogOut className="h-3.5 w-3.5" /> Đăng xuất tài khoản
                </button>
              </div>
            )}

            <button
              onClick={() => {
                onOpenCreateProfile();
                setIsOpen(false);
              }}
              className="w-full bg-[#006590] text-white px-5 py-3 rounded-xl text-center font-semibold flex items-center justify-center gap-2 shadow-md"
            >
              <Sparkles className="h-4 w-4" />
              Tạo Hồ Sơ Roommate
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
