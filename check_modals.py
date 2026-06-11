import io

for filename in ['src/components/CreateProfileModal.tsx', 'src/components/PostListingModal.tsx']:
    with io.open(filename, 'r', encoding='utf-8') as f:
        content = f.read()
    if "canvas" in content.lower() or "compress" in content.lower() or "resizer" in content.lower():
        print(f"Found compression in {filename}")
