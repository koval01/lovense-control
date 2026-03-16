import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const SESSION_COOKIE_NAME = 'lovense_session_token';

interface SessionPayload {
  sessionId?: string;
}

export async function requireSessionId(): Promise<string> {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT_SECRET is not configured');
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    throw new Error('No active session');
  }

  const secret = new TextEncoder().encode(jwtSecret);
  const verified = await jwtVerify(token, secret);
  const payload = verified.payload as SessionPayload;
  if (!payload.sessionId || typeof payload.sessionId !== 'string') {
    throw new Error('Invalid session token');
  }

  return payload.sessionId;
}
