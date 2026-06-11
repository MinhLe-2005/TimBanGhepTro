import io

with io.open('src/components/InterestedRoommatesModal.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

lines = content.split('\n')
for i in range(max(0, len(lines)-40), len(lines)):
    print(f"Line {i+1}: {lines[i].strip()}")
