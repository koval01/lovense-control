/**
 * BridgeRegistry Durable Object: create room, join room, pair_code lookup.
 * Uses SQLite-backed storage so rooms survive DO eviction.
 */

import { DurableObject } from 'cloudflare:workers';
import { registryCreateRoomResponse } from './registry-create-room';
import { registryJoinRoomResponse } from './registry-join-room';
import { registryRemoveRoomResponse } from './registry-remove-room';
import type { BridgeRegistryEnv } from './registry-env';

export type { BridgeRegistryEnv as Env } from './registry-env';

export class BridgeRegistry extends DurableObject<BridgeRegistryEnv> {
  private ctx: DurableObjectState;

  constructor(ctx: DurableObjectState, env: BridgeRegistryEnv) {
    super(ctx, env);
    this.ctx = ctx;
  }

  private kv() {
    return this.ctx.storage.kv;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    if (request.method === 'POST' && path === '/internal/create-room') {
      return registryCreateRoomResponse(this.kv(), this.env.JWT_SECRET);
    }
    if (request.method === 'POST' && path === '/internal/join-room') {
      const body = (await request.json()) as { pairCode?: string };
      const pairCode = (body.pairCode ?? '').toString();
      return registryJoinRoomResponse(this.kv(), this.env, pairCode);
    }
    if (request.method === 'POST' && path === '/internal/remove-room') {
      const roomId = url.searchParams.get('roomId');
      return registryRemoveRoomResponse(this.kv(), roomId);
    }

    return new Response('Not Found', { status: 404 });
  }
}
