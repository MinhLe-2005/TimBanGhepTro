import io
import re

with io.open('src/components/PostListingModal.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace rImage state with rImages
content = content.replace(
    'const [rImage, setRImage] = useState(ROOM_IMAGE_PRESETS[0]);',
    'const [rImages, setRImages] = useState<Array<{file?: File, preview: string}>>([{ preview: ROOM_IMAGE_PRESETS[0] }]);'
)

# Replace handleRImageUpload
handle_img_upload_old = """  const handleRImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert("Dung lượng ảnh tối đa là 10MB để đảm bảo hiệu suất lưu trữ và tải trang tốt nhất!");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          setCropImageSrc(reader.result);
          setCropType("room");
        }
      };
      reader.readAsDataURL(file);
      e.target.value = '';
    }
  };"""

handle_img_upload_new = """  const handleRImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    
    if (rImages.length + files.length > 5) {
      alert("Bạn chỉ có thể tải lên tối đa 5 ảnh cho mỗi phòng!");
      return;
    }

    const newImages: Array<{file?: File, preview: string}> = [];
    
    // Khởi tạo một Promise.all để đọc tất cả file
    const filePromises = files.map(file => {
      return new Promise<void>((resolve) => {
        if (file.size > 10 * 1024 * 1024) {
          alert(`Ảnh ${file.name} vượt quá 10MB và sẽ bị bỏ qua.`);
          resolve();
          return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === "string") {
             // Lọc bỏ placeholder mặc định nếu có khi up ảnh mới
             newImages.push({ file, preview: reader.result });
          }
          resolve();
        };
        reader.readAsDataURL(file);
      });
    });

    Promise.all(filePromises).then(() => {
      setRImages(prev => {
         const filteredPrev = prev.filter(p => !ROOM_IMAGE_PRESETS.includes(p.preview));
         return [...filteredPrev, ...newImages].slice(0, 5);
      });
    });
    
    e.target.value = '';
  };

  const handleRemoveRImage = (index: number) => {
    setRImages(prev => prev.filter((_, i) => i !== index));
  };"""
  
content = content.replace(handle_img_upload_old, handle_img_upload_new)

# Replace handleCropComplete
content = content.replace(
    '} else if (cropType === "room") {\n        setRImage(base64data);\n      }',
    '} else if (cropType === "room") {\n        setRImages(prev => { const filtered = prev.filter(p => !ROOM_IMAGE_PRESETS.includes(p.preview)); return [...filtered, { preview: base64data }].slice(0, 5); });\n      }'
)

# Update effect where editingData is set
editing_set_image = """        if (editingData.images && editingData.images.length > 0) {
          setRImage(editingData.images[0]);
        }"""
editing_set_image_new = """        if (editingData.images && editingData.images.length > 0) {
          setRImages(editingData.images.map((img: string) => ({ preview: img })));
        }"""
content = content.replace(editing_set_image, editing_set_image_new)

profile_set_image = """      setRImage(currentProfile.avatar || ROOM_IMAGE_PRESETS[0]); // Use profile avatar as default room host avatar"""
profile_set_image_new = """      setRImages([{ preview: currentProfile.avatar || ROOM_IMAGE_PRESETS[0] }]); // Use profile avatar as default room host avatar"""
content = content.replace(profile_set_image, profile_set_image_new)

# Update the render section
render_old = """                {/* Section 1: Room image */}
                <div className="rounded-2xl border border-slate-150 bg-slate-50/50 p-5">
                  <div className="flex justify-between items-center mb-4">
                    <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Hình ảnh căn phòng</p>
                    <label className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-[#006590] hover:text-[#005176] rounded-full text-[11px] font-black shadow-sm duration-150">
                      <Upload className="h-3.5 w-3.5" />
                      <span>Tải ảnh thực tế</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleRImageUpload} />
                    </label>
                  </div>
                  <div className="w-full h-44 rounded-2xl border border-slate-200 overflow-hidden bg-white mb-3">
                    <img src={rImage} alt="Room" className="w-full h-full object-cover" />
                  </div>
                  <p className="text-[12px] text-slate-400 leading-relaxed">
                    Bấm <strong className="text-[#006590]">"Tải ảnh thực tế"</strong> để dùng ảnh chân thật của căn phòng (JPG, PNG &lt; 3MB).
                  </p>
                </div>"""

render_new = """                {/* Section 1: Room image */}
                <div className="rounded-2xl border border-slate-150 bg-slate-50/50 p-5">
                  <div className="flex justify-between items-center mb-4">
                    <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Hình ảnh căn phòng (Tối đa 5 ảnh)</p>
                    <label className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-[#006590] hover:text-[#005176] rounded-full text-[11px] font-black shadow-sm duration-150">
                      <Upload className="h-3.5 w-3.5" />
                      <span>Tải ảnh thực tế</span>
                      <input type="file" accept="image/*" multiple className="hidden" onChange={handleRImageUpload} />
                    </label>
                  </div>
                  
                  {rImages.length > 0 ? (
                    <div className="space-y-3 mb-3">
                      {/* Main Image Preview */}
                      <div className="w-full h-48 rounded-2xl border border-slate-200 overflow-hidden bg-white relative">
                        <img src={rImages[0].preview} alt="Room Cover" className="w-full h-full object-cover" />
                        <div className="absolute top-2 left-2 bg-black/60 text-white text-[10px] font-bold px-2 py-1 rounded-md backdrop-blur-md">Ảnh Bìa</div>
                        <button type="button" onClick={() => handleRemoveRImage(0)} className="absolute top-2 right-2 w-7 h-7 bg-white/90 hover:bg-rose-500 hover:text-white text-slate-700 rounded-full flex items-center justify-center shadow-sm backdrop-blur-md transition-colors">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      
                      {/* Thumbnails list */}
                      {rImages.length > 1 && (
                        <div className="grid grid-cols-4 gap-2">
                          {rImages.slice(1).map((img, idx) => (
                            <div key={idx + 1} className="h-20 rounded-xl border border-slate-200 overflow-hidden bg-white relative group">
                              <img src={img.preview} alt={`Room ${idx + 2}`} className="w-full h-full object-cover" />
                              <button type="button" onClick={() => handleRemoveRImage(idx + 1)} className="absolute top-1 right-1 w-6 h-6 bg-white/90 hover:bg-rose-500 hover:text-white text-slate-700 rounded-full flex items-center justify-center shadow-sm backdrop-blur-md transition-colors opacity-0 group-hover:opacity-100">
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ))}
                          {rImages.length < 5 && (
                            <label className="h-20 rounded-xl border-2 border-dashed border-slate-300 hover:border-[#006590] bg-slate-50 flex items-center justify-center cursor-pointer transition-colors">
                              <Plus className="h-6 w-6 text-slate-400" />
                              <input type="file" accept="image/*" multiple className="hidden" onChange={handleRImageUpload} />
                            </label>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="w-full h-44 rounded-2xl border border-slate-200 bg-white mb-3 flex flex-col items-center justify-center">
                      <ImageIcon className="h-10 w-10 text-slate-300 mb-2" />
                      <p className="text-[13px] text-slate-400 font-medium">Chưa có hình ảnh nào</p>
                    </div>
                  )}
                  
                  <p className="text-[12px] text-slate-400 leading-relaxed">
                    Bấm <strong className="text-[#006590]">"Tải ảnh thực tế"</strong> để chọn tối đa 5 hình (chọn nhiều hình cùng lúc). (JPG, PNG &lt; 10MB).
                  </p>
                </div>"""
content = content.replace(render_old, render_new)

# Find the submit handler for Room
submit_old = "    const newRoom: Room = {"
submit_new = """    let uploadedImageUrls: string[] = [];
    
    // Tải ảnh lên Supabase
    if (import.meta.env.VITE_SUPABASE_URL) {
      // Import the upload utility dynamically or we can just use the utility we created
      const { uploadImageToSupabase } = await import('../lib/supabase');
      for (const img of rImages) {
        if (img.file) {
          // It's a new file, upload it
          const url = await uploadImageToSupabase(img.file);
          if (url) uploadedImageUrls.push(url);
        } else {
          // It's an existing URL
          uploadedImageUrls.push(img.preview);
        }
      }
    } else {
      // Local fallback
      uploadedImageUrls = rImages.map(img => img.preview);
    }
    
    if (uploadedImageUrls.length === 0) {
      uploadedImageUrls = [ROOM_IMAGE_PRESETS[0]]; // fallback
    }

    const newRoom: Room = {"""
content = content.replace(submit_old, submit_new)

# Replace images: [rImage], with images: uploadedImageUrls,
content = content.replace('images: [rImage],', 'images: uploadedImageUrls,')

with io.open('src/components/PostListingModal.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("SUCCESS")
