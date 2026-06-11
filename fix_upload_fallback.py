import io

with io.open('src/components/PostListingModal.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

old_upload = """        if (img.file) {
          // It's a new file, upload it
          const url = await uploadImageToSupabase(img.file);
          if (url) uploadedImageUrls.push(url);
        } else {"""

new_upload = """        if (img.file) {
          // It's a new file, upload it
          const url = await uploadImageToSupabase(img.file);
          if (url) {
            uploadedImageUrls.push(url);
          } else {
            console.warn("Supabase upload failed, falling back to base64 string");
            uploadedImageUrls.push(img.preview);
          }
        } else {"""

content = content.replace(old_upload, new_upload)

with io.open('src/components/PostListingModal.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("SUCCESS")
