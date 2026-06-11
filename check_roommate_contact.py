import io

with io.open('src/components/RoommateModal.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

lines = content.split('\n')
for i, line in enumerate(lines):
    if "email" in line.lower() or "liên hệ" in line.lower() or "contact" in line.lower() or "sđt" in line.lower() or "phone" in line.lower():
        print(f"Line {i+1}: {line.strip()}")
