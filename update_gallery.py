import io

with io.open('src/components/RoomModal.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add fullscreenImage state
content = content.replace("const [showGallery, setShowGallery] = useState(false);", "const [showGallery, setShowGallery] = useState(false);\n  const [fullscreenImage, setFullscreenImage] = useState<number | null>(null);")

# 2. Update the old Lightbox rendering to use fullscreenImage
old_lightbox = """      {/* Lightbox Gallery Overlay */}
      {showGallery && (
        <div 
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex flex-col"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowGallery(false); }}
        >
          {/* Header */}
          <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-center bg-gradient-to-b from-black/70 to-transparent z-10">
            <span className="text-white/80 font-medium px-4">
              {currentImageIndex + 1} / {room.images.length}
            </span>
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowGallery(false); }}
              className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Main Image */}
          <div className="flex-1 flex items-center justify-center p-4 md:p-12 relative">
            {room.images.length > 1 && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setCurrentImageIndex((prev) => (prev === 0 ? room.images.length - 1 : prev - 1));
                }}
                className="absolute left-4 md:left-8 p-4 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
            )}

            <img
              src={room.images[currentImageIndex]}
              alt={room.title}
              className="max-w-full max-h-full object-contain"
              referrerPolicy="no-referrer"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
            />

            {room.images.length > 1 && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setCurrentImageIndex((prev) => (prev === room.images.length - 1 ? 0 : prev + 1));
                }}
                className="absolute right-4 md:right-8 p-4 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors cursor-pointer"
              >
                <ChevronRight className="w-8 h-8" />
              </button>
            )}
          </div>
        </div>
      )}"""

new_gallery_modal = """      {/* Gallery Grid Modal */}
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
      )}

      {/* Lightbox Gallery Overlay */}
      {fullscreenImage !== null && (
        <div 
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex flex-col"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setFullscreenImage(null); }}
        >
          {/* Header */}
          <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-center bg-gradient-to-b from-black/70 to-transparent z-10">
            <span className="text-white/80 font-medium px-4">
              {fullscreenImage + 1} / {room.images.length}
            </span>
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setFullscreenImage(null); }}
              className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Main Image */}
          <div className="flex-1 flex items-center justify-center p-4 md:p-12 relative">
            {room.images.length > 1 && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setFullscreenImage((prev) => (prev === 0 ? room.images.length - 1 : prev! - 1));
                }}
                className="absolute left-4 md:left-8 p-4 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
            )}

            <img
              src={room.images[fullscreenImage]}
              alt={room.title}
              className="max-w-full max-h-full object-contain"
              referrerPolicy="no-referrer"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
            />

            {room.images.length > 1 && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setFullscreenImage((prev) => (prev === room.images.length - 1 ? 0 : prev! + 1));
                }}
                className="absolute right-4 md:right-8 p-4 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors cursor-pointer"
              >
                <ChevronRight className="w-8 h-8" />
              </button>
            )}
          </div>
        </div>
      )}"""

content = content.replace(old_lightbox, new_gallery_modal)

with io.open('src/components/RoomModal.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated Gallery logic")
