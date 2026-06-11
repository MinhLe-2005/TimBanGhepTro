import io

with io.open('src/components/RoomModal.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add ChevronLeft, ChevronRight if not exist
if 'ChevronLeft' not in content:
    content = content.replace(
        'import { X, Flame',
        'import { X, Flame, ChevronLeft, ChevronRight'
    )

# Add currentImageIndex state
state_old = "const [isDragging, setIsDragging] = useState(false);"
state_new = """const [isDragging, setIsDragging] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === room.images.length - 1 ? 0 : prev + 1));
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === 0 ? room.images.length - 1 : prev - 1));
  };"""

if 'setCurrentImageIndex' not in content:
    content = content.replace(state_old, state_new)

# Replace the single image render with a slider
render_old = """          {/* Room Header Carousel Image */}
        <div className="relative rounded-2xl overflow-hidden aspect-[16/9] w-full bg-slate-100 mb-6 border border-slate-100/50 pt-4 sm:pt-0">
          <img
            src={room.images[0]}
            alt={room.title}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          {room.isHot && (
            <div className="absolute top-4 left-4 z-10 bg-red-500 text-white px-3.5 py-1.5 rounded-full text-xs font-bold shadow-md flex items-center gap-1">
              <Flame className="h-4 w-4 fill-white" />
              TIN HOT NỔI BẬT
            </div>
          )}
        </div>"""

render_new = """          {/* Room Header Carousel Image */}
        <div className="relative rounded-2xl overflow-hidden aspect-[16/9] w-full bg-slate-100 mb-6 border border-slate-100/50 pt-4 sm:pt-0 group">
          <img
            src={room.images[currentImageIndex] || room.images[0]}
            alt={room.title}
            className="w-full h-full object-cover transition-opacity duration-300"
            referrerPolicy="no-referrer"
          />
          
          {room.images.length > 1 && (
            <>
              {/* Image Indicators */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20 bg-black/30 px-3 py-1.5 rounded-full backdrop-blur-sm">
                {room.images.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(idx); }}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      idx === currentImageIndex 
                        ? "bg-white scale-125 w-4" 
                        : "bg-white/50 hover:bg-white/80"
                    }`}
                  />
                ))}
              </div>

              {/* Navigation Arrows */}
              <button 
                onClick={prevImage}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 hover:bg-white text-slate-800 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-md backdrop-blur-sm z-20 -translate-x-4 group-hover:translate-x-0"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button 
                onClick={nextImage}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 hover:bg-white text-slate-800 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-md backdrop-blur-sm z-20 translate-x-4 group-hover:translate-x-0"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
              
              <div className="absolute top-4 right-4 z-20 bg-black/60 text-white px-2 py-1 rounded-md text-[11px] font-bold backdrop-blur-md">
                {currentImageIndex + 1} / {room.images.length}
              </div>
            </>
          )}

          {room.isHot && (
            <div className="absolute top-4 left-4 z-10 bg-red-500 text-white px-3.5 py-1.5 rounded-full text-xs font-bold shadow-md flex items-center gap-1">
              <Flame className="h-4 w-4 fill-white" />
              TIN HOT NỔI BẬT
            </div>
          )}
        </div>"""

if 'ChevronRight className=' not in content:
    content = content.replace(render_old, render_new)

with io.open('src/components/RoomModal.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("SUCCESS")
