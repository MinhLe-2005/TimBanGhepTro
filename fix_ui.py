import re

with open("src/components/PostListingModal.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Section Wrappers
content = content.replace(
    '<div className="space-y-4">',
    '<div className="bg-white rounded-3xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-6 sm:p-8 space-y-6">'
)

# 2. Section Headers
content = content.replace(
    'text-xs font-bold text-[#006590] uppercase tracking-wider border-b border-sky-100 pb-2',
    'flex items-center gap-2 text-[13px] font-black text-[#006590] uppercase tracking-widest'
)

# 3. Labels
content = content.replace(
    'block text-xs font-extrabold text-slate-500 mb-1.5',
    'block text-[13px] font-bold text-slate-700 mb-2'
)

# 4. Inputs
content = content.replace(
    'w-full bg-slate-50 border border-slate-200 focus:border-[#006590] focus:ring-1 focus:ring-[#006590] rounded-xl px-4 py-2.5 text-xs outline-none',
    'w-full bg-slate-50/50 hover:bg-white border border-slate-200 focus:bg-white focus:border-[#006590] focus:ring-4 focus:ring-[#006590]/10 rounded-xl px-4 py-3 text-[14px] outline-none text-slate-800 font-semibold transition-all shadow-[0_2px_10px_rgba(0,0,0,0.02)] placeholder:text-slate-400 placeholder:font-normal'
)

content = content.replace(
    'w-full bg-slate-50 border border-slate-200 focus:border-[#006590] focus:ring-1 focus:ring-[#006590] rounded-xl px-3 py-2.5 text-xs outline-none',
    'w-full bg-slate-50/50 hover:bg-white border border-slate-200 focus:bg-white focus:border-[#006590] focus:ring-4 focus:ring-[#006590]/10 rounded-xl px-3 py-3 text-[14px] outline-none text-slate-800 font-semibold transition-all shadow-[0_2px_10px_rgba(0,0,0,0.02)] cursor-pointer'
)

content = content.replace(
    'w-full bg-slate-50 border border-slate-200 focus:border-[#006590] focus:ring-1 focus:ring-[#006590] rounded-xl px-4 py-3 text-xs outline-none resize-none',
    'w-full bg-slate-50/50 hover:bg-white border border-slate-200 focus:bg-white focus:border-[#006590] focus:ring-4 focus:ring-[#006590]/10 rounded-xl px-4 py-3.5 text-[14px] outline-none text-slate-800 font-medium transition-all shadow-[0_2px_10px_rgba(0,0,0,0.02)] placeholder:text-slate-400 resize-none'
)

# For price inputs which had extra classes
content = content.replace(
    'w-full bg-slate-50 border border-slate-200 focus:border-[#006590] focus:ring-1 focus:ring-[#006590] rounded-xl px-4 py-2.5 text-xs outline-none font-bold text-[#006590]',
    'w-full bg-slate-50/50 hover:bg-white border border-slate-200 focus:bg-white focus:border-[#006590] focus:ring-4 focus:ring-[#006590]/10 rounded-xl px-4 py-3 text-[15px] outline-none text-[#006590] font-black transition-all shadow-[0_2px_10px_rgba(0,0,0,0.02)] placeholder:text-slate-400 placeholder:font-normal'
)

content = content.replace(
    'w-full bg-slate-50 border border-slate-200 focus:border-[#006590] focus:ring-1 focus:ring-[#006590] rounded-xl px-4 py-2.5 text-xs outline-none font-bold',
    'w-full bg-slate-50/50 hover:bg-white border border-slate-200 focus:bg-white focus:border-[#006590] focus:ring-4 focus:ring-[#006590]/10 rounded-xl px-4 py-3 text-[15px] outline-none text-slate-800 font-black transition-all shadow-[0_2px_10px_rgba(0,0,0,0.02)] placeholder:text-slate-400 placeholder:font-normal'
)

# Fix Form background
content = content.replace('<form onSubmit={handleRoommateSubmit} className="space-y-6">', '<form onSubmit={handleRoommateSubmit} className="space-y-8 bg-slate-50/30 rounded-3xl p-1 sm:p-2">')
content = content.replace('<form onSubmit={handleRoomSubmit} className="space-y-6">', '<form onSubmit={handleRoomSubmit} className="space-y-8 bg-slate-50/30 rounded-3xl p-1 sm:p-2">')

# Grid gaps
content = content.replace('gap-4', 'gap-5 sm:gap-6')

# Checkbox sections fix
content = content.replace('bg-white border-2 border-slate-100 hover:border-slate-200 rounded-xl p-3 cursor-pointer duration-150', 'bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl p-3 sm:p-4 cursor-pointer duration-150 shadow-sm')
content = content.replace('bg-[#006590]/5 border-2 border-[#006590] rounded-xl p-3 cursor-pointer duration-150 shadow-sm', 'bg-white border-2 border-[#006590] rounded-xl p-3 sm:p-4 cursor-pointer duration-150 shadow-md')
content = content.replace('font-black text-[11px]', 'font-black text-[12px]')
content = content.replace('text-[10px] font-black tracking-wide text-slate-400 uppercase', 'text-[11px] font-black tracking-widest text-slate-500 uppercase mb-3')

with open("src/components/PostListingModal.tsx", "w", encoding="utf-8") as f:
    f.write(content)

print("UI Fixed!")
