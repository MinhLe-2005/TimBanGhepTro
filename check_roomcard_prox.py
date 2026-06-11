import io

with io.open('src/components/RoomCard.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

lines = content.split('\n')
for i, line in enumerate(lines):
    if "proximity" in line:
        for j in range(max(0, i-2), min(i+5, len(lines))):
            print(f"Line {j+1}: {lines[j].strip()}")
        break
