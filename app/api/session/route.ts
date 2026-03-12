import { SignJWT, jwtVerify } from 'jose';
import { v4 as uuidv4 } from 'uuid';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const SESSION_COOKIE_NAME = 'lovense_session_token';
const MAX_AGE = 60 * 60 * 24; // 24h

export async function GET() {
  const secret = new TextEncoder().encode(process.env.JWT_SECRET);
  const cookieStore = await cookies();
  const existingToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (existingToken) {
    try {
      await jwtVerify(existingToken, secret);
      // Valid session already present; don't overwrite so reload keeps the same session
      return NextResponse.json({ ok: true });
    } catch {
      // Expired or invalid; fall through to create a new session
    }
  }

  const sessionId = uuidv4();
  const jwt = await new SignJWT({ sessionId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(secret);

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE_NAME, jwt, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE,
  });
  return response;
}
