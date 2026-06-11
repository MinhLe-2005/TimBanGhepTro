import io

with io.open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

lines = content.split('\n')
for i, line in enumerate(lines):
    if "const handleLoginSuccess =" in line or "function handleLoginSuccess(" in line:
        start = max(0, i - 1)
        end = min(len(lines), i + 15)
        for j in range(start, end):
            print(f"Line {j+1}: {lines[j].strip()}")
