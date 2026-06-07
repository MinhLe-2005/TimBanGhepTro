import { Facebook, Instagram, Linkedin, Phone, Mail, MapPin } from "lucide-react";
import { useState } from "react";

export default function Footer({ onNavigateToTab }: { onNavigateToTab?: (tab: string) => void }) {
  return (
    <footer className="w-full px-4 sm:px-6 lg:px-8 pb-8">
      <div className="max-w-[1600px] mx-auto bg-white rounded-[32px] shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-slate-100 p-8 sm:p-12 lg:p-16">
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-16 mb-12">
          
          {/* 1. Logo & Desc */}
          <div className="lg:col-span-4 flex flex-col items-start">
            <div className="flex items-center cursor-pointer mb-5" onClick={() => onNavigateToTab?.("home")}>
              <div className="relative flex items-center justify-center w-7 h-7 mr-2">
                <div className="absolute left-0 w-4.5 h-4.5 rounded-full bg-rose-500 mix-blend-multiply opacity-90 shadow-sm" />
                <div className="absolute right-0 w-4.5 h-4.5 rounded-full bg-[#004e70] mix-blend-multiply opacity-90 shadow-sm" />
              </div>
              <span className="text-[24px] tracking-tight flex items-baseline">
                <span className="font-black text-slate-900">Roomie</span>
                <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-orange-400">Match</span>
              </span>
            </div>
            <p className="text-[14px] font-medium text-slate-500 leading-relaxed max-w-sm">
              Nền tảng tìm bạn ở ghép và phòng trọ thông minh dành cho giới trẻ tại Đà Nẵng. Kết nối nhanh chóng, an toàn và minh bạch.
            </p>
          </div>

          {/* 2. Dịch Vụ */}
          <div className="lg:col-span-2">
            <h4 className="text-[15px] font-extrabold text-slate-800 mb-6">Dịch Vụ</h4>
            <ul className="space-y-5">
              <li><a href="#roommates" className="text-[14px] font-semibold text-slate-500 hover:text-[#006590] transition-colors block">Tìm bạn ở ghép</a></li>
              <li><a href="#rooms" className="text-[14px] font-semibold text-slate-500 hover:text-[#006590] transition-colors block">Đăng tin cho thuê</a></li>
              <li><a href="#agreement" className="text-[14px] font-semibold text-slate-500 hover:text-[#006590] transition-colors block">Thỏa thuận sống chung</a></li>
            </ul>
          </div>

          {/* 3. Hỗ Trợ */}
          <div className="lg:col-span-2">
            <h4 className="text-[15px] font-extrabold text-slate-800 mb-6">Hỗ Trợ</h4>
            <ul className="space-y-5">
              <li><a href="#info?tab=about" className="text-[14px] font-semibold text-slate-500 hover:text-[#006590] transition-colors block">Về chúng tôi</a></li>
              <li><a href="#info?tab=help" className="text-[14px] font-semibold text-slate-500 hover:text-[#006590] transition-colors block">Trung tâm trợ giúp</a></li>
              <li><a href="#info?tab=safety" className="text-[14px] font-semibold text-slate-500 hover:text-[#006590] transition-colors block">Hướng dẫn an toàn</a></li>
              <li><a href="#info?tab=faq" className="text-[14px] font-semibold text-slate-500 hover:text-[#006590] transition-colors block">Câu hỏi thường gặp</a></li>
              <li><a href="#info?tab=terms" className="text-[14px] font-semibold text-slate-500 hover:text-[#006590] transition-colors block">Điều khoản & Bảo mật</a></li>
            </ul>
          </div>

          {/* 4. Liên Hệ & Kết Nối */}
          <div className="lg:col-span-4">
            <h4 className="text-[15px] font-extrabold text-slate-800 mb-6">Liên Hệ & Kết Nối</h4>
            <div className="space-y-4">
              <div className="flex items-center gap-2.5 text-[14px] font-semibold text-slate-500">
                <Phone className="w-4 h-4 text-[#006590]" />
                <span>Hotline: 0905.123.456</span>
              </div>
              <div className="flex items-center gap-2.5 text-[14px] font-semibold text-slate-500">
                <Mail className="w-4 h-4 text-[#006590]" />
                <span>Email: hi@roomiematch.vn</span>
              </div>
              <div className="flex items-start gap-2.5 text-[14px] font-semibold text-slate-500 mb-2">
                <MapPin className="w-4 h-4 text-[#006590] shrink-0 mt-0.5" />
                <span>470 Trần Đại Nghĩa, Ngũ Hành Sơn, TP. Đà Nẵng</span>
              </div>
              
              <div className="flex items-center gap-3 pt-2">
                <a href="#" className="w-10 h-10 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 hover:text-[#1877F2] hover:border-[#1877F2] hover:bg-blue-50 transition-all duration-300">
                  <Facebook className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 hover:text-[#E4405F] hover:border-[#E4405F] hover:bg-pink-50 transition-all duration-300">
                  <Instagram className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 hover:text-[#0A66C2] hover:border-[#0A66C2] hover:bg-blue-50 transition-all duration-300">
                  <Linkedin className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>
          
        </div>

        {/* Bottom Line */}
        <div className="pt-8 border-t border-slate-100 text-center sm:text-left">
          <p className="text-[13px] font-bold text-slate-400">
            © 2026 RoomieMatch Đà Nẵng. Kết nối không gian sống.
          </p>
        </div>

      </div>
    </footer>
  );
}
