"""
Register Lovense session with the bridge: getSocketUrl, self-pairing, spawn backend tunnel.
"""

import asyncio
from typing import Optional

import jwt
import httpx

from bridge.auth import decode_ticket, session_id_from_proof
from bridge.backend_tunnel import run_backend_connection
from bridge.config import ALLOW_SELF_PAIRING, IS_PRODUCTION, logger
from bridge.lovense import LovenseClient
from bridge.state import RoomRegistry
from fastapi import HTTPException


class SocketUrlService:
    """
    Handles POST /getSocketUrl: validate ticket, call Lovense getSocketUrl,
    apply self-pairing rules, spawn BackendTunnel.
    """

    def __init__(self, registry: RoomRegistry) -> None:
        self._registry = registry

    async def register(
        self,
        auth_token: str,
        ticket: str,
        session_proof: Optional[str],
        http_client: httpx.AsyncClient,
    ) -> dict:
        """
        Register Lovense session. Returns {"ok": True} or raises HTTPException.
        """
        try:
            room_id, role = decode_ticket(ticket)
        except jwt.InvalidTokenError:
            raise HTTPException(status_code=401, detail="Invalid ticket")

        socket_info = await self._fetch_socket_url(auth_token, http_client)
        final_ws_url = LovenseClient.build_websocket_url(socket_info, auth_token)

        room = self._registry.get_room(room_id)
        guest_session_id = session_id_from_proof(session_proof) if role == "guest" else None

        self._store_host_session(room_id, role, room, auth_token, session_proof)

        if role == "guest":
            if self._reject_guest_same_session(room_id, room, guest_session_id):
                raise HTTPException(
                    status_code=403,
                    detail="Self-pairing is disabled. Use a different browser or device (different session) to join as guest.",
                )
            if self._use_host_backend_for_guest(room_id, role, room, auth_token, guest_session_id):
                return {"ok": True}
            if guest_session_id is not None and room:
                room.guest_session_id = guest_session_id

        if role == "host" and room:
            await self._disconnect_guest_if_same_session(room_id, room)

        if room:
            room.touch_activity()

        logger.info("Spawning Lovense backend tunnel for Room %s (%s)", room_id, role)
        asyncio.create_task(run_backend_connection(final_ws_url, room_id, role))
        return {"ok": True}

    async def _fetch_socket_url(self, auth_token: str, http_client: httpx.AsyncClient) -> dict:
        client = LovenseClient(http_client)
        try:
            return await client.get_socket_url(auth_token)
        except httpx.HTTPStatusError as e:
            if IS_PRODUCTION:
                logger.warning("Lovense API error: %s", e)
                raise HTTPException(
                    status_code=502, detail="Lovense service temporarily unavailable"
                )
            raise HTTPException(status_code=502, detail=str(e))
        except ValueError as e:
            if IS_PRODUCTION:
                logger.warning("Lovense token rejected: %s", e)
                raise HTTPException(status_code=400, detail="Invalid or expired session")
            raise HTTPException(status_code=400, detail=str(e))

    def _store_host_session(
        self,
        room_id: str,
        role: str,
        room,
        auth_token: str,
        session_proof: Optional[str],
    ) -> None:
        if role != "host" or not room:
            return
        room.host_auth_token = auth_token
        if session_proof:
            room.host_session_id = session_id_from_proof(session_proof)

    def _reject_guest_same_session(
        self, room_id: str, room, guest_session_id: Optional[str]
    ) -> bool:
        if not room or not room.host_session_id or guest_session_id is None:
            return False
        if guest_session_id != room.host_session_id:
            return False
        if ALLOW_SELF_PAIRING:
            return False
        logger.info(
            "Room %s: rejected guest (same sessionId as host, self-pairing disabled)", room_id
        )
        return True

    def _use_host_backend_for_guest(
        self,
        room_id: str,
        role: str,
        room,
        auth_token: str,
        guest_session_id: Optional[str],
    ) -> bool:
        if role != "guest" or not room or not ALLOW_SELF_PAIRING:
            return False
        same_session = room.host_session_id and guest_session_id == room.host_session_id
        same_token = room.host_auth_token and room.host_auth_token == auth_token
        if not (same_session or same_token):
            return False
        room.guest_uses_host_backend = True
        logger.info(
            "Dev self-pairing: guest reusing host Lovense connection for Room %s", room_id
        )
        return True

    async def _disconnect_guest_if_same_session(self, room_id: str, room) -> None:
        if not room.guest_session_id or not room.host_session_id:
            return
        if room.guest_session_id != room.host_session_id:
            return
        if ALLOW_SELF_PAIRING:
            return
        if not room.guest_frontend:
            return
        logger.info(
            "Room %s: disconnecting guest (same sessionId as host, self-pairing disabled)", room_id
        )
        await room.guest_frontend.put(None)
