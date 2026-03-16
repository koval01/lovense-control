"""
JWT ticket and session proof verification.
"""

from typing import Optional, Tuple

import jwt

from bridge.config import JWT_SECRET


def decode_ticket(ticket: str) -> Tuple[str, str]:
    """
    Decode a bridge ticket (hostTicket or guestTicket) and return (room_id, role).

    Raises:
        jwt.InvalidTokenError: If ticket is invalid or expired.
    """
    decoded = jwt.decode(ticket, JWT_SECRET, algorithms=["HS256"])
    return decoded["roomId"], decoded["role"]


def session_id_from_proof(proof: Optional[str]) -> Optional[str]:
    """
    Extract sessionId from a sessionProof JWT (from the Next.js app).

    Returns None if proof is missing or invalid.
    """
    if not proof:
        return None
    try:
        payload = jwt.decode(proof, JWT_SECRET, algorithms=["HS256"])
        sid = payload.get("sessionId")
        return str(sid) if isinstance(sid, str) else None
    except jwt.InvalidTokenError:
        return None


def create_ticket(room_id: str, role: str, exp_seconds: int = 86400) -> str:
    """Create a bridge ticket for the given room and role."""
    import time
    exp = int(time.time()) + exp_seconds
    payload = {"type": "bridge_ticket", "roomId": room_id, "role": role, "exp": exp}
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")
