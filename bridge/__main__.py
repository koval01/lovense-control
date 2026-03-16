"""Allow running the bridge with: python -m bridge"""

import uvicorn

from bridge.app import create_app
from bridge.config import HOST, PORT

if __name__ == "__main__":
    uvicorn.run(create_app(), host=HOST, port=PORT, log_level="info")
