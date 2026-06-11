import io

with io.open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

for i, line in enumerate(content.split('\n')):
    if "const handleSaveProfile =" in line:
        for j in range(max(0, i), min(i+40, len(content.split('\n')))):
            print(f"Line {j+1}: {content.split('\n')[j]}")
        break
