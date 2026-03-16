/**
 * JWT ticket and session proof verification.
 * Ported from bridge/auth.py
 */

import * as jose from 'jose';

export interface DecodedTicket {
  roomId: string;
  role: 'host' | 'guest';
}

export async function decodeTicket(
  ticket: string,
  secret: string
): Promise<DecodedTicket> {
  const key = new TextEncoder().encode(secret);
  const { payload } = await jose.jwtVerify(ticket, key);
  const roomId = payload.roomId as string;
  const role = payload.role as 'host' | 'guest';
  if (!roomId || !role || (role !== 'host' && role !== 'guest')) {
    throw new Error('Invalid ticket payload');
  }
  return { roomId, role };
}

export async function sessionIdFromProof(
  proof: string | null | undefined,
  secret: string
): Promise<string | null> {
  if (!proof) return null;
  try {
    const key = new TextEncoder().encode(secret);
    const { payload } = await jose.jwtVerify(proof, key);
    const sid = payload.sessionId;
    return typeof sid === 'string' ? sid : null;
  } catch {
    return null;
  }
}

export async function createTicket(
  roomId: string,
  role: 'host' | 'guest',
  secret: string,
  expSeconds = 86400
): Promise<string> {
  const key = new TextEncoder().encode(secret);
  const exp = Math.floor(Date.now() / 1000) + expSeconds;
  return await new jose.SignJWT({
    type: 'bridge_ticket',
    roomId,
    role,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(exp)
    .sign(key);
}
