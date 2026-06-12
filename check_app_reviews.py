import io
with io.open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()
if "supabase.from('reviews')" in content:
    print("Found reviews fetch in App.tsx")
else:
    print("NO reviews fetch in App.tsx")
