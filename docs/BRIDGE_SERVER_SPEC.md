# Partner bridge server specification

This document describes the contract between the frontend and the **partner bridge server**. The reference implementation is the Cloudflare Worker + Durable Objects bridge in `workers/bridge/`.

---

## Overview

- **Host** and **partner (guest)** connect to the same bridge server.
- The WebSocket speaks **Socket.IO / Engine.IO** with the **Lovense wire protocol** for toy commands and device/status events. The bridge also defines **bridge-specific events** for partner status, toy rules, and chat.
- Each side registers their **Lovense session** with the server via `POST /register-session` (authToken + ticket). The server calls Lovense’s `getSocketUrl`, connects to the real Lovense WebSocket, and maintains a **backend tunnel** per participant (or reuses the host’s tunnel in self-pairing mode).
- Once both are connected, the server **routes** so that:
  - The **host** sees the **guest’s** toys and can control them (commands go to the guest’s Lovense backend).
  - The **guest** sees the **host’s** toys and can control them (commands go to the host’s Lovense backend).
- **Toy rules** (enabled toys, max power, per-feature limits) are set by each participant for their own toys and enforced on the bridge before forwarding commands to Lovense.

---

## 1. HTTP API

Base URL is the bridge server (e.g. `https://bridge.example.com`). Use the same origin for HTTP and WebSocket (`wss://` when base is `https://`).

All HTTP endpoints are **rate-limited per client IP** (60-second window). On limit exceeded the server returns `429` with body `{ "detail": "Too many requests. Try again later." }`.

### 1.1 Create room (host)

- **Request:** `POST /rooms`
- **Body:** `{ "hostDisplayName": null }` (or optional display name)
- **Rate limit:** 10 requests per 60 s per IP
- **Response (200):**
  ```json
  {
    "roomId": "uuid",
    "pairCode": "XXXXXXXX",
    "hostTicket": "jwt-string"
  }
  ```
- `pairCode` is 8 characters (uppercase letters + digits). Frontend stores `roomId`, `pairCode`, and uses `hostTicket` for subsequent steps.

### 1.2 Join room (partner)

- **Request:** `POST /rooms/join`
- **Body:** `{ "pairCode": "XXXXXXXX", "guestDisplayName": null }`
- **Rate limit:** 30 requests per 60 s per IP
- **Response (200):**
  ```json
  {
    "roomId": "uuid",
    "guestTicket": "jwt-string"
  }
  ```
- **Response (404):** Room not found for the given pair code.

### 1.3 Register Lovense session

- **Request:** `POST /register-session`
- **Body:**
  ```json
  {
    "authToken": "string-from-lovense-getToken",
    "ticket": "hostTicket-or-guestTicket",
    "sessionProof": "optional-jwt-with-sessionId"
  }
  ```
- **Rate limit:** 30 requests per 60 s per IP
- **Purpose:** The frontend obtains `authToken` from the Next.js app (Lovense `getToken`). The bridge:
  1. Decodes the JWT `ticket` to get `roomId` and `role` (host/guest).
  2. Optionally decodes `sessionProof` to get `sessionId` (same secret as Next.js). Used to **disable self-pairing** when host and guest share the same session (e.g. two tabs, same browser).
  3. Calls Lovense **getSocketUrl** with `authToken` and a platform string.
  4. Builds the Lovense WebSocket URL and spawns a **backend tunnel** for this role. In **self-pairing** mode (guest same session/token as host), the bridge may reuse the host’s Lovense connection for the guest instead of opening a second one.
- **Lovense getSocketUrl:**  
  `POST https://api.lovense-api.com/api/basicApi/getSocketUrl`  
  Body: `{ "authToken": "<authToken>", "platform": "<string>" }`  
  Response: `{ "code": 0, "data": { "socketIoUrl": "...", "socketIoPath": "..." } }`. The WebSocket URL is built from `socketIoUrl` (host), `socketIoPath` (path), and `ntoken` from the URL query or `authToken`.
- **Response (200):** `{ "ok": true }`
- **Response (401):** Invalid ticket.
- **Response (403):** Self-pairing disabled and guest has same sessionId as host (or same authToken in non–self-pairing mode); message indicates using a different device/session.
- **Response (502/400):** Lovense API error or invalid/expired token.

---

## 2. WebSocket connection

- **URL:** `GET /ws?ticket=<hostTicket|guestTicket>`
- **Protocol:** **Engine.IO over WebSocket** (Socket.IO–compatible). Application messages are Engine.IO type 4, packet type 2: `42["<eventName>", <payload>]` (JSON array).

### 2.1 Handshake (client → server)

1. Server sends: `0{"sid":"bridge-session","upgrades":[],"pingInterval":25000,"pingTimeout":50000}`
2. Client sends: `2probe` → server responds: `3probe`
3. Client sends: `5` → server responds: `40`
4. Engine.IO ping: client sends `2` → server responds `3`

After receiving `40`, the client treats the connection as Socket.IO connected and sends/receives application messages (`42...`).

**Message size:** Messages larger than 256 KB are dropped by the server.

### 2.2 Lovense events (tunneled)

These are **forwarded** between the bridge and the **other** side’s Lovense backend (host’s browser ↔ guest’s Lovense backend, guest’s browser ↔ host’s Lovense backend).

**Client → server (commands):**  
- `basicapi_send_toy_command_ts` — payload e.g. `{ "command": "Function", "action": "Vibrate1:5", "timeSec": 0, "apiVer": 1, "toy": "<toyId>", "stopPrevious": 0 }` (optional: `loopRunningSec`, `loopPauseSec`).  
  The bridge **routes** the command to the **other** side’s backend only. It applies the **target** side’s rules (enabled toys, per-feature limits, max power) before sending to Lovense. Commands for disabled toys are dropped.

**Server → client (from Lovense):**  
- `basicapi_update_device_info_tc` / `basicApi_update_device_info` — payload includes `toyList: Array<{ id, name?, toyType?, connected?, battery?, shortFunctionNames?, fullFunctionNames? }>`.
- `basicapi_update_app_online_tc` / `basicapi_update_app_status_tc` — payload includes `status: 1` when app is online.

The bridge caches the last device/status message from each backend and **replays** it to a frontend when it connects, so the second tab sees the other side’s toys immediately.

### 2.3 Bridge events (client → server)

| Event | Payload | Description |
|-------|---------|-------------|
| `bridge_set_toy_rules` | `{ enabledToyIds?: string[], maxPower?: number, limits?: Record<string, number>, targetRole?: "host" \| "guest" }` | Set which toys the partner can control and limits. Only the sender’s role is updated; `targetRole` must be omitted or equal to sender (otherwise rejected). |
| `bridge_chat_message` | `{ text: string, ts: number }` | Send a chat message. Server validates length (max 1000), control chars, emoji count (max 20), and flood (min 2 s between messages per role). |
| `bridge_chat_typing` | `{ typing: boolean }` | Typing indicator; forwarded to the other frontend. |
| `bridge_ping` | `{ id?: string, ts: number }` | RTT measurement; server forwards to other frontend. |
| `bridge_pong` | `{ id?: string, ts: number }` | Response to bridge_ping; forwarded to other frontend. |

### 2.4 Bridge events (server → client)

| Event | Payload | Description |
|-------|---------|-------------|
| `bridge_partner_status` | `{ connected: boolean }` | Other participant connected or disconnected. |
| `bridge_partner_toy_rules` | `{ enabledToyIds: string[], limits: Record<string, number>, maxPower?: number }` | Partner’s rules for the toys you can control (replayed on connect if set). |
| `bridge_chat_message` | `{ text: string, ts: number, role: "host" \| "guest" }` | One chat message (echo to sender and forward to partner). |
| `bridge_chat_history` | `{ messages: Array<{ text, ts, role }> }` | Last N chat messages (e.g. 10) replayed when a frontend connects. |
| `bridge_chat_typing` | `{ typing: boolean }` | Partner typing indicator. |

---

## 3. Order of operations (frontend)

**Host:**

1. `POST /rooms` → get `roomId`, `pairCode`, `hostTicket`
2. `POST /register-session` with `{ authToken, ticket: hostTicket, sessionProof? }`
3. Open WebSocket: `/ws?ticket=<hostTicket>`
4. Engine.IO handshake → send/receive Lovense and bridge events. Until the guest joins, partner status is disconnected; when guest connects, server sends cached device list and partner status/rules.

**Guest:**

1. `POST /rooms/join` with `{ pairCode }` → get `roomId`, `guestTicket`
2. `POST /register-session` with `{ authToken, ticket: guestTicket, sessionProof? }`
3. Open WebSocket: `/ws?ticket=<guestTicket>`
4. Same handshake and event flow; guest sees host’s toys (and own toys if not self-pairing) and receives partner status/rules.

---

## 4. Environment and run

The bridge uses Worker secrets / vars (so `JWT_SECRET` matches the Next.js app).

| Variable | Description | Default |
|----------|-------------|---------|
| `JWT_SECRET` | Secret for tickets and sessionProof; must match Next.js. ≥32 chars in production. | `dev_secret_bridge_min_32_bytes_long` |
| `CORS_ORIGINS` | Comma-separated origins; empty in dev = `*`. | dev: `*`; prod: `[]` |
| `BRIDGE_ENV` | Set to `production` for safe error messages and to forbid default JWT. | — |
| `ALLOW_SELF_PAIRING` | `1` / `true` / `yes` to allow host and guest from the same session (e.g. two tabs). | off |

**Run:**

```bash
npm run bridge:cf:dev
# deploy
npm run bridge:cf:deploy
```

---

## 5. Security (summary)

- **Tickets** (hostTicket, guestTicket) are JWT signed with `JWT_SECRET`; they encode `roomId` and `role` and are validated on WebSocket upgrade and on `register-session`.
- **Self-pairing:** If `ALLOW_SELF_PAIRING` is not set and the guest’s `sessionProof` decodes to the same `sessionId` as the host (or the same authToken is used), the bridge rejects the guest with 403 or disconnects the guest when the host registers.
- **Toy rules:** Only the owner can set rules for their toys (`targetRole` must not be the other role). Commands for toys not in the owner’s `enabledToyIds` are dropped; `limits` and `maxPower` are applied on the bridge before sending to Lovense.

---

## 6. Reference: Lovense API (server-side)

- **getToken:** Done by the Next.js app; frontend never calls this on the bridge. Frontend gets `authToken` from `POST /api/lovense/socket`.
- **getSocketUrl:** `POST https://api.lovense-api.com/api/basicApi/getSocketUrl` with `authToken`, `platform`. Use returned `socketIoUrl` and `socketIoPath` to build `wss://<host><path>?ntoken=<...>&EIO=3&transport=websocket`.
