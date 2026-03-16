"""
Lovense backend WebSocket tunnel.

Maintains a single WebSocket connection to Lovense for a room/role,
forwards Engine.IO frames to/from a queue, and routes incoming events
to the opposite frontend.
"""

import asyncio
from typing import Any, Awaitable, Callable

import websockets

from bridge.config import logger
from bridge.state import RoomRegistry, registry

# Headers sent when connecting to Lovense WS (browser-like)
LOVENSE_WS_HEADERS = {
    "Origin": "http://localhost:3000",
    "Cache-Control": "no-cache",
    "Pragma": "no-cache",
    "Accept-Language": "de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7,ru;q=0.6,uk;q=0.5,be;q=0.4,hu;q=0.3",
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36",
}

PING_INTERVAL_SEC = 20


class BackendTunnel:
    """
    Connects to the Lovense WebSocket for a room/role and forwards messages.
    Uses app-level Engine.IO ping; on disconnect clears the room's backend queue.
    """

    def __init__(
        self,
        ws_url: str,
        room_id: str,
        role: str,
        room_registry: RoomRegistry,
        route_to_frontends: Callable[[str, str | bytes, str], Awaitable[None]],
    ) -> None:
        self._ws_url = ws_url
        self._room_id = room_id
        self._role = role
        self._registry = room_registry
        self._route_to_frontends = route_to_frontends

    async def run(self) -> None:
        try:
            async with websockets.connect(
                self._ws_url,
                additional_headers=LOVENSE_WS_HEADERS,
                ping_interval=None,
                ping_timeout=None,
                close_timeout=5,
            ) as ws:
                logger.info(
                    "Successfully Connected to Lovense WS for Room %s (%s)",
                    self._room_id, self._role,
                )
                queue: asyncio.Queue = asyncio.Queue()
                self._attach_queue_to_room(queue)

                tasks = [
                    asyncio.create_task(self._ping_loop(ws)),
                    asyncio.create_task(self._read_ws(ws)),
                    asyncio.create_task(self._write_ws(ws, queue)),
                ]
                done, pending = await asyncio.wait(tasks, return_when=asyncio.FIRST_COMPLETED)
                for task in pending:
                    task.cancel()
                for task in done:
                    try:
                        task.result()
                    except (asyncio.CancelledError, websockets.ConnectionClosed):
                        pass

        except websockets.ConnectionClosed as e:
            logger.warning(
                "Lovense WS closed for Room %s (%s): %s %s",
                self._room_id, self._role, e.code, e.reason,
            )
        except (OSError, ConnectionError) as e:
            logger.error(
                "Lovense WS disconnected/failed for Room %s (%s): %s",
                self._room_id, self._role, e,
            )
        finally:
            self._detach_queue_from_room()

    def _attach_queue_to_room(self, queue: asyncio.Queue) -> None:
        room = self._registry.get_room(self._room_id)
        if room:
            room.set_backend(self._role, queue)

    def _detach_queue_from_room(self) -> None:
        room = self._registry.get_room(self._room_id)
        if room:
            room.clear_backend(self._role)

    async def _ping_loop(self, ws: Any) -> None:
        while True:
            await asyncio.sleep(PING_INTERVAL_SEC)
            try:
                await ws.send("2")
            except (websockets.ConnectionClosed, OSError, ConnectionError):
                break

    async def _read_ws(self, ws: Any) -> None:
        try:
            async for msg in ws:
                data = msg.encode("utf-8") if isinstance(msg, str) else msg
                if len(data) >= 2 and data[0:2] == b"0{":
                    await ws.send("40")
                elif len(data) >= 2 and data[0:2] == b"42":
                    await self._route_to_frontends(self._room_id, data, self._role)
        except websockets.ConnectionClosed as e:
            logger.debug(
                "Lovense WS read closed for Room %s (%s): %s %s",
                self._room_id, self._role, e.code, e.reason,
            )

    async def _write_ws(self, ws: Any, queue: asyncio.Queue) -> None:
        try:
            while True:
                msg = await queue.get()
                if msg is None:
                    break
                await ws.send(msg)
        except websockets.ConnectionClosed:
            pass


async def run_backend_connection(ws_url: str, room_id: str, role: str) -> None:
    """
    Spawn a BackendTunnel (module-level entry point).
    Uses global registry and router's route_to_frontends.
    """
    from bridge.routing import route_to_frontends
    tunnel = BackendTunnel(ws_url, room_id, role, registry, route_to_frontends)
    await tunnel.run()
