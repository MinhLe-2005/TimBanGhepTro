import io

with io.open('src/lib/supabase.ts', 'r', encoding='utf-8') as f:
    content = f.read()

lines = content.split('\n')
for i, line in enumerate(lines):
    if "export async function uploadImageToSupabase" in line:
        for j in range(max(0, i-2), min(i+25, len(lines))):
            print(f"Line {j+1}: {lines[j].strip()}")
        break
