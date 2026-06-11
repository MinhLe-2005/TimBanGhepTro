import io

with io.open('src/components/RoommateModal.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

if "email" in content.lower():
    print("Found 'email' in RoommateModal.tsx")
else:
    print("No 'email' in RoommateModal.tsx")
