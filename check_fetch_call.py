import io

with io.open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

lines = content.split('\n')
for i, line in enumerate(lines):
    if "fetchSupabaseData" in line:
        for j in range(max(0, i-5), min(i+20, len(lines))):
            print(f"Line {j+1}: {lines[j].strip()}")
        break
