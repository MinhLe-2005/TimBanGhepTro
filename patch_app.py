import io

with io.open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

old_logic = """const visibleLocalRoommates = import.meta.env.VITE_SUPABASE_URL
      ? roommates.filter((roommate) => {
          if (supabaseRoommates.some(sr => sr.id === roommate.id)) return true;
          if (initialRoommateIds.has(String(roommate.id))) return true;
          const ownerId = String(roommate.user_id || roommate.postedBy || "");
          const ownerName = String(roommate.name || "").trim().toLowerCase();
          return !!currentUser?.id && (
            ownerId === currentUser.id ||
            (!ownerId && !!currentName && ownerName === currentName)
          );
        })
      : roommates;"""

new_logic = """const visibleLocalRoommates = import.meta.env.VITE_SUPABASE_URL
      ? roommates.filter((roommate) => {
          // If Supabase is connected, only include local mock data
          // Do not resurrect user's old local posts if they were deleted from Supabase
          if (initialRoommateIds.has(String(roommate.id))) {
             // Don't duplicate if it's already in Supabase
             return !supabaseRoommates.some(sr => sr.id === roommate.id);
          }
          return false;
        })
      : roommates;"""

if old_logic in content:
    content = content.replace(old_logic, new_logic)
    with io.open('src/App.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Updated allRoommates merge logic to stop resurrecting deleted posts.")
else:
    print("Could not find exact block. Let's try regex or replace chunk.")
