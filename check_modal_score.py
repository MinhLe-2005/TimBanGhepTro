import io
with io.open('src/components/RoommateModal.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if "Uy tín" in line or "reputationScore" in line:
        print(line.strip())
