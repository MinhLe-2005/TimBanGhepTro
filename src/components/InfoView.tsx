import { useState, useEffect } from "react";
import { 
  Info, 
  HelpCircle, 
  ShieldCheck, 
  MessageCircleQuestion, 
  FileLock2,
  ChevronRight,
  Sparkles,
  User,
  Mail,
  MessageSquare,
  AlertTriangle,
  Flag,
  Star
} from "lucide-react";

export const INFO_TABS = [
  { id: "about", label: "Về chúng tôi", icon: Info },
  { id: "help", label: "Trung tâm trợ giúp", icon: HelpCircle },
  { id: "safety", label: "Hướng dẫn an toàn", icon: ShieldCheck },
  { id: "faq", label: "Câu hỏi thường gặp", icon: MessageCircleQuestion },
  { id: "terms", label: "Điều khoản & Bảo mật", icon: FileLock2 },
];

export default function InfoView() {
  const [activeTab, setActiveTab] = useState("about");

  // Read URL query parameter if available to jump directly to a tab
  // e.g., #info?tab=faq
  useEffect(() => {
    const handleHashChange = () => {
      const search = window.location.hash.split("?")[1];
      if (search) {
        const params = new URLSearchParams(search);
        const tabParam = params.get("tab");
        if (tabParam && INFO_TABS.find(t => t.id === tabParam)) {
          setActiveTab(tabParam);
        }
      }
    };
    handleHashChange();
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    // Update hash query silently
    window.history.replaceState(null, "", `#info?tab=${tabId}`);
  };

  const renderContent = () => {
    switch (activeTab) {
      case "about":
        return (
          <div className="space-y-8 animate-fade-in">
            {/* Hero Section */}
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#004e70] to-[#006590] p-8 sm:p-10 text-white">
              <div className="relative z-10 max-w-2xl">
                <span className="inline-block px-3 py-1 mb-4 text-xs font-bold uppercase tracking-wider text-sky-100 bg-white/20 rounded-full backdrop-blur-md">
                  Về RoomieMatch
                </span>
                <h2 className="text-3xl sm:text-4xl font-black mb-4 leading-tight">
                  Kết nối từ <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-200 to-white">trái tim</span> đến không gian sống
                </h2>
                <p className="text-sky-100 text-sm sm:text-base leading-relaxed">
                  RoomieMatch hỗ trợ người dùng đăng tin, trò chuyện, đánh giá và lập thỏa thuận sống chung. Nền tảng cung cấp công cụ giảm rủi ro, nhưng không thể bảo chứng tuyệt đối danh tính, phòng trọ hoặc giao dịch giữa người dùng.
                </p>
              </div>
              <div className="absolute top-0 right-0 -mt-10 -mr-10 opacity-10">
                <Info className="w-64 h-64" />
              </div>
            </div>

            {/* Features/Values Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div className="bg-sky-50 rounded-2xl p-6 border border-sky-100">
                <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-sm mb-4 text-[#004e70]">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-800 mb-2">Tìm Kiếm Theo Nhu Cầu</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Lọc hồ sơ theo khu vực, ngân sách, loại hình và thói quen sinh hoạt để chủ động tìm người phù hợp.
                </p>
              </div>
              <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-100">
                <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-sm mb-4 text-emerald-600">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-800 mb-2">Công Cụ An Toàn</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Người dùng có thể xem đánh giá, báo cáo nội dung, chặn tài khoản và lưu thỏa thuận. Bạn vẫn cần tự kiểm tra giấy tờ và phòng trước khi giao dịch.
                </p>
              </div>
              <div className="bg-rose-50 rounded-2xl p-6 border border-rose-100">
                <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-sm mb-4 text-rose-600">
                  <User className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-800 mb-2">Cộng Đồng Hiện Đại</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Tạo ra một hệ sinh thái những người trẻ văn minh, tôn trọng sự khác biệt và cùng nhau xây dựng không gian sống hạnh phúc.
                </p>
              </div>
            </div>
          </div>
        );
      case "help":
        return (
          <div className="space-y-8 animate-fade-in">
            <div className="text-center pb-6 border-b border-slate-100">
              <div className="w-16 h-16 mx-auto bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
                <HelpCircle className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-black text-slate-800">Chúng tôi có thể giúp gì cho bạn?</h2>
              <p className="text-sm text-slate-500 mt-2">Gửi thông tin rõ ràng và ảnh minh chứng để được kiểm tra nhanh hơn</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <a href="mailto:support@roomiematch.vn" className="group block bg-white border border-slate-200 rounded-2xl p-6 hover:border-blue-300 hover:shadow-lg transition-all duration-300">
                <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Mail className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-800">Gửi Email Hỗ Trợ</h3>
                <p className="text-sm text-slate-500 mt-1">support@roomiematch.vn</p>
                <p className="text-xs text-slate-400 mt-3">Thời gian phản hồi phụ thuộc mức độ và lượng yêu cầu</p>
              </a>

              <div className="group block bg-white border border-slate-200 rounded-2xl p-6 hover:border-emerald-300 hover:shadow-lg transition-all duration-300">
                <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-800">Báo Cáo Trong Ứng Dụng</h3>
                <p className="text-sm text-slate-500 mt-1">Tại hồ sơ hoặc cuộc trò chuyện</p>
                <p className="text-xs text-slate-400 mt-3">Báo cáo được chuyển tới khu vực quản trị để xem xét</p>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-900 leading-relaxed">
                Nếu đã chuyển tiền hoặc nghi có hành vi chiếm đoạt, hãy lưu tin nhắn, biên lai, số tài khoản và liên hệ ngân hàng hoặc cơ quan công an. Báo cáo trên RoomieMatch giúp quản trị viên kiểm tra tài khoản, không thay thế việc trình báo.
              </p>
            </div>
          </div>
        );
      case "safety":
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-800">Cẩm nang an toàn</h2>
                <p className="text-sm text-slate-500">Bảo vệ bản thân khi tìm trọ và bạn ở ghép</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200">
                <h3 className="font-bold text-amber-900 mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Không có một dấu hiệu nào bảo đảm an toàn 100%
                </h3>
                <p className="text-sm text-amber-800 leading-relaxed">
                  Tài khoản đăng nhập, điểm uy tín và đánh giá chỉ là dữ liệu tham khảo. Hãy kết hợp nhiều dấu hiệu, gặp trực tiếp và kiểm tra quyền cho thuê trước khi đặt cọc.
                </p>
              </div>

              <div className="grid sm:grid-cols-3 gap-3">
                <div className="border border-slate-200 rounded-xl p-4">
                  <ShieldCheck className="w-5 h-5 text-sky-600 mb-2" />
                  <h3 className="font-bold text-slate-800 text-sm">Xác minh danh tính</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">Website chưa có quy trình xác minh giấy tờ đầy đủ, nên hiện không dùng dấu xác minh để bảo chứng người đăng.</p>
                </div>
                <div className="border border-slate-200 rounded-xl p-4">
                  <Star className="w-5 h-5 text-amber-500 mb-2" />
                  <h3 className="font-bold text-slate-800 text-sm">Mức uy tín</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">Được quy đổi từ trung bình đánh giá sao. Ví dụ 4,5/5 tương ứng 90%.</p>
                </div>
                <div className="border border-slate-200 rounded-xl p-4">
                  <Flag className="w-5 h-5 text-rose-500 mb-2" />
                  <h3 className="font-bold text-slate-800 text-sm">Báo cáo</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">Giúp quản trị viên xem xét bằng chứng và khóa tài khoản khi xác định có vi phạm.</p>
                </div>
              </div>

              <div className="flex gap-4 p-5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <span className="font-black text-lg">1</span>
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 mb-1">Xác minh người đăng tin</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">Đối chiếu tên người nhận tiền với giấy tờ và quyền cho thuê. Không yêu cầu người lạ gửi ảnh CCCD đầy đủ qua chat; khi cần đối chiếu, nên gặp trực tiếp và che các thông tin không cần thiết.</p>
                </div>
              </div>

              <div className="flex gap-4 p-5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                  <span className="font-black text-lg">2</span>
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 mb-1">Gặp mặt ở nơi công cộng</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">Cho những lần hẹn gặp mặt bạn cùng phòng đầu tiên để trao đổi, hãy chọn các quán cà phê đông người thay vì đến thẳng những khu trọ hẻo lánh một mình.</p>
                </div>
              </div>

              <div className="flex gap-4 p-5 rounded-2xl bg-rose-50 border border-rose-200 shadow-sm">
                <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                  <span className="font-black text-lg">3</span>
                </div>
                <div>
                  <h3 className="font-bold text-rose-800 mb-1">Không chuyển khoản nếu chưa xem phòng</h3>
                  <p className="text-sm text-rose-700 leading-relaxed">Kẻ gian thường hối thúc chuyển tiền cọc “giữ chỗ”. Không chuyển tiền khi chưa xem phòng, xác minh người có quyền cho thuê và đọc rõ điều kiện hoàn cọc bằng văn bản.</p>
                </div>
              </div>

              <div className="flex gap-4 p-5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <span className="font-black text-lg">4</span>
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 mb-1">Bảo vệ thông tin cá nhân</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">Không vội vàng cung cấp địa chỉ nhà riêng chính xác, số điện thoại thật hoặc CMND/CCCD cho người lạ trên mạng khi chưa xác minh được mức độ tin cậy của họ.</p>
                </div>
              </div>

              <div className="flex gap-4 p-5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <span className="font-black text-lg">5</span>
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 mb-1">Khảo sát kỹ khu vực xung quanh</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">Khi đi xem phòng, hãy để ý đến an ninh khu vực: hẻm có đèn đường không, cổng rào có chắc chắn không, camera an ninh và tình hình an ninh trật tự của xóm trọ.</p>
                </div>
              </div>

              <div className="flex gap-4 p-5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-10 h-10 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                  <span className="font-black text-lg">6</span>
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 mb-1">Ký Bản Cam Kết Sống Chung</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">Nếu quyết định ở ghép, hãy soạn thảo "Bản Cam Kết Sống Chung" trên RoomieMatch để thống nhất rõ ràng về chi phí và nếp sinh hoạt ngay từ ngày đầu, tránh mâu thuẫn về sau.</p>
                </div>
              </div>
            </div>
          </div>
        );
      case "faq":
        return (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-2xl font-black text-slate-800 mb-6">Câu hỏi thường gặp (FAQ)</h2>
            <div className="space-y-4">
              <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all">
                <h4 className="font-bold text-slate-800 flex items-start gap-3">
                  <span className="text-sky-500 mt-0.5"><MessageCircleQuestion className="w-5 h-5" /></span>
                  1. Đăng tin trên RoomieMatch có mất phí không?
                </h4>
                <p className="text-sm text-slate-600 mt-3 ml-8 leading-relaxed">
                  RoomieMatch là nền tảng hoàn toàn <strong className="text-emerald-600">miễn phí 100%</strong>. Mọi tính năng bao gồm đăng tin, ghép đôi, nhắn tin và tạo thỏa thuận đều không thu phí người dùng. Chúng tôi xây dựng cộng đồng này với mong muốn hỗ trợ tối đa việc tìm kiếm người bạn cùng phòng lý tưởng cho giới trẻ.
                </p>
              </div>
              <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all">
                <h4 className="font-bold text-slate-800 flex items-start gap-3">
                  <span className="text-sky-500 mt-0.5"><MessageCircleQuestion className="w-5 h-5" /></span>
                  2. Mức uy tín được tính như thế nào?
                </h4>
                <p className="text-sm text-slate-600 mt-3 ml-8 leading-relaxed">
                  Mức uy tín hiện được quy đổi trực tiếp từ điểm đánh giá trung bình: số sao trung bình chia cho 5 rồi nhân 100. Ví dụ 4,5/5 sao tương ứng 90%. Hãy xem cả số lượng, nội dung và thời gian đánh giá; một đánh giá 5 sao duy nhất chưa đủ để kết luận người đó đáng tin.
                </p>
              </div>
              <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all">
                <h4 className="font-bold text-slate-800 flex items-start gap-3">
                  <span className="text-sky-500 mt-0.5"><MessageCircleQuestion className="w-5 h-5" /></span>
                  3. Làm sao để biết phòng trọ đó là thật hay lừa đảo?
                </h4>
                <p className="text-sm text-slate-600 mt-3 ml-8 leading-relaxed">
                  Không thể xác định chắc chắn chỉ từ một tin đăng. Hãy kiểm tra ảnh bằng tìm kiếm hình ảnh ngược, so sánh giá khu vực, gọi video hoặc xem phòng trực tiếp, đối chiếu người nhận tiền với người có quyền cho thuê và yêu cầu văn bản về tiền cọc. Giá quá rẻ, thúc giục chuyển tiền và từ chối gặp mặt là dấu hiệu rủi ro cao.
                </p>
              </div>
              <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all">
                <h4 className="font-bold text-slate-800 flex items-start gap-3">
                  <span className="text-sky-500 mt-0.5"><MessageCircleQuestion className="w-5 h-5" /></span>
                  4. Tôi có thể báo cáo người dùng có hành vi xấu không?
                </h4>
                <p className="text-sm text-slate-600 mt-3 ml-8 leading-relaxed">
                  Có. Bạn có thể báo cáo tại hồ sơ hoặc cuộc trò chuyện và nên đính kèm ảnh minh chứng. Báo cáo sẽ xuất hiện trong khu vực quản trị để xem xét; quản trị viên có thể khóa tài khoản nếu xác định có vi phạm. Trong trường hợp khẩn cấp hoặc đã mất tiền, hãy liên hệ ngân hàng và cơ quan chức năng.
                </p>
              </div>
              <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all">
                <h4 className="font-bold text-slate-800 flex items-start gap-3">
                  <span className="text-sky-500 mt-0.5"><MessageCircleQuestion className="w-5 h-5" /></span>
                  5. Tôi có thể xóa tài khoản không?
                </h4>
                <p className="text-sm text-slate-600 mt-3 ml-8 leading-relaxed">
                  Website hiện chưa có nút tự xóa tài khoản. Bạn có thể gửi yêu cầu tới support@roomiematch.vn từ email đã đăng ký. Yêu cầu cần được xác minh trước khi xử lý; một số dữ liệu có thể phải lưu trong thời hạn cần thiết để giải quyết khiếu nại, chống gian lận hoặc tuân thủ pháp luật.
                </p>
              </div>
              <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all">
                <h4 className="font-bold text-slate-800 flex items-start gap-3">
                  <span className="text-sky-500 mt-0.5"><MessageCircleQuestion className="w-5 h-5" /></span>
                  6. Bản cam kết sống chung có giá trị pháp lý không?
                </h4>
                <p className="text-sm text-slate-600 mt-3 ml-8 leading-relaxed">
                  Đây là bản ghi thỏa thuận về nếp sống và chi phí giữa hai người dùng, không phải hợp đồng thuê nhà và RoomieMatch không bảo đảm giá trị pháp lý của bản ghi. Khi thuê phòng hoặc đặt cọc, hai bên vẫn nên lập hợp đồng riêng, xác định đúng chủ thể và tham khảo người có chuyên môn khi cần.
                </p>
              </div>
            </div>
          </div>
        );
      case "terms":
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-100">
              <div className="w-12 h-12 bg-slate-100 text-slate-700 rounded-2xl flex items-center justify-center">
                <FileLock2 className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-800">Điều khoản & Bảo mật</h2>
                <p className="text-sm text-slate-500">Cập nhật lần cuối: 09/06/2026</p>
              </div>
            </div>

            <div className="space-y-8 text-sm text-slate-600 leading-relaxed">
              <div>
                <h3 className="font-bold text-slate-800 text-base mb-2">1. Trách nhiệm người dùng</h3>
                <p className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  Người dùng phải cung cấp thông tin trung thực và chỉ đăng phòng mà mình có quyền cho thuê hoặc giới thiệu. Báo cáo vi phạm sẽ được xem xét dựa trên nội dung và bằng chứng hiện có. Tùy mức độ, RoomieMatch có thể ẩn nội dung, hạn chế hoặc khóa tài khoản; trường hợp có dấu hiệu vi phạm pháp luật có thể được chuyển cho cơ quan có thẩm quyền theo yêu cầu hợp lệ.
                </p>
              </div>
              
              <div>
                <h3 className="font-bold text-slate-800 text-base mb-2">2. Thu thập và bảo mật thông tin</h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li>RoomieMatch cam kết <strong>không bán hoặc chia sẻ trái phép</strong> số điện thoại, email và dữ liệu cá nhân của bạn cho bên thứ ba vì mục đích quảng cáo hoặc thương mại.</li>
                  <li>Các thông tin hồ sơ và thói quen bạn nhập được dùng để hiển thị, lọc tìm kiếm và cung cấp chức năng của nền tảng.</li>
                  <li>Tin nhắn được truyền qua kết nối bảo mật của nhà cung cấp dịch vụ, nhưng hiện không được quảng cáo là mã hóa đầu cuối. Không gửi mật khẩu, mã OTP, ảnh giấy tờ đầy đủ hoặc thông tin ngân hàng qua chat.</li>
                  <li>Bạn có thể yêu cầu truy cập, chỉnh sửa hoặc xóa dữ liệu qua email hỗ trợ. Việc xử lý phụ thuộc bước xác minh và nghĩa vụ lưu trữ hợp pháp.</li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-slate-800 text-base mb-2">3. Hành vi bị nghiêm cấm</h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li>Nghiêm cấm sử dụng RoomieMatch để môi giới mại dâm, tìm "sugar baby", quấy rối tình dục dưới bất kỳ hình thức nào.</li>
                  <li>Nghiêm cấm spam tin nhắn quảng cáo các dịch vụ không liên quan đến phòng trọ và sinh hoạt lưu trú.</li>
                  <li>Nghiêm cấm lôi kéo người dùng tham gia các hình thức đa cấp, cá cược, hoặc đầu tư tài chính bất hợp pháp.</li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-slate-800 text-base mb-2">4. Giới hạn bảo chứng và xử lý sự cố</h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li>RoomieMatch là nền tảng kết nối, không phải bên cho thuê, môi giới, ngân hàng hoặc cơ quan xác minh danh tính chuyên trách.</li>
                  <li>Tài khoản đăng nhập, đánh giá và mức uy tín không phải cam kết rằng người dùng hoặc giao dịch chắc chắn an toàn.</li>
                  <li>Người dùng chịu trách nhiệm kiểm tra phòng, quyền cho thuê, giấy tờ, hợp đồng và điều kiện thanh toán trước khi giao dịch.</li>
                  <li>Khi nghi ngờ lừa đảo, hãy dừng chuyển tiền, lưu bằng chứng, báo cáo tài khoản và liên hệ ngân hàng hoặc cơ quan chức năng nếu cần.</li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-slate-800 text-base mb-2">5. Bản quyền nội dung</h3>
                <p>
                  Tất cả hình ảnh đồ họa, logo, thuật toán ghép đôi, mã nguồn và giao diện người dùng thuộc sở hữu trí tuệ của nhóm phát triển RoomieMatch. Mọi hành vi sao chép thiết kế, cào dữ liệu tự động (data scraping) từ website mà không có sự cho phép bằng văn bản đều là vi phạm bản quyền.
                </p>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in pb-20">
      
      {/* Header section */}
      <div className="mb-10 text-center sm:text-left">
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900">
          Trung tâm thông tin
        </h1>
        <p className="text-slate-500 mt-2 font-medium">
          Mọi thông tin, hướng dẫn và quy chế hoạt động của RoomieMatch.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">
        {/* Left Sidebar */}
        <div className="w-full lg:w-[320px] shrink-0 bg-white border border-slate-100 rounded-[32px] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] lg:sticky lg:top-8">
          <ul className="space-y-2">
            {INFO_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <li key={tab.id}>
                  <button
                    onClick={() => handleTabChange(tab.id)}
                    className={`w-full flex items-center justify-between px-5 py-4 rounded-[16px] font-bold text-[15px] transition-all duration-200 ${
                      isActive 
                        ? "bg-[#006590] text-white shadow-md shadow-[#006590]/20" 
                        : "text-slate-600 hover:bg-slate-50 hover:text-[#006590]"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <Icon className={`w-5 h-5 ${isActive ? "opacity-100" : "text-slate-500"}`} strokeWidth={isActive ? 2 : 1.5} />
                      {tab.label}
                    </div>
                    {isActive && <ChevronRight className="h-5 w-5 opacity-90" strokeWidth={2.5} />}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Right Content Area */}
        <div className="flex-1 w-full bg-white border border-slate-200 rounded-[24px] p-6 sm:p-10 shadow-sm min-h-[500px]">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
