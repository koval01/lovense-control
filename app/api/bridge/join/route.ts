import { SignJWT, type JWTPayload } from 'jose';
import { NextResponse } from 'next/server';
import { consumeBridgeInviteCode } from '@/lib/server/bridge-code-service';
import { requireSessionId } from '@/lib/server/session-auth';
import type { BridgeTicketPayload } from '@/lib/bridge/protocol';

const TICKET_TTL = '2h';

export async function POST(req: Request) {
  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return NextResponse.json({ error: 'JWT_SECRET is not configured' }, { status: 500 });
    }

    const body = (await req.json().catch(() => ({}))) as { code?: string };
    if (!body.code || !/^\d{6}$/.test(body.code.trim())) {
      return NextResponse.json({ error: '6-digit code is required' }, { status: 400 });
    }

    const userId = await requireSessionId();
    const secret = new TextEncoder().encode(jwtSecret);
    const consumed = await consumeBridgeInviteCode(body.code.trim(), userId);

    const ticketPayload: BridgeTicketPayload = {
      type: 'bridge_ticket',
      roomId: consumed.roomId,
      userId,
      role: 'guest',
    };

    const ticket = await new SignJWT(ticketPayload as unknown as JWTPayload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(TICKET_TTL)
      .sign(secret);

    return NextResponse.json({ roomId: consumed.roomId, ticket });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to join bridge room';
    const status = message === 'No active session' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
