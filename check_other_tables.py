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

def check_table(table_name, column_name):
    req = urllib.request.Request(f"{url}/rest/v1/{table_name}?select=id,{column_name}", headers={"apikey": key, "Authorization": f"Bearer {key}"})
    try:
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode())
            count = 0
            for r in data:
                val = r.get(column_name)
                if isinstance(val, str) and val.startswith('data:image'):
                    count += 1
                elif isinstance(val, list):
                    for img in val:
                        if isinstance(img, str) and img.startswith('data:image'):
                            count += 1
            print(f"Base64 in {table_name}.{column_name}: {count}")
    except Exception as e:
        print(f"Error checking {table_name}: {e}")

check_table('profiles', 'avatar')
check_table('reviews', 'user_avatar')
check_table('room_reviews', 'user_avatar')
