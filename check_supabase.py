import json
import urllib.request

with open('.env', 'r', encoding='utf-8') as f:
    content = f.read()

url = ''
key = ''
for line in content.split('\n'):
    if line.startswith('VITE_SUPABASE_URL='):
        url = line.split('=')[1].strip().strip('"').strip("'")
    if line.startswith('VITE_SUPABASE_ANON_KEY='):
        key = line.split('=', 1)[1].strip().strip('"').strip("'")

req = urllib.request.Request(f"{url}/rest/v1/messages?select=id,image_url", headers={"apikey": key, "Authorization": f"Bearer {key}"})
try:
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read().decode())
        count = 0
        for r in data:
            if r.get('image_url') and r.get('image_url').startswith('data:image'):
                count += 1
        print(f"Base64 chat messages: {count}")
except Exception as e:
    print(e)
