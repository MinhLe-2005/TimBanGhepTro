import io

with io.open('src/components/HomeView.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update Search Header
old_header = """            <h3 className="text-transparent bg-clip-text bg-gradient-to-r from-rose-300 to-amber-300 font-black text-[24px] mb-6 flex items-center gap-2.5 drop-shadow-lg">
              <Search className="w-6 h-6 text-rose-300" />
              Tìm Bạn Ở Ghép
            </h3>"""

new_header = """            <h3 className="text-white font-black text-[24px] mb-6 flex items-center gap-2.5 drop-shadow-lg">
              <Search className="w-6 h-6 text-sky-400" />
              Tìm Bạn Ở Ghép
            </h3>"""

if old_header in content:
    content = content.replace(old_header, new_header)
    print("SUCCESS HEADER")
else:
    print("FAILED HEADER")

# 2. Update Search Button
old_button = """              <button 
                onClick={() => onNavigateToTab("roommates", { location: selectedLocation, budget: selectedBudget, lifestyle: selectedLifestyle })}
                className="mt-2 w-full bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600 text-white px-8 py-4.5 rounded-2xl text-[16px] font-black flex items-center justify-center gap-2.5 transition-all shadow-xl shadow-orange-500/30 active:scale-95 cursor-pointer"
              >
                <Search className="h-5 w-5" />
                Tìm Kiếm Ngay
              </button>"""

new_button = """              <button 
                onClick={() => onNavigateToTab("roommates", { location: selectedLocation, budget: selectedBudget, lifestyle: selectedLifestyle })}
                className="mt-2 w-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white px-8 py-4.5 rounded-2xl text-[16px] font-black flex items-center justify-center gap-2.5 transition-all shadow-xl shadow-blue-500/30 active:scale-95 cursor-pointer"
              >
                <Search className="h-5 w-5" />
                Tìm Kiếm Ngay
              </button>"""

if old_button in content:
    content = content.replace(old_button, new_button)
    print("SUCCESS BUTTON")
else:
    print("FAILED BUTTON")

with io.open('src/components/HomeView.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

