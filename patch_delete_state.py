import io

with io.open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Modify handleDeleteRoom
old_delete_room = """  const handleDeleteRoom = async (id: string) => {
    // 1. Remove from local fallback
    const saved = localStorage.getItem("roomiematch_posted_rooms");
    if (saved) {
      const parsed = JSON.parse(saved).filter((r: any) => r.id !== id);
      localStorage.setItem("roomiematch_posted_rooms", JSON.stringify(parsed));
    }"""
new_delete_room = """  const handleDeleteRoom = async (id: string) => {
    // 1. Remove from local fallback
    const saved = localStorage.getItem("roomiematch_posted_rooms");
    if (saved) {
      const parsed = JSON.parse(saved).filter((r: any) => r.id !== id);
      localStorage.setItem("roomiematch_posted_rooms", JSON.stringify(parsed));
    }
    // Update local state to immediately remove from UI
    setRooms((prev) => prev.filter((r) => r.id !== id));"""

# Modify handleDeleteRoommate
old_delete_rm = """    const saved = localStorage.getItem("roomiematch_posted_roommates");
    if (saved) {
      const parsed = JSON.parse(saved).filter((r: any) => r.id !== id);
      localStorage.setItem("roomiematch_posted_roommates", JSON.stringify(parsed));
    }"""
new_delete_rm = """    const saved = localStorage.getItem("roomiematch_posted_roommates");
    if (saved) {
      const parsed = JSON.parse(saved).filter((r: any) => r.id !== id);
      localStorage.setItem("roomiematch_posted_roommates", JSON.stringify(parsed));
    }
    // Update local state to immediately remove from UI
    setRoommates((prev) => prev.filter((r) => r.id !== id));"""

if old_delete_room in content and old_delete_rm in content:
    content = content.replace(old_delete_room, new_delete_room)
    content = content.replace(old_delete_rm, new_delete_rm)
    with io.open('src/App.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Deleted states patched.")
else:
    print("Could not find the blocks to replace.")
