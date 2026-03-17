/**
 * BridgeRegistry Durable Object: create room, join room, pair_code lookup.
 * Uses SQLite-backed storage so rooms survive DO eviction.
 */

import { DurableObject } from 'cloudflare:workers';
import { createTicket } from './auth';

const PAIR_CODE_LENGTH = 8;
const PAIR_CODE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const KV_PREFIX_PAIR = 'pc:';
const KV_PREFIX_ROOM = 'room:';

function generatePairCode(): string {
  let result = '';
  const chars = PAIR_CODE_CHARS;
  for (let i = 0; i < PAIR_CODE_LENGTH; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

export interface Env {
  JWT_SECRET: string;
  BRIDGE_REGISTRY: DurableObjectNamespace;
  BRIDGE_ROOM: DurableObjectNamespace;
}

export class BridgeRegistry extends DurableObject<Env> {
  private ctx: DurableObjectState;

  constructor(ctx: DurableObjectState, env: Env) {
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
      return this.handleCreateRoom(request);
    }
    if (request.method === 'POST' && path === '/internal/join-room') {
      return this.handleJoinRoom(request);
    }
    if (request.method === 'POST' && path === '/internal/remove-room') {
      return this.handleRemoveRoom(request);
    }

    return new Response('Not Found', { status: 404 });
  }

  private async handleCreateRoom(request: Request): Promise<Response> {
    const secret = this.env.JWT_SECRET;
    if (!secret) {
      return Response.json({ error: 'JWT_SECRET not configured' }, { status: 500 });
    }

    const roomId = crypto.randomUUID();
    const kv = this.kv();
    let pairCode = generatePairCode();
    for (let i = 0; i < 100; i++) {
      if (!kv.get(KV_PREFIX_PAIR + pairCode)) break;
      pairCode = generatePairCode();
    }

    kv.put(KV_PREFIX_PAIR + pairCode, roomId);
    kv.put(KV_PREFIX_ROOM + roomId, pairCode);
    const hostTicket = await createTicket(roomId, 'host', secret);
    console.log(`[BridgeRegistry] Room created: roomId=${roomId} pairCode=${pairCode}`);

    return Response.json({
      roomId,
      pairCode,
      hostTicket,
    });
  }

  private async handleRemoveRoom(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const roomId = url.searchParams.get('roomId');
    if (!roomId) {
      return new Response('roomId required', { status: 400 });
    }
    const kv = this.kv();
    const pairCode = kv.get(KV_PREFIX_ROOM + roomId) as string | undefined;
    if (pairCode) {
      kv.delete(KV_PREFIX_PAIR + pairCode);
      kv.delete(KV_PREFIX_ROOM + roomId);
    }
    return new Response(null, { status: 204 });
  }

  private async handleJoinRoom(request: Request): Promise<Response> {
    const body = (await request.json()) as { pairCode?: string };
    const pairCode = (body.pairCode ?? '').toString().toUpperCase();
    if (!pairCode) {
      return Response.json({ error: 'pairCode required' }, { status: 400 });
    }

    const roomId = this.kv().get(KV_PREFIX_PAIR + pairCode) as string | undefined;
    if (!roomId) {
      return Response.json({ detail: 'Room not found' }, { status: 404 });
    }

    const secret = this.env.JWT_SECRET;
    if (!secret) {
      return Response.json({ error: 'JWT_SECRET not configured' }, { status: 500 });
    }

    const guestTicket = await createTicket(roomId, 'guest', secret);
    console.log(`[BridgeRegistry] Guest joined: roomId=${roomId} pairCode=${pairCode}`);

    return Response.json({
      roomId,
      guestTicket,
    });
  }

}
