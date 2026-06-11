import io

with io.open('src/components/HomeView.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()
    
# print out sections to find where they start
for i, line in enumerate(lines):
    if "Vì sao bạn nên thiết lập" in line or "Khách hàng nói gì về" in line or "Sẵn sàng bắt đầu" in line:
        print(f"Line {i+1}: {line.strip()}")
