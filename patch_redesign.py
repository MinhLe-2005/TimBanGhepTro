import io
import re

with io.open('src/components/HomeView.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

start_marker = "{/* 5. Vì sao nên lập thỏa thuận sống chung"
end_marker = "{/* Popular Roommates Modal */}"

start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

if start_idx != -1 and end_idx != -1:
    new_sections = """{/* 5. Vì sao nên lập thỏa thuận sống chung - Redesigned Premium Bento Grid */}
      <section className="mt-32">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-xs font-bold uppercase tracking-wider mb-4">
            <ShieldCheck className="w-4 h-4" />
            Bảo vệ quyền lợi
          </div>
          <h2 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight leading-[1.15] mb-6">
            Lý do thiết lập <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-sky-500">
              Thỏa thuận sống chung
            </span>
          </h2>
          <p className="text-[16px] text-slate-500 leading-relaxed font-medium">
            Mâu thuẫn thường bắt nguồn từ sự thiếu minh bạch. Giải quyết triệt để ngay từ ngày đầu tiên.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main big card */}
          <div className="md:col-span-2 bg-slate-900 rounded-[32px] p-8 sm:p-12 relative overflow-hidden group hover:shadow-2xl hover:shadow-indigo-500/20 transition-all duration-500">
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-indigo-500/30 blur-[80px] rounded-full pointer-events-none group-hover:bg-indigo-500/50 transition-all duration-700"></div>
            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-sky-500/20 blur-[80px] rounded-full pointer-events-none group-hover:bg-sky-500/40 transition-all duration-700"></div>
            
            <div className="relative z-10 flex flex-col h-full justify-between gap-12">
              <div>
                <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center mb-6 shadow-inner backdrop-blur-md">
                  <Clock className="w-7 h-7 text-indigo-300" />
                </div>
                <h3 className="text-3xl font-black text-white mb-4 leading-tight">Đồng thuận <br/> giờ giấc tĩnh</h3>
                <p className="text-slate-300/80 font-medium leading-relaxed max-w-sm text-lg">
                  Tôn trọng giấc ngủ của nhau, duy trì không gian nghỉ ngơi thư thái để học tập và làm việc hiệu quả.
                </p>
              </div>
              
              <button onClick={() => onNavigateToTab("agreement")} className="inline-flex items-center gap-2 text-indigo-300 font-bold hover:text-white transition-colors w-fit group/btn">
                Tạo thỏa thuận ngay <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          {/* Secondary vertical card */}
          <div className="bg-gradient-to-b from-amber-50 to-orange-50/50 rounded-[32px] p-8 sm:p-12 border border-amber-100/50 hover:shadow-xl hover:shadow-amber-500/10 transition-all duration-500 group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-200/40 blur-[40px] rounded-full pointer-events-none"></div>
            
            <div className="w-14 h-14 rounded-2xl bg-amber-100 border border-amber-200 flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform duration-500">
              <Coins className="w-7 h-7 text-amber-600" />
            </div>
            <h3 className="text-2xl font-black text-slate-800 mb-4 leading-tight">Minh bạch <br/> dòng tiền</h3>
            <p className="text-slate-600 font-medium leading-relaxed">
              Thống nhất phân bổ sòng phẳng phí mạng wifi, điện nước sinh hoạt chung cuối tháng.
            </p>
          </div>

          {/* Third horizontal card */}
          <div className="md:col-span-3 bg-emerald-50/50 rounded-[32px] p-8 sm:p-10 border border-emerald-100 flex flex-col sm:flex-row items-center gap-8 hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-500 group">
            <div className="w-20 h-20 shrink-0 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center shadow-sm group-hover:rotate-12 transition-transform duration-500">
              <Sparkles className="w-10 h-10 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-800 mb-3">Phân chia việc nhà rạch ròi</h3>
              <p className="text-slate-600 font-medium leading-relaxed max-w-3xl text-[15px]">
                Tránh tình trạng đùn đẩy đổ rác, dọn dẹp nhà bếp, vệ sinh phòng khách. Giữ gìn không gian chung luôn sạch sẽ và tạo thói quen tốt cho tất cả mọi người trong phòng.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5.5. Testimonials - Redesigned Dynamic Cards */}
      <section className="mt-32 relative">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rose-50 border border-rose-100 text-rose-600 text-xs font-bold uppercase tracking-wider mb-4">
            <Heart className="w-4 h-4" />
            Cộng Đồng
          </div>
          <h2 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight pb-2">
            Khách hàng nói gì về <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-orange-400">RoomieMatch?</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 px-4 sm:px-0">
          {[
            {
              name: "Hoàng Oanh",
              role: "Sinh viên Kinh Tế",
              text: "Nhờ hồ sơ lối sống và phần đánh giá rõ ràng mà mình tìm được một bạn chung phòng khá hợp cạ. Tụi mình lập thỏa thuận sống chung trên web luôn, giờ sống rất thoải mái!",
              rating: 5,
              color: "bg-gradient-to-br from-rose-400 to-pink-500",
              theme: "light"
            },
            {
              name: "Thành Đạt",
              role: "Nhân viên IT",
              text: "Mình làm đêm nên tìm bạn ghép cực khó. Lên RoomieMatch lọc tiêu chí 'Cú đêm' cái là ra ngay vài hồ sơ tiềm năng. Nền tảng quá xịn xò và trực quan.",
              rating: 5,
              color: "bg-slate-800",
              theme: "dark"
            },
            {
              name: "Minh Anh",
              role: "Sinh viên FPT",
              text: "Giao diện chat tiện lợi, mình vừa trò chuyện thương lượng vừa chốt luôn các điều khoản chia tiền điện nước. Trải nghiệm rất an toàn và chuyên nghiệp!",
              rating: 5,
              color: "bg-gradient-to-br from-emerald-400 to-teal-500",
              theme: "light"
            }
          ].map((item, idx) => (
            <div 
              key={idx} 
              className={`relative p-8 sm:p-10 rounded-[2.5rem] border transition-all duration-500 hover:-translate-y-2 group ${
                item.theme === 'dark' 
                  ? 'bg-slate-900 border-slate-800 text-white shadow-2xl shadow-slate-900/20' 
                  : 'bg-white border-slate-100 text-slate-800 shadow-xl shadow-slate-200/50'
              }`}
            >
              {/* Decorative Quote Icon */}
              <div className={`absolute top-8 right-8 text-7xl font-serif opacity-10 leading-none ${item.theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                "
              </div>
              
              <div className="flex gap-1 mb-6">
                {[...Array(item.rating)].map((_, i) => (
                  <Sparkles key={i} className="w-5 h-5 text-amber-400 fill-amber-400" />
                ))}
              </div>
              
              <p className={`text-[15px] font-medium leading-relaxed mb-10 ${item.theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                "{item.text}"
              </p>
              
              <div className="flex items-center gap-4 mt-auto">
                <div className={`w-14 h-14 rounded-full ${item.color} flex items-center justify-center font-black text-xl text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  {item.name.charAt(0)}
                </div>
                <div>
                  <p className={`text-[16px] font-black ${item.theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{item.name}</p>
                  <p className={`text-[12px] font-bold uppercase tracking-widest mt-0.5 ${item.theme === 'dark' ? 'text-slate-400' : 'text-slate-400'}`}>{item.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. CTA Section - Photo Background Glassmorphism */}
      <section className="relative overflow-hidden rounded-[3rem] mt-32 shadow-2xl">
        {/* Background Image */}
        <img 
          src="https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=1600&auto=format&fit=crop" 
          alt="Căn hộ cao cấp"
          className="absolute inset-0 w-full h-full object-cover scale-105 group-hover:scale-100 transition-transform duration-[10s]"
        />
        {/* Gradients to ensure text readability */}
        <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-[2px]"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#006590]/80 via-transparent to-slate-900/50"></div>

        <div className="relative z-10 px-8 py-24 sm:py-32 text-center max-w-4xl mx-auto flex flex-col items-center">
          <div className="w-20 h-20 bg-white/10 backdrop-blur-xl rounded-full border border-white/20 flex items-center justify-center mb-8 shadow-2xl shadow-sky-500/20">
            <Home className="w-10 h-10 text-sky-300" />
          </div>
          
          <h2 className="text-4xl sm:text-5xl lg:text-7xl font-black text-white tracking-tight leading-[1.1] mb-6 drop-shadow-xl">
            Sẵn sàng bắt đầu <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-300 to-emerald-300">
              hành trình mới?
            </span>
          </h2>
          
          <p className="text-sky-50/80 text-lg sm:text-xl font-medium max-w-2xl mx-auto leading-relaxed mb-12 drop-shadow-md">
            Chỉ mất 2 phút để tạo hồ sơ và kết nối với hàng nghìn bạn ở ghép tiềm năng tại Đà Nẵng. Hệ thống thuật toán thông minh sẽ lo phần còn lại.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-5 w-full sm:w-auto">
            <button 
              onClick={() => {
                if (!currentUserProfile) {
                  onRequireAuth && onRequireAuth();
                } else {
                  onOpenCreateProfile && onOpenCreateProfile();
                }
              }}
              className="group relative flex items-center justify-center gap-3 bg-white text-slate-900 hover:bg-sky-50 px-10 py-5 w-full sm:w-auto rounded-full text-[16px] font-black shadow-[0_0_40px_rgba(255,255,255,0.2)] hover:shadow-[0_0_60px_rgba(255,255,255,0.4)] hover:-translate-y-1 transition-all duration-300 active:scale-95"
            >
              Tạo hồ sơ miễn phí
              <ArrowUpRight className="h-5 w-5 text-slate-400 group-hover:text-slate-900 transition-colors" />
            </button>
            <button 
              onClick={() => onNavigateToTab("roommates")}
              className="group flex items-center justify-center gap-3 bg-white/10 backdrop-blur-md border-2 border-white/30 text-white hover:bg-white/20 hover:border-white/50 px-10 py-4.5 w-full sm:w-auto rounded-full text-[16px] font-bold transition-all duration-300 active:scale-95 hover:-translate-y-1"
            >
              Khám phá người dùng
            </button>
          </div>
        </div>
      </section>

      """

    new_content = content[:start_idx] + new_sections + content[end_idx:]
    with io.open('src/components/HomeView.tsx', 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("SUCCESS REDESIGN")
else:
    print("FAILED TO MATCH")
