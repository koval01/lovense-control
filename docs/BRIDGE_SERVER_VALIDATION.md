# Bridge implementation notes

This document summarizes what is implemented in the **Python** bridge server (`bridge/`). The authoritative contract is [BRIDGE_SERVER_SPEC.md](./BRIDGE_SERVER_SPEC.md).

---

## Implemented behavior

- **HTTP API:** `POST /rooms`, `POST /rooms/join`, `POST /getSocketUrl` with rate limits (10 / 30 / 30 per 60 s per IP). Tickets are JWT; `sessionProof` is supported for self-pairing checks.
- **WebSocket:** `GET /ws?ticket=...` with JWT validation, Engine.IO handshake (`0{...}`, `2probe`/`3probe`, `5`/`40`, ping `2`/`3`). Application messages `42["event", payload]` are parsed and handled per event type.
- **Command routing:** Host commands go only to the **guest** Lovense backend; guest commands only to the **host** backend. Implemented in `bridge/routing.py` (`route_to_backends` with `from_role`).
- **State replay:** Last device/status message from each backend is cached (`last_host_backend_msg`, `last_guest_backend_msg`). When a frontend connects, the **other** side’s cached message is replayed so the new tab sees the partner’s toys immediately. See `bridge/state.py` and `bridge/routes_ws.py` (replay in `ws_upgrade_handler`), `bridge/routing.py` (`route_to_frontends` updates cache).
- **Toy rules:** `bridge_set_toy_rules` updates per-role state (enabledToyIds, maxPower, limits). Only the sender’s role is updated; `targetRole` must match or be omitted. Commands are filtered and scaled in `bridge/rules.py` (`apply_rules_and_forward_command`) before being sent to the backend. `bridge_partner_toy_rules` is sent to the other frontend when rules change and on connect.
- **Partner status:** On connect/disconnect the other frontend receives `bridge_partner_status`. On connect, if the other side is already connected, the new frontend gets `bridge_partner_status(connected: true)` (and partner rules if set).
- **Chat:** `bridge_chat_message` validated (length 1000, emoji cap 20, no control chars, flood 2 s). Buffer of last 10 messages replayed via `bridge_chat_history` on connect. `bridge_chat_typing` forwarded to the other frontend. See `bridge/chat.py`, `bridge/ws_events.py`, `bridge/routes_ws.py`.
- **Ping/pong:** `bridge_ping` and `bridge_pong` forwarded to the other frontend only (no backend).
- **Lovense URL:** `bridge/lovense.py` builds the WebSocket URL from getSocketUrl response; `ntoken` is taken from `socketIoUrl` query if present, otherwise `authToken`.
- **Self-pairing:** When `ALLOW_SELF_PAIRING=1` and guest uses the same session/token as host, the guest reuses the host’s Lovense backend (`guest_uses_host_backend`). When self-pairing is disabled, guest with same `sessionId` (from `sessionProof`) as host is rejected (403) or disconnected.
- **Room cleanup:** Background task removes rooms with no connected frontends and older than 1 hour. See `bridge/app.py` lifespan.

---

## Key modules and classes

| Module | Classes / role |
|--------|----------------|
| `bridge/app.py` | FastAPI app, CORS, lifespan; starts `RoomCleanupRunner` |
| `bridge/state.py` | **Room** (queues, cache, rules, chat; methods: set_frontend/backend, get_other_frontend, get_cached_message_for_peer, append_chat, etc.), **RoomRegistry** (create_room, join_room, get_room, cleanup_idle) |
| `bridge/routing.py` | **MessageRouter** (forward_to_other_frontend, route_to_backends, route_to_frontends); module-level wrappers for backward compat |
| `bridge/rules.py` | **ToyRulesService** (apply_set_toy_rules_and_notify, apply_rules_to_command); module-level wrappers |
| `bridge/backend_tunnel.py` | **BackendTunnel** (run: connect to Lovense WS, read → route_to_frontends, queue → write); `run_backend_connection` entry point |
| `bridge/routes_ws.py` | **FrontendConnection** (run, _replay_state, _handle_frame, _handle_app_message, _on_disconnect); `ws_upgrade_handler` |
| `bridge/routes_http.py` | POST /rooms, /rooms/join, /getSocketUrl; uses `RoomRegistry`, **SocketUrlService** for getSocketUrl |
| `bridge/socket_url_service.py` | **SocketUrlService** (register: getSocketUrl, self-pairing, spawn BackendTunnel) |
| `bridge/room_cleanup.py` | **RoomCleanupRunner** (start/stop, periodic cleanup_idle on registry) |
| `bridge/ws_events.py` | Event names, payload models, parse_app_message, build_app_message |
| `bridge/protocol.py` | partner_status_msg, partner_toy_rules_msg |
| `bridge/chat.py` | validate_chat_text, CHAT_* constants, build_chat_message_event, build_chat_history_event |
| `bridge/auth.py` | create_ticket, decode_ticket, session_id_from_proof |
| `bridge/config.py` | JWT_SECRET, BIND_ADDR, CORS_ORIGINS, ALLOW_SELF_PAIRING, BRIDGE_ENV |

---

## Running and testing

```bash
# Default (dev) – CORS *, default JWT
python -m bridge

# Self-pairing (two tabs, same session)
ALLOW_SELF_PAIRING=1 python -m bridge

# Production – set JWT_SECRET, BRIDGE_ENV=production, CORS_ORIGINS
BRIDGE_ENV=production JWT_SECRET=your-secret CORS_ORIGINS=https://app.example.com python -m bridge
```

Frontend uses `NEXT_PUBLIC_BRIDGE_SERVER_URL` for both HTTP and WebSocket base URLs.
