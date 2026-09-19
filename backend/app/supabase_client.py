from supabase import create_client, Client
from app.config import SUPABASE_URL, SUPABASE_KEY, SUPABASE_SERVICE_ROLE_KEY

if not SUPABASE_SERVICE_ROLE_KEY:
    print("⚠️ [Backend] Warning: SUPABASE_SERVICE_ROLE_KEY is missing. Using anon key — RLS may block writes.")

# Default shared backend Supabase client (using service role or anon key)
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def get_supabase_client_for_token(token: str | None = None) -> Client:
    """Returns a client scoped with the user's JWT Bearer token if provided."""
    if not token:
        return supabase
    
    # Create client with Authorization header
    return create_client(
        SUPABASE_URL,
        SUPABASE_KEY,
        options={
            "headers": {
                "Authorization": f"Bearer {token}"
            }
        }
    )
