import io

with io.open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

lines = content.split('\n')
for i in range(103, 831):
    if "return " in lines[i]:
        print(f"Line {i+1}: {lines[i].strip()}")
