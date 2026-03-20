import { corsHeaders } from './cors';
import type { Env } from './env';

export function withCors(
  origin: string | null,
  env: Env,
  res: Response,
  preserveWebSocket = false
): Response {
  const headers = new Headers(res.headers);
  for (const [k, v] of Object.entries(corsHeaders(origin, env))) {
    if (v) headers.set(k, v);
  }
  const init: ResponseInit & { webSocket?: WebSocket } = { status: res.status, headers };
  const ws = (res as Response & { webSocket?: WebSocket }).webSocket;
  if (preserveWebSocket && ws) init.webSocket = ws;
  return new Response(res.body, init);
}
