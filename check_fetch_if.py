import io

with io.open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

lines = content.split('\n')
for i in range(300, 315):
    print(f"Line {i+1}: {lines[i].strip()}")
