import io
import re

with io.open('src/components/PostListingModal.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add import
if "compressImageFile" not in content:
    content = content.replace("import getCroppedImg", "import getCroppedImg, { compressImageFile }")

# Update handleRImageUpload
target = """        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === "string") {
             // Lọc bỏ placeholder mặc định nếu có khi up ảnh mới
             newImages.push({ file, preview: reader.result });
          }
          resolve();
        };
        reader.readAsDataURL(file);"""

replacement = """        compressImageFile(file, 1200, 0.8).then(compressedFile => {
          const reader = new FileReader();
          reader.onloadend = () => {
            if (typeof reader.result === "string") {
               newImages.push({ file: compressedFile, preview: reader.result });
            }
            resolve();
          };
          reader.readAsDataURL(compressedFile);
        }).catch(err => {
          console.error("Compression failed", err);
          const reader = new FileReader();
          reader.onloadend = () => {
            if (typeof reader.result === "string") {
               newImages.push({ file, preview: reader.result });
            }
            resolve();
          };
          reader.readAsDataURL(file);
        });"""

content = content.replace(target, replacement)

with io.open('src/components/PostListingModal.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
