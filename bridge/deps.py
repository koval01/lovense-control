"""
FastAPI dependencies (HTTP client, etc.).
"""

from typing import AsyncGenerator

import httpx
from fastapi import Request


async def get_http_client(request: Request) -> AsyncGenerator[httpx.AsyncClient, None]:
    """Yield the shared HTTP client stored on app state."""
    client: httpx.AsyncClient = request.app.state.http_client
    yield client
