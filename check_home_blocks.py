import io

with io.open('src/components/HomeView.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

lines = content.split('\n')
for i, line in enumerate(lines):
    if "import RoomCard" in line:
        for j in range(max(0, i-2), min(i+3, len(lines))):
            print(f"Line {j+1}: {lines[j]}")
        print("---")
    if "Bạn Ở Ghép Tiềm Năng" in line:
        for j in range(max(0, i-3), min(i+35, len(lines))):
            print(f"Line {j+1}: {lines[j]}")
        print("---")
    if "Phòng Trọ Yêu Thích" in line:
        for j in range(max(0, i-3), min(i+40, len(lines))):
            print(f"Line {j+1}: {lines[j]}")
        print("---")
