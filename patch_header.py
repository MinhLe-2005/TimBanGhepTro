import io

with io.open('src/components/Header.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

start_marker = "<header"
end_marker = "    >"

start_idx = content.find(start_marker)
end_idx = content.find(end_marker, start_idx)

if start_idx != -1 and end_idx != -1:
    old_header_tag = content[start_idx:end_idx + 5]
    new_header_tag = """<header 
      className={`fixed left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? "top-0 bg-white/90 backdrop-blur-xl shadow-[0_4px_30px_rgba(0,0,0,0.08)] border-b border-slate-200/50" 
          : "top-0 bg-white border-b border-transparent"
      }`}
    >
      {/* Top Announcement Bar */}
      <div 
        className={`bg-[#111111] text-white text-[9px] sm:text-[11px] font-bold uppercase tracking-[0.25em] text-center transition-all duration-500 overflow-hidden flex items-center justify-center ${
          isScrolled ? "h-0 opacity-0" : "h-9 sm:h-11 opacity-100"
        }`}
      >
        TRẢI NGHIỆM DỊCH VỤ TỐT NHẤT CÙNG CHÚNG TÔI
      </div>"""
    new_content = content[:start_idx] + new_header_tag + content[end_idx + 5:]
    with io.open('src/components/Header.tsx', 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("SUCCESS HEADER UPDATE")
else:
    print("FAILED TO MATCH HEADER")
