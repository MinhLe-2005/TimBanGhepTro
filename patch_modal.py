import io

with io.open('src/components/RoomModal.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add Zap, Droplet, Building if not there
if 'Zap' not in content:
    content = content.replace(
        'import { X, Flame, Shield',
        'import { X, Flame, Shield, Zap, Droplet, Building'
    )

start_marker = "{/* Basic Costs */}"
end_marker = "<div>\n            <h4 className=\"text-[13px] font-black text-[#006590] uppercase tracking-wider mb-3\">Đặc trưng nổi bật</h4>"

start_idx = content.find(start_marker)
end_idx = content.find(end_marker, start_idx)

if start_idx != -1 and end_idx != -1:
    new_html = """{/* Basic Costs */}
          <div>
            <h4 className="text-[13px] font-black text-[#006590] uppercase tracking-wider mb-3 flex items-center gap-2">
              <Zap className="h-4 w-4" /> Thông tin & Chi phí cơ bản
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              {/* Type */}
              <div className="bg-gradient-to-br from-indigo-50 to-white border-2 border-indigo-100/60 px-4 py-3.5 rounded-2xl flex flex-col items-center justify-center gap-2 text-center shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
                <div className="bg-indigo-100 p-2 rounded-xl text-indigo-600 mb-1">
                  <Building className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider leading-none">Loại phòng</span>
                <span className="text-[14px] font-black text-indigo-900">{room.type}</span>
              </div>
              
              {/* Bedroom */}
              <div className="bg-gradient-to-br from-emerald-50 to-white border-2 border-emerald-100/60 px-4 py-3.5 rounded-2xl flex flex-col items-center justify-center gap-2 text-center shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
                <div className="bg-emerald-100 p-2 rounded-xl text-emerald-600 mb-1">
                  <Bed className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider leading-none">Phòng ngủ</span>
                <span className="text-[14px] font-black text-emerald-900">{room.bedrooms} PN</span>
              </div>
              
              {/* Electricity */}
              <div className="bg-gradient-to-br from-amber-50 to-white border-2 border-amber-100/60 px-4 py-3.5 rounded-2xl flex flex-col items-center justify-center gap-2 text-center shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
                <div className="bg-amber-100 p-2 rounded-xl text-amber-600 mb-1">
                  <Zap className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider leading-none">Giá điện</span>
                <span className="text-[14px] font-black text-amber-900 truncate max-w-full px-1" title={room.electricity || 'Chưa cập nhật'}>{room.electricity || 'Chưa cập nhật'}</span>
              </div>
              
              {/* Water */}
              <div className="bg-gradient-to-br from-cyan-50 to-white border-2 border-cyan-100/60 px-4 py-3.5 rounded-2xl flex flex-col items-center justify-center gap-2 text-center shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
                <div className="bg-cyan-100 p-2 rounded-xl text-cyan-600 mb-1">
                  <Droplet className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider leading-none">Giá nước</span>
                <span className="text-[14px] font-black text-cyan-900 truncate max-w-full px-1" title={room.water || 'Chưa cập nhật'}>{room.water || 'Chưa cập nhật'}</span>
              </div>
            </div>
          </div>
          """
    content = content[:start_idx] + new_html + content[end_idx:]
    with io.open('src/components/RoomModal.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print("SUCCESS")
else:
    print("FAIL TO FIND MARKERS")
