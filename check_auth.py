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
            
    # Try querying auth.users just in case
    req = urllib.request.Request(f"{url}/rest/v1/auth.users?select=*", headers={"apikey": key, "Authorization": f"Bearer {key}"})
    try:
        response = urllib.request.urlopen(req)
        print("Success: ", response.read().decode('utf-8'))
    except Exception as e:
        print("Error fetching auth.users:", e)
except Exception as e:
    print(e)
