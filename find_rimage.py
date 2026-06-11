import io

with io.open('src/components/PostListingModal.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

lines = content.split('\n')
for i, line in enumerate(lines):
    if "rImage" in line or "ROOM_IMAGE_PRESETS" in line or "handleRImageUpload" in line:
        print(f"Line {i+1}: {line.strip()}")
