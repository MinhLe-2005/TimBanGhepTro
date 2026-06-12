import io
with io.open('src/components/AdminDashboard.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if "const roommateListings" in line or "roommates.filter" in line:
        print(f"Line {i+1}: {line.strip()}")
