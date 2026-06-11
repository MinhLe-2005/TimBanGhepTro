import io

with io.open('src/components/RoomModal.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add state for Lightbox
state_old = "const [currentImageIndex, setCurrentImageIndex] = useState(0);"
state_new = """const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showGallery, setShowGallery] = useState(false);"""
content = content.replace(state_old, state_new)

# 2. Add the button and Lightbox
img_section_old = """          <img
            src={room.images[currentImageIndex] || room.images[0]}
            alt={room.title}
            className="w-full h-full object-cover transition-opacity duration-300"
            referrerPolicy="no-referrer"
          />
          
          {room.images.length > 1 && ("""

img_section_new = """          <img
            src={room.images[currentImageIndex] || room.images[0]}
            alt={room.title}
            className="w-full h-full object-cover transition-opacity duration-300 cursor-pointer"
            referrerPolicy="no-referrer"
            onClick={() => setShowGallery(true)}
          />

          {/* Nút Xem tất cả ảnh (Đậm và nổi bật) */}
          <button
            onClick={() => setShowGallery(true)}
            className="absolute bottom-4 right-4 bg-white text-slate-900 px-4 py-2 rounded-xl text-[13px] font-black shadow-lg border border-slate-200 flex items-center gap-2 hover:bg-slate-50 hover:scale-105 active:scale-95 transition-all z-20"
          >
            <ImageIcon className="w-4 h-4 text-[#006590]" />
            XEM TẤT CẢ {room.images.length} ẢNH
          </button>
          
          {room.images.length > 1 && ("""

# Replace ImageIcon if not imported, so we will use Image or add it
if "Image as ImageIcon" not in content and "ImageIcon" not in content:
    import_old = "import { MapPin, Phone, User, Check, X, ChevronLeft, ChevronRight, Share2, Heart, Shield, Sparkles, Map, Clock, Zap, Droplet } from 'lucide-react';"
    import_new = "import { MapPin, Phone, User, Check, X, ChevronLeft, ChevronRight, Share2, Heart, Shield, Sparkles, Map, Clock, Zap, Droplet, Image as ImageIcon } from 'lucide-react';"
    content = content.replace(import_old, import_new)

content = content.replace(img_section_old, img_section_new)

# 3. Add the Fullscreen Gallery Modal at the end of the return statement
render_end_old = """      </div>
    </div>
  );
};"""

render_end_new = """      </div>

      {/* LIGHTBOX FULLSCREEN GALLERY */}
      {showGallery && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex flex-col items-center justify-center animate-fade-in">
          <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-center z-50 bg-gradient-to-b from-black/50 to-transparent">
            <div className="text-white font-bold text-sm bg-black/40 px-3 py-1.5 rounded-full">
              {currentImageIndex + 1} / {room.images.length}
            </div>
            <button
              onClick={() => setShowGallery(false)}
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {room.images.length > 1 && (
            <button 
              onClick={(e) => { e.stopPropagation(); prevImage(); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer z-50"
            >
              <ChevronLeft className="h-8 w-8" />
            </button>
          )}

          <img
            src={room.images[currentImageIndex] || room.images[0]}
            alt={room.title}
            className="max-w-[95vw] max-h-[85vh] object-contain shadow-2xl rounded-lg"
            referrerPolicy="no-referrer"
          />

          {room.images.length > 1 && (
            <button 
              onClick={(e) => { e.stopPropagation(); nextImage(); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer z-50"
            >
              <ChevronRight className="h-8 w-8" />
            </button>
          )}

          {/* Thumbnails list at bottom */}
          {room.images.length > 1 && (
            <div className="absolute bottom-4 left-0 w-full flex justify-center gap-2 px-4 overflow-x-auto pb-2 scrollbar-none">
              {room.images.map((img, idx) => (
                <div
                  key={idx}
                  onClick={() => setCurrentImageIndex(idx)}
                  className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden shrink-0 cursor-pointer transition-all border-2 ${
                    idx === currentImageIndex ? "border-white scale-110" : "border-transparent opacity-50 hover:opacity-100"
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};"""

content = content.replace(render_end_old, render_end_new)

with io.open('src/components/RoomModal.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("SUCCESS")
