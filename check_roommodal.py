import io

with io.open('src/components/RoomModal.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

lines = content.split('\n')
for i, line in enumerate(lines):
    if "XEM TẤT CẢ" in line or "setShowGallery(true)" in line:
        for j in range(max(0, i-10), min(i+10, len(lines))):
            print(f"Line {j+1}: {lines[j].strip()}")
        break
