"""
Entry point for the bridge server.

Run with: python -m bridge
"""

import asyncio
import sys

import uvicorn

from bridge.app import create_app
from bridge.config import HOST, PORT

if __name__ == "__main__":
    try:
        uvicorn.run(create_app(), host=HOST, port=PORT, log_level="info")
    except (KeyboardInterrupt, asyncio.CancelledError):
        sys.exit(0)
