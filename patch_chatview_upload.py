import io

with io.open('src/components/ChatView.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Remove image upload logic in handleSendReport
old_upload = """       if (reportImageFile) {
         try {
           const fileExt = reportImageFile.name.split('.').pop();
           const fileName = `${myId}_report_${Date.now()}.${fileExt}`;

           const { error: uploadError } = await supabase.storage
             .from('reports')
             .upload(fileName, reportImageFile);

           if (uploadError) throw uploadError;

           const { data: urlData } = supabase.storage
             .from('reports')
             .getPublicUrl(fileName);

           finalImageUrl = urlData.publicUrl;
         } catch (err: any) {
           console.error("Lỗi upload ảnh:", err);
           toast("Không thể tải ảnh minh chứng. Hãy thử lại hoặc gửi báo cáo không kèm ảnh.", "error", 5000);
           setIsUploadingReport(false);
           return;
         }
       }"""

content = content.replace(old_upload, "")

with io.open('src/components/ChatView.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Removed image upload logic.")
