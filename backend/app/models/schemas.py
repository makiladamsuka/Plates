from pydantic import BaseModel, Field
from typing import List, Optional, Any, Dict

class ParticipantInput(BaseModel):
    friendId: str
    share: float
    paid: Optional[bool] = False

class CreateBillRequest(BaseModel):
    title: str
    category: Optional[str] = "Food"
    total: float
    status: Optional[str] = "Pending"
    creatorId: Optional[str] = None
    participants: Optional[List[ParticipantInput]] = []

class UserIdRequest(BaseModel):
    userId: Optional[str] = None

class FriendIdRequest(BaseModel):
    friendId: str

class AcceptFriendRequest(BaseModel):
    requesterId: str
    friendId: str

class DeleteFriendRequest(BaseModel):
    userId: Optional[str] = None
    friendId: str

class DeleteAccountRequest(BaseModel):
    userId: Optional[str] = None

class DeleteBillRequest(BaseModel):
    userId: Optional[str] = None
