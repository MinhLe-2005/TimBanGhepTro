import io

with io.open('src/components/PostListingModal.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

lines = content.split('\n')
for i, line in enumerate(lines):
    if "supabase.from('rooms').insert" in line:
        for j in range(max(0, i-20), min(i+15, len(lines))):
            print(f"Line {j+1}: {lines[j].strip()}")
        break
