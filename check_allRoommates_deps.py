import io
with io.open('src/App.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if "const allRoommates = useMemo(() => {" in line:
        for j in range(i, len(lines)):
            if "}, [" in lines[j]:
                print(f"Line {j+1}: {lines[j].strip()}")
                break
