import io

with io.open('src/components/RoommateCard.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

for line in content.split('\n'):
    if "<img" in line or "avatar" in line.lower():
        print(line.strip())
