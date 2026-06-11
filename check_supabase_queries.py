import io

with io.open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

for i, line in enumerate(content.split('\n')):
    if "supabase.from(" in line:
        print(f"Line {i+1}: {line.strip()}")
