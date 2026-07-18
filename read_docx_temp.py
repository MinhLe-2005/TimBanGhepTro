import zipfile
import xml.etree.ElementTree as ET
import sys
import io

# Set stdout to utf-8 to handle unicode characters properly
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

def extract_text(docx_path):
    text = []
    try:
        with zipfile.ZipFile(docx_path) as docx:
            xml_content = docx.read('word/document.xml')
            tree = ET.fromstring(xml_content)
            for p in tree.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}p'):
                texts = [node.text for node in p.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}t') if node.text]
                if texts:
                    text.append(''.join(texts))
    except Exception as e:
        print(f"Error: {e}")
    return '\n'.join(text)

print(extract_text(r"D:\Jobs\roomiematch\MKT20A03-Team 2-SSB201-PROPOSAL 1.docx"))
