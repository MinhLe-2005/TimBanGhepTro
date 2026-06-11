import io

with io.open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add a safety timeout for loading states to prevent infinite spinners
timeout_hook = """  // Fallback safety timeout: force stop loading after 10s if Supabase hangs
  useEffect(() => {
    const t1 = setTimeout(() => setIsRoommatesLoading(false), 10000);
    const t2 = setTimeout(() => setIsRoomsLoading(false), 10000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const [supabaseRooms, setSupabaseRooms] = useState<any[]>(() => {"""

content = content.replace("  const [supabaseRooms, setSupabaseRooms] = useState<any[]>(() => {", timeout_hook)

with io.open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("SUCCESS")
