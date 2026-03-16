"""Allow running the bridge with: python -m bridge"""

import asyncio
import sys

import uvicorn

from bridge.app import create_app

# uvloop: 2–4x faster async I/O (Unix only)
if sys.platform != "win32":
    try:
        import uvloop
        asyncio.set_event_loop_policy(uvloop.EventLoopPolicy())
    except ImportError:
        pass
from bridge.config import HOST, PORT

if __name__ == "__main__":
    uvicorn.run(create_app(), host=HOST, port=PORT, log_level="info")
