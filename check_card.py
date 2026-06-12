import io
with io.open('src/components/RoommateCard.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if "Chưa đánh giá" in line or "Uy tín" in line:
        print(f"Line {i+1}: {line.strip()}")
