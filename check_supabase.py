import io
import os

supabase_file = 'src/lib/supabase.ts'
if os.path.exists(supabase_file):
    with io.open(supabase_file, 'r', encoding='utf-8') as f:
        print(f.read())
else:
    print("supabase.ts not found")
