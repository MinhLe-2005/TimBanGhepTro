import io

with io.open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

for line in content.split('\n'):
    if "removePublicStorageUrls" in line:
        print(line.strip())
