import io

with io.open('src/components/LoginModal.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add setItem to handleForgotPassword
content = content.replace(
    'setOtpType("recovery");',
    'setOtpType("recovery");\n      sessionStorage.setItem("isRecovering", "true");'
)

# Add removeItem to handleResetPassword
content = content.replace(
    'if (error) throw error;',
    'if (error) throw error;\n      sessionStorage.removeItem("isRecovering");\n      // Dispatch event so App.tsx re-checks session\n      window.dispatchEvent(new Event("auth_refresh"));'
)

with io.open('src/components/LoginModal.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("SUCCESS")
