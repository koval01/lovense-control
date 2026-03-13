import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { requestLovenseAuthToken } from '@/lib/server/lovense-api-client';

const SESSION_COOKIE_NAME = 'lovense_session_token';
const LOVENSE_IP_RESTRICTED_CODE = 'LOVENSE_IP_RESTRICTED';

function isLovenseIpRestrictedError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  return message.includes('ip is restricted') || message.includes('frequent access');
}

function clearSessionCookie(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE_NAME, '', { path: '/', maxAge: 0 });
}

export async function POST(req: Request) {
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const LOVENSE_DEV_TOKEN = process.env.LOVENSE_DEV_TOKEN;

    const cookieStore = await cookies();
    let token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) {
      const body = await req.json().catch(() => ({}));
      token = (body as { token?: string }).token;
    }
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    let payload;
    try {
      const verified = await jwtVerify(token, secret);
      payload = verified.payload;
    } catch (jwtError) {
      const res = NextResponse.json(
        { error: 'Invalid or expired token', code: 'INVALID_TOKEN' },
        { status: 401 }
      );
      clearSessionCookie(res);
      return res;
    }

    const uid = payload.sessionId as string;

    if (!LOVENSE_DEV_TOKEN) {
      return NextResponse.json({ error: 'Lovense Dev Token not configured' }, { status: 500 });
    }

    const authToken = await requestLovenseAuthToken({
      developerToken: LOVENSE_DEV_TOKEN,
      uid,
      uname: `user_${uid.substring(0, 6)}`,
    });

    return NextResponse.json({ authToken, uid });
  } catch (error) {
    console.error('Lovense API Error:', error);
    if (isLovenseIpRestrictedError(error)) {
      return NextResponse.json(
        {
          error:
            'Lovense temporarily blocked this server IP due to frequent requests. Please try again later.',
          code: LOVENSE_IP_RESTRICTED_CODE,
        },
        { status: 429 }
      );
    }

    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
