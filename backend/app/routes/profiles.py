import re
from fastapi import APIRouter, HTTPException, Depends, Query
from app.supabase_client import supabase
from app.middleware.auth import get_current_user
from typing import Optional, Dict, Any

router = APIRouter(prefix="/api/profiles", tags=["profiles"])

@router.get("/search")
async def search_profiles(
    q: Optional[str] = Query(None),
    userId: Optional[str] = Query(None),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    try:
        if not q or not q.strip():
            return []

        # Strip special control characters to prevent filter injection
        sanitized_q = re.sub(r'[,()%.@]', '', q).strip()
        if not sanitized_q:
            return []

        query = supabase.from_("profiles").select("id, full_name, username, avatar_url").or_(
            f"full_name.ilike.%{sanitized_q}%,username.ilike.%{sanitized_q}%"
        ).limit(10)

        if userId:
            query = query.neq("id", userId)

        res = query.execute()
        return res.data or []
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
