import io
with io.open('src/App.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if "setSupabaseRoommates" in line:
        for j in range(max(0, i-2), min(i+10, len(lines))):
            print(f"Line {j+1}: {lines[j].strip()}")
