import io
import re

with io.open('src/components/AdminDashboard.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

if "base64" in content.lower():
    print("Found base64 in AdminDashboard")
