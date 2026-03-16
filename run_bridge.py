"""
Run the partner bridge server (convenience script).

Usage: python run_bridge.py
Equivalent: python -m bridge
"""

import asyncio
import sys

if __name__ == "__main__":
    import uvicorn
    from bridge.app import create_app
    from bridge.config import HOST, PORT
    try:
        uvicorn.run(create_app(), host=HOST, port=PORT, log_level="info")
    except (KeyboardInterrupt, asyncio.CancelledError):
        sys.exit(0)
