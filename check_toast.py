import io

with io.open('src/components/PostListingModal.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

if "toast" in content:
    print("toast is used")
else:
    print("toast is NOT used")
