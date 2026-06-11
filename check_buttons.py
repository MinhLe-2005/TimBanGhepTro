import io

with io.open('src/components/PostListingModal.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

lines = content.split('\n')
for i, line in enumerate(lines):
    if "Hủy bỏ" in line or "Đăng tin" in line:
        for j in range(max(0, i-5), min(len(lines), i+5)):
            print(f"Line {j+1}: {lines[j]}")
        break
