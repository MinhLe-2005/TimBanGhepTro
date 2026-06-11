import io

with io.open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

lines = content.split('\n')
for i, line in enumerate(lines):
    if "Merging rooms" in line or "Merging roommates" in line:
        print(f"Line {i+1}: {line.strip()}")
