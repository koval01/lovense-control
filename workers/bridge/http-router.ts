import type { Env } from './env';
import { normalizeBridgePath } from './http-path';
import { handleBridgeEarly } from './http-router-early';
import { handleBridgeRoutes } from './http-router-routes';

export { ensureProductionSecret } from './http-router-security';

export async function handleBridgeFetch(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const path = normalizeBridgePath(url.pathname);
  const origin = request.headers.get('Origin');
  const early = handleBridgeEarly(request, env, path, origin);
  if (early) return early;
  return handleBridgeRoutes(request, env, path, origin);
}
