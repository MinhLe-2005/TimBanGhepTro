import io
import os

for root, _, files in os.walk('src'):
    for file in files:
        if file.endswith(('.ts', '.tsx', '.js', '.jsx')):
            path = os.path.join(root, file)
            with io.open(path, 'r', encoding='utf-8') as f:
                content = f.read()
            if "supabase.storage" in content:
                lines = content.split('\n')
                for i, line in enumerate(lines):
                    if "supabase.storage" in line:
                        print(f"{path}:{i+1}: {line.strip()}")
