import { DurableObject } from 'cloudflare:workers';

interface InviteCodeRecord {
  roomId: string;
  hostUserId: string;
  expiresAt: number;
}

const CODE_TTL_MS = 10 * 60 * 1000;
const MAX_GENERATION_ATTEMPTS = 25;

function createSixDigitCode(): string {
  const value = Math.floor(Math.random() * 1_000_000);
  return value.toString().padStart(6, '0');
}

export class BridgeCodeDurableObject extends DurableObject {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

    if (url.pathname === '/create' && request.method === 'POST') {
      const roomId = typeof body.roomId === 'string' ? body.roomId : '';
      const hostUserId = typeof body.hostUserId === 'string' ? body.hostUserId : '';
      if (!roomId || !hostUserId) {
        return Response.json({ error: 'roomId and hostUserId are required' }, { status: 400 });
      }

      for (let attempt = 0; attempt < MAX_GENERATION_ATTEMPTS; attempt += 1) {
        const code = createSixDigitCode();
        const key = `invite:${code}`;
        const existing = ((await this.ctx.storage.get(key)) as InviteCodeRecord | undefined) || null;
        if (existing && existing.expiresAt > Date.now()) {
          continue;
        }

        const record: InviteCodeRecord = {
          roomId,
          hostUserId,
          expiresAt: Date.now() + CODE_TTL_MS,
        };

        await this.ctx.storage.put(key, record, {
          expiration: Math.ceil(record.expiresAt / 1000),
        });
        return Response.json({ code, expiresInSec: Math.floor(CODE_TTL_MS / 1000) });
      }

      return Response.json({ error: 'Unable to allocate invite code' }, { status: 503 });
    }

    if (url.pathname === '/consume' && request.method === 'POST') {
      const code = typeof body.code === 'string' ? body.code.trim() : '';
      const requesterUserId = typeof body.requesterUserId === 'string' ? body.requesterUserId : '';
      const allowSameUser = Boolean(body.allowSameUser);

      if (!/^\d{6}$/.test(code)) {
        return Response.json({ error: 'Invalid code format' }, { status: 400 });
      }
      if (!requesterUserId) {
        return Response.json({ error: 'requesterUserId is required' }, { status: 400 });
      }

      const key = `invite:${code}`;
      const record = ((await this.ctx.storage.get(key)) as InviteCodeRecord | undefined) || null;
      if (!record || record.expiresAt <= Date.now()) {
        await this.ctx.storage.delete(key);
        return Response.json({ error: 'Code is invalid or expired' }, { status: 404 });
      }

      if (!allowSameUser && record.hostUserId === requesterUserId) {
        return Response.json({ error: 'Cannot use your own code' }, { status: 400 });
      }

      await this.ctx.storage.delete(key);
      return Response.json({ roomId: record.roomId, hostUserId: record.hostUserId });
    }

    return new Response('Not found', { status: 404 });
  }
}
