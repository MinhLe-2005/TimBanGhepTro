import io
import os

for root, _, files in os.walk('supabase'):
    for file in files:
        if file.endswith('.sql'):
            path = os.path.join(root, file)
            with io.open(path, 'r', encoding='utf-8') as f:
                content = f.read()
            if "rooms" in content and "REFERENCES" in content:
                print(f"File: {path}")
