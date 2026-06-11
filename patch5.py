import io

with io.open('src/components/HomeView.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update Badges
old_badges = """        {/* Floating animated badges - Grouped on Top Left */}
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
              <p className="text-[10px] text-white/90 font-bold uppercase tracking-widest leading-none mb-0.5 drop-shadow-md">Người dùng</p>
              <p className="text-[15px] font-black leading-none drop-shadow-md">{roommates.length} Thành viên</p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-white/25 backdrop-blur-2xl border border-white/50 px-4 py-3 rounded-2xl text-white shadow-[0_8px_30px_rgb(0,0,0,0.12)]" style={{animation: 'float 4s ease-in-out infinite 1s'}}>
            <span className="w-9 h-9 rounded-full bg-rose-400/50 flex items-center justify-center shadow-inner border border-white/20">
              <Home className="w-4.5 h-4.5 text-rose-50 drop-shadow-md" />
            </span>
            <div>
              <p className="text-[10px] text-white/90 font-bold uppercase tracking-widest leading-none mb-0.5 drop-shadow-md">Phòng cho thuê</p>
              <p className="text-[15px] font-black leading-none drop-shadow-md">{rooms.length} Tin đăng</p>
            </div>
          </div>
        </div>"""

new_badges = """        {/* Floating animated badges - Grouped on Top Left */}
        <div className="absolute top-8 left-8 lg:left-16 hidden lg:flex flex-wrap items-center gap-4 z-20">
          <div className="flex items-center gap-3 bg-slate-900/60 backdrop-blur-md border border-white/20 px-4 py-3 rounded-2xl text-white shadow-2xl" style={{animation: 'float 4s ease-in-out infinite'}}>
            <span className="w-9 h-9 rounded-full bg-emerald-500/30 flex items-center justify-center border border-emerald-400/30">
              <ShieldCheck className="w-4.5 h-4.5 text-emerald-300 drop-shadow-md" />
            </span>
            <div>
              <p className="text-[10px] text-emerald-200/80 font-bold uppercase tracking-widest leading-none mb-0.5">Uy tín</p>
              <p className="text-[15px] font-black leading-none text-white drop-shadow-md">100% An Toàn</p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-slate-900/60 backdrop-blur-md border border-white/20 px-4 py-3 rounded-2xl text-white shadow-2xl" style={{animation: 'float 4s ease-in-out infinite 0.5s'}}>
            <span className="w-9 h-9 rounded-full bg-sky-500/30 flex items-center justify-center border border-sky-400/30">
              <Users className="w-4.5 h-4.5 text-sky-300 drop-shadow-md" />
            </span>
            <div>
              <p className="text-[10px] text-sky-200/80 font-bold uppercase tracking-widest leading-none mb-0.5">Người dùng</p>
              <p className="text-[15px] font-black leading-none text-white drop-shadow-md">{roommates.length} Thành viên</p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-slate-900/60 backdrop-blur-md border border-white/20 px-4 py-3 rounded-2xl text-white shadow-2xl" style={{animation: 'float 4s ease-in-out infinite 1s'}}>
            <span className="w-9 h-9 rounded-full bg-rose-500/30 flex items-center justify-center border border-rose-400/30">
              <Home className="w-4.5 h-4.5 text-rose-300 drop-shadow-md" />
            </span>
            <div>
              <p className="text-[10px] text-rose-200/80 font-bold uppercase tracking-widest leading-none mb-0.5">Phòng cho thuê</p>
              <p className="text-[15px] font-black leading-none text-white drop-shadow-md">{rooms.length} Tin đăng</p>
            </div>
          </div>
        </div>"""

if old_badges in content:
    content = content.replace(old_badges, new_badges)
    print("SUCCESS BADGES")
else:
    print("FAILED BADGES")


# 2. Update Search Box
old_search_container = """          {/* Vertical Search Card on the Right */}
          <div className="w-full lg:w-[380px] shrink-0 bg-white/10 backdrop-blur-3xl border border-white/30 rounded-[2.5rem] p-6 sm:p-8 shadow-[0_30px_60px_rgba(0,0,0,0.3)] relative z-30 lg:-mt-6">
            <h3 className="text-white font-black text-[22px] mb-6 flex items-center gap-2.5 drop-shadow-md">
              <Search className="w-6 h-6 text-rose-300" />
              Tìm Bạn Ở Ghép
            </h3>"""

new_search_container = """          {/* Vertical Search Card on the Right */}
          <div 
            className="w-full lg:w-[380px] shrink-0 bg-white/10 backdrop-blur-3xl border border-white/30 rounded-[2.5rem] p-6 sm:p-8 shadow-[0_30px_60px_rgba(0,0,0,0.3)] relative z-30 lg:-mt-6"
            style={{animation: 'float 6s ease-in-out infinite 0.5s'}}
          >
            <h3 className="text-transparent bg-clip-text bg-gradient-to-r from-rose-300 to-amber-300 font-black text-[24px] mb-6 flex items-center gap-2.5 drop-shadow-lg">
              <Search className="w-6 h-6 text-rose-300" />
              Tìm Bạn Ở Ghép
            </h3>"""

if old_search_container in content:
    content = content.replace(old_search_container, new_search_container)
    print("SUCCESS SEARCH CONTAINER")
else:
    print("FAILED SEARCH CONTAINER")


# 3. Update Button
old_button = """              <button 
                onClick={() => onNavigateToTab("roommates", { location: selectedLocation, budget: selectedBudget, lifestyle: selectedLifestyle })}
                className="mt-2 w-full bg-rose-500 hover:bg-rose-600 text-white px-8 py-4.5 rounded-2xl text-[16px] font-black flex items-center justify-center gap-2.5 transition-all shadow-xl shadow-rose-500/30 active:scale-95 cursor-pointer"
              >
                <Search className="h-5 w-5" />
                Tìm Kiếm Ngay
              </button>"""

new_button = """              <button 
                onClick={() => onNavigateToTab("roommates", { location: selectedLocation, budget: selectedBudget, lifestyle: selectedLifestyle })}
                className="mt-2 w-full bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600 text-white px-8 py-4.5 rounded-2xl text-[16px] font-black flex items-center justify-center gap-2.5 transition-all shadow-xl shadow-orange-500/30 active:scale-95 cursor-pointer"
              >
                <Search className="h-5 w-5" />
                Tìm Kiếm Ngay
              </button>"""

if old_button in content:
    content = content.replace(old_button, new_button)
    print("SUCCESS BUTTON")
else:
    print("FAILED BUTTON")

with io.open('src/components/HomeView.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

