import io
with io.open('src/components/RoommateModal.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

if "supabase" in content:
    print("supabase found in RoommateModal")
else:
    print("supabase NOT found in RoommateModal")
    
if "const reviews =" in content or "const averageRating =" in content:
    lines = content.split('\n')
    for i, line in enumerate(lines):
        if "const reviews =" in line or "const averageRating =" in line:
            print(line.strip())
