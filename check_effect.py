import io
with io.open('src/App.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if "useEffect" in line and "supabaseReviews" in line:
        print(f"Line {i+1}: {line.strip()}")
