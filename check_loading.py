import io

with io.open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

lines = content.split('\n')
for i, line in enumerate(lines):
    if "setIsLoading(" in line or "isLoading" in line:
        print(f"Line {i+1}: {line.strip()}")
