import io
with io.open('src/App.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if "<RoommateGrid" in line or "const allRoommates =" in line or "roommates.filter" in line:
        for j in range(max(0, i-2), min(i+5, len(lines))):
            print(f"Line {j+1}: {lines[j].strip()}")
