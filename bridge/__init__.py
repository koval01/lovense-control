"""
Partner bridge server package.

Bridges two Lovense sessions (host and guest) so each side can see and control
the other's toys via a single WebSocket/Socket.IO–compatible API.
"""

from bridge.app import create_app

__all__ = ["create_app"]
