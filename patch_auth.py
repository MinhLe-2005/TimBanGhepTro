import io

with io.open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

target = "if (session?.user) {"
new_code = """if (session?.user) {
        if (sessionStorage.getItem('isRecovering') === 'true') {
          console.log('[Auth] In password recovery flow - ignoring session until password is reset');
          return;
        }"""

if target in content:
    content = content.replace(target, new_code)
    with io.open('src/App.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print("SUCCESS")
else:
    print("FAIL")

