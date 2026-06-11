import io

with io.open('src/components/AdminDashboard.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

lines = content.split('\n')
for i, line in enumerate(lines):
    if "UserCard" in line and "=>" in line or "function UserCard" in line:
        for j in range(max(0, i-2), min(i+40, len(lines))):
            print(f"Line {j+1}: {lines[j]}")
        print("---")
