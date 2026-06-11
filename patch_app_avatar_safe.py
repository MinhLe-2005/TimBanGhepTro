import io

with io.open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

old_delete = """      // Không xóa avatar của roommate listing vì avatar này thường là avatar profile (dùng chung)
      // hoặc là chuỗi base64. Nếu xóa sẽ ảnh hưởng đến profile chính.

      const { error } = await supabase.from('roommates').delete().eq('id', id);"""

new_delete = """      // Chỉ xóa ảnh avatar của roommate listing NẾU nó khác với avatar của Profile hiện tại
      // và không phải là ảnh Preset có sẵn.
      const rmToDelete = supabaseRoommates.find(r => r.id === id) || JSON.parse(saved || "[]").find((r: any) => r.id === id);
      const AVATAR_PRESETS = [
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=150&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=150&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150&auto=format&fit=crop",
      ];
      
      const currentProfile = user ? profiles.find(p => p.id === user.id) : null;
      
      if (rmToDelete && rmToDelete.avatar) {
        const isProfileAvatar = currentProfile?.avatar === rmToDelete.avatar;
        const isPreset = AVATAR_PRESETS.includes(rmToDelete.avatar);
        
        if (!isProfileAvatar && !isPreset) {
          await deleteImagesFromSupabase([rmToDelete.avatar], 'room-images');
        }
      }

      const { error } = await supabase.from('roommates').delete().eq('id', id);"""

content = content.replace(old_delete, new_delete)

with io.open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("SUCCESS")
