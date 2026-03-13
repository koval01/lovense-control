import { SignJWT, type JWTPayload } from 'jose';
import { NextResponse } from 'next/server';
import { createBridgeInviteCode } from '@/lib/server/bridge-code-service';
import { requireSessionId } from '@/lib/server/session-auth';
import type { BridgeTicketPayload } from '@/lib/bridge/protocol';

const TICKET_TTL = '2h';

export async function POST() {
  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return NextResponse.json({ error: 'JWT_SECRET is not configured' }, { status: 500 });
    }

    const userId = await requireSessionId();
    const roomId = crypto.randomUUID();
    const secret = new TextEncoder().encode(jwtSecret);

    const { code } = await createBridgeInviteCode(roomId, userId);

    const ticketPayload: BridgeTicketPayload = {
      type: 'bridge_ticket',
      roomId,
      userId,
      role: 'host',
    };
    const ticket = await new SignJWT(ticketPayload as unknown as JWTPayload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(TICKET_TTL)
      .sign(secret);

    return NextResponse.json({ roomId, code, ticket });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create bridge room';
    const status = message === 'No active session' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
