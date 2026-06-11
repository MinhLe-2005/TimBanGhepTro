import io
import re

with io.open('src/components/PostListingModal.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Remove "required" from inputs in PostListingModal to allow custom validation
content = content.replace("<input type=\"text\" required value={rmName}", "<input type=\"text\" value={rmName}")
content = content.replace("<input type=\"number\" required value={rmBudget}", "<input type=\"number\" value={rmBudget}")
content = content.replace("<input type=\"text\" required value={rTitle}", "<input type=\"text\" value={rTitle}")
content = content.replace("<input type=\"number\" required value={rPrice}", "<input type=\"number\" value={rPrice}")
content = content.replace('required className="', 'className="')

with io.open('src/components/PostListingModal.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

with io.open('src/components/RoomModal.tsx', 'r', encoding='utf-8') as f:
    rm_content = f.read()

# 2. Fix the button click issue in RoomModal
rm_old_img = """          <img
            src={room.images[currentImageIndex] || room.images[0]}
            alt={room.title}
            className="w-full h-full object-cover transition-opacity duration-300 cursor-pointer"
            referrerPolicy="no-referrer"
            onClick={() => setShowGallery(true)}
          />"""

rm_new_img = """          <img
            src={room.images[currentImageIndex] || room.images[0]}
            alt={room.title}
            className="w-full h-full object-cover transition-opacity duration-300 cursor-pointer"
            referrerPolicy="no-referrer"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowGallery(true); }}
          />"""

rm_old_btn = """          {/* Nút Xem tất cả ảnh (Đậm và nổi bật) */}
          <button
            onClick={() => setShowGallery(true)}
            className="absolute bottom-4 right-4 bg-white text-slate-900 px-4 py-2 rounded-xl text-[13px] font-black shadow-lg border border-slate-200 flex items-center gap-2 hover:bg-slate-50 hover:scale-105 active:scale-95 transition-all z-20 pointer-events-auto"
          >"""

rm_new_btn = """          {/* Nút Xem tất cả ảnh (Đậm và nổi bật) */}
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowGallery(true); }}
            className="absolute bottom-4 right-4 bg-white text-slate-900 px-4 py-2 rounded-xl text-[13px] font-black shadow-lg border border-slate-200 flex items-center gap-2 hover:bg-slate-50 hover:scale-105 active:scale-95 transition-all z-[60] pointer-events-auto cursor-pointer"
          >"""

# Need to handle if pointer-events-auto was not there
rm_old_btn_2 = """          {/* Nút Xem tất cả ảnh (Đậm và nổi bật) */}
          <button
            onClick={() => setShowGallery(true)}
            className="absolute bottom-4 right-4 bg-white text-slate-900 px-4 py-2 rounded-xl text-[13px] font-black shadow-lg border border-slate-200 flex items-center gap-2 hover:bg-slate-50 hover:scale-105 active:scale-95 transition-all z-20"
          >"""

rm_content = rm_content.replace(rm_old_img, rm_new_img)
if rm_old_btn in rm_content:
    rm_content = rm_content.replace(rm_old_btn, rm_new_btn)
else:
    rm_content = rm_content.replace(rm_old_btn_2, rm_new_btn)

with io.open('src/components/RoomModal.tsx', 'w', encoding='utf-8') as f:
    f.write(rm_content)

print("SUCCESS")
