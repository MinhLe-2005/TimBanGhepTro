import io
with io.open('src/App.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if "recalculate roommates" in line or "supabaseReviews" in line:
        pass

# Let's just find the useEffect that depends on supabaseReviews
for i, line in enumerate(lines):
    if "useEffect(() => {" in line:
        for j in range(i, min(i+50, len(lines))):
            if "supabaseReviews" in lines[j] and setSupabaseRoommates in lines[j]:
                pass
