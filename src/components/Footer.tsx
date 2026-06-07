import { Sparkles } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100 py-12 mt-20">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col items-center md:items-start">
            <span className="text-xl font-extrabold text-[#006590] flex items-center gap-1">
              RoomieMatch
              <Sparkles className="h-4 w-4 text-sky-400 fill-sky-200" />
            </span>
            <p className="text-sm text-gray-500 mt-2 text-center md:text-left">
              © 2026 RoomieMatch - Nền tảng tìm bạn ở ghép thế hệ mới cho Gen Z. Đáng tin cậy và minh bạch.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
