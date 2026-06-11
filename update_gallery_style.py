import io

with io.open('src/components/RoomModal.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

old_modal = """      {/* Gallery Grid Modal */}
      {showGallery && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowGallery(false)} />
          <div className="relative bg-white rounded-[32px] shadow-2xl border border-gray-100 w-full max-w-5xl h-[85vh] flex flex-col z-10 overflow-hidden animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100 shrink-0 bg-white">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-sky-50 rounded-2xl flex items-center justify-center text-sky-500">
                  <ImageIcon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-800">Tất cả ảnh</h3>
                  <p className="text-sm text-slate-500">{room.images.length} hình ảnh về phòng</p>
                </div>
              </div>
              <button
                onClick={() => setShowGallery(false)}
                className="w-10 h-10 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {/* Grid */}
            <div className="overflow-y-auto flex-1 p-6 scrollbar-thin scrollbar-thumb-slate-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {room.images.map((img, idx) => (
                  <div 
                    key={idx} 
                    className="aspect-[4/3] rounded-2xl overflow-hidden cursor-zoom-in group border border-slate-100 shadow-sm hover:shadow-md transition-all"
                    onClick={() => setFullscreenImage(idx)}
                  >
                    <img 
                      src={img} 
                      alt={`Ảnh ${idx + 1}`} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                      referrerPolicy="no-referrer"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}"""

new_modal = """      {/* Gallery Grid Modal */}
      {showGallery && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={() => setShowGallery(false)} />
          <div className="relative w-full max-w-5xl z-10 animate-fade-in">
            {/* Close Button */}
            <button
              onClick={() => setShowGallery(false)}
              className="absolute top-3 right-3 w-10 h-10 rounded-xl bg-white/90 shadow-md border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-white active:scale-95 duration-200 cursor-pointer z-50"
              aria-label="Đóng"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="bg-[#fbfdff] rounded-[32px] shadow-2xl border border-white/80 w-full max-h-[90vh] flex flex-col overflow-hidden">
              <section className="relative overflow-hidden border-b border-sky-100 bg-white shadow-[0_4px_20px_rgba(15,80,110,0.05)] shrink-0">
                <div className="absolute inset-x-0 top-0 h-full bg-gradient-to-br from-[#ccefff] via-[#e3f7fb] to-[#d8f6e9] opacity-40" />
                <div className="absolute -left-8 top-5 h-32 w-32 rounded-full bg-sky-400/20 blur-2xl" />
                <div className="absolute right-12 top-0 h-28 w-28 rounded-full bg-emerald-400/15 blur-2xl" />

                <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 sm:p-8 pr-14">
                  <div className="flex items-center gap-4">
                    <div className="relative h-14 w-14 overflow-hidden rounded-2xl border-2 border-white bg-white shadow-md flex items-center justify-center shrink-0">
                      <div className="absolute inset-0 bg-sky-50" />
                      <ImageIcon className="w-7 h-7 text-sky-500 relative z-10" />
                    </div>
                    <div>
                      <h2 className="text-2xl sm:text-3xl font-black text-[#07132d] tracking-tight">Thư viện ảnh</h2>
                      <p className="text-slate-500 text-sm mt-1 font-medium">Toàn bộ hình ảnh chi tiết về phòng</p>
                    </div>
                  </div>
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-sky-100 text-sky-600 font-bold text-sm shadow-sm backdrop-blur-md">
                    <LayoutGrid className="w-4 h-4" />
                    {room.images.length} hình ảnh
                  </div>
                </div>
              </section>

              <div className="overflow-y-auto w-full h-full p-4 sm:p-6 lg:p-8 scrollbar-thin scrollbar-thumb-slate-200 hover:scrollbar-thumb-slate-300">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 sm:gap-6">
                  {room.images.map((img, idx) => (
                    <div 
                      key={idx} 
                      className="aspect-[4/3] rounded-2xl overflow-hidden cursor-zoom-in group border border-slate-100 shadow-sm hover:shadow-xl transition-all relative"
                      onClick={() => setFullscreenImage(idx)}
                    >
                      <img 
                        src={img} 
                        alt={`Ảnh ${idx + 1}`} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 bg-white/90 text-slate-800 text-xs font-bold px-3 py-1.5 rounded-full shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                          Phóng to
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}"""

content = content.replace(old_modal, new_modal)

with io.open('src/components/RoomModal.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated Gallery Grid Modal styling")
