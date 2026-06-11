import io

with io.open('src/components/RoomModal.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

lines = content.split('\n')
for i, line in enumerate(lines):
    if "showGallery" in line:
        for j in range(max(0, i-2), min(i+15, len(lines))):
            print(f"Line {j+1}: {lines[j].strip()}")
        print("---")
        break
