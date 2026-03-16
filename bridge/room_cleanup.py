"""
Periodic cleanup of idle rooms (no connected frontends, older than timeout).
"""

import asyncio
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from bridge.state import RoomRegistry


class RoomCleanupRunner:
    """
    Background task: every interval_sec seconds, remove rooms that have
    no frontends and have been idle for at least timeout_sec.
    """

    def __init__(
        self,
        registry: "RoomRegistry",
        timeout_sec: float = 3600,
        interval_sec: float = 300,
    ) -> None:
        self._registry = registry
        self._timeout_sec = timeout_sec
        self._interval_sec = interval_sec
        self._task: asyncio.Task | None = None

    def start(self) -> asyncio.Task:
        """Start the cleanup loop. Returns the asyncio Task."""
        self._task = asyncio.create_task(self._loop())
        return self._task

    async def stop(self) -> None:
        """Cancel the cleanup task."""
        if self._task is not None:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
            self._task = None

    async def _loop(self) -> None:
        while True:
            await asyncio.sleep(self._interval_sec)
            try:
                self._registry.cleanup_idle(self._timeout_sec)
            except asyncio.CancelledError:
                break
