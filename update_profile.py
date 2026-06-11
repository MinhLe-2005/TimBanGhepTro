import io
import re

with io.open('src/components/CreateProfileModal.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add import
if "uploadInlineImage" not in content:
    content = content.replace('import { supabase } from "../lib/supabase";', 'import { supabase } from "../lib/supabase";\nimport { uploadInlineImage, isInlineImage } from "../lib/storage";')

# Update handleSubmit
target = """    const updatedProfile = {
      id: profileId,
      name,
      age: Number(age),
      role,
      avatar: selectedAvatar,
      location,"""

replacement = """    let finalAvatar = selectedAvatar;
    if (isInlineImage(finalAvatar)) {
      try {
        finalAvatar = await uploadInlineImage('room-images', `avatar_${Date.now()}_${profileId}.png`, finalAvatar);
      } catch (err) {
        console.error("Lỗi upload avatar", err);
      }
    }

    const updatedProfile = {
      id: profileId,
      name,
      age: Number(age),
      role,
      avatar: finalAvatar,
      location,"""

content = content.replace(target, replacement)

with io.open('src/components/CreateProfileModal.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
