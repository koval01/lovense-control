"""
Pydantic models and parser for Socket.IO app messages (Engine.IO type 42).

Wire format: b'42' + json.dumps([event_name, payload]).encode('utf-8')
All parsing and building work at byte level.
"""

import json
from typing import Any, Optional

from pydantic import BaseModel, Field

# --- Wire-level constants (bytes) ---
# Engine.IO packet type 4 (message) + Socket.IO packet type 2 (event)
PREFIX_APP = b"42"
# Minimum length: "42" + "[]"
MIN_APP_MESSAGE_LEN = 4

# --- Event name constants ---
BRIDGE_SET_TOY_RULES = "bridge_set_toy_rules"
BRIDGE_PING = "bridge_ping"
BRIDGE_PONG = "bridge_pong"
BRIDGE_CHAT_TYPING = "bridge_chat_typing"
BRIDGE_CHAT_MESSAGE = "bridge_chat_message"
BRIDGE_CHAT_VOICE = "bridge_chat_voice"

DEVICE_OR_STATUS_EVENTS = frozenset({
    "basicapi_update_device_info_tc",
    "basicApi_update_device_info",
    "basicapi_update_app_online_tc",
    "basicapi_update_app_status_tc",
})

# --- Payload models ---


class SetToyRulesPayload(BaseModel):
    """Payload for bridge_set_toy_rules."""

    enabledToyIds: Optional[list[str]] = None
    maxPower: Optional[int] = None
    limits: Optional[dict[str, int]] = None
    targetRole: Optional[str] = None


class ChatMessagePayload(BaseModel):
    """Payload for bridge_chat_message."""

    text: str = Field(..., min_length=1)


class ChatVoicePayload(BaseModel):
    """Payload for bridge_chat_voice (base64-encoded audio, no server-side storage)."""

    id: str = Field(..., min_length=1)
    ts: int
    mime: str = Field(..., min_length=1)
    data: str = Field(..., min_length=1)
    durationMs: Optional[int] = None


class LovenseToyCommandPayload(BaseModel):
    """Payload for basicapi_send_toy_command_ts (Lovense toy command)."""

    model_config = {"extra": "allow"}

    toy: str
    action: str


LOVENSE_TOY_COMMAND_EVENT = "basicapi_send_toy_command_ts"


# --- Parser (byte-level) ---


def parse_app_message(data: bytes) -> Optional[tuple[str, Any]]:
    """
    Parse Engine.IO app message: prefix b'42' + JSON array [event, payload].
    Returns (event_name, payload) or None if not a valid app message.
    """
    if len(data) < MIN_APP_MESSAGE_LEN or data[:2] != PREFIX_APP:
        return None
    payload_bytes = data[2:]
    if len(payload_bytes) < 1 or payload_bytes[0:1] != b"[":
        return None
    try:
        arr = json.loads(payload_bytes.decode("utf-8"))
    except (json.JSONDecodeError, TypeError, UnicodeDecodeError):
        return None
    if not isinstance(arr, list) or len(arr) < 1:
        return None
    event = arr[0]
    if not isinstance(event, str):
        return None
    payload = arr[1] if len(arr) >= 2 else None
    return event, payload


def get_app_event_name(data: bytes) -> Optional[str]:
    """Return event name for app message, or None."""
    parsed = parse_app_message(data)
    return parsed[0] if parsed else None


def is_device_or_status_event(data: bytes) -> bool:
    """True if message is a device list or app status event (for caching)."""
    event = get_app_event_name(data)
    return event in DEVICE_OR_STATUS_EVENTS if event else False


def build_app_message(event: str, payload: dict) -> bytes:
    """Build wire format: b'42' + JSON array [event, payload]."""
    body = json.dumps([event, payload], separators=(",", ":"))
    return PREFIX_APP + body.encode("utf-8")
