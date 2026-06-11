import io

with io.open('src/components/HomeView.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

lines = content.split('\n')
for i, line in enumerate(lines):
    if "likedRoommates.map" in line:
        for j in range(max(0, i-2), min(i+15, len(lines))):
            print(f"Line {j+1}: {lines[j].strip()}")
        print("---")
    if "filter((r) => likedRoomIds.includes(r.id))" in line:
        for j in range(max(0, i-2), min(i+15, len(lines))):
            print(f"Line {j+1}: {lines[j].strip()}")
        print("---")
