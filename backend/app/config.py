import os
from dotenv import load_dotenv

load_dotenv()

PORT = int(os.getenv("PORT", 3000))
CLIENT_URL = os.getenv("CLIENT_URL", "http://localhost:5173")
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://rvxyaepqrvtmprfjhtld.supabase.co")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "sb_publishable_9h1vRM946kBiK5gBKZTUBQ_8DeObQYA")
SUPABASE_KEY = SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY
NODE_ENV = os.getenv("NODE_ENV", "development")

ALLOWED_ORIGINS = [
    CLIENT_URL,
    "https://plates.live",
    "https://www.plates.live",
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:3000",
    "http://localhost:3001",
]
