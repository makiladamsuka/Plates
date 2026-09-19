from fastapi import APIRouter, HTTPException, Depends, Request
from app.supabase_client import supabase, get_supabase_client_for_token
from app.middleware.auth import get_current_user
from app.models.schemas import DeleteAccountRequest
from typing import Dict, Any, Optional

router = APIRouter(prefix="/api/account", tags=["account"])

@router.delete("")
async def delete_account(
    request: Request,
    body: Optional[DeleteAccountRequest] = None,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    try:
        effective_user_id = current_user.get("id") or (body.userId if body else None)

        if not effective_user_id:
            raise HTTPException(status_code=400, detail="User ID is required")

        auth_header = request.headers.get("authorization", "")
        token = auth_header.replace("Bearer ", "") if auth_header.startswith("Bearer ") else None
        db_client = get_supabase_client_for_token(token)

        # 1. Fetch all bills involving this user
        bills_res = db_client.from_("bills").select("id, title, status, creator_id, participants(*)").execute()
        bills = bills_res.data or []

        user_bills = [
            b for b in bills
            if b.get("creator_id") == effective_user_id or any(p.get("friend_id") == effective_user_id for p in (b.get("participants") or []))
        ]

        # 2. Check for unsettled bills
        unsettled_bills = []
        for b in user_bills:
            if b.get("status") == "Settled":
                continue
            is_creator = b.get("creator_id") == effective_user_id
            parts = b.get("participants") or []

            if is_creator:
                if any(not p.get("paid") for p in parts):
                    unsettled_bills.append(b)
            else:
                user_part = next((p for p in parts if p.get("friend_id") == effective_user_id), None)
                if user_part and not user_part.get("paid"):
                    unsettled_bills.append(b)

        if unsettled_bills:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot delete account: You have {len(unsettled_bills)} unsettled bill(s). Please settle all payments and debts with all friends first."
            )

        # 3. Clean up database records
        # A. Delete user's participant entries in other bills
        db_client.from_("participants").delete().eq("friend_id", effective_user_id).execute()

        # B. Delete bills created by this user
        user_created_ids = [b["id"] for b in bills if b.get("creator_id") == effective_user_id]
        if user_created_ids:
            db_client.from_("participants").delete().in_("bill_id", user_created_ids).execute()
            db_client.from_("bills").delete().eq("creator_id", effective_user_id).execute()

        # C. Delete all friend relationships
        db_client.from_("friends").delete().eq("user_id", effective_user_id).execute()
        db_client.from_("friends").delete().eq("friend_id", effective_user_id).execute()

        # D. Delete profile
        db_client.from_("profiles").delete().eq("id", effective_user_id).execute()

        # E. Attempt admin delete on auth if available
        try:
            if hasattr(supabase.auth, "admin") and hasattr(supabase.auth.admin, "delete_user"):
                supabase.auth.admin.delete_user(effective_user_id)
        except Exception as e:
            print("Auth admin delete notice:", e)

        return {"success": True, "message": "Account and associated records deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
