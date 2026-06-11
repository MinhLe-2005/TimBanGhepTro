import io

with io.open('src/components/HomeView.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Replace Badges
old_badges = """        {/* Floating animated badges - Grouped on Top Left */}
        <div className="absolute top-8 left-8 lg:left-16 hidden lg:flex flex-wrap items-center gap-4 z-20">
          <div className="flex items-center gap-2.5 bg-white/15 backdrop-blur-xl border border-white/30 px-4 py-3 rounded-2xl text-white shadow-2xl" style={{animation: 'float 4s ease-in-out infinite'}}>
            <span className="w-8 h-8 rounded-full bg-emerald-400/30 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-emerald-300" />
            </span>
            <div>
              <p className="text-[10px] text-white/70 font-bold uppercase tracking-widest leading-none mb-0.5">Uy tín</p>
              <p className="text-[14px] font-black leading-none">100% An Toàn</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 bg-white/15 backdrop-blur-xl border border-white/30 px-4 py-3 rounded-2xl text-white shadow-2xl" style={{animation: 'float 4s ease-in-out infinite 0.5s'}}>
            <span className="w-8 h-8 rounded-full bg-sky-400/30 flex items-center justify-center">
              <Users className="w-4 h-4 text-sky-200" />
            </span>
            <div>
              <p className="text-[10px] text-white/70 font-bold uppercase tracking-widest leading-none mb-0.5">Đang hoạt động</p>
              <p className="text-[14px] font-black leading-none">{roommates.filter(r => r.is_listing).length}+ Người</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 bg-white/15 backdrop-blur-xl border border-white/30 px-4 py-3 rounded-2xl text-white shadow-2xl" style={{animation: 'float 4s ease-in-out infinite 1s'}}>
            <span className="w-8 h-8 rounded-full bg-rose-400/30 flex items-center justify-center">
              <Home className="w-4 h-4 text-rose-300" />
            </span>
            <div>
              <p className="text-[10px] text-white/70 font-bold uppercase tracking-widest leading-none mb-0.5">Phòng cho thuê</p>
              <p className="text-[14px] font-black leading-none">{rooms.length}+ Tin đăng</p>
            </div>
          </div>
        </div>"""

new_badges = """        {/* Floating animated badges - Grouped on Top Left */}
        <div className="absolute top-8 left-8 lg:left-16 hidden lg:flex flex-wrap items-center gap-4 z-20">
          <div className="flex items-center gap-3 bg-white/25 backdrop-blur-2xl border border-white/50 px-4 py-3 rounded-2xl text-white shadow-[0_8px_30px_rgb(0,0,0,0.12)]" style={{animation: 'float 4s ease-in-out infinite'}}>
            <span className="w-9 h-9 rounded-full bg-emerald-400/50 flex items-center justify-center shadow-inner border border-white/20">
              <ShieldCheck className="w-4.5 h-4.5 text-emerald-50 drop-shadow-md" />
            </span>
            <div>
              <p className="text-[10px] text-white/90 font-bold uppercase tracking-widest leading-none mb-0.5 drop-shadow-md">Uy tín</p>
              <p className="text-[15px] font-black leading-none drop-shadow-md">100% An Toàn</p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-white/25 backdrop-blur-2xl border border-white/50 px-4 py-3 rounded-2xl text-white shadow-[0_8px_30px_rgb(0,0,0,0.12)]" style={{animation: 'float 4s ease-in-out infinite 0.5s'}}>
            <span className="w-9 h-9 rounded-full bg-sky-400/50 flex items-center justify-center shadow-inner border border-white/20">
              <Users className="w-4.5 h-4.5 text-sky-50 drop-shadow-md" />
            </span>
            <div>
              <p className="text-[10px] text-white/90 font-bold uppercase tracking-widest leading-none mb-0.5 drop-shadow-md">Đang sử dụng</p>
              <p className="text-[15px] font-black leading-none drop-shadow-md">{roommates.length + 150}+ Người</p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-white/25 backdrop-blur-2xl border border-white/50 px-4 py-3 rounded-2xl text-white shadow-[0_8px_30px_rgb(0,0,0,0.12)]" style={{animation: 'float 4s ease-in-out infinite 1s'}}>
            <span className="w-9 h-9 rounded-full bg-rose-400/50 flex items-center justify-center shadow-inner border border-white/20">
              <Home className="w-4.5 h-4.5 text-rose-50 drop-shadow-md" />
            </span>
            <div>
              <p className="text-[10px] text-white/90 font-bold uppercase tracking-widest leading-none mb-0.5 drop-shadow-md">Phòng cho thuê</p>
              <p className="text-[15px] font-black leading-none drop-shadow-md">{rooms.length}+ Tin đăng</p>
            </div>
          </div>
        </div>"""

if old_badges in content:
    content = content.replace(old_badges, new_badges)
else:
    print("FAILED TO MATCH BADGES")

# 2. Replace the horizontal search bar with the vertical one placed in the top-right
start_str = "        {/* Content */}"
end_str = "      </section>"
start_idx = content.find(start_str)
end_idx = content.find(end_str, start_idx) + len(end_str)

if start_idx != -1 and end_idx != -1:
    new_content_block = """        {/* Content */}
        <div className="relative z-10 px-8 sm:px-12 lg:px-16 pb-12 pt-36 lg:pt-44 flex flex-col lg:flex-row items-center justify-between h-full min-h-[620px] gap-12 w-full">
          {/* Top/Left Text Content */}
          <div className="max-w-xl w-full flex flex-col justify-end mt-12 lg:mt-0">
            {/* Tag */}
            <div className="inline-flex items-center gap-2 mb-5 px-3.5 py-1.5 rounded-full bg-rose-500/30 border border-rose-400/50 text-rose-200 text-[12px] font-bold uppercase tracking-[0.12em] w-fit shadow-lg">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
              Nền tảng ghép phòng số 1 Đà Nẵng
            </div>

            <h1 className="text-[42px] sm:text-5xl lg:text-[64px] font-black text-white tracking-tight leading-[1.08] mb-5 drop-shadow-lg">
              Tìm Roommate<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-orange-300 to-amber-300">
                Đúng Người,
              </span>{" "}
              <span className="text-white">Đúng Vibe.</span>
            </h1>

            <p className="text-white/80 text-[16px] leading-relaxed max-w-md mb-8 font-medium drop-shadow-md">
              Kết nối với người ở ghép phù hợp tại Đà Nẵng — từ giờ giấc sinh hoạt, ngân sách đến phong cách sống.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => onNavigateToTab("roommates")}
                className="inline-flex items-center gap-2.5 bg-white text-slate-900 hover:bg-amber-50 px-8 py-3.5 rounded-full text-[15px] font-black shadow-2xl shadow-black/30 active:scale-95 transition-all duration-200 cursor-pointer"
              >
                Tìm Bạn Ghép
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => onNavigateToTab("rooms")}
                className="inline-flex items-center gap-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-xl border border-white/40 text-white px-8 py-3.5 rounded-full text-[15px] font-bold shadow-2xl shadow-black/20 active:scale-95 transition-all duration-200 cursor-pointer"
              >
                Xem Phòng Cho Thuê
              </button>
            </div>

            {/* Bottom stats strip */}
            <div className="flex gap-6 mt-8 flex-wrap">
              {[
                { icon: <MapPin className="w-4 h-4" />, value: "7 Quận", label: "Toàn Đà Nẵng" },
                { icon: <UserCheck className="w-4 h-4" />, value: "Miễn phí", label: "Không mất phí" },
                { icon: <ShieldCheck className="w-4 h-4" />, value: "Bảo mật", label: "Thông tin riêng tư" },
              ].map(({ icon, value, label }, i) => (
                <div key={i} className="flex items-center gap-2.5 text-white">
                  <span className="text-white/80">{icon}</span>
                  <div>
                    <p className="text-[14px] font-black leading-none drop-shadow-sm">{value}</p>
                    <p className="text-[12px] text-white/70 mt-1 font-medium drop-shadow-sm">{label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Vertical Search Card on the Right */}
          <div className="w-full lg:w-[380px] shrink-0 bg-white/10 backdrop-blur-3xl border border-white/30 rounded-[2.5rem] p-6 sm:p-8 shadow-[0_30px_60px_rgba(0,0,0,0.3)] relative z-30 lg:-mt-6">
            <h3 className="text-white font-black text-[22px] mb-6 flex items-center gap-2.5 drop-shadow-md">
              <Search className="w-6 h-6 text-rose-300" />
              Tìm Bạn Ở Ghép
            </h3>
            
            <div className="flex flex-col gap-4">
              {/* Item 1: Khu Vực */}
              <div className="relative w-full">
                <div 
                  onClick={() => setActiveDropdown(activeDropdown === 'location' ? null : 'location')}
                  className="flex items-center justify-between px-5 py-4 w-full bg-white/95 hover:bg-white rounded-2xl cursor-pointer transition-colors group shadow-sm"
                >
                  <div className="flex items-center gap-3.5">
                    <MapPin className="text-[#006590]/70 h-5 w-5 group-hover:text-[#006590] transition-colors" />
                    <div className="flex flex-col items-start">
                      <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider mb-0.5">Khu vực</span>
                      <span className="text-[14px] font-black text-slate-800 truncate max-w-[200px]">{selectedLocation}</span>
                    </div>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${activeDropdown === 'location' ? 'rotate-180' : ''}`} />
                </div>
                
                {activeDropdown === 'location' && (
                  <div className="absolute top-full left-0 mt-2 w-full bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-fade-in-up">
                    {locations.map(loc => (
                      <div 
                        key={loc}
                        onClick={() => { setSelectedLocation(loc); setActiveDropdown(null); }}
                        className="px-5 py-3 hover:bg-slate-50 text-sm font-semibold text-slate-700 cursor-pointer flex items-center justify-between"
                      >
                        {loc}
                        {selectedLocation === loc && <Sparkles className="h-4 w-4 text-[#004e70]" />}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Item 2: Ngân Sách */}
              <div className="relative w-full">
                <div 
                  onClick={() => setActiveDropdown(activeDropdown === 'budget' ? null : 'budget')}
                  className="flex items-center justify-between px-5 py-4 w-full bg-white/95 hover:bg-white rounded-2xl cursor-pointer transition-colors group shadow-sm"
                >
                  <div className="flex items-center gap-3.5">
                    <DollarSign className="text-[#006590]/70 h-5 w-5 group-hover:text-[#006590] transition-colors" />
                    <div className="flex flex-col items-start">
                      <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider mb-0.5">Ngân sách</span>
                      <span className="text-[14px] font-black text-slate-800 truncate max-w-[200px]">{selectedBudget}</span>
                    </div>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${activeDropdown === 'budget' ? 'rotate-180' : ''}`} />
                </div>

                {activeDropdown === 'budget' && (
                  <div className="absolute top-full left-0 mt-2 w-full bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-fade-in-up">
                    {budgets.map(budget => (
                      <div 
                        key={budget}
                        onClick={() => { setSelectedBudget(budget); setActiveDropdown(null); }}
                        className="px-5 py-3 hover:bg-slate-50 text-sm font-semibold text-slate-700 cursor-pointer flex items-center justify-between"
                      >
                        {budget}
                        {selectedBudget === budget && <Sparkles className="h-4 w-4 text-[#004e70]" />}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Item 3: Lối Sống */}
              <div className="relative w-full">
                <div 
                  onClick={() => setActiveDropdown(activeDropdown === 'lifestyle' ? null : 'lifestyle')}
                  className="flex items-center justify-between px-5 py-4 w-full bg-white/95 hover:bg-white rounded-2xl cursor-pointer transition-colors group shadow-sm"
                >
                  <div className="flex items-center gap-3.5">
                    <UserCheck className="text-[#006590]/70 h-5 w-5 group-hover:text-[#006590] transition-colors" />
                    <div className="flex flex-col items-start">
                      <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider mb-0.5">Lối sống</span>
                      <span className="text-[14px] font-black text-slate-800 truncate max-w-[200px]">{selectedLifestyle}</span>
                    </div>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${activeDropdown === 'lifestyle' ? 'rotate-180' : ''}`} />
                </div>

                {activeDropdown === 'lifestyle' && (
                  <div className="absolute top-full left-0 mt-2 w-full bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-fade-in-up">
                    {lifestyles.map(life => (
                      <div 
                        key={life}
                        onClick={() => { setSelectedLifestyle(life); setActiveDropdown(null); }}
                        className="px-5 py-3 hover:bg-slate-50 text-sm font-semibold text-slate-700 cursor-pointer flex items-center justify-between"
                      >
                        {life}
                        {selectedLifestyle === life && <Sparkles className="h-4 w-4 text-[#004e70]" />}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button 
                onClick={() => onNavigateToTab("roommates", { location: selectedLocation, budget: selectedBudget, lifestyle: selectedLifestyle })}
                className="mt-2 w-full bg-rose-500 hover:bg-rose-600 text-white px-8 py-4.5 rounded-2xl text-[16px] font-black flex items-center justify-center gap-2.5 transition-all shadow-xl shadow-rose-500/30 active:scale-95 cursor-pointer"
              >
                <Search className="h-5 w-5" />
                Tìm Kiếm Ngay
              </button>
            </div>
            
            {/* Backdrop to close dropdown when clicking outside */}
            {activeDropdown && (
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setActiveDropdown(null)} 
              />
            )}
          </div>
        </div>
      </section>"""
    
    content = content[:start_idx] + new_content_block + content[end_idx:]
    print("SUCCESS SEARCH BAR")
else:
    print("FAILED TO MATCH SEARCH BAR")

with io.open('src/components/HomeView.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

