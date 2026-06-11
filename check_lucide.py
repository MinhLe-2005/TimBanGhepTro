import io

with io.open('src/components/RoomModal.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

lines = content.split('\n')
for i, line in enumerate(lines):
    if "import" in line and "lucide-react" in line:
        print(f"Line {i+1}: {line.strip()}")
