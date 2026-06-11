import io

with io.open('src/components/PostListingModal.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

lines = content.split('\n')
for i, line in enumerate(lines):
    if "image" in line.lower() or "ảnh" in line.lower() or "upload" in line.lower():
        print(f"Line {i+1}: {line.strip()}")
