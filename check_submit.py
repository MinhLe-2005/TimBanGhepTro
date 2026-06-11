import io

with io.open('src/components/PostListingModal.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

lines = content.split('\n')
for i, line in enumerate(lines):
    if "handleRoomSubmit = async" in line:
        for j in range(i, i+15):
            print(f"Line {j+1}: {lines[j]}")
        break
