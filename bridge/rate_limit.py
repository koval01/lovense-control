"""
In-memory rate limiter by IP for HTTP endpoints.
"""

import time
from collections import defaultdict
from typing import Tuple

# (timestamp, count) per key; we trim old windows
_window_sec = 60
_max_per_window = defaultdict(lambda: (0.0, 0))  # key -> (window_start, count)


def _key(ip: str, suffix: str) -> str:
    return f"{ip}:{suffix}"


def check_rate_limit(ip: str, suffix: str, max_requests: int) -> Tuple[bool, str]:
    """
    Returns (allowed, error_message).
    suffix: "rooms" | "join" | "getsocketurl"
    """
    now = time.time()
    k = _key(ip, suffix)
    start, count = _max_per_window[k]
    if now - start >= _window_sec:
        start = now
        count = 0
    count += 1
    _max_per_window[k] = (start, count)
    if count > max_requests:
        return False, "Too many requests. Try again later."
    return True, ""
