import io

with io.open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace strict inequality in handleDeleteRoom
old_room = """  const handleDeleteRoom = async (id: string) => {
    // 1. Remove from local fallback
    const saved = localStorage.getItem("roomiematch_posted_rooms");
    if (saved) {
      const parsed = JSON.parse(saved).filter((r: any) => r.id !== id);
      localStorage.setItem("roomiematch_posted_rooms", JSON.stringify(parsed));
    }
    // Update local state to immediately remove from UI
    setRooms((prev) => prev.filter((r) => r.id !== id));

    // Lấy thông tin phòng để xóa ảnh trên Supabase Storage
    const roomToDelete = supabaseRooms.find(r => r.id === id) || JSON.parse(saved || "[]").find((r: any) => r.id === id);

    // 2. Remove from Supabase state optimistically
    setSupabaseRooms((prev) => prev.filter((r) => r.id !== id));"""

new_room = """  const handleDeleteRoom = async (id: string) => {
    // 1. Remove from local fallback
    const saved = localStorage.getItem("roomiematch_posted_rooms");
    if (saved) {
      const parsed = JSON.parse(saved).filter((r: any) => String(r.id) !== String(id));
      localStorage.setItem("roomiematch_posted_rooms", JSON.stringify(parsed));
    }
    // Update local state to immediately remove from UI
    setRooms((prev) => prev.filter((r) => String(r.id) !== String(id)));

    // Lấy thông tin phòng để xóa ảnh trên Supabase Storage
    const roomToDelete = supabaseRooms.find(r => String(r.id) === String(id)) || JSON.parse(saved || "[]").find((r: any) => String(r.id) === String(id));

    // 2. Remove from Supabase state optimistically
    setSupabaseRooms((prev) => prev.filter((r) => String(r.id) !== String(id)));"""

# Replace strict inequality in handleDeleteRoommate
old_rm = """  const handleDeleteRoommate = async (id: string) => {
    console.log('[App] Starting delete for ID:', id);
    console.log('[App] Currently selectedRoommate:', selectedRoommate?.id);
    
    // 1. Check if this is a user profile (is_listing = false) - should not be deleted
    if (import.meta.env.VITE_SUPABASE_URL) {
      const { data: roommateData, error: fetchError } = await supabase.from('roommates').select('is_listing, user_id, name').eq('id', id).single();
      
      console.log('[Delete] Checking record:', { id, data: roommateData, error: fetchError });
      
      // Only block deletion if is_listing is explicitly FALSE (user profile)
      // Allow deletion if is_listing is TRUE or NULL (listings)
      if (roommateData && roommateData.is_listing === false) {
        toast('Không thể xóa hồ sơ cá nhân từ trang này. Hồ sơ cá nhân chỉ có thể chỉnh sửa, không thể xóa.', 'warning');
        return;
      }
      
      console.log('[Delete] Allowed to delete - is_listing:', roommateData?.is_listing);
    }

    const saved = localStorage.getItem("roomiematch_posted_roommates");
    if (saved) {
      const parsed = JSON.parse(saved).filter((r: any) => r.id !== id);
      localStorage.setItem("roomiematch_posted_roommates", JSON.stringify(parsed));
    }
    // Update local state to immediately remove from UI
    setRoommates((prev) => prev.filter((r) => r.id !== id));

    setSupabaseRoommates((prev) => prev.filter((r) => r.id !== id));"""

new_rm = """  const handleDeleteRoommate = async (id: string) => {
    console.log('[App] Starting delete for ID:', id);
    console.log('[App] Currently selectedRoommate:', selectedRoommate?.id);
    
    // 1. Check if this is a user profile (is_listing = false) - should not be deleted
    if (import.meta.env.VITE_SUPABASE_URL) {
      const { data: roommateData, error: fetchError } = await supabase.from('roommates').select('is_listing, user_id, name').eq('id', id).single();
      
      console.log('[Delete] Checking record:', { id, data: roommateData, error: fetchError });
      
      // Only block deletion if is_listing is explicitly FALSE (user profile)
      // Allow deletion if is_listing is TRUE or NULL (listings)
      if (roommateData && roommateData.is_listing === false) {
        toast('Không thể xóa hồ sơ cá nhân từ trang này. Hồ sơ cá nhân chỉ có thể chỉnh sửa, không thể xóa.', 'warning');
        return;
      }
      
      console.log('[Delete] Allowed to delete - is_listing:', roommateData?.is_listing);
    }

    const saved = localStorage.getItem("roomiematch_posted_roommates");
    if (saved) {
      const parsed = JSON.parse(saved).filter((r: any) => String(r.id) !== String(id));
      localStorage.setItem("roomiematch_posted_roommates", JSON.stringify(parsed));
    }
    // Update local state to immediately remove from UI
    setRoommates((prev) => prev.filter((r) => String(r.id) !== String(id)));

    setSupabaseRoommates((prev) => prev.filter((r) => String(r.id) !== String(id)));"""

if old_room in content and old_rm in content:
    content = content.replace(old_room, new_room)
    content = content.replace(old_rm, new_rm)
    with io.open('src/App.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Patched string equality!")
else:
    print("Could not find the text to replace.")
