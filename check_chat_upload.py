import io

with io.open('src/components/ChatView.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

for i, line in enumerate(content.split('\n')):
    if "isInlineImage" in line or "uploadInlineImage" in line:
        print(f"Line {i+1}: {line.strip()}")
