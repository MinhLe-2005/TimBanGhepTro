import io

with io.open('src/components/HomeView.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

start_marker = "{/* 5. Vì sao nên lập thỏa thuận sống chung - Redesigned Premium Bento Grid */}"
end_marker = "{/* Popular Roommates Modal */}"

start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

if start_idx != -1 and end_idx != -1:
    clean_sections = """{/* 5. Vì sao nên lập thỏa thuận sống chung - Clean & Professional */}
      <section className="mt-32 max-w-5xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
            Tại sao nên có Thỏa thuận sống chung?
          </h2>
          <p className="text-lg text-slate-500 font-medium max-w-2xl mx-auto">
            Giải quyết triệt để những mâu thuẫn không đáng có. Đặt ra quy tắc rõ ràng ngay từ ngày đầu tiên để bảo vệ quyền lợi của mọi người.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              title: "Đồng thuận giờ giấc",
              desc: "Tôn trọng giấc ngủ của nhau, duy trì không gian nghỉ ngơi thư thái để học tập và làm việc hiệu quả.",
              icon: <Clock className="w-6 h-6 text-[#006590]" />
            },
            {
              title: "Minh bạch chi phí",
              desc: "Thống nhất phân bổ sòng phẳng phí mạng wifi, tiền điện nước và các chi phí sinh hoạt chung cuối tháng.",
              icon: <Coins className="w-6 h-6 text-[#006590]" />
            },
            {
              title: "Phân chia việc nhà",
              desc: "Tránh tình trạng đùn đẩy đổ rác, dọn dẹp nhà bếp, vệ sinh phòng khách và giữ gìn không gian chung.",
              icon: <Sparkles className="w-6 h-6 text-[#006590]" />
            }
          ].map((item, idx) => (
            <div key={idx} className="flex flex-col items-center text-center p-6">
              <div className="w-14 h-14 rounded-xl bg-sky-50 flex items-center justify-center mb-6">
                {item.icon}
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">{item.title}</h3>
              <p className="text-[15px] text-slate-600 leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
        
        <div className="mt-12 flex justify-center">
          <button 
            onClick={() => onNavigateToTab("agreement")}
            className="flex items-center gap-2 text-[#006590] font-bold hover:text-sky-600 transition-colors"
          >
            Tìm hiểu thêm về Thỏa thuận <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* 5.5. Testimonials - Clean Layout */}
      <section className="mt-32 bg-slate-50 py-24 border-y border-slate-100">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Được tin dùng bởi cộng đồng
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: "Hoàng Oanh",
                role: "Sinh viên Kinh Tế",
                text: "Nhờ hồ sơ lối sống và phần đánh giá rõ ràng mà mình tìm được một bạn chung phòng khá hợp cạ. Tụi mình lập thỏa thuận sống chung trên web luôn, giờ sống rất thoải mái!"
              },
              {
                name: "Thành Đạt",
                role: "Nhân viên IT",
                text: "Mình làm đêm nên tìm bạn ghép cực khó. Lên RoomieMatch lọc tiêu chí 'Cú đêm' cái là ra ngay vài hồ sơ tiềm năng. Nền tảng quá xịn xò và trực quan."
              },
              {
                name: "Minh Anh",
                role: "Sinh viên FPT",
                text: "Giao diện chat tiện lợi, mình vừa trò chuyện thương lượng vừa chốt luôn các điều khoản chia tiền điện nước. Trải nghiệm rất an toàn và chuyên nghiệp!"
              }
            ].map((item, idx) => (
              <div key={idx} className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100/60">
                <div className="flex gap-1 mb-6">
                  {[...Array(5)].map((_, i) => (
                    <Sparkles key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-[15px] text-slate-700 leading-relaxed mb-8">
                  "{item.text}"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600">
                    {item.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-[14px] font-bold text-slate-900">{item.name}</p>
                    <p className="text-[13px] text-slate-500">{item.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. CTA Section - Minimalist */}
      <section className="mt-24 mb-12 max-w-5xl mx-auto px-4">
        <div className="bg-[#006590] rounded-3xl p-12 lg:p-20 text-center relative overflow-hidden">
          {/* Subtle background pattern */}
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
          
          <div className="relative z-10">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight mb-6">
              Sẵn sàng bắt đầu hành trình mới?
            </h2>
            <p className="text-sky-100 text-lg max-w-2xl mx-auto mb-10">
              Tạo hồ sơ trong 2 phút và khám phá hàng nghìn người ở ghép tiềm năng tại Đà Nẵng ngay hôm nay.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button 
                onClick={() => {
                  if (!currentUserProfile) {
                    onRequireAuth && onRequireAuth();
                  } else {
                    onOpenCreateProfile && onOpenCreateProfile();
                  }
                }}
                className="bg-white text-[#006590] hover:bg-sky-50 px-8 py-4 w-full sm:w-auto rounded-xl text-[16px] font-bold shadow-md transition-colors"
              >
                Tạo hồ sơ miễn phí
              </button>
              <button 
                onClick={() => onNavigateToTab("roommates")}
                className="bg-transparent border border-white/30 text-white hover:bg-white/10 px-8 py-4 w-full sm:w-auto rounded-xl text-[16px] font-bold transition-colors"
              >
                Khám phá ngay
              </button>
            </div>
          </div>
        </div>
      </section>

      """

    new_content = content[:start_idx] + clean_sections + content[end_idx:]
    with io.open('src/components/HomeView.tsx', 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("SUCCESS CLEAN REDESIGN")
else:
    print("FAILED TO MATCH")
