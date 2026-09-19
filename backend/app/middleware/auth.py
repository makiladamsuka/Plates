from fastapi import Request, HTTPException, Security, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.supabase_client import supabase
from app.config import NODE_ENV
from typing import Optional, Dict, Any

security = HTTPBearer(auto_error=False)

async def get_current_user(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Security(security)
) -> Dict[str, Any]:
    """
    Middleware dependency to authenticate requests via Supabase JWT Bearer tokens.
    In development mode, falls back to demo-user or query/body parameters if missing.
    """
    token = credentials.credentials if credentials else None
    
    # Check if Authorization header is present
    if not token:
        if NODE_ENV != "production":
            # Fallback for dev mode / demo token
            user_id = request.query_params.get("userId") or "demo-user-me"
            return {"id": user_id, "email": "demo@plates.live"}
        raise HTTPException(status_code=401, detail="Missing or invalid authorization token")

    if NODE_ENV != "production" and token == "guest-token":
        user_id = request.query_params.get("userId") or "demo-user-me"
        return {"id": user_id, "email": "guest@plates.live"}

    try:
        user_res = supabase.auth.get_user(token)
        if not user_res or not user_res.user:
            if NODE_ENV != "production":
                user_id = request.query_params.get("userId") or "demo-user-me"
                return {"id": user_id, "email": "dev@plates.live"}
            raise HTTPException(status_code=401, detail="Unauthorized: Invalid or expired token")
        
        user = user_res.user
        return {
            "id": str(user.id),
            "email": getattr(user, "email", None),
            "user_metadata": getattr(user, "user_metadata", {})
        }
    except Exception as e:
        if NODE_ENV != "production":
            user_id = request.query_params.get("userId") or "demo-user-me"
            return {"id": user_id, "email": "fallback@plates.live"}
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")
