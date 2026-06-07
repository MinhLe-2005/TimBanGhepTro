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
  MessageSquare
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
                  RoomieMatch ra đời với sứ mệnh mang lại một nền tảng tìm bạn ở ghép và phòng trọ minh bạch, an toàn và thông minh nhất dành cho giới trẻ tại Việt Nam.
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
                <h3 className="font-bold text-slate-800 mb-2">Ghép Đôi Thông Minh</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Ứng dụng thuật toán phân tích phong cách sống, giờ giấc sinh hoạt và mức độ ngăn nắp để tìm ra người bạn cùng phòng lý tưởng nhất.
                </p>
              </div>
              <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-100">
                <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-sm mb-4 text-emerald-600">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-800 mb-2">An Toàn Tuyệt Đối</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Khác biệt với các hội nhóm lộn xộn, RoomieMatch cung cấp các tính năng xác minh danh tính và hợp đồng sống chung minh bạch.
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
              <p className="text-sm text-slate-500 mt-2">Đội ngũ CSKH của RoomieMatch luôn sẵn sàng hỗ trợ bạn 24/7</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <a href="mailto:support@roomiematch.vn" className="group block bg-white border border-slate-200 rounded-2xl p-6 hover:border-blue-300 hover:shadow-lg transition-all duration-300">
                <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Mail className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-800">Gửi Email Hỗ Trợ</h3>
                <p className="text-sm text-slate-500 mt-1">support@roomiematch.vn</p>
                <p className="text-xs text-slate-400 mt-3">Phản hồi trong vòng 24 giờ làm việc</p>
              </a>

              <div className="group block bg-white border border-slate-200 rounded-2xl p-6 hover:border-emerald-300 hover:shadow-lg transition-all duration-300">
                <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-800">Chat Trực Tuyến</h3>
                <p className="text-sm text-slate-500 mt-1">Qua tính năng Tin Nhắn</p>
                <p className="text-xs text-slate-400 mt-3">Hỗ trợ ngay lập tức (8:00 - 22:00)</p>
              </div>
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
              <div className="flex gap-4 p-5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <span className="font-black text-lg">1</span>
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 mb-1">Xác minh người đăng tin</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">Hãy yêu cầu cung cấp Căn cước công dân và hợp đồng thuê nhà gốc (nếu là người nhượng phòng) trước khi quyết định đặt cọc để tránh lừa đảo đa cấp hoặc môi giới ảo.</p>
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
                  <p className="text-sm text-rose-700 leading-relaxed">Kẻ gian thường hối thúc bạn chuyển tiền cọc "giữ chỗ" vì có nhiều người hỏi. Tuyệt đối KHÔNG giao dịch điện tử nếu chưa đến tận nơi và gặp trực tiếp chủ nhà.</p>
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
                  Việc đăng tin tìm bạn ở ghép và tìm phòng trọ cơ bản là hoàn toàn <strong className="text-emerald-600">miễn phí</strong>. Chúng tôi chỉ thu phí đối với các gói đẩy tin (Premium) dành cho chủ trọ muốn tiếp cận khách thuê nhanh hơn và nổi bật trên bản đồ.
                </p>
              </div>
              <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all">
                <h4 className="font-bold text-slate-800 flex items-start gap-3">
                  <span className="text-sky-500 mt-0.5"><MessageCircleQuestion className="w-5 h-5" /></span>
                  2. Thuật toán ghép đôi hoạt động thế nào?
                </h4>
                <p className="text-sm text-slate-600 mt-3 ml-8 leading-relaxed">
                  Dựa trên bộ câu hỏi Lifestyle của bạn (giờ ngủ, độ sạch sẽ, tính cách, nuôi thú cưng, mức độ ồn ào), hệ thống trí tuệ nhân tạo sẽ đối chiếu và chấm điểm phần trăm độ tương hợp với những người dùng khác. Điểm số càng cao, hai bạn càng có khả năng chung sống hòa hợp.
                </p>
              </div>
              <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all">
                <h4 className="font-bold text-slate-800 flex items-start gap-3">
                  <span className="text-sky-500 mt-0.5"><MessageCircleQuestion className="w-5 h-5" /></span>
                  3. Làm sao để biết phòng trọ đó là thật hay lừa đảo?
                </h4>
                <p className="text-sm text-slate-600 mt-3 ml-8 leading-relaxed">
                  RoomieMatch có đội ngũ kiểm duyệt tin đăng liên tục. Những tin có dấu hiệu giá quá rẻ so với mặt bằng chung, hình ảnh copy trên mạng sẽ bị gắn cờ. Tuy nhiên, bạn vẫn phải áp dụng nguyên tắc "đến tận nơi, xem tận mắt" trước khi cọc.
                </p>
              </div>
              <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all">
                <h4 className="font-bold text-slate-800 flex items-start gap-3">
                  <span className="text-sky-500 mt-0.5"><MessageCircleQuestion className="w-5 h-5" /></span>
                  4. Tôi có thể báo cáo người dùng có hành vi xấu không?
                </h4>
                <p className="text-sm text-slate-600 mt-3 ml-8 leading-relaxed">
                  Chắc chắn rồi. Nếu ai đó nhắn tin gạ gẫm, quấy rối hoặc đăng tin lừa đảo, bạn hãy bấm vào biểu tượng "..." ở góc phải hồ sơ của họ và chọn "Báo cáo vi phạm". Đội ngũ quản trị sẽ xử lý ngay lập tức.
                </p>
              </div>
              <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all">
                <h4 className="font-bold text-slate-800 flex items-start gap-3">
                  <span className="text-sky-500 mt-0.5"><MessageCircleQuestion className="w-5 h-5" /></span>
                  5. Tôi có thể xóa tài khoản không?
                </h4>
                <p className="text-sm text-slate-600 mt-3 ml-8 leading-relaxed">
                  Có. Bạn có thể vào phần Cài Đặt Cá Nhân và chọn "Xóa tài khoản". Mọi thông tin, tin nhắn và lịch sử ghép đôi của bạn sẽ được xóa khỏi hệ thống hoàn toàn sau 15 ngày làm việc theo đúng quy định bảo vệ dữ liệu.
                </p>
              </div>
              <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all">
                <h4 className="font-bold text-slate-800 flex items-start gap-3">
                  <span className="text-sky-500 mt-0.5"><MessageCircleQuestion className="w-5 h-5" /></span>
                  6. Bản cam kết sống chung có giá trị pháp lý không?
                </h4>
                <p className="text-sm text-slate-600 mt-3 ml-8 leading-relaxed">
                  Bản cam kết trên RoomieMatch đóng vai trò như một thỏa thuận dân sự giữa các cá nhân để đảm bảo ý thức chung. Mặc dù không phải là hợp đồng thuê nhà chính thức, nhưng nó cung cấp bằng chứng rõ ràng nếu có tranh chấp xảy ra giữa các bạn cùng phòng.
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
                <p className="text-sm text-slate-500">Cập nhật lần cuối: Tháng 6, 2026</p>
              </div>
            </div>

            <div className="space-y-8 text-sm text-slate-600 leading-relaxed">
              <div>
                <h3 className="font-bold text-slate-800 text-base mb-2">1. Trách nhiệm người dùng</h3>
                <p className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  Người dùng phải cung cấp thông tin trung thực khi đăng tin bài. Hình ảnh phòng trọ phải đúng thực tế. Các hành vi đăng tin sai sự thật, lừa đảo chiếm đoạt tài sản, phân biệt vùng miền hoặc sử dụng ngôn từ đả kích sẽ bị khóa tài khoản vĩnh viễn không cần báo trước và có thể bị báo cáo lên cơ quan chức năng.
                </p>
              </div>
              
              <div>
                <h3 className="font-bold text-slate-800 text-base mb-2">2. Thu thập và bảo mật thông tin</h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li>RoomieMatch cam kết <strong>không bán hoặc chia sẻ trái phép</strong> số điện thoại, email và dữ liệu cá nhân của bạn cho bên thứ ba vì mục đích quảng cáo hoặc thương mại.</li>
                  <li>Thuật toán ghép đôi chỉ sử dụng các dữ liệu về lối sống mà bạn đã công khai đồng ý chia sẻ trên trang cá nhân để tìm kiếm sự tương hợp.</li>
                  <li>Hệ thống tin nhắn được mã hóa hai chiều để đảm bảo quyền riêng tư tuyệt đối cho các cuộc trò chuyện của bạn.</li>
                  <li>Bạn có toàn quyền yêu cầu xóa bỏ hoàn toàn dữ liệu cá nhân của mình khỏi máy chủ của chúng tôi bất cứ lúc nào.</li>
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
                <h3 className="font-bold text-slate-800 text-base mb-2">4. Chính sách thanh toán và hoàn tiền</h3>
                <p className="mb-2">
                  Đối với các giao dịch mua gói Premium (đẩy tin, làm nổi bật hồ sơ), RoomieMatch xử lý qua cổng thanh toán VNPay và Momo.
                </p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>Chúng tôi sẽ hoàn tiền 100% nếu hệ thống xảy ra lỗi kỹ thuật khiến gói dịch vụ không được kích hoạt thành công.</li>
                  <li>Không hoàn tiền trong trường hợp tài khoản của bạn bị khóa do vi phạm các chính sách ở mục 1 và 3.</li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-slate-800 text-base mb-2">5. Bản quyền nội dung</h3>
                <p>
                  Tất cả hình ảnh đồ họa, logo, thuật toán ghép đôi, mã nguồn và giao diện người dùng thuộc sở hữu trí tuệ của RM Technology. Mọi hành vi sao chép thiết kế, cào dữ liệu tự động (data scraping) từ website mà không có sự cho phép bằng văn bản sẽ bị truy tố theo quy định của Luật Sở hữu trí tuệ Việt Nam.
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
