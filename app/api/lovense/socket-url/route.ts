import { NextResponse } from 'next/server';
import { requestLovenseSocketUrl } from '@/lib/server/lovense-api-client';

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as { authToken?: string };
    if (!body.authToken) {
      return NextResponse.json({ error: 'authToken is required' }, { status: 400 });
    }

    const wsUrl = await requestLovenseSocketUrl(body.authToken, 'Koval Yaroslav');
    return NextResponse.json({ wsUrl });
  } catch (error) {
    console.error('Lovense Socket URL Error:', error);
    const message = error instanceof Error ? error.message : 'Failed to get socket URL from Lovense';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
