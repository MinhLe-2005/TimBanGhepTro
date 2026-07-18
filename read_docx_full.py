import zipfile
import xml.etree.ElementTree as ET
import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

def extract_all_text(docx_path):
    text = []
    try:
        with zipfile.ZipFile(docx_path) as docx:
            xml_content = docx.read('word/document.xml')
            tree = ET.fromstring(xml_content)
            
            # Simple namespace removal for easier searching
            for elem in tree.iter():
                if '}' in elem.tag:
                    elem.tag = elem.tag.split('}', 1)[1]
            
            # Extract text from p (paragraphs) and tbl (tables) in order
            for body_child in tree.find('body').iter():
                if body_child.tag == 'p':
                    texts = [t.text for t in body_child.findall('.//t') if t.text]
                    if texts:
                        text.append(''.join(texts))
                elif body_child.tag == 'tbl':
                    for row in body_child.findall('.//tr'):
                        row_data = []
                        for cell in row.findall('.//tc'):
                            cell_texts = [t.text for t in cell.findall('.//t') if t.text]
                            if cell_texts:
                                row_data.append(''.join(cell_texts))
                        if row_data:
                            text.append(' | '.join(row_data))
                    text.append("--- [End of Table] ---")
    except Exception as e:
        print(f"Error: {e}")
    return '\n'.join(text)

print(extract_all_text(r"D:\Jobs\roomiematch\MKT20A03-Team 2-SSB201-PROPOSAL 1.docx"))
