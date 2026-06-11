import io

with io.open('src/components/Header.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

lines = content.split('\n')
for i, line in enumerate(lines):
    if "ChangePassword" in line or "Đăng xuất tài khoản" in line or "Đổi mật khẩu" in line:
        print(f"Line {i+1}: {line.strip()}")
