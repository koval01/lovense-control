"""
Bridge server configuration and logging.

Loads .env from project root so JWT_SECRET matches the Next.js app
(required for sessionProof verification).
"""

import logging
import os
from pathlib import Path
from typing import Tuple

try:
    from dotenv import load_dotenv
    env_path = Path(__file__).resolve().parent.parent / ".env"
    load_dotenv(env_path)
except ImportError:
    pass


def setup_logging() -> logging.Logger:
    """
    Configure logging for the bridge and return the bridge logger.

    Returns:
        Logger instance named "lovense_remote_bridge".
    """
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    )
    return logging.getLogger("lovense_remote_bridge")


def get_jwt_secret() -> str:
    """
    JWT secret for signing/verifying bridge tickets and session proofs.
    Must be at least 32 bytes for production; short keys trigger a warning.
    """
    secret = os.getenv("JWT_SECRET", "dev_secret_bridge_min_32_bytes_long")
    if len(secret) < 32:
        try:
            import warnings
            from jwt.warnings import InsecureKeyLengthWarning
            warnings.filterwarnings("ignore", category=InsecureKeyLengthWarning)
        except (ImportError, AttributeError):
            pass
    return secret


def get_bind_address() -> str:
    """Bind address for the HTTP/WS server (e.g. '0.0.0.0:8000')."""
    return os.getenv("BIND_ADDR", "0.0.0.0:8000")


def parse_bind_address(addr: str) -> Tuple[str, int]:
    """Split 'host:port' into (host, port)."""
    host, port = addr.split(":", 1)
    return host, int(port)


def allow_self_pairing() -> bool:
    """
    Whether to allow host and guest from the same session (one tab = host, other = guest).
    Enabled in dev via ALLOW_SELF_PAIRING=1|true|yes.
    """
    return os.getenv("ALLOW_SELF_PAIRING", "").lower() in ("1", "true", "yes")


def is_production() -> bool:
    """True when BRIDGE_ENV=production (safe error messages, no default JWT)."""
    return os.getenv("BRIDGE_ENV", "").lower() == "production"


def get_cors_origins() -> list[str]:
    """
    CORS allow_origins from CORS_ORIGINS env (comma-separated).
    In production, empty = []; in dev, empty = ["*"] for backward compatibility.
    """
    raw = os.getenv("CORS_ORIGINS", "").strip()
    if not raw:
        return [] if is_production() else ["*"]
    origins = [o.strip() for o in raw.split(",") if o.strip()]
    return origins if origins else ([] if is_production() else ["*"])


def get_jwt_secret_for_app() -> str:
    """
    JWT secret; in production fail if default is still used.
    """
    secret = get_jwt_secret()
    default_dev = "dev_secret_bridge_min_32_bytes_long"
    if is_production() and secret == default_dev:
        raise RuntimeError(
            "JWT_SECRET must be set to a non-default value in production. "
            "Use a strong secret (≥32 chars) and keep it in sync with Next.js."
        )
    return secret


logger = setup_logging()
JWT_SECRET = get_jwt_secret()
BIND_ADDR = get_bind_address()
ALLOW_SELF_PAIRING = allow_self_pairing()
HOST, PORT = parse_bind_address(BIND_ADDR)
IS_PRODUCTION = is_production()
CORS_ORIGINS = get_cors_origins()
