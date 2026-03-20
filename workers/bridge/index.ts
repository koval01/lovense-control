/**
 * Bridge Worker: HTTP routing, CORS, rate limiting, proxy to Durable Objects.
 */

export { BridgeRegistry } from './registry';
export { BridgeRoom } from './room';
export type { Env } from './env';

import type { Env } from './env';
import { handleBridgeFetch } from './http-router';

export default {
  async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    return handleBridgeFetch(request, env);
  },
};
