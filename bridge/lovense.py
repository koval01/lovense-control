"""
Lovense API client: getSocketUrl and WebSocket URL construction.

Builds the final wss URL the same way as the Next.js app: host from socketIoUrl,
path from socketIoPath, ntoken from query or authToken.
"""

from urllib.parse import parse_qs, urlparse
from typing import Any, Dict

import httpx

from bridge.config import logger

LOVENSE_GET_SOCKET_URL = "https://api.lovense-api.com/api/basicApi/getSocketUrl"
PLATFORM = "Koval Yaroslav"


class LovenseClient:
    """Calls Lovense getSocketUrl and builds the WebSocket URL for the backend tunnel."""

    def __init__(self, http_client: httpx.AsyncClient) -> None:
        self._client = http_client

    async def get_socket_url(self, auth_token: str) -> Dict[str, Any]:
        """
        Call Lovense getSocketUrl with the given authToken.

        Returns:
            The "data" object from the API (socketIoUrl, socketIoPath, etc.).
        Raises:
            httpx.HTTPStatusError: On non-2xx response.
            ValueError: If API returns code != 0 or missing data.
        """
        payload = {"authToken": auth_token, "platform": PLATFORM}
        res = await self._client.post(LOVENSE_GET_SOCKET_URL, json=payload)
        res.raise_for_status()
        data = res.json()
        if data.get("code") != 0 or not data.get("data"):
            raise ValueError("Lovense API rejected token")
        return data["data"]

    @staticmethod
    def build_websocket_url(socket_info: Dict[str, Any], auth_token: str) -> str:
        """
        Build the Engine.IO WebSocket URL from getSocketUrl response.

        Uses wss://HOST only; path comes from socketIoPath. ntoken is taken
        from socketIoUrl query or from authToken, then URL-encoded.
        """
        socket_io_url = socket_info.get("socketIoUrl", "")
        parsed = urlparse(socket_io_url)
        qs = parse_qs(parsed.query)
        ntoken_from_url = qs.get("ntoken", [None])[0] if qs else None
        raw = ntoken_from_url if ntoken_from_url else auth_token
        safe_token = raw.replace("+", "%2B").replace("/", "%2F").replace("=", "%3D")

        ws_host = parsed.netloc or parsed.hostname or ""
        if not ws_host:
            raise ValueError("Lovense socketIoUrl has no host")

        path = (socket_info.get("socketIoPath") or "").strip()
        if not path.startswith("/"):
            path = f"/{path}"
        if not path.endswith("/"):
            path = f"{path}/"

        return f"wss://{ws_host}{path}?ntoken={safe_token}&EIO=3&transport=websocket"
