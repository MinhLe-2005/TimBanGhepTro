import re
import io

with io.open('src/components/HomeView.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Pattern to find from the end of max-w-xl to the end of Search Bar
pattern = r'(          </div>\n        </div>\n      </section>\n\n      \{\/\* Search Bar \*\/\}\n      <div className="relative z-20 max-w-5xl mx-auto px-4 -mt-6 mb-8">.*?\n      </div>)'

new_search_box = """          </div>

          {/* Right Search Box */}
          <div className="w-full lg:w-[380px] shrink-0 bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[2rem] p-6 shadow-2xl relative z-30 mt-8 lg:mt-0">
            <h3 className="text-white font-black text-[22px] mb-5 flex items-center gap-2.5 drop-shadow-md">
              <Search className="w-6 h-6 text-rose-300" />
              Tìm Bạn Ở Ghép
            </h3>
            
            <div className="flex flex-col gap-3.5">
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
                className="mt-2 w-full bg-rose-500 hover:bg-rose-600 text-white px-8 py-4.5 rounded-2xl text-[16px] font-black flex items-center justify-center gap-2.5 transition-all shadow-lg shadow-rose-500/30 active:scale-95 cursor-pointer"
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

new_content = re.sub(pattern, new_search_box, content, flags=re.DOTALL)

with io.open('src/components/HomeView.tsx', 'w', encoding='utf-8') as f:
    f.write(new_content)
