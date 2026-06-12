import io
with io.open('src/components/AdminDashboard.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if "Bài đăng tìm bạn" in line or "roommates" in line:
        if i > 50 and i < 150:
            print(f"Line {i+1}: {line.strip()}")
