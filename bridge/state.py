"""
In-memory state for rooms and pair codes.

Room holds queues for host/guest frontends and backends, last cached
device/status messages, toy access rules, and chat buffer.
"""

import asyncio
import time
from typing import Dict, List, Optional, Set, Tuple

# Type alias for optional queues (asyncio.Queue used like Rust mpsc::channel)
Queue = Optional[asyncio.Queue]


class Room:
    """
    Single bridge room: one host and one guest, each with a frontend WS
    and an optional Lovense backend tunnel.
    """

    def __init__(self) -> None:
        self.host_frontend: Queue = None
        self.guest_frontend: Queue = None
        self.host_backend: Queue = None
        self.guest_backend: Queue = None
        # Cache last device/status from each backend for new frontends (wire format: bytes)
        self.last_host_backend_msg: Optional[bytes] = None
        self.last_guest_backend_msg: Optional[bytes] = None
        # Self-pairing: host's authToken; when guest uses same token, share one Lovense connection
        self.host_auth_token: Optional[str] = None
        self.host_session_id: Optional[str] = None
        self.guest_session_id: Optional[str] = None
        self.guest_uses_host_backend: bool = False
        # Access rules for MY toys (partner controls these)
        self.host_enabled_toy_ids: Optional[Set[str]] = None
        self.host_toy_max_power: Optional[int] = None
        self.host_limits: Optional[Dict[str, int]] = None
        self.guest_enabled_toy_ids: Optional[Set[str]] = None
        self.guest_toy_max_power: Optional[int] = None
        self.guest_limits: Optional[Dict[str, int]] = None
        # Chat: last N messages for replay to new joiners; each item {"text", "ts", "role"}
        self.chat_buffer: List[dict] = []
        # Flood limit: last chat message time per role (host/guest), seconds
        self.last_host_chat_ts: float = 0.0
        self.last_guest_chat_ts: float = 0.0
        # For cleanup: last time any frontend was connected (host or guest)
        self.last_activity: float = 0.0

    # --- Frontend/backend access ---

    def get_frontend(self, role: str) -> Queue:
        return self.host_frontend if role == "host" else self.guest_frontend

    def get_backend(self, role: str) -> Queue:
        return self.host_backend if role == "host" else self.guest_backend

    def get_other_frontend(self, role: str) -> Queue:
        return self.guest_frontend if role == "host" else self.host_frontend

    def set_frontend(self, role: str, queue: asyncio.Queue) -> None:
        if role == "host":
            self.host_frontend = queue
        else:
            self.guest_frontend = queue

    def set_backend(self, role: str, queue: asyncio.Queue) -> None:
        if role == "host":
            self.host_backend = queue
            if self.guest_uses_host_backend:
                self.guest_backend = queue
        else:
            self.guest_backend = queue

    def clear_frontend(self, role: str) -> None:
        if role == "host":
            self.host_frontend = None
        else:
            self.guest_frontend = None

    def clear_backend(self, role: str) -> None:
        if role == "host":
            self.host_backend = None
            if self.guest_uses_host_backend:
                self.guest_backend = None
        else:
            self.guest_backend = None

    def get_cached_message_for_peer(self, role: str) -> Optional[bytes]:
        """Last device/status message from the OTHER side's backend (for replay to this role)."""
        return self.last_guest_backend_msg if role == "host" else self.last_host_backend_msg

    def partner_has_rules(self, role: str) -> bool:
        """True if the other side has set enabled toys or limits (for sending bridge_partner_toy_rules)."""
        if role == "host":
            return self.guest_enabled_toy_ids is not None or self.guest_limits is not None
        return self.host_enabled_toy_ids is not None or self.host_limits is not None

    def get_rules_for_target(self, to_guest_backend: bool) -> Tuple[Optional[Set[str]], Optional[int], Optional[Dict[str, int]]]:
        """(enabled_toy_ids, max_power, limits) for the target backend."""
        if to_guest_backend:
            return self.guest_enabled_toy_ids, self.guest_toy_max_power, self.guest_limits
        return self.host_enabled_toy_ids, self.host_toy_max_power, self.host_limits

    # --- Activity & cleanup ---

    def touch_activity(self) -> None:
        self.last_activity = time.time()

    def has_any_frontend(self) -> bool:
        return self.host_frontend is not None or self.guest_frontend is not None

    def is_idle_since(self, timeout_sec: float) -> bool:
        return not self.has_any_frontend() and (getattr(self, "last_activity", 0) + timeout_sec < time.time())

    # --- Chat ---

    def get_last_chat_ts(self, role: str) -> float:
        return self.last_host_chat_ts if role == "host" else self.last_guest_chat_ts

    def set_last_chat_ts(self, role: str, ts: float) -> None:
        if role == "host":
            self.last_host_chat_ts = ts
        else:
            self.last_guest_chat_ts = ts

    def append_chat(self, entry: dict, max_size: int) -> None:
        self.chat_buffer.append(entry)
        while len(self.chat_buffer) > max_size:
            self.chat_buffer.pop(0)


class RoomRegistry:
    """Registry of rooms and pair codes. Creates, joins, and cleans up rooms."""

    def __init__(self) -> None:
        self._rooms: Dict[str, Room] = {}
        self._pair_codes: Dict[str, str] = {}  # pairCode -> roomId

    def get_room(self, room_id: str) -> Optional[Room]:
        return self._rooms.get(room_id)

    def create_room(self, room_id: str, pair_code: str) -> Room:
        room = Room()
        room.touch_activity()
        self._rooms[room_id] = room
        self._pair_codes[pair_code] = room_id
        return room

    def join_room(self, pair_code: str) -> Optional[Tuple[str, Room]]:
        room_id = self._pair_codes.get(pair_code)
        if not room_id:
            return None
        room = self._rooms.get(room_id)
        if not room:
            return None
        room.touch_activity()
        return (room_id, room)

    def remove_room(self, room_id: str) -> None:
        self._rooms.pop(room_id, None)
        for code, rid in list(self._pair_codes.items()):
            if rid == room_id:
                del self._pair_codes[code]
                break

    def cleanup_idle(self, timeout_sec: float) -> None:
        to_remove = [
            rid for rid, room in list(self._rooms.items())
            if room.is_idle_since(timeout_sec)
        ]
        for room_id in to_remove:
            self.remove_room(room_id)


# Global registry (backward compatibility: expose ._rooms and ._pair_codes as rooms, pair_codes)
registry = RoomRegistry()
rooms = registry._rooms
pair_codes = registry._pair_codes
