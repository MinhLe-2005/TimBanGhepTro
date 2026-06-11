import io

with io.open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

lines = content.split('\n')
for i, line in enumerate(lines):
    if "Toast " in line or "toast" in line.lower() and "<div" in line:
        print(f"Line {i+1}: {line.strip()}")
