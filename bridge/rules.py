"""
Toy access rules: apply enabled IDs, per-feature limits, and max power to commands.
Wire format: bytes; parsing and building at byte level.
"""

from typing import TYPE_CHECKING, Optional

from bridge.config import logger
from bridge.state import Room, RoomRegistry, registry
from bridge.ws_events import (
    LovenseToyCommandPayload,
    LOVENSE_TOY_COMMAND_EVENT,
    SetToyRulesPayload,
    build_app_message,
    parse_app_message,
)
from pydantic import ValidationError

if TYPE_CHECKING:
    pass

MAX_ENABLED_TOY_IDS = 50
MAX_LIMITS_KEYS = 30


def _apply_max_power_to_action(action: str, max_power_pct: int) -> str:
    """Scale levels in action string (e.g. Vibrate1:10,Rotate:5) by max_power_pct (0-100)."""
    if max_power_pct >= 100:
        return action
    parts = []
    for part in action.split(","):
        part = part.strip()
        if ":" in part:
            name, level_str = part.split(":", 1)
            try:
                level = int(level_str)
                new_level = round(level * max_power_pct / 100)
                parts.append(f"{name}:{new_level}")
            except ValueError:
                parts.append(part)
        else:
            parts.append(part)
    return ",".join(parts)


def _apply_per_feature_limits(action: str, limits: dict) -> str:
    """Cap each function level by owner's per-feature limits."""
    if not limits:
        return action
    parts = []
    for part in action.split(","):
        part = part.strip()
        if ":" in part:
            name, level_str = part.split(":", 1)
            try:
                level = int(level_str)
                cap = limits.get(name)
                if cap is not None:
                    level = min(level, int(cap))
                parts.append(f"{name}:{level}")
            except (ValueError, TypeError):
                parts.append(part)
        else:
            parts.append(part)
    return ",".join(parts)


class ToyRulesService:
    """Applies toy access rules and notifies the other frontend."""

    def __init__(self, room_registry: RoomRegistry) -> None:
        self._registry = room_registry

    async def apply_set_toy_rules_and_notify(
        self, room_id: str, payload: SetToyRulesPayload, from_role: str
    ) -> None:
        """
        Update room rules from bridge_set_toy_rules payload and notify the other frontend.
        Rejects payloads that try to set the partner's rules (targetRole != from_role).
        """
        from bridge.protocol import partner_toy_rules_msg

        if payload.targetRole is not None and payload.targetRole != from_role:
            logger.warning(
                "Room %s: rejected bridge_set_toy_rules (cannot set partner's rules)", room_id
            )
            return
        room = self._registry.get_room(room_id)
        if not room:
            return
        self._apply_payload_to_room(room, payload, from_role)
        logger.debug(
            "Room %s rules from %s: enabledToyIds=%s, maxPower=%s",
            room_id, from_role, payload.enabledToyIds, payload.maxPower,
        )
        other = room.get_other_frontend(from_role)
        if other:
            await other.put(partner_toy_rules_msg(from_role, room))

    def _apply_payload_to_room(
        self, room: Room, payload: SetToyRulesPayload, from_role: str
    ) -> None:
        if payload.enabledToyIds is not None:
            ids = set(payload.enabledToyIds[:MAX_ENABLED_TOY_IDS])
            if from_role == "host":
                room.host_enabled_toy_ids = ids
            else:
                room.guest_enabled_toy_ids = ids
        if payload.maxPower is not None:
            v = payload.maxPower
            pct = max(0, min(100, v)) if v >= 0 else None
            if from_role == "host":
                room.host_toy_max_power = pct
            else:
                room.guest_toy_max_power = pct
        if payload.limits is not None:
            items = list(payload.limits.items())[:MAX_LIMITS_KEYS]
            clean = {k: int(v) for k, v in items}
            if from_role == "host":
                room.host_limits = clean
            else:
                room.guest_limits = clean

    def apply_rules_to_command(self, room: Room, data: bytes, to_guest_backend: bool) -> Optional[bytes]:
        """
        Apply enabled_toy_ids, per-feature limits, and max_power to a toy command.
        Returns modified message bytes or None to drop (e.g. toy not in enabled list).
        """
        parsed = parse_app_message(data)
        if parsed is None:
            return data
        event, payload_raw = parsed
        if event != LOVENSE_TOY_COMMAND_EVENT:
            return data
        if not isinstance(payload_raw, dict):
            return data
        try:
            payload = LovenseToyCommandPayload.model_validate(payload_raw)
        except ValidationError:
            return data

        enabled_ids, max_power, limits_dict = room.get_rules_for_target(to_guest_backend)

        if enabled_ids is not None and payload.toy not in enabled_ids:
            logger.info(
                "Bridge dropped command: toy %s not in owner's enabled list (guest cannot control disabled toy)",
                payload.toy,
            )
            return None

        action = payload.action
        if limits_dict:
            action = _apply_per_feature_limits(action, limits_dict)
        if max_power is not None and max_power < 100:
            action = _apply_max_power_to_action(action, max_power)

        out_payload = payload.model_dump(mode="json")
        out_payload["action"] = action
        return build_app_message(LOVENSE_TOY_COMMAND_EVENT, out_payload)


_default_rules_service = ToyRulesService(registry)


async def apply_bridge_set_toy_rules_and_notify(
    room_id: str, payload: SetToyRulesPayload, from_role: str
) -> None:
    """Module-level wrapper for ToyRulesService.apply_set_toy_rules_and_notify."""
    await _default_rules_service.apply_set_toy_rules_and_notify(room_id, payload, from_role)


def apply_rules_and_forward_command(room: Room, data: bytes, to_guest_backend: bool) -> Optional[bytes]:
    """Module-level wrapper for ToyRulesService.apply_rules_to_command."""
    return _default_rules_service.apply_rules_to_command(room, data, to_guest_backend)
