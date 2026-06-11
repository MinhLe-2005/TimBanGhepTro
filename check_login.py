import io

with io.open('src/components/LoginModal.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

lines = content.split('\n')
for i, line in enumerate(lines):
    if "onClose(" in line or "onLoginSuccess(" in line:
        print(f"Line {i+1}: {line.strip()}")
