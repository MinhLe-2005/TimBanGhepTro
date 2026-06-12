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

# Update 1 test avatar
req = urllib.request.Request(f"{url}/rest/v1/roommates?avatar=like.data:image*&limit=1", data=json.dumps({"avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop"}).encode(), headers={"apikey": key, "Authorization": f"Bearer {key}", "Content-Type": "application/json", "Prefer": "return=representation"}, method="PATCH")
try:
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read().decode())
        print(f"Updated: {len(data)}")
except Exception as e:
    print(e)
