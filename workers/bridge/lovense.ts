/**
 * Lovense API client: getSocketUrl and WebSocket URL construction.
 * Ported from bridge/lovense.py
 */

const LOVENSE_GET_SOCKET_URL = 'https://api.lovense-api.com/api/basicApi/getSocketUrl';
const PLATFORM = 'Koval Yaroslav';

export interface SocketInfo {
  socketIoUrl: string;
  socketIoPath?: string;
  [key: string]: unknown;
}

export class LovenseApiError extends Error {
  constructor(
    message: string,
    public readonly status: 400 | 502
  ) {
    super(message);
    this.name = 'LovenseApiError';
  }
}

export async function getSocketUrl(authToken: string): Promise<SocketInfo> {
  const res = await fetch(LOVENSE_GET_SOCKET_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ authToken, platform: PLATFORM }),
  });
  if (!res.ok) {
    throw new LovenseApiError('Lovense service temporarily unavailable', 502);
  }
  const data = (await res.json().catch(() => ({}))) as { code?: number; data?: SocketInfo };
  if (data.code !== 0 || !data.data) {
    throw new LovenseApiError('Invalid or expired session', 400);
  }
  return data.data;
}

export function buildWebSocketUrl(socketInfo: SocketInfo, authToken: string): string {
  const socketIoUrl = socketInfo.socketIoUrl ?? '';
  const url = new URL(socketIoUrl.startsWith('http') ? socketIoUrl : `https://${socketIoUrl}`);
  const ntokenFromUrl = url.searchParams.get('ntoken');
  const raw = ntokenFromUrl ?? authToken;
  const safeToken = raw.replace(/\+/g, '%2B').replace(/\//g, '%2F').replace(/=/g, '%3D');

  const host = url.hostname || url.host || '';
  if (!host) throw new Error('Lovense socketIoUrl has no host');

  let path = (socketInfo.socketIoPath ?? '').trim();
  if (!path.startsWith('/')) path = '/' + path;
  if (!path.endsWith('/')) path = path + '/';

  return `wss://${host}${path}?ntoken=${safeToken}&EIO=3&transport=websocket`;
}
