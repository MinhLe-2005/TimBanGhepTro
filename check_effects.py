import io

with io.open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

lines = content.split('\n')
for i, line in enumerate(lines):
    if "useEffect(" in line:
        for j in range(i, min(i+10, len(lines))):
            print(f"Line {j+1}: {lines[j]}")
        print("---")
