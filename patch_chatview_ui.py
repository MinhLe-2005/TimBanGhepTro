import io

with io.open('src/components/ChatView.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 2. Remove Right Side UI
old_ui = """               {/* Right Side - Image Upload & Preview */}
               <div className="w-1/2 p-6 overflow-y-auto bg-slate-50">
                 <div>
                   <label className="block text-base font-bold text-slate-700 mb-2">Ảnh minh chứng <span className="font-medium text-slate-400">(không bắt buộc)</span></label>
                   <label className="w-full h-[calc(100%-3rem)] min-h-[400px] flex flex-col items-center justify-center bg-white border-2 border-dashed border-slate-300 rounded-2xl hover:bg-slate-50 hover:border-rose-400 transition-all cursor-pointer">
                     <input
                       type="file"
                       accept="image/*"
                       className="hidden"
                       disabled={isUploadingReport}
                       onChange={e => {
                         if (e.target.files && e.target.files[0]) {
                           const file = e.target.files[0];
                           setReportImageFile(file);
                           const reader = new FileReader();
                           reader.onloadend = () => {
                             setReportImagePreview(reader.result as string);
                           };
                           reader.readAsDataURL(file);
                         }
                       }}
                     />
                     {reportImageFile && reportImagePreview ? (
                       <div className="flex flex-col items-center gap-4 w-full h-full p-6">
                         {/* Large Image Preview */}
                         <div className="flex-1 w-full rounded-xl overflow-hidden border-2 border-emerald-500 shadow-lg flex items-center justify-center bg-slate-100">
                           <img src={reportImagePreview} alt="Preview" className="max-w-full max-h-full object-contain" />
                         </div>
                         <div className="flex flex-col items-center gap-2">
                           <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                           <span className="text-base font-bold text-emerald-600 truncate max-w-[300px]">{reportImageFile.name}</span>
                           <span className="text-sm text-slate-500">Nhấn để chọn ảnh khác</span>
                         </div>
                       </div>
                     ) : (
                       <div className="flex flex-col items-center gap-3 text-slate-500">
                         <UploadCloud className="w-16 h-16 text-slate-400" />
                         <span className="text-lg font-bold">Nhấn để tải ảnh lên</span>
                         <span className="text-sm">Hỗ trợ JPG, PNG, GIF</span>
                       </div>
                     )}
                   </label>
                 </div>
               </div>"""

# 3. Adjust the Left Side to be full width
old_left = """{/* Left Side - Form */}
               <div className="w-1/2 border-r border-slate-200 p-6 overflow-y-auto space-y-6">"""
new_left = """{/* Full Width - Form */}
               <div className="w-full p-6 overflow-y-auto space-y-6 max-w-3xl mx-auto">"""

if old_ui in content:
    content = content.replace(old_ui, "")
    content = content.replace(old_left, new_left)
    with io.open('src/components/ChatView.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print("UI updated successfully.")
else:
    print("Could not find the UI block. Let's see the context.")
