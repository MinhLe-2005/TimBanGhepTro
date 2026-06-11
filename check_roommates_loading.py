import io

with io.open('src/components/RoommatesView.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

lines = content.split('\n')
for i, line in enumerate(lines):
    if "Đang tải danh sách" in line:
        for j in range(max(0, i-5), i+6):
            print(f"Line {j+1}: {lines[j].strip()}")
        break
