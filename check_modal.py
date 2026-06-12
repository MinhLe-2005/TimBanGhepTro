import io
with io.open('src/components/RoommateModal.tsx', 'r', encoding='utf-8') as f:
    content = f.read()
if "supabase" in content and "reviews" in content:
    print("Found reviews fetch in RoommateModal.tsx")
