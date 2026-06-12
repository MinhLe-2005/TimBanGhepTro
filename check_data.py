import io
with io.open('src/data.ts', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if "Minh" in line or "Quang" in line:
        print(f"Line {i+1}: {line.strip()}")
