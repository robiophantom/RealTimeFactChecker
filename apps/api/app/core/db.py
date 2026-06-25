from supabase import create_client, Client
from app.core.config import settings

def get_supabase_client() -> Client:
    url: str = settings.SUPABASE_URL
    key: str = settings.SUPABASE_SERVICE_ROLE_KEY # Use service role key for background workers
    
    if not url or not key:
        raise ValueError("Supabase URL and Service Role Key are not set")
        
    return create_client(url, key)

supabase_client = get_supabase_client()
