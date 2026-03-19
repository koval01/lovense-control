# Lovense Bridge (Cloudflare Workers + Durable Objects)

Cloudflare-based bridge server for partner mode. Replaces the Python bridge for lower latency when deployed on Cloudflare's edge.

## Deploy

1. Set secrets (same `JWT_SECRET` as your Next.js app):

```bash
npx wrangler secret put JWT_SECRET --config wrangler.bridge.jsonc
```

2. Production: set `BRIDGE_ENV=production` to enforce non-default JWT and safe CORS:

```bash
npx wrangler secret put BRIDGE_ENV --config wrangler.bridge.jsonc
# Value: production
```

3. Optional: CORS (comma-separated origins). If empty, dev allows `*`; production rejects unknown origins:

```bash
npx wrangler secret put CORS_ORIGINS --config wrangler.bridge.jsonc
# Value: https://your-app.com,https://www.your-app.com
```

4. Optional: enable self-pairing (host and guest from same browser):

```bash
npx wrangler secret put ALLOW_SELF_PAIRING --config wrangler.bridge.jsonc
# Value: 1 or true or yes
```

5. Deploy:

```bash
npm run bridge:cf:deploy
```

6. Update your app's bridge URL to the Worker URL (e.g. `https://lovense-bridge.<your-subdomain>.workers.dev`) via `NEXT_PUBLIC_BRIDGE_SERVER_URL` or [lib/bridge-config.ts](../lib/bridge-config.ts).

## Same domain (lovense.koval-dev.org/bridge)

Bridge can share the app domain. Set `BRIDGE_SERVER_URL=https://lovense.koval-dev.org/bridge` (or update [lib/bridge-config.ts](../lib/bridge-config.ts) fallback). The Worker handles paths `/bridge/rooms`, `/bridge/ws`, etc.

Configure in Cloudflare Dashboard: Workers & Pages → lovense-bridge → Settings → Domains & Routes → Add route:
- Route: `lovense.koval-dev.org/bridge/*`
- Worker: lovense-bridge

Or use `routes` in [wrangler.bridge.jsonc](../wrangler.bridge.jsonc) (adjust `zone_name` for your zone).

## Health check

`GET /health` and `GET /bridge/health` return `{"ok":true}` for monitoring.

## Local development

```bash
# Create .dev.vars in project root with:
# JWT_SECRET=your-secret
# ALLOW_SELF_PAIRING=1

npm run bridge:cf:dev
```

Then set `NEXT_PUBLIC_BRIDGE_SERVER_URL=http://localhost:8787` when running the Next.js app.

## API

Server contract ([docs/BRIDGE_SERVER_SPEC.md](../../docs/BRIDGE_SERVER_SPEC.md)):

- `POST /rooms` — create room (host)
- `POST /rooms/join` — join room (guest)
- `POST /register-session` — register Lovense session
- `GET /ws?ticket=...` — WebSocket (Engine.IO / Socket.IO)
