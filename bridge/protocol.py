"""
Bridge protocol: message construction for partner events (byte-level wire format).
"""

from typing import TYPE_CHECKING

from bridge.ws_events import build_app_message

if TYPE_CHECKING:
    from bridge.state import Room


def partner_toy_rules_msg(from_role: str, room: "Room") -> bytes:
    """Build bridge_partner_toy_rules payload for the other side."""
    if from_role == "host":
        limits = room.host_limits or {}
        max_power = room.host_toy_max_power
        enabled_ids = room.host_enabled_toy_ids
    else:
        limits = room.guest_limits or {}
        max_power = room.guest_toy_max_power
        enabled_ids = room.guest_enabled_toy_ids
    payload = {"limits": limits}
    if enabled_ids is not None:
        payload["enabledToyIds"] = list(enabled_ids)
    if max_power is not None:
        payload["maxPower"] = max_power
    return build_app_message("bridge_partner_toy_rules", payload)


def partner_status_msg(connected: bool) -> bytes:
    """Build bridge_partner_status payload."""
    return build_app_message("bridge_partner_status", {"connected": connected})
