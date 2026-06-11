import io

with io.open('src/components/PostListingModal.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

for i, line in enumerate(content.split('\n')):
    if "const dbRoom =" in line:
        for j in range(max(0, i-5), min(i+15, len(content.split('\n')))):
            print(f"Line {j+1}: {content.split('\n')[j]}")
        print("---")
