import json
import urllib.request

try:
    with open('src/lib/supabase.ts', 'r', encoding='utf-8') as f:
        content = f.read()
    
    url = ''
    key = ''
    for line in content.split('\n'):
        if 'VITE_SUPABASE_URL' in line:
            url = line.split('"')[1] if '"' in line else line.split("'")[1]
        elif 'VITE_SUPABASE_ANON_KEY' in line:
            key = line.split('"')[1] if '"' in line else line.split("'")[1]
            
    print(f"URL: {url}, Key: {key[:5]}...")
except Exception as e:
    print(e)
