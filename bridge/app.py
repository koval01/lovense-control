"""
FastAPI application factory: CORS, HTTP client, route registration, room cleanup.
"""

import asyncio
from contextlib import asynccontextmanager
from typing import AsyncGenerator

import httpx
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from bridge.config import CORS_ORIGINS, IS_PRODUCTION, get_jwt_secret_for_app
from bridge.room_cleanup import RoomCleanupRunner
from bridge.routes_http import router as http_router
from bridge import routes_ws
from bridge.state import registry

ROOM_IDLE_TIMEOUT_SEC = 3600  # 1 hour
ROOM_CLEANUP_INTERVAL_SEC = 300  # every 5 min


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Create HTTP client, start cleanup task; on shutdown close client and cancel task."""
    if IS_PRODUCTION:
        get_jwt_secret_for_app()  # raise if default JWT_SECRET in production
    app.state.http_client = httpx.AsyncClient()
    cleanup = RoomCleanupRunner(
        registry,
        timeout_sec=ROOM_IDLE_TIMEOUT_SEC,
        interval_sec=ROOM_CLEANUP_INTERVAL_SEC,
    )
    cleanup.start()
    try:
        yield
    finally:
        await cleanup.stop()
        try:
            await app.state.http_client.aclose()
        except (asyncio.CancelledError, AttributeError):
            pass


def create_app() -> FastAPI:
    """
    Create and configure the bridge FastAPI application.

    Registers CORS (from CORS_ORIGINS), HTTP routes (rooms, getSocketUrl), and the WebSocket /ws endpoint.
    """
    app = FastAPI(lifespan=lifespan)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=CORS_ORIGINS,
        allow_credentials=True if "*" not in CORS_ORIGINS else False,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.include_router(http_router)
    app.websocket("/ws")(routes_ws.ws_upgrade_handler)
    return app
