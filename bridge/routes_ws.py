"""
WebSocket endpoint: browser frontend connection with Socket.IO–compatible handshake.
"""

import asyncio
import time

import jwt
from fastapi import WebSocket, WebSocketDisconnect, Query
from pydantic import ValidationError

from bridge.auth import decode_ticket
from bridge.chat import (
    CHAT_BUFFER_SIZE,
    build_chat_history_event,
    build_chat_message_event,
    validate_chat_text,
)
from bridge.config import logger
from bridge.protocol import partner_status_msg, partner_toy_rules_msg
from bridge.routing import forward_to_other_frontend, route_to_backends
from bridge.rules import apply_bridge_set_toy_rules_and_notify
from bridge.state import registry
from bridge.ws_events import (
    BRIDGE_CHAT_MESSAGE,
    BRIDGE_CHAT_TYPING,
    BRIDGE_CHAT_VOICE,
    BRIDGE_PING,
    BRIDGE_PONG,
    BRIDGE_SET_TOY_RULES,
    ChatMessagePayload,
    ChatVoicePayload,
    SetToyRulesPayload,
    build_app_message,
    parse_app_message,
)

# Mock Engine.IO handshake response for the browser (sent as text)
ENGINE_OPEN = '0{"sid":"bridge-session","upgrades":[],"pingInterval":25000,"pingTimeout":50000}'

# Engine.IO control frames (byte-level comparison)
PROBE_REQUEST = b"2probe"
PROBE_RESPONSE = b"3probe"
UPGRADE_ACK = b"40"
PING = b"2"
PONG = b"3"

WS_MESSAGE_MAX_BYTES = 256 * 1024  # 256 KB
FORWARD_ONLY_EVENTS = frozenset({BRIDGE_PING, BRIDGE_PONG, BRIDGE_CHAT_TYPING})
CHAT_FLOOD_INTERVAL_SEC = 2.0
VOICE_MAX_DURATION_MS = 60_000
VOICE_MAX_BASE64_LEN = 200 * 1024  # ~200 KB payload cap per message


async def _handle_chat_message(
    room_id: str, payload: ChatMessagePayload, role: str, sender_queue: asyncio.Queue
) -> None:
    """Validate chat message, enforce flood limit, append to room buffer, forward and echo."""
    room = registry.get_room(room_id)
    if not room:
        return
    now = time.time()
    if now - room.get_last_chat_ts(role) < CHAT_FLOOD_INTERVAL_SEC:
        return
    text = payload.text.strip()
    ok, _ = validate_chat_text(text)
    if not ok:
        return
    room.set_last_chat_ts(role, now)
    ts = int(now * 1000)
    room.append_chat({"text": text, "ts": ts, "role": role}, CHAT_BUFFER_SIZE)
    out = build_chat_message_event(text, ts, role)
    await sender_queue.put(out)
    other = room.get_other_frontend(role)
    if other:
        await other.put(out)


async def _handle_chat_voice(
    room_id: str, payload: ChatVoicePayload, role: str, sender_queue: asyncio.Queue
) -> None:
    """
    Handle voice chat message:
    - Enforce same flood limit as text chat
    - Echo to sender and forward to partner
    - Do NOT store on disk or in room history (no persistence).
    """
    room = registry.get_room(room_id)
    if not room:
        return
    # Basic limits: duration (if provided) and encoded payload size
    if payload.durationMs is not None and payload.durationMs > VOICE_MAX_DURATION_MS:
        return
    if len(payload.data.encode("utf-8")) > VOICE_MAX_BASE64_LEN:
        return

    now = time.time()
    if now - room.get_last_chat_ts(role) < CHAT_FLOOD_INTERVAL_SEC:
        return
    room.set_last_chat_ts(role, now)
    ts = int(now * 1000)
    out_payload = {
        "id": payload.id,
        "ts": ts,
        "mime": payload.mime,
        "data": payload.data,
        "role": role,
    }
    if payload.durationMs is not None:
        out_payload["durationMs"] = payload.durationMs
    out = build_app_message(BRIDGE_CHAT_VOICE, out_payload)
    await sender_queue.put(out)
    other = room.get_other_frontend(role)
    if other:
        await other.put(out)


class FrontendConnection:
    """
    Handles one browser WebSocket: handshake, replay state for new joiner,
    read/write loops, and cleanup on disconnect.
    """

    def __init__(self, websocket: WebSocket, room_id: str, role: str) -> None:
        self._ws = websocket
        self._room_id = room_id
        self._role = role
        self._queue: asyncio.Queue = asyncio.Queue()

    async def run(self) -> None:
        room = registry.get_room(self._room_id)
        if room:
            room.touch_activity()
            room.set_frontend(self._role, self._queue)
            await self._replay_state(room)

        await self._ws.send_text(ENGINE_OPEN)

        read_task = asyncio.create_task(self._read_loop())
        write_task = asyncio.create_task(self._write_loop())
        done, pending = await asyncio.wait(
            [read_task, write_task], return_when=asyncio.FIRST_COMPLETED
        )
        for task in pending:
            task.cancel()

        logger.info("Frontend Browser disconnected: Room %s (%s)", self._room_id, self._role)
        await self._on_disconnect()

    async def _replay_state(self, room) -> None:
        cached = room.get_cached_message_for_peer(self._role)
        if cached:
            await self._queue.put(cached)
        other = room.get_other_frontend(self._role)
        if other:
            await self._queue.put(partner_status_msg(True))
        if other and room.partner_has_rules(self._role):
            await self._queue.put(partner_toy_rules_msg("guest" if self._role == "host" else "host", room))
        if room.chat_buffer:
            await self._queue.put(build_chat_history_event(room.chat_buffer))

    async def _on_disconnect(self) -> None:
        room = registry.get_room(self._room_id)
        if not room:
            return
        room.touch_activity()
        other = room.get_other_frontend(self._role)
        if other:
            await other.put(partner_status_msg(False))
        room.clear_frontend(self._role)

    async def _read_loop(self) -> None:
        try:
            while True:
                raw = await self._ws.receive_text()
                data = raw.encode("utf-8")
                if len(data) > WS_MESSAGE_MAX_BYTES:
                    logger.warning("Room %s: message too large, dropping", self._room_id)
                    continue
                await self._handle_frame(data)
        except WebSocketDisconnect:
            pass

    async def _handle_frame(self, data: bytes) -> None:
        if data == PROBE_REQUEST:
            await self._ws.send_text(PROBE_RESPONSE.decode("utf-8"))
        elif data == b"5":
            await self._ws.send_text(UPGRADE_ACK.decode("utf-8"))
        elif data == UPGRADE_ACK:
            await self._ws.send_text(UPGRADE_ACK.decode("utf-8"))
        elif data == PING:
            await self._ws.send_text(PONG.decode("utf-8"))
        else:
            await self._handle_app_message(data)

    async def _handle_app_message(self, data: bytes) -> None:
        parsed = parse_app_message(data)
        if parsed is None:
            return
        event, payload_raw = parsed
        if event == BRIDGE_SET_TOY_RULES:
            try:
                payload = SetToyRulesPayload.model_validate(
                    payload_raw if isinstance(payload_raw, dict) else {}
                )
            except ValidationError:
                return
            await apply_bridge_set_toy_rules_and_notify(self._room_id, payload, self._role)
        elif event in FORWARD_ONLY_EVENTS:
            await forward_to_other_frontend(self._room_id, data, self._role)
        elif event == BRIDGE_CHAT_MESSAGE:
            try:
                payload = ChatMessagePayload.model_validate(
                    payload_raw if isinstance(payload_raw, dict) else {}
                )
            except ValidationError:
                return
            await _handle_chat_message(self._room_id, payload, self._role, self._queue)
        elif event == BRIDGE_CHAT_VOICE:
            try:
                payload = ChatVoicePayload.model_validate(
                    payload_raw if isinstance(payload_raw, dict) else {}
                )
            except ValidationError:
                return
            await _handle_chat_voice(self._room_id, payload, self._role, self._queue)
        else:
            await route_to_backends(self._room_id, data, self._role)

    async def _write_loop(self) -> None:
        while True:
            msg = await self._queue.get()
            if msg is None:
                break
            out = msg.decode("utf-8") if isinstance(msg, bytes) else msg
            await self._ws.send_text(out)


async def ws_upgrade_handler(websocket: WebSocket, ticket: str = Query(...)) -> None:
    """
    Accept a browser WebSocket with ?ticket=..., validate ticket,
    then run FrontendConnection.
    """
    try:
        room_id, role = decode_ticket(ticket)
    except jwt.InvalidTokenError:
        await websocket.close(code=1008)
        return

    await websocket.accept()
    logger.info("Frontend Browser connected: Room %s (%s)", room_id, role)

    connection = FrontendConnection(websocket, room_id, role)
    await connection.run()
