import io

with io.open('src/components/HomeView.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

start_marker = "{/* 5. Vì sao nên lập thỏa thuận sống chung - Clean & Professional */}"
end_marker = "{/* Popular Roommates Modal */}"

start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

if start_idx != -1 and end_idx != -1:
    premium_sections = """{/* 5. Vì sao nên lập thỏa thuận sống chung - Modern SaaS Layout */}
      <section className="mt-32 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-50 rounded-[2.5rem] p-8 sm:p-12 lg:p-16 border border-slate-100 flex flex-col lg:flex-row gap-16 items-center">
          
          {/* Left Column: Sticky/Main Content */}
          <div className="lg:w-1/2 space-y-8">
            <div className="inline-flex items-center gap-2 bg-[#006590]/10 text-[#006590] px-4 py-2 rounded-full text-sm font-bold">
              <ShieldCheck className="h-5 w-5" />
              Bảo vệ quyền lợi
            </div>
            
            <h2 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight leading-[1.15]">
              Tại sao nên có <br/>
              <span className="text-[#006590]">Thỏa thuận sống chung?</span>
            </h2>
            
            <p className="text-lg text-slate-600 font-medium leading-relaxed max-w-md">
              90% mâu thuẫn khi ở ghép đến từ sự thiếu minh bạch. Đặt ra quy tắc rõ ràng ngay từ ngày đầu tiên để bảo vệ quyền lợi và tình bạn của bạn.
            </p>
            
            <button 
              onClick={() => onNavigateToTab("agreement")}
              className="inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-8 py-4 rounded-2xl text-[16px] font-bold shadow-xl shadow-slate-900/20 transition-all hover:-translate-y-1"
            >
              Thiết lập thỏa thuận ngay <ArrowRight className="w-5 h-5" />
            </button>
          </div>

          {/* Right Column: Elegant Cards */}
          <div className="lg:w-1/2 flex flex-col gap-6 w-full">
            {[
              {
                title: "Đồng thuận giờ giấc",
                desc: "Tôn trọng giấc ngủ của nhau, duy trì không gian nghỉ ngơi thư thái để học tập và làm việc hiệu quả.",
                icon: <Clock className="w-6 h-6 text-sky-500" />
              },
              {
                title: "Minh bạch chi phí",
                desc: "Thống nhất phân bổ sòng phẳng phí mạng wifi, tiền điện nước và các chi phí sinh hoạt chung.",
                icon: <Coins className="w-6 h-6 text-emerald-500" />
              },
              {
                title: "Phân chia việc nhà",
                desc: "Tránh tình trạng đùn đẩy đổ rác, dọn dẹp nhà bếp, vệ sinh phòng khách và giữ gìn không gian chung.",
                icon: <Sparkles className="w-6 h-6 text-amber-500" />
              }
            ].map((item, idx) => (
              <div key={idx} className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-1 flex items-start gap-6">
                <div className="w-14 h-14 shrink-0 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center shadow-sm">
                  {item.icon}
                </div>
                <div>
                  <h3 className="text-[18px] font-black text-slate-900 mb-2">{item.title}</h3>
                  <p className="text-[14px] text-slate-500 font-medium leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
          
        </div>
      </section>

      {/* 6. CTA Section - Beautiful & Trustworthy */}
      <section className="mt-24 mb-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden bg-gradient-to-br from-[#004e70] to-[#006590] rounded-[2.5rem] p-12 lg:p-20 shadow-2xl flex flex-col lg:flex-row items-center justify-between gap-12">
          
          {/* Subtle overlay texture */}
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
          
          {/* Left Content */}
          <div className="relative z-10 lg:w-2/3 text-center lg:text-left">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-[1.15] mb-6">
              Sẵn sàng bắt đầu <br className="hidden lg:block"/> hành trình mới?
            </h2>
            <p className="text-sky-100 text-lg font-medium max-w-xl mx-auto lg:mx-0">
              Chỉ mất 2 phút để tạo hồ sơ và kết nối với hàng nghìn bạn ở ghép tiềm năng tại Đà Nẵng. Hệ thống thuật toán thông minh sẽ lo phần còn lại.
            </p>
          </div>
          
          {/* Right Actions */}
          <div className="relative z-10 lg:w-1/3 flex flex-col gap-4 w-full sm:w-auto">
            <button 
              onClick={() => {
                if (!currentUserProfile) {
                  onRequireAuth && onRequireAuth();
                } else {
                  onOpenCreateProfile && onOpenCreateProfile();
                }
              }}
              className="bg-white text-[#006590] hover:bg-sky-50 px-8 py-4.5 rounded-2xl text-[16px] font-black shadow-xl hover:-translate-y-1 transition-all w-full text-center"
            >
              Tạo hồ sơ miễn phí
            </button>
            <button 
              onClick={() => onNavigateToTab("roommates")}
              className="bg-white/10 backdrop-blur-md border-2 border-white/30 text-white hover:bg-white/20 px-8 py-4 rounded-2xl text-[16px] font-bold transition-all hover:-translate-y-1 w-full text-center"
            >
              Khám phá người dùng
            </button>
          </div>
          
        </div>
      </section>

      """

    new_content = content[:start_idx] + premium_sections + content[end_idx:]
    with io.open('src/components/HomeView.tsx', 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("SUCCESS PREMIUM REDESIGN")
else:
    print("FAILED TO MATCH")
