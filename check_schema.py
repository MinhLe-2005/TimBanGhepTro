import json

try:
    with open('supabase/migrations/20240101000000_initial_schema.sql', 'r', encoding='utf-8') as f:
        content = f.read()
    
    for i, line in enumerate(content.split('\n')):
        if 'create table' in line.lower() or 'roommates' in line.lower():
            for j in range(max(0, i-2), min(i+40, len(content.split('\n')))):
                print(f"Line {j+1}: {content.split('\n')[j]}")
            break
except Exception as e:
    print(e)
