import io

with io.open('src/lib/storage.ts', 'r', encoding='utf-8') as f:
    content = f.read()

for line in content.split('\n'):
    if "compress" in line.lower() or "canvas" in line.lower():
        print(line.strip())
