import io

with io.open('src/components/HomeView.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

start_str = "        {/* Content */}"
end_str = "      </section>"

start_idx = content.find(start_str)
end_idx = content.find(end_str, start_idx) + len(end_str)

if start_idx != -1 and end_idx != -1:
    new_content_block = """        {/* Content */}
        <div className="relative z-10 px-8 sm:px-12 lg:px-16 pb-12 pt-36 lg:pt-44 flex flex-col justify-between h-full min-h-[620px]">
          {/* Top/Left Text Content */}
          <div className="max-w-xl w-full">
            {/* Tag */}
            <div className="inline-flex items-center gap-2 mb-5 px-3.5 py-1.5 rounded-full bg-rose-500/30 border border-rose-400/50 text-rose-200 text-[12px] font-bold uppercase tracking-[0.12em]">
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

            <p className="text-white/70 text-[15px] leading-relaxed max-w-md mb-8 font-medium">
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
                className="inline-flex items-center gap-2.5 bg-white/15 hover:bg-white/25 backdrop-blur-sm border border-white/30 text-white px-8 py-3.5 rounded-full text-[15px] font-bold active:scale-95 transition-all duration-200 cursor-pointer"
              >
                Xem Phòng Cho Thuê
              </button>
            </div>

            {/* Bottom stats strip */}
            <div className="flex gap-6 mt-8 flex-wrap">
              {[
                { icon: <MapPin className="w-3.5 h-3.5" />, value: "7 Quận", label: "Toàn Đà Nẵng" },
                { icon: <UserCheck className="w-3.5 h-3.5" />, value: "Miễn phí", label: "Không mất phí" },
                { icon: <ShieldCheck className="w-3.5 h-3.5" />, value: "Bảo mật", label: "Thông tin riêng tư" },
              ].map(({ icon, value, label }, i) => (
                <div key={i} className="flex items-center gap-2 text-white">
                  <span className="text-white/60">{icon}</span>
                  <div>
                    <p className="text-[13px] font-black leading-none">{value}</p>
                    <p className="text-[11px] text-white/55 mt-0.5 font-medium">{label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Horizontal Search Box aligned to Right */}
          <div className="w-full flex flex-col items-end mt-12 lg:mt-0 relative z-30">
            <h3 className="text-white font-bold text-[15px] mb-3 pr-6 flex items-center gap-2 drop-shadow-md">
              <Search className="w-4 h-4 text-rose-300" />
              Tìm Kiếm Nhanh
            </h3>
            
            <div className="bg-white/10 backdrop-blur-xl rounded-full shadow-2xl p-2 border border-white/20 flex flex-col lg:flex-row items-center w-full lg:w-auto">
              {/* Item 1: Khu Vực */}
              <div className="relative w-full lg:w-[200px]">
                <div 
                  onClick={() => setActiveDropdown(activeDropdown === 'location' ? null : 'location')}
                  className="flex items-center justify-between px-6 py-3 w-full hover:bg-white/20 rounded-full cursor-pointer transition-colors group"
                >
                  <div className="flex items-center gap-3.5">
                    <MapPin className="text-white/70 h-5 w-5 group-hover:text-white transition-colors" />
                    <div className="flex flex-col items-start">
                      <span className="text-[10px] uppercase font-black text-white/60 tracking-wider mb-0.5">Khu vực</span>
                      <span className="text-[14px] font-bold text-white truncate max-w-[100px]">{selectedLocation}</span>
                    </div>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-white/50 transition-transform duration-200 ${activeDropdown === 'location' ? 'rotate-180' : ''}`} />
                </div>
                
                {activeDropdown === 'location' && (
                  <div className="absolute top-full left-0 mt-3 w-full sm:w-[240px] bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-fade-in-up">
                    {locations.map(loc => (
                      <div 
                        key={loc}
                        onClick={() => { setSelectedLocation(loc); setActiveDropdown(null); }}
                        className="px-6 py-2.5 hover:bg-slate-50 text-sm font-semibold text-slate-700 cursor-pointer flex items-center justify-between"
                      >
                        {loc}
                        {selectedLocation === loc && <Sparkles className="h-4 w-4 text-[#004e70]" />}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="hidden lg:block w-[1px] h-10 bg-white/20 mx-1"></div>

              {/* Item 2: Ngân Sách */}
              <div className="relative w-full lg:w-[200px]">
                <div 
                  onClick={() => setActiveDropdown(activeDropdown === 'budget' ? null : 'budget')}
                  className="flex items-center justify-between px-6 py-3 w-full hover:bg-white/20 rounded-full cursor-pointer transition-colors group"
                >
                  <div className="flex items-center gap-3.5">
                    <DollarSign className="text-white/70 h-5 w-5 group-hover:text-white transition-colors" />
                    <div className="flex flex-col items-start">
                      <span className="text-[10px] uppercase font-black text-white/60 tracking-wider mb-0.5">Ngân sách</span>
                      <span className="text-[14px] font-bold text-white truncate max-w-[100px]">{selectedBudget}</span>
                    </div>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-white/50 transition-transform duration-200 ${activeDropdown === 'budget' ? 'rotate-180' : ''}`} />
                </div>

                {activeDropdown === 'budget' && (
                  <div className="absolute top-full left-0 mt-3 w-full sm:w-[240px] bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-fade-in-up">
                    {budgets.map(budget => (
                      <div 
                        key={budget}
                        onClick={() => { setSelectedBudget(budget); setActiveDropdown(null); }}
                        className="px-6 py-2.5 hover:bg-slate-50 text-sm font-semibold text-slate-700 cursor-pointer flex items-center justify-between"
                      >
                        {budget}
                        {selectedBudget === budget && <Sparkles className="h-4 w-4 text-[#004e70]" />}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="hidden lg:block w-[1px] h-10 bg-white/20 mx-1"></div>

              {/* Item 3: Lối Sống */}
              <div className="relative w-full lg:w-[200px]">
                <div 
                  onClick={() => setActiveDropdown(activeDropdown === 'lifestyle' ? null : 'lifestyle')}
                  className="flex items-center justify-between px-6 py-3 w-full hover:bg-white/20 rounded-full cursor-pointer transition-colors group"
                >
                  <div className="flex items-center gap-3.5">
                    <UserCheck className="text-white/70 h-5 w-5 group-hover:text-white transition-colors" />
                    <div className="flex flex-col items-start">
                      <span className="text-[10px] uppercase font-black text-white/60 tracking-wider mb-0.5">Lối sống</span>
                      <span className="text-[14px] font-bold text-white truncate max-w-[100px]">{selectedLifestyle}</span>
                    </div>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-white/50 transition-transform duration-200 ${activeDropdown === 'lifestyle' ? 'rotate-180' : ''}`} />
                </div>

                {activeDropdown === 'lifestyle' && (
                  <div className="absolute top-full right-0 lg:-right-8 mt-3 w-full sm:w-[240px] bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-fade-in-up">
                    {lifestyles.map(life => (
                      <div 
                        key={life}
                        onClick={() => { setSelectedLifestyle(life); setActiveDropdown(null); }}
                        className="px-6 py-2.5 hover:bg-slate-50 text-sm font-semibold text-slate-700 cursor-pointer flex items-center justify-between"
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
                className="w-full lg:w-auto bg-rose-500 hover:bg-rose-600 text-white px-8 py-3.5 rounded-full text-[14px] font-bold flex items-center justify-center gap-2 transition-all shrink-0 shadow-lg shadow-rose-500/30 active:scale-95 ml-0 lg:ml-2 mt-2 lg:mt-0 cursor-pointer"
              >
                <Search className="h-4.5 w-4.5" />
                Tìm Kiếm
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
    
    new_content = content[:start_idx] + new_content_block + content[end_idx:]
    with io.open('src/components/HomeView.tsx', 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("SUCCESS")
else:
    print("FAILED TO MATCH")
