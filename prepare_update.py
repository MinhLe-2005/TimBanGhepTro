import io
import re

with io.open('src/components/PostListingModal.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add imports
if "uploadInlineImage" not in content:
    content = content.replace('import { supabase } from "../lib/supabase";', 'import { supabase } from "../lib/supabase";\nimport { uploadInlineImage, isInlineImage } from "../lib/storage";')

# Update activeTab === "roommate" submission
target_rm = """        const dbRoommate = {
          id: editingListingData?.id || `rm-${Date.now()}`,
          is_listing: true,
          name: rmName,
          age: Number(rmAge),"""

replacement_rm = """        let finalRmAvatar = rmAvatar;
        if (isInlineImage(finalRmAvatar)) {
          try {
            finalRmAvatar = await uploadInlineImage('room-images', `avatar_${Date.now()}.png`, finalRmAvatar);
          } catch(e) { console.error(e); }
        }

        const dbRoommate = {
          id: editingListingData?.id || `rm-${Date.now()}`,
          is_listing: true,
          name: rmName,
          age: Number(rmAge),
          avatar: finalRmAvatar,"""

# Remove the original `avatar: rmAvatar,` which was below `age: Number(rmAge),`
# Let's use regex to replace it safely
pattern_rm = r'const dbRoommate = \{\s*id: editingListingData\?\.id \|\| `rm-\$\{Date\.now\(\)\}`,\s*is_listing: true,\s*name: rmName,\s*age: Number\(rmAge\),\s*avatar: rmAvatar,'
content = re.sub(pattern_rm, replacement_rm.replace('avatar: finalRmAvatar,', ''), content)

# Wait, regex is tricky. Let's just do it directly.
