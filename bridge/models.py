"""
Pydantic request/response models for the bridge HTTP API.
"""

from typing import Optional

from pydantic import BaseModel


class CreateRoomReq(BaseModel):
    """Request body for POST /rooms (create room as host)."""
    hostDisplayName: Optional[str] = None


class CreateRoomRes(BaseModel):
    """Response for POST /rooms."""
    roomId: str
    pairCode: str
    hostTicket: str


class JoinRoomReq(BaseModel):
    """Request body for POST /rooms/join (join as guest)."""
    pairCode: str
    guestDisplayName: Optional[str] = None


class JoinRoomRes(BaseModel):
    """Response for POST /rooms/join."""
    roomId: str
    guestTicket: str


class GetSocketUrlReq(BaseModel):
    """
    Request body for POST /getSocketUrl (register Lovense session).

    sessionProof is a JWT with sessionId from the app, used for self-pairing checks.
    """
    authToken: str
    ticket: str
    sessionProof: Optional[str] = None
