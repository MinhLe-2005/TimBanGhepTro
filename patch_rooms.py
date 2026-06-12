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

req = urllib.request.Request(f"{url}/rest/v1/rooms?select=id,images", headers={"apikey": key, "Authorization": f"Bearer {key}"})
try:
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read().decode())
        for r in data:
            old_images = r.get('images', [])
            new_images = [img for img in old_images if not img.startswith('data:image')]
            
            if len(old_images) != len(new_images):
                if len(new_images) == 0:
                    new_images = ["https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?q=80&w=600&auto=format&fit=crop"]
                update_req = urllib.request.Request(f"{url}/rest/v1/rooms?id=eq.{r['id']}", data=json.dumps({"images": new_images}).encode(), headers={"apikey": key, "Authorization": f"Bearer {key}", "Content-Type": "application/json", "Prefer": "return=representation"}, method="PATCH")
                with urllib.request.urlopen(update_req) as update_res:
                    print(f"Updated room: {r['id']}")
except Exception as e:
    print(e)
