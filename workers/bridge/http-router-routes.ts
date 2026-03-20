import { decodeTicket } from './auth';
import type { Env } from './env';
import { withCors } from './http-response-cors';
import {
  checkRateLimit,
  getClientIp,
  RATE_LIMIT_JOIN,
  RATE_LIMIT_REGISTER_SESSION,
  RATE_LIMIT_ROOMS,
} from './rate-limit';

export async function handleBridgeRoutes(
  request: Request,
  env: Env,
  path: string,
  origin: string | null
): Promise<Response> {
  if (request.method === 'POST' && path === '/rooms') {
    const ip = getClientIp(request);
    const [ok, err] = checkRateLimit(ip, 'rooms', RATE_LIMIT_ROOMS);
    if (!ok) return withCors(origin, env, Response.json({ detail: err }, { status: 429 }));
    const id = env.BRIDGE_REGISTRY.idFromName('bridge-registry');
    const stub = env.BRIDGE_REGISTRY.get(id);
    const res = await stub.fetch('https://internal/internal/create-room', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    return withCors(origin, env, new Response(res.body, { status: res.status, headers: res.headers }));
  }

  if (request.method === 'POST' && path === '/rooms/join') {
    const ip = getClientIp(request);
    const [ok, err] = checkRateLimit(ip, 'join', RATE_LIMIT_JOIN);
    if (!ok) return withCors(origin, env, Response.json({ detail: err }, { status: 429 }));
    let body: { pairCode?: string };
    try {
      body = (await request.json()) as { pairCode?: string };
    } catch {
      return withCors(origin, env, Response.json({ detail: 'Invalid JSON' }, { status: 400 }));
    }
    const id = env.BRIDGE_REGISTRY.idFromName('bridge-registry');
    const stub = env.BRIDGE_REGISTRY.get(id);
    const res = await stub.fetch('https://internal/internal/join-room', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pairCode: body.pairCode ?? '' }),
    });
    return withCors(origin, env, new Response(res.body, { status: res.status, headers: res.headers }));
  }

  if (request.method === 'POST' && (path === '/register-session' || path === '/getSocketUrl')) {
    const ip = getClientIp(request);
    const [ok, err] = checkRateLimit(ip, 'register-session', RATE_LIMIT_REGISTER_SESSION);
    if (!ok) return withCors(origin, env, Response.json({ detail: err }, { status: 429 }));
    let body: { authToken?: string; ticket?: string; sessionProof?: string };
    try {
      body = (await request.json()) as typeof body;
    } catch {
      return withCors(origin, env, Response.json({ detail: 'Invalid JSON' }, { status: 400 }));
    }
    if (!body.ticket) return withCors(origin, env, Response.json({ detail: 'ticket required' }, { status: 400 }));
    let roomId: string;
    try {
      roomId = (await decodeTicket(body.ticket, env.JWT_SECRET)).roomId;
    } catch {
      return withCors(origin, env, Response.json({ detail: 'Invalid ticket' }, { status: 401 }));
    }
    const stub = env.BRIDGE_ROOM.get(env.BRIDGE_ROOM.idFromName(roomId));
    const res = await stub.fetch(
      new Request('https://internal/internal/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authToken: body.authToken,
          ticket: body.ticket,
          sessionProof: body.sessionProof,
        }),
      })
    );
    return withCors(origin, env, new Response(res.body, { status: res.status, headers: res.headers }));
  }

  if (request.method === 'GET' && path === '/ws') {
    const url = new URL(request.url);
    const ticket = url.searchParams.get('ticket');
    if (!ticket) return withCors(origin, env, new Response('ticket required', { status: 400 }));
    let roomId: string;
    try {
      roomId = (await decodeTicket(ticket, env.JWT_SECRET)).roomId;
    } catch {
      return withCors(origin, env, new Response('Invalid ticket', { status: 401 }));
    }
    const stub = env.BRIDGE_ROOM.get(env.BRIDGE_ROOM.idFromName(roomId));
    const res = await stub.fetch(request);
    return withCors(origin, env, res, true);
  }

  return withCors(origin, env, new Response('Not Found', { status: 404 }));
}
