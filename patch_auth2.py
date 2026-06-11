import io

with io.open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

target = "const { data: { subscription } } = supabase.auth.onAuthStateChange"
new_code = """useEffect(() => {
      const handleAuthRefresh = () => {
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (session?.user) {
            setCurrentUser({
              id: session.user.id,
              email: session.user.email,
              name: session.user.user_metadata?.full_name || "Thành viên Roomie",
              avatar: session.user.user_metadata?.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=150&auto=format&fit=crop",
            });
          }
        });
      };
      window.addEventListener("auth_refresh", handleAuthRefresh);
      return () => window.removeEventListener("auth_refresh", handleAuthRefresh);
    }, []);

    const { data: { subscription } } = supabase.auth.onAuthStateChange"""

if target in content:
    content = content.replace(target, new_code)
    with io.open('src/App.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print("SUCCESS")
else:
    print("FAIL")

