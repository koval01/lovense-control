import { getCloudflareContext } from '@opennextjs/cloudflare';
import { SignJWT, type JWTPayload } from 'jose';
import { NextResponse } from 'next/server';
import { requireSessionId } from '@/lib/server/session-auth';
import type { BridgeTicketPayload } from '@/lib/bridge/protocol';

const TICKET_TTL = '15m';

function isLocalRequest(req: Request): boolean {
  const host = req.headers.get('host') || req.headers.get('x-forwarded-host') || '';
  return host.includes('localhost') || host.includes('127.0.0.1') || host.startsWith('localhost:');
}

export async function POST(req: Request) {
  const { env } = (await getCloudflareContext({ async: true })) as unknown as { env: Record<string, unknown> };
  const allowTestPeer =
    isLocalRequest(req) || env.ALLOW_TEST_PEER === 'true' || env.ALLOW_TEST_PEER === true;
  if (!allowTestPeer) {
    return NextResponse.json({ error: 'Test peer is disabled in production' }, { status: 403 });
  }

  try {
    const jwtSecret =
      (env.JWT_SECRET as string | undefined) || process.env.JWT_SECRET;
    if (!jwtSecret) {
      return NextResponse.json({ error: 'JWT_SECRET is not configured' }, { status: 500 });
    }

    const body = (await req.json().catch(() => ({}))) as { roomId?: string };
    const roomId = typeof body.roomId === 'string' ? body.roomId.trim() : '';
    if (!roomId) {
      return NextResponse.json({ error: 'roomId is required' }, { status: 400 });
    }

    // Require a real user session to avoid unauthenticated abuse of test mode.
    await requireSessionId();

    const testPeerUserId = `test-peer-${crypto.randomUUID()}`;
    const ticketPayload: BridgeTicketPayload = {
      type: 'bridge_ticket',
      roomId,
      userId: testPeerUserId,
      role: 'guest',
    };
    const secret = new TextEncoder().encode(jwtSecret);
    const ticket = await new SignJWT(ticketPayload as unknown as JWTPayload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(TICKET_TTL)
      .sign(secret);

    return NextResponse.json({ ticket, testPeerUserId });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create test peer';
    const status = message === 'No active session' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
