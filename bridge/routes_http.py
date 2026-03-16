"""
HTTP API: create room, join room, getSocketUrl (Lovense proxy).
"""

import random
import string
import uuid

from fastapi import APIRouter, Depends, HTTPException, Request

from bridge.auth import create_ticket
from bridge.models import CreateRoomReq, CreateRoomRes, JoinRoomReq, JoinRoomRes, GetSocketUrlReq
from bridge.rate_limit import check_rate_limit
from bridge.state import registry
from bridge.socket_url_service import SocketUrlService

from .deps import get_http_client

router = APIRouter()

PAIR_CODE_LENGTH = 8
RATE_LIMIT_ROOMS = 10
RATE_LIMIT_JOIN = 30
RATE_LIMIT_GET_SOCKET_URL = 30

_socket_url_service = SocketUrlService(registry)


def _client_ip(request: Request) -> str:
    """Client IP; prefer X-Forwarded-For when behind proxy."""
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


@router.post("/rooms", response_model=CreateRoomRes)
async def create_room(req: CreateRoomReq, request: Request) -> CreateRoomRes:
    """Create a new room; returns roomId, pairCode, and hostTicket."""
    ip = _client_ip(request)
    ok, err = check_rate_limit(ip, "rooms", RATE_LIMIT_ROOMS)
    if not ok:
        raise HTTPException(status_code=429, detail=err)
    room_id = str(uuid.uuid4())
    pair_code = "".join(random.choices(string.ascii_uppercase + string.digits, k=PAIR_CODE_LENGTH))
    token = create_ticket(room_id, "host")
    registry.create_room(room_id, pair_code)
    from bridge.config import logger
    logger.info("Created Room: %s (Code: %s)", room_id, pair_code)
    return CreateRoomRes(roomId=room_id, pairCode=pair_code, hostTicket=token)


@router.post("/rooms/join", response_model=JoinRoomRes)
async def join_room(req: JoinRoomReq, request: Request) -> JoinRoomRes:
    """Join an existing room by pairCode; returns roomId and guestTicket."""
    ip = _client_ip(request)
    ok, err = check_rate_limit(ip, "join", RATE_LIMIT_JOIN)
    if not ok:
        raise HTTPException(status_code=429, detail=err)
    pair_code = req.pairCode.upper()
    result = registry.join_room(pair_code)
    if not result:
        raise HTTPException(status_code=404, detail="Room not found")
    room_id, _ = result
    token = create_ticket(room_id, "guest")
    from bridge.config import logger
    logger.info("Guest joined Room: %s", room_id)
    return JoinRoomRes(roomId=room_id, guestTicket=token)


@router.post("/getSocketUrl")
async def get_socket_url(
    req: GetSocketUrlReq,
    request: Request,
    http_client=Depends(get_http_client),
) -> dict:
    """
    Register Lovense session: call Lovense getSocketUrl, build WS URL,
    spawn backend tunnel, handle self-pairing checks.
    """
    ip = _client_ip(request)
    ok, err = check_rate_limit(ip, "getsocketurl", RATE_LIMIT_GET_SOCKET_URL)
    if not ok:
        raise HTTPException(status_code=429, detail=err)
    return await _socket_url_service.register(
        req.authToken, req.ticket, req.sessionProof, http_client
    )
