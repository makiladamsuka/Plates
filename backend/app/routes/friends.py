import re
from fastapi import APIRouter, HTTPException, Depends, Request
from app.supabase_client import supabase, get_supabase_client_for_token
from app.middleware.auth import get_current_user
from app.models.schemas import AcceptFriendRequest, DeleteFriendRequest
from typing import Dict, Any
from pydantic import BaseModel

router = APIRouter(prefix="/api/friends", tags=["friends"])

class AddFriendRequest(BaseModel):
    userId: str
    friendId: str

@router.get("/{userId}")
async def get_user_friends(
    userId: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    try:
        res = supabase.from_("friends").select("""
            friend_id,
            created_at,
            profiles:friend_id (
                id,
                full_name,
                avatar_url,
                username
            )
        """).eq("user_id", userId).execute()

        friends = []
        for item in (res.data or []):
            if item.get("profiles"):
                friends.append(item["profiles"])
        return friends
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("", status_code=201)
async def add_friend(
    body: AddFriendRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    try:
        res = supabase.from_("friends").insert({
            "user_id": body.userId,
            "friend_id": body.friendId,
            "status": "pending"
        }).execute()
        return res.data
    except Exception as e:
        err_msg = str(e)
        if "23505" in err_msg or "duplicate key" in err_msg:
            raise HTTPException(status_code=409, detail="Already friends")
        raise HTTPException(status_code=500, detail=err_msg)

@router.post("/accept")
async def accept_friend(
    request: Request,
    body: AcceptFriendRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    try:
        if not body.requesterId or not body.friendId:
            raise HTTPException(status_code=400, detail="requesterId and friendId are required")

        auth_header = request.headers.get("authorization", "")
        token = auth_header.replace("Bearer ", "") if auth_header.startswith("Bearer ") else None
        db_client = get_supabase_client_for_token(token)

        # 1. Try Supabase RPC first
        rpc_failed = False
        try:
            db_client.rpc("accept_friend_request", {
                "p_requester_id": body.requesterId,
                "p_friend_id": body.friendId
            }).execute()
        except Exception:
            rpc_failed = True

        if rpc_failed:
            # Fallback direct updates
            db_client.from_("friends").update({"status": "accepted"}).eq("user_id", body.requesterId).eq("friend_id", body.friendId).execute()
            db_client.from_("friends").upsert({
                "user_id": body.friendId,
                "friend_id": body.requesterId,
                "status": "accepted"
            }, on_conflict="user_id,friend_id").execute()

        return {"message": "Friend request accepted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("")
async def delete_friend(
    body: DeleteFriendRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    try:
        effective_user_id = current_user.get("id") or body.userId
        friend_id = body.friendId

        if not effective_user_id or not friend_id:
            raise HTTPException(status_code=400, detail="User ID and Friend ID are required")

        # 1. Fetch all shared bills
        bills_res = supabase.from_("bills").select("id, title, status, creator_id, participants(*)").execute()
        bills = bills_res.data or []

        shared_bills = [
            b for b in bills
            if (b.get("creator_id") == effective_user_id or any(p.get("friend_id") == effective_user_id for p in (b.get("participants") or [])))
            and (b.get("creator_id") == friend_id or any(p.get("friend_id") == friend_id for p in (b.get("participants") or [])))
        ]

        # Check for unsettled bills
        unsettled_bills = []
        for b in shared_bills:
            if b.get("status") == "Settled":
                continue
            parts = b.get("participants") or []
            friend_part = next((p for p in parts if p.get("friend_id") == friend_id), None)
            user_part = next((p for p in parts if p.get("friend_id") == effective_user_id), None)

            is_user_creator = b.get("creator_id") == effective_user_id
            is_friend_creator = b.get("creator_id") == friend_id

            if is_user_creator and friend_part and not friend_part.get("paid"):
                unsettled_bills.append(b)
            elif is_friend_creator and user_part and not user_part.get("paid"):
                unsettled_bills.append(b)
            elif b.get("status") != "Settled" and ((friend_part and not friend_part.get("paid")) or (user_part and not user_part.get("paid"))):
                unsettled_bills.append(b)

        if unsettled_bills:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot delete friend: You have {len(unsettled_bills)} unsettled bill(s) with this friend. Please settle all bills before deleting."
            )

        # 2. Perform friend deletion in both directions
        supabase.from_("friends").delete().eq("user_id", effective_user_id).eq("friend_id", friend_id).execute()
        supabase.from_("friends").delete().eq("user_id", friend_id).eq("friend_id", effective_user_id).execute()

        return {"message": "Friend removed successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
