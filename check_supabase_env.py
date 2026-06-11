import urllib.request
import json
import os

supabase_url = os.environ.get("VITE_SUPABASE_URL", "")
supabase_key = os.environ.get("VITE_SUPABASE_ANON_KEY", "")

if not supabase_url:
    # Try to read from .env
    try:
        with open(".env", "r") as f:
            for line in f:
                if line.startswith("VITE_SUPABASE_URL="):
                    supabase_url = line.strip().split("=")[1].strip('"').strip("'")
                elif line.startswith("VITE_SUPABASE_ANON_KEY="):
                    supabase_key = line.strip().split("=")[1].strip('"').strip("'")
    except Exception as e:
        print("Could not read .env:", e)

print(f"Supabase URL: {supabase_url}")
# We can't query policies directly via REST API anon key.
