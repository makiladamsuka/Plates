from fastapi import APIRouter, HTTPException, Depends, Query, Request
from app.supabase_client import supabase
from app.middleware.auth import get_current_user
from app.models.schemas import CreateBillRequest, UserIdRequest, FriendIdRequest, DeleteBillRequest
from typing import Optional, List, Dict, Any

router = APIRouter(prefix="/api/bills", tags=["bills"])

def enrich_bill_participants(bills_list: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Enriches participants of a bill with full_name, avatar_url, username from profiles."""
    if not bills_list:
        return []

    all_friend_ids = list({
        p.get("friend_id")
        for b in bills_list
        for p in (b.get("participants") or [])
        if p.get("friend_id")
    } | {
        b.get("creator_id")
        for b in bills_list
        if b.get("creator_id")
    })

    profiles_map = {}
    if all_friend_ids:
        res = supabase.from_("profiles").select("id, full_name, avatar_url, username").in_("id", all_friend_ids).execute()
        for prof in (res.data or []):
            profiles_map[prof["id"]] = prof

    enriched = []
    for b in bills_list:
        participants = []
        for p in (b.get("participants") or []):
            f_id = p.get("friend_id")
            prof = profiles_map.get(f_id)
            participants.append({
                **p,
                "profile": prof,
                "full_name": prof.get("full_name") if prof else None,
                "avatar_url": prof.get("avatar_url") if prof else None,
                "username": prof.get("username") if prof else None
            })
        enriched.append({
            **b,
            "participants": participants
        })
    return enriched

@router.get("")
async def get_bills(
    userId: Optional[str] = Query(None),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    try:
        res = supabase.from_("bills").select("*, participants(*)").execute()
        bills = res.data or []

        if userId:
            bills = [
                b for b in bills
                if b.get("creator_id") == userId or any(p.get("friend_id") == userId for p in (b.get("participants") or []))
            ]

        enriched = enrich_bill_participants(bills)
        return enriched
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{id}")
async def get_bill_by_id(
    id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    try:
        res = supabase.from_("bills").select("*, participants(*)").eq("id", id).single().execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Bill not found")
        
        enriched = enrich_bill_participants([res.data])
        return enriched[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("", status_code=201)
async def create_bill(
    body: CreateBillRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    try:
        creator_id = body.creatorId or current_user.get("id")

        # 1. Create the bill
        bill_res = supabase.from_("bills").insert({
            "title": body.title,
            "category": body.category or "Food",
            "total": body.total,
            "status": body.status or "Pending",
            "creator_id": creator_id
        }).execute()

        if not bill_res.data:
            raise HTTPException(status_code=500, detail="Failed to create bill")

        new_bill = bill_res.data[0]
        bill_id = new_bill["id"]

        # 2. Insert participants if provided
        if body.participants:
            part_inserts = []
            for p in body.participants:
                is_creator = (creator_id is not None) and (p.friendId == creator_id)
                part_inserts.append({
                    "bill_id": bill_id,
                    "friend_id": p.friendId,
                    "share": p.share,
                    "paid": True if is_creator else bool(p.paid),
                    "accepted": True if is_creator else False
                })
            
            supabase.from_("participants").insert(part_inserts).execute()

        # 3. Fetch and enrich complete bill
        complete_res = supabase.from_("bills").select("*, participants(*)").eq("id", bill_id).single().execute()
        enriched = enrich_bill_participants([complete_res.data])
        return enriched[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{id}/accept")
async def accept_bill(
    id: str,
    body: UserIdRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    try:
        user_id = body.userId or current_user.get("id")
        res = supabase.from_("participants").update({
            "accepted": True,
            "paid": False
        }).eq("bill_id", id).eq("friend_id", user_id).execute()

        supabase.from_("bills").update({"status": "Pending"}).eq("id", id).execute()

        return {"message": "Bill accepted", "data": res.data, "status": "Pending"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{id}/decline")
async def decline_bill(
    id: str,
    body: UserIdRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    try:
        user_id = body.userId or current_user.get("id")
        supabase.from_("participants").update({
            "accepted": False,
            "paid": False
        }).eq("bill_id", id).eq("friend_id", user_id).execute()

        supabase.from_("bills").update({"status": "Rejected"}).eq("id", id).execute()

        return {"message": "Bill declined"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{id}/send-payment")
async def send_payment(
    id: str,
    body: FriendIdRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    try:
        res = supabase.from_("participants").update({
            "payment_sent": True,
            "accepted": True,
            "paid": False
        }).eq("bill_id", id).eq("friend_id", body.friendId).execute()

        return {"message": "Payment marked as sent, awaiting creator confirmation", "data": res.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{id}/confirm-payment")
async def confirm_payment(
    id: str,
    body: FriendIdRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    try:
        res = supabase.from_("participants").update({
            "paid": True,
            "payment_sent": True,
            "accepted": True
        }).eq("bill_id", id).eq("friend_id", body.friendId).execute()

        # Check if all participants are paid
        parts_res = supabase.from_("participants").select("paid").eq("bill_id", id).execute()
        parts = parts_res.data or []
        all_paid = len(parts) > 0 and all(p.get("paid") is True for p in parts)

        if all_paid:
            supabase.from_("bills").update({"status": "Settled"}).eq("id", id).execute()

        return {"message": "Payment confirmed by creator", "data": res.data, "allPaid": all_paid}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{id}/decline-payment")
async def decline_payment(
    id: str,
    body: FriendIdRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    try:
        res = supabase.from_("participants").update({
            "payment_sent": False,
            "paid": False
        }).eq("bill_id", id).eq("friend_id", body.friendId).execute()

        return {"message": "Payment receipt declined", "data": res.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{id}/pay")
async def pay_share(
    id: str,
    body: FriendIdRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    try:
        res = supabase.from_("participants").update({
            "paid": True,
            "payment_sent": True
        }).eq("bill_id", id).eq("friend_id", body.friendId).execute()

        parts_res = supabase.from_("participants").select("paid").eq("bill_id", id).execute()
        parts = parts_res.data or []
        all_paid = len(parts) > 0 and all(p.get("paid") is True for p in parts)

        if all_paid:
            supabase.from_("bills").update({"status": "Settled"}).eq("id", id).execute()

        return {"message": "Share paid", "data": res.data, "allPaid": all_paid}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{id}")
async def delete_bill(
    id: str,
    body: Optional[DeleteBillRequest] = None,
    userId: Optional[str] = Query(None),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    try:
        effective_user_id = current_user.get("id") or (body.userId if body else None) or userId
        if not effective_user_id:
            raise HTTPException(status_code=401, detail="User ID required")

        # 1. Fetch bill and participants
        bill_res = supabase.from_("bills").select("*, participants(*)").eq("id", id).single().execute()
        bill = bill_res.data
        if not bill:
            raise HTTPException(status_code=404, detail="Bill not found")

        is_creator = bill.get("creator_id") == effective_user_id
        is_participant = any(p.get("friend_id") == effective_user_id for p in (bill.get("participants") or []))

        if not is_creator and not is_participant:
            raise HTTPException(status_code=403, detail="You are not authorized to modify this bill")

        if is_creator:
            # Creator can delete the entire bill
            supabase.from_("participants").delete().eq("bill_id", id).execute()
            supabase.from_("bills").delete().eq("id", id).execute()
            return {"message": "Bill deleted successfully", "isCreator": True}
        else:
            # Non-creator participant: can only delete settled bills
            is_settled = bill.get("status") == "Settled"
            my_part = next((p for p in (bill.get("participants") or []) if p.get("friend_id") == effective_user_id), None)
            is_my_share_paid = my_part.get("paid") is True if my_part else False

            if not is_settled and not is_my_share_paid:
                raise HTTPException(
                    status_code=403,
                    detail="Only the bill creator can delete an unsettled bill. You can only remove bills once they are settled."
                )

            supabase.from_("participants").delete().eq("bill_id", id).eq("friend_id", effective_user_id).execute()
            return {"message": "Settled bill removed from your list", "isCreator": False}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
