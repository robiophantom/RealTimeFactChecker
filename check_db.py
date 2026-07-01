import os
from supabase import create_client

supabase_url = os.environ.get("SUPABASE_URL", "")
supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")

if not supabase_url:
    from dotenv import load_dotenv
    load_dotenv(r"d:\UsersMovedData\Desktop\RTFC\apps\api\.env")
    supabase_url = os.environ.get("SUPABASE_URL", "")
    supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")

client = create_client(supabase_url, supabase_key)

uploads = client.table("uploads").select("*").order("created_at", desc=True).limit(5).execute()
for u in uploads.data:
    print(f"ID: {u['id']}, Status: {u['status']}, Error: {u['error_message']}, Filename: {u['filename']}")
