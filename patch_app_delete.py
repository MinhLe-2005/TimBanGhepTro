import io

with io.open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

import_statement = "import { supabase, withoutExtendedRoomFields, withoutExtendedRoommateFields, getListingErrorMessage } from './lib/supabase';"
import_new = "import { supabase, withoutExtendedRoomFields, withoutExtendedRoommateFields, getListingErrorMessage, deleteImagesFromSupabase } from './lib/supabase';"

content = content.replace(import_statement, import_new)

# Update handleDeleteRoom
delete_room_old = """  const handleDeleteRoom = async (id: string) => {
    // 1. Remove from local fallback
    const saved = localStorage.getItem("roomiematch_posted_rooms");
    if (saved) {
      const parsed = JSON.parse(saved).filter((r: any) => r.id !== id);
      localStorage.setItem("roomiematch_posted_rooms", JSON.stringify(parsed));
    }

    // 2. Remove from Supabase state optimistically
    setSupabaseRooms((prev) => prev.filter((r) => r.id !== id));
    
    // 3. Supabase Delete
    if (import.meta.env.VITE_SUPABASE_URL) {
      const { error } = await supabase.from('rooms').delete().eq('id', id);
      if (error) console.error("Error deleting room from Supabase:", error);
    }
  };"""

delete_room_new = """  const handleDeleteRoom = async (id: string) => {
    // 1. Remove from local fallback
    const saved = localStorage.getItem("roomiematch_posted_rooms");
    if (saved) {
      const parsed = JSON.parse(saved).filter((r: any) => r.id !== id);
      localStorage.setItem("roomiematch_posted_rooms", JSON.stringify(parsed));
    }

    // Lấy thông tin phòng để xóa ảnh trên Supabase Storage
    const roomToDelete = supabaseRooms.find(r => r.id === id) || JSON.parse(saved || "[]").find((r: any) => r.id === id);

    // 2. Remove from Supabase state optimistically
    setSupabaseRooms((prev) => prev.filter((r) => r.id !== id));
    
    // 3. Supabase Delete
    if (import.meta.env.VITE_SUPABASE_URL) {
      // Xóa ảnh trước
      if (roomToDelete && roomToDelete.images && roomToDelete.images.length > 0) {
        await deleteImagesFromSupabase(roomToDelete.images, 'room-images');
      }

      const { error } = await supabase.from('rooms').delete().eq('id', id);
      if (error) console.error("Error deleting room from Supabase:", error);
    }
  };"""

content = content.replace(delete_room_old, delete_room_new)

# Update handleDeleteRoommate
delete_roommate_old = """    // 5. Supabase Delete - delete the record
    if (import.meta.env.VITE_SUPABASE_URL) {
      const { error } = await supabase.from('roommates').delete().eq('id', id);
      if (error) {
        console.error("[App] Error deleting roommate listing from Supabase:", error);
      } else {
        console.log('[App] Successfully deleted roommate listing:', id);
      }
    }"""

delete_roommate_new = """    // 5. Supabase Delete - delete the record
    if (import.meta.env.VITE_SUPABASE_URL) {
      // Lấy thông tin roommate để xóa ảnh avatar trên Supabase Storage
      const rmToDelete = supabaseRoommates.find(r => r.id === id) || JSON.parse(saved || "[]").find((r: any) => r.id === id);
      if (rmToDelete && rmToDelete.avatar) {
        // Assume avatar might be in 'room-images' bucket or 'avatars' bucket, usually we upload to room-images if from the same modal
        await deleteImagesFromSupabase([rmToDelete.avatar], 'room-images');
      }

      const { error } = await supabase.from('roommates').delete().eq('id', id);
      if (error) {
        console.error("[App] Error deleting roommate listing from Supabase:", error);
      } else {
        console.log('[App] Successfully deleted roommate listing:', id);
      }
    }"""

content = content.replace(delete_roommate_old, delete_roommate_new)

with io.open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("SUCCESS")
