import io

with io.open('src/components/RoomCard.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

lines = content.split('\n')
for i, line in enumerate(lines):
    if "XEM TẤT CẢ" in line or "setShowGallery" in line or "showGallery" in line:
        print(f"Line {i+1}: {line.strip()}")
