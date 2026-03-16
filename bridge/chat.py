"""
Bridge chat: message validation, buffer size, and event builders (byte-level wire format).
"""

import re
from typing import List, Optional, Tuple

from bridge.ws_events import BRIDGE_CHAT_MESSAGE, build_app_message

# Max message length (client must enforce the same)
CHAT_MAX_LENGTH = 1000
CHAT_BUFFER_SIZE = 10
# Max emojis per message to avoid client freezes from heavy rendering
CHAT_EMOJI_MAX = 20

BRIDGE_CHAT_HISTORY = "bridge_chat_history"

# Allow any character except C0/C1 control characters (newline U+000A is allowed)
_CHAT_DISALLOWED_PATTERN = re.compile(r"[\x00-\x09\x0b-\x1f\x7f-\x9f]")

# One character from common emoji/pictographic blocks (BMP + supplementary)
_EMOJI_PATTERN = re.compile(
    r"[\u2600-\u26FF\u2700-\u27BF\uFE00-\uFE0F"
    r"\U0001F300-\U0001F5FF\U0001F600-\U0001F64F\U0001F680-\U0001F6FF"
    r"\U0001F900-\U0001F9FF\U0001F1E0-\U0001F1FF]"
)


def _count_emojis(text: str) -> int:
    return len(_EMOJI_PATTERN.findall(text))


def validate_chat_text(text: str) -> Tuple[bool, Optional[str]]:
    """
    Check that text is within length, has no control characters, and emoji count <= CHAT_EMOJI_MAX.
    Allows letters (any script), numbers, punctuation, emojis, symbols.
    """
    if not isinstance(text, str):
        return False, "Invalid message"
    if len(text) > CHAT_MAX_LENGTH:
        return False, f"Message too long (max {CHAT_MAX_LENGTH} characters)"
    if _CHAT_DISALLOWED_PATTERN.search(text):
        return False, "Control characters are not allowed"
    if _count_emojis(text) > CHAT_EMOJI_MAX:
        return False, f"Too many emojis (max {CHAT_EMOJI_MAX} per message)"
    return True, None


def build_chat_message_event(text: str, ts: int, role: str) -> bytes:
    """Build app message for one chat message (sender echo and history replay)."""
    return build_app_message(BRIDGE_CHAT_MESSAGE, {"text": text, "ts": ts, "role": role})


def build_chat_history_event(messages: List[dict]) -> bytes:
    """Build app message for chat buffer replay to newly connected client."""
    return build_app_message(BRIDGE_CHAT_HISTORY, {"messages": messages})
