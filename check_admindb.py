import io

with io.open('src/components/AdminDashboard.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

for i, line in enumerate(content.split('\n')):
    if "rm.phoneNumber" in line:
        print(f"Line {i+1}: {line.strip()}")
