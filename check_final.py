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

# Patch profiles
patch_req = urllib.request.Request(f"{url}/rest/v1/profiles?avatar=like.data:image*&limit=1", data=json.dumps({"avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop"}).encode(), headers={"apikey": key, "Authorization": f"Bearer {key}", "Content-Type": "application/json", "Prefer": "return=representation"}, method="PATCH")
try:
    with urllib.request.urlopen(patch_req) as response:
        print("Patched profiles table.")
except Exception as e:
    print(e)

def check_all(table_name):
    req = urllib.request.Request(f"{url}/rest/v1/{table_name}?select=*", headers={"apikey": key, "Authorization": f"Bearer {key}"})
    try:
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode())
            count = 0
            for r in data:
                for k, v in r.items():
                    if isinstance(v, str) and v.startswith('data:image'):
                        count += 1
                        print(f"Found base64 in {table_name}.{k}")
                    elif isinstance(v, list):
                        for img in v:
                            if isinstance(img, str) and img.startswith('data:image'):
                                count += 1
                                print(f"Found base64 in {table_name}.{k}")
            print(f"Total base64 in {table_name}: {count}")
    except Exception as e:
        print(f"Error checking {table_name}: {e}")

check_all('reviews')
check_all('room_reviews')
check_all('profiles')
check_all('messages')
