import io

with io.open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

for i, line in enumerate(content.split('\n')):
    if "email" in line.lower() and "setcurrentuser" in line.lower():
        for j in range(max(0, i-2), min(i+5, len(content.split('\n')))):
            print(f"Line {j+1}: {content.split('\n')[j]}")
        print("---")
