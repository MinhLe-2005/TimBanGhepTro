import io

with io.open('src/components/HomeView.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

lines = content.split('\n')
for i, line in enumerate(lines):
    if "likedRoommateIds.length > 4" in line:
        print(f"Line {i+1}: {line.strip()}")
    if "likedRoommates.slice(0, 4)" in line:
        print(f"Line {i+1}: {line.strip()}")
    if "likedRoomIds.length > 4" in line:
        print(f"Line {i+1}: {line.strip()}")
    if "likedRooms.slice(0, 4)" in line:
        print(f"Line {i+1}: {line.strip()}")
