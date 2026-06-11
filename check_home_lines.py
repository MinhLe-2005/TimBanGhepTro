import io

with io.open('src/components/HomeView.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

lines = content.split('\n')
for i, line in enumerate(lines):
    if "import RoomCard" in line:
        print(f"Line {i+1}: {line.strip()}")
    if "const [showAllLikedRoommates" in line:
        print(f"Line {i+1}: {line.strip()}")
    if "const [showAllLikedRooms" in line:
        print(f"Line {i+1}: {line.strip()}")
