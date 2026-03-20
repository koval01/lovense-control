import { corsHeaders } from './cors';
import type { Env } from './env';
import { ensureProductionSecret } from './http-router-security';

export function handleBridgeEarly(
  request: Request,
  env: Env,
  path: string,
  origin: string | null
): Response | null {
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
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return null;
}
