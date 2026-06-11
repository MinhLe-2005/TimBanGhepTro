import io

with io.open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

old_code = """      // Lấy thông tin roommate để xóa ảnh avatar trên Supabase Storage
      const rmToDelete = supabaseRoommates.find(r => r.id === id) || JSON.parse(saved || "[]").find((r: any) => r.id === id);
      if (rmToDelete && rmToDelete.avatar) {
        // Assume avatar might be in 'room-images' bucket or 'avatars' bucket, usually we upload to room-images if from the same modal
        await deleteImagesFromSupabase([rmToDelete.avatar], 'room-images');
      }

      const { error } = await supabase.from('roommates').delete().eq('id', id);"""

new_code = """      // Không xóa avatar của roommate listing vì avatar này thường là avatar profile (dùng chung)
      // hoặc là chuỗi base64. Nếu xóa sẽ ảnh hưởng đến profile chính.

      const { error } = await supabase.from('roommates').delete().eq('id', id);"""

content = content.replace(old_code, new_code)

with io.open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("SUCCESS")
