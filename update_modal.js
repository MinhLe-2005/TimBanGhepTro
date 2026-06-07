const fs = require('fs');
let content = fs.readFileSync('src/components/CreateProfileModal.tsx', 'utf8');

// Replace structural top
content = content.replace(
  /<div className="relative bg-white rounded-\[32px\] shadow-2xl border border-gray-100 w-full max-w-2xl max-h-\[90vh\] overflow-y-auto z-10 animate-fade-in p-6 sm:p-8">[\s\S]*?<form onSubmit={handleSubmit} className="space-y-7 relative">/,
  `<div className="relative bg-white rounded-[32px] shadow-2xl border border-gray-100 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col z-10 animate-fade-in">
        {/* Header */}
        <div className="flex justify-between items-center px-6 sm:px-8 py-6 border-b border-slate-100 shrink-0 bg-white z-20">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-sky-50 flex items-center justify-center text-[#006590]">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">Hồ Sơ Cá Nhân</h3>
              <p className="text-sm font-medium text-slate-500 mt-0.5">Cập nhật thông tin để thuật toán ghép đôi hiệu quả hơn.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800 duration-200 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Form */}
        <div className="overflow-y-auto flex-1 custom-scrollbar">
          <form id="profile-form" onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-7 relative">`
);

// Replace structural bottom
content = content.replace(
  /          {/* Action Row */}[\s\S]*?<\/form>\n      <\/div>/,
  `          </form>
        </div>

        {/* Action Row */}
        <div className="px-6 sm:px-8 py-5 border-t border-slate-100 bg-slate-50 shrink-0 z-20 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 border border-slate-200 text-slate-500 py-3.5 rounded-xl font-bold hover:bg-slate-100 hover:text-slate-700 duration-200 cursor-pointer text-center bg-white shadow-sm"
          >
            Hủy bỏ
          </button>
          <button
            type="submit"
            form="profile-form"
            disabled={isSaving}
            className="flex-1 bg-[#006590] hover:bg-[#005176] text-white py-3.5 rounded-xl font-bold shadow-md hover:shadow-lg duration-200 cursor-pointer text-center disabled:opacity-70 flex items-center justify-center gap-2"
          >
            {isSaving ? "Đang lưu..." : "Lưu & Cập Nhật Hồ Sơ"}
          </button>
        </div>
      </div>`
);

// Replace styling for inputs
const oldInputClass = 'w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:bg-white focus:border-[#006590] focus:ring-4 focus:ring-[#006590]/10 outline-none transition-all';
const newInputClass = 'w-full bg-white border-2 border-slate-200 rounded-xl px-4 py-3.5 text-[15px] font-bold text-slate-900 shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:border-slate-300 focus:border-[#006590] focus:ring-4 focus:ring-[#006590]/10 outline-none transition-all';
content = content.split(oldInputClass).join(newInputClass);

fs.writeFileSync('src/components/CreateProfileModal.tsx', content);
