import io
import re

# --- Update RoomModal.tsx ---
with io.open('src/components/RoomModal.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

if "compressImageFile" not in content:
    content = content.replace("import getCroppedImg from '../utils/cropImage';", "import getCroppedImg, { compressImageFile } from '../utils/cropImage';")

target = """    const validImageFiles = files.filter(f => f.type.startsWith("image/"));
    validImageFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
          setNewImages(prev => [...prev, reader.result as string].slice(0, 4));
        }
      };
      reader.readAsDataURL(file);
    });"""

replacement = """    const validImageFiles = files.filter(f => f.type.startsWith("image/"));
    validImageFiles.forEach(file => {
      compressImageFile(file, 1200, 0.8).then(compressedFile => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (reader.result) {
            setNewImages(prev => [...prev, reader.result as string].slice(0, 4));
          }
        };
        reader.readAsDataURL(compressedFile);
      }).catch(err => {
        console.error("Compression error:", err);
        const reader = new FileReader();
        reader.onloadend = () => {
          if (reader.result) {
            setNewImages(prev => [...prev, reader.result as string].slice(0, 4));
          }
        };
        reader.readAsDataURL(file);
      });
    });"""

content = content.replace(target, replacement)

with io.open('src/components/RoomModal.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

# --- Update ChatView.tsx ---
with io.open('src/components/ChatView.tsx', 'r', encoding='utf-8') as f:
    chat_content = f.read()

if "compressImageFile" not in chat_content:
    chat_content = chat_content.replace('import { removePublicStorageUrls, uploadInlineImage } from "../lib/storage";', 'import { removePublicStorageUrls, uploadInlineImage } from "../lib/storage";\nimport { compressImageFile } from "../utils/cropImage";')

target_chat_1 = """    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        onImageSelected(e.target.result as string, file);
      }
    };
    reader.readAsDataURL(file);"""

replacement_chat_1 = """    compressImageFile(file, 1200, 0.8).then(compressedFile => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          onImageSelected(e.target.result as string, compressedFile);
        }
      };
      reader.readAsDataURL(compressedFile);
    }).catch(err => {
      console.error(err);
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          onImageSelected(e.target.result as string, file);
        }
      };
      reader.readAsDataURL(file);
    });"""

chat_content = chat_content.replace(target_chat_1, replacement_chat_1)

target_chat_2 = """                        const reader = new FileReader();
                        reader.onload = (e) => {
                          if (e.target?.result) {
                            setPendingImage({ dataUrl: e.target.result as string, file });
                            setNewMessage('');
                          }
                        };
                        reader.readAsDataURL(file);"""

replacement_chat_2 = """                        compressImageFile(file, 1200, 0.8).then(compressedFile => {
                          const reader = new FileReader();
                          reader.onload = (e) => {
                            if (e.target?.result) {
                              setPendingImage({ dataUrl: e.target.result as string, file: compressedFile });
                              setNewMessage('');
                            }
                          };
                          reader.readAsDataURL(compressedFile);
                        }).catch(err => {
                          const reader = new FileReader();
                          reader.onload = (e) => {
                            if (e.target?.result) {
                              setPendingImage({ dataUrl: e.target.result as string, file });
                              setNewMessage('');
                            }
                          };
                          reader.readAsDataURL(file);
                        });"""

chat_content = chat_content.replace(target_chat_2, replacement_chat_2)

with io.open('src/components/ChatView.tsx', 'w', encoding='utf-8') as f:
    f.write(chat_content)
