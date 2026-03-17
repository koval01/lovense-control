/**
 * Bridge Worker: HTTP routing, CORS, rate limiting, proxy to Durable Objects.
 */

import { decodeTicket } from './auth';

export { BridgeRegistry } from './registry';
export { BridgeRoom } from './room';

export interface Env {
  JWT_SECRET: string;
  BRIDGE_REGISTRY: DurableObjectNamespace;
  BRIDGE_ROOM: DurableObjectNamespace;
  ALLOW_SELF_PAIRING?: string;
  CORS_ORIGINS?: string;
  BRIDGE_ENV?: string;
}

const DEFAULT_JWT_SECRET = 'dev_secret_bridge_min_32_bytes_long';

const RATE_LIMIT_WINDOW_SEC = 60;
const RATE_LIMIT_ROOMS = 10;
const RATE_LIMIT_JOIN = 30;
const RATE_LIMIT_GET_SOCKET_URL = 30;

interface RateLimitEntry {
  count: number;
  windowStart: number;
}
const rateLimitMap = new Map<string, RateLimitEntry>();

function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return 'unknown';
}

function checkRateLimit(
  ip: string,
  suffix: string,
  maxRequests: number
): [boolean, string] {
  const now = Date.now() / 1000;
  const key = `${ip}:${suffix}`;
  let entry = rateLimitMap.get(key);
  if (!entry || now - entry.windowStart >= RATE_LIMIT_WINDOW_SEC) {
    entry = { count: 0, windowStart: now };
    rateLimitMap.set(key, entry);
  }
  entry.count++;
  if (entry.count > maxRequests) {
    return [false, 'Too many requests. Try again later.'];
  }
  return [true, ''];
}

function getAllowedOrigin(origin: string | null, env: Env): string {
  const corsOrigins = env.CORS_ORIGINS?.trim();
  const isProduction = env.BRIDGE_ENV?.toLowerCase() === 'production';
  if (!corsOrigins) {
    return isProduction ? '' : origin || '*';
  }
  const allowed = corsOrigins.split(',').map((o) => o.trim()).filter(Boolean);
  if (allowed.length === 0) return isProduction ? '' : origin || '*';
  if (origin && allowed.includes(origin)) return origin;
  return allowed[0] ?? '';
}

function corsHeaders(origin: string | null, env: Env): Record<string, string> {
  const allow = getAllowedOrigin(origin, env);
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
  if (allow) headers['Access-Control-Allow-Origin'] = allow;
  return headers;
}

function ensureProductionSecret(env: Env): void {
  if (env.BRIDGE_ENV?.toLowerCase() !== 'production') return;
  if (!env.JWT_SECRET || env.JWT_SECRET === DEFAULT_JWT_SECRET) {
    throw new Error(
      'JWT_SECRET must be set to a non-default value in production. Use a strong secret (≥32 chars) and keep it in sync with Next.js.'
    );
  }
}

const BRIDGE_PATH_PREFIX = '/bridge';

/** Normalize path: /bridge/rooms -> /rooms, /bridge/ws -> /ws. Supports same-domain routing. */
function normalizePath(path: string): string {
  if (path.startsWith(BRIDGE_PATH_PREFIX)) {
    const rest = path.slice(BRIDGE_PATH_PREFIX.length) || '/';
    return rest.startsWith('/') ? rest : `/${rest}`;
  }
  return path;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const path = normalizePath(url.pathname);
    const origin = request.headers.get('Origin');

    if (request.method === 'GET' && (path === '/health' || path === '/' || path === '')) {
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(origin, env),
      });
    }

    try {
      ensureProductionSecret(env);
    } catch (e) {
      return new Response(
        JSON.stringify({ error: (e as Error).message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const addCors = (res: Response, preserveWebSocket = false) => {
      const headers = new Headers(res.headers);
      for (const [k, v] of Object.entries(corsHeaders(origin, env))) {
        if (v) headers.set(k, v);
      }
      const init: ResponseInit & { webSocket?: WebSocket } = { status: res.status, headers };
      const ws = (res as Response & { webSocket?: WebSocket }).webSocket;
      if (preserveWebSocket && ws) init.webSocket = ws;
      return new Response(res.body, init);
    };

    if (request.method === 'POST' && path === '/rooms') {
      const ip = getClientIp(request);
      const [ok, err] = checkRateLimit(ip, 'rooms', RATE_LIMIT_ROOMS);
      if (!ok) {
        return addCors(Response.json({ detail: err }, { status: 429 }));
      }
      const id = env.BRIDGE_REGISTRY.idFromName('bridge-registry');
      const stub = env.BRIDGE_REGISTRY.get(id);
      const res = await stub.fetch('https://internal/internal/create-room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      return addCors(new Response(res.body, { status: res.status, headers: res.headers }));
    }

    if (request.method === 'POST' && path === '/rooms/join') {
      const ip = getClientIp(request);
      const [ok, err] = checkRateLimit(ip, 'join', RATE_LIMIT_JOIN);
      if (!ok) {
        return addCors(Response.json({ detail: err }, { status: 429 }));
      }
      let body: { pairCode?: string };
      try {
        body = (await request.json()) as { pairCode?: string };
      } catch {
        return addCors(Response.json({ detail: 'Invalid JSON' }, { status: 400 }));
      }
      const id = env.BRIDGE_REGISTRY.idFromName('bridge-registry');
      const stub = env.BRIDGE_REGISTRY.get(id);
      const res = await stub.fetch('https://internal/internal/join-room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pairCode: body.pairCode ?? '' }),
      });
      return addCors(new Response(res.body, { status: res.status, headers: res.headers }));
    }

    if (request.method === 'POST' && path === '/getSocketUrl') {
      const ip = getClientIp(request);
      const [ok, err] = checkRateLimit(ip, 'getsocketurl', RATE_LIMIT_GET_SOCKET_URL);
      if (!ok) {
        return addCors(Response.json({ detail: err }, { status: 429 }));
      }
      let body: { authToken?: string; ticket?: string; sessionProof?: string };
      try {
        body = (await request.json()) as typeof body;
      } catch {
        return addCors(Response.json({ detail: 'Invalid JSON' }, { status: 400 }));
      }
      const ticket = body.ticket;
      if (!ticket) {
        return addCors(Response.json({ detail: 'ticket required' }, { status: 400 }));
      }
      let roomId: string;
      try {
        const decoded = await decodeTicket(ticket, env.JWT_SECRET);
        roomId = decoded.roomId;
      } catch {
        return addCors(Response.json({ detail: 'Invalid ticket' }, { status: 401 }));
      }
      const id = env.BRIDGE_ROOM.idFromName(roomId);
      const stub = env.BRIDGE_ROOM.get(id);
      const res = await stub.fetch(new Request('https://internal/internal/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authToken: body.authToken,
          ticket: body.ticket,
          sessionProof: body.sessionProof,
        }),
      }));
      return addCors(new Response(res.body, { status: res.status, headers: res.headers }));
    }

    if (request.method === 'GET' && path === '/ws') {
      const ticket = url.searchParams.get('ticket');
      if (!ticket) {
        return addCors(new Response('ticket required', { status: 400 }));
      }
      let roomId: string;
      try {
        const decoded = await decodeTicket(ticket, env.JWT_SECRET);
        roomId = decoded.roomId;
      } catch {
        return addCors(new Response('Invalid ticket', { status: 401 }));
      }
      const id = env.BRIDGE_ROOM.idFromName(roomId);
      const stub = env.BRIDGE_ROOM.get(id);
      const res = await stub.fetch(request);
      return addCors(res, true);
    }

    return addCors(new Response('Not Found', { status: 404 }));
  },
};
