import io
import re

with io.open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

effects = re.finditer(r'useEffect\(\s*\(\)\s*=>\s*\{.*?\}(?:\s*,\s*\[(.*?)\])?\s*\)', content, re.DOTALL)
for match in effects:
    deps = match.group(1)
    if deps is None:
        start_pos = match.start()
        line_num = content.count('\n', 0, start_pos) + 1
        print(f"Missing deps at line {line_num}")
