import io

with io.open('src/lib/storage.ts', 'r', encoding='utf-8') as f:
    content = f.read()

lines = content.split('\n')
for i, line in enumerate(lines):
    print(f"Line {i+1}: {line}")
