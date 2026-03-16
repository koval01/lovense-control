"""
Message routing: backend → frontends and frontend → backends.
Wire format: bytes; Lovense backend may send str, we normalize to bytes.
"""

from typing import Callable, Optional

from bridge.state import Room, RoomRegistry
from bridge.ws_events import is_device_or_status_event


def _to_bytes(msg: str | bytes) -> bytes:
    """Normalize to bytes for internal wire format."""
    return msg.encode("utf-8") if isinstance(msg, str) else msg


class MessageRouter:
    """Routes messages between frontends and Lovense backends."""

    def __init__(
        self,
        registry: RoomRegistry,
        apply_rules_and_forward_command: Callable[[Room, bytes, bool], Optional[bytes]],
    ) -> None:
        self._registry = registry
        self._apply_rules = apply_rules_and_forward_command

    async def forward_to_other_frontend(self, room_id: str, data: bytes, from_role: str) -> None:
        """Forward bridge_ping / bridge_pong to the other frontend for RTT measurement."""
        room = self._registry.get_room(room_id)
        if not room:
            return
        other = room.get_other_frontend(from_role)
        if other:
            await other.put(data)

    async def route_to_backends(self, room_id: str, data: bytes, from_role: str) -> None:
        """
        Send a command to the OTHER side's Lovense backend.
        Applies target's rules (enabledToyIds, maxPower, limits).
        """
        room = self._registry.get_room(room_id)
        if not room:
            return
        if from_role == "host":
            backend = room.guest_backend
            to_guest = True
        else:
            backend = room.host_backend
            to_guest = False
        if not backend:
            return
        out = self._apply_rules(room, data, to_guest)
        if out is not None:
            await backend.put(out)

    def _cache_device_or_status(self, room: Room, data: bytes, from_backend_role: str) -> None:
        if not is_device_or_status_event(data):
            return
        if from_backend_role == "host":
            room.last_host_backend_msg = data
            if room.guest_uses_host_backend:
                room.last_guest_backend_msg = data
        else:
            room.last_guest_backend_msg = data

    async def route_to_frontends(self, room_id: str, msg: str | bytes, from_backend_role: str) -> None:
        """
        Send toy data from a Lovense backend to the OPPOSITE frontend.
        msg from Lovense may be str or bytes; we store and forward as bytes.
        """
        room = self._registry.get_room(room_id)
        if not room:
            return
        data = _to_bytes(msg)
        self._cache_device_or_status(room, data, from_backend_role)
        if from_backend_role == "host":
            frontend = room.guest_frontend
        else:
            frontend = room.host_frontend
        if frontend:
            await frontend.put(data)


# Default router (uses global registry). Import rules here to avoid circular import at module load.
def _default_router() -> MessageRouter:
    from bridge.rules import apply_rules_and_forward_command
    from bridge.state import registry
    return MessageRouter(registry, apply_rules_and_forward_command)


_router: Optional[MessageRouter] = None


def _get_router() -> MessageRouter:
    global _router
    if _router is None:
        _router = _default_router()
    return _router


async def forward_to_other_frontend(room_id: str, data: bytes, from_role: str) -> None:
    """Forward bridge_ping / bridge_pong to the other frontend (module-level wrapper)."""
    await _get_router().forward_to_other_frontend(room_id, data, from_role)


async def route_to_backends(room_id: str, data: bytes, from_role: str) -> None:
    """Send command to the other side's backend (module-level wrapper)."""
    await _get_router().route_to_backends(room_id, data, from_role)


async def route_to_frontends(room_id: str, msg: str | bytes, from_backend_role: str) -> None:
    """Send backend message to the opposite frontend (module-level wrapper)."""
    await _get_router().route_to_frontends(room_id, msg, from_backend_role)
