import io

with io.open('src/components/AdminDashboard.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

lines = content.split('\n')
for i, line in enumerate(lines):
    if "const handleAction =" in line or "handleIgnore" in line or "handleResolve" in line or "ReportAction" in line or "handleUpdateStatus" in line:
        for j in range(max(0, i-2), min(i+15, len(lines))):
            print(f"Line {j+1}: {lines[j].strip()}")
        print("---")
        break
