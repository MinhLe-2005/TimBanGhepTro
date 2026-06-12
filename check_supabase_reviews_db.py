import json
import urllib.request

with open('.env', 'r', encoding='utf-8') as f:
    content = f.read()

url = ''
key = ''
for line in content.split('\n'):
    if line.startswith('VITE_SUPABASE_URL='):
        url = line.split('=')[1].strip()
    if line.startswith('VITE_SUPABASE_ANON_KEY='):
        key = line.split('=')[1].strip()

req = urllib.request.Request(f"{url}/rest/v1/reviews?select=*", headers={
    "apikey": key,
    "Authorization": f"Bearer {key}"
})

response = urllib.request.urlopen(req)
data = json.loads(response.read())

print(f"Total reviews: {len(data)}")
for d in data:
    print(d['roommate_id'], d['rating'])
