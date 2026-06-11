import io
import re

with io.open('src/components/RoomModal.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

target = """    const newReview = {
      id: `rev-${Date.now()}`,
      room_id: room.id,
      user_id: currentUserProfile?.id || "guest",
      user_name: currentUserProfile?.name || "Người dùng ẩn danh",
      user_avatar: currentUserProfile?.avatar || AVATAR_PRESETS[0],
      rating: newRating,
      text: newReviewText,
      images: newImages,
      created_at: new Date().toISOString()
    };"""

replacement = """    let finalImages = [...newImages];
    for (let i = 0; i < finalImages.length; i++) {
      if (isInlineImage(finalImages[i])) {
        try {
          finalImages[i] = await uploadInlineImage('room-images', `review_${Date.now()}_${i}.png`, finalImages[i]);
        } catch (err) {
          console.error("Failed to upload review image", err);
        }
      }
    }

    const newReview = {
      id: `rev-${Date.now()}`,
      room_id: room.id,
      user_id: currentUserProfile?.id || "guest",
      user_name: currentUserProfile?.name || "Người dùng ẩn danh",
      user_avatar: currentUserProfile?.avatar || AVATAR_PRESETS[0],
      rating: newRating,
      text: newReviewText,
      images: finalImages,
      created_at: new Date().toISOString()
    };"""

if "uploadInlineImage" not in content:
    content = content.replace('import { supabase } from "../lib/supabase";', 'import { supabase } from "../lib/supabase";\nimport { uploadInlineImage, isInlineImage } from "../lib/storage";')
    content = content.replace(target, replacement)
    with io.open('src/components/RoomModal.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Updated RoomModal.tsx")
