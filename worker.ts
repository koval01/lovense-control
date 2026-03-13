import { decodeJwt } from 'jose';
import { BridgeCodeDurableObject } from './worker/bridge-code-do';
import { BridgeRoomDurableObject } from './worker/bridge-room-do';
// @ts-ignore `.open-next/worker.js` is generated at build time.
import { default as handler } from './.open-next/worker.js';

export default {
  async fetch(request: Request, env: any, ctx: any): Promise<Response> {
    const url = new URL(request.url);
    const isBridgeSocket = url.pathname === '/bridge/ws';
    const isUpgrade = (request.headers.get('Upgrade') || '').toLowerCase() === 'websocket';

    if (isBridgeSocket && isUpgrade) {
      const ticket = url.searchParams.get('ticket');
      if (!ticket) {
        return new Response('Missing ticket', { status: 401 });
      }

      let roomId: string | undefined;
      try {
        const decoded = decodeJwt(ticket) as { roomId?: string };
        roomId = decoded.roomId;
      } catch {
        return new Response('Invalid ticket', { status: 401 });
      }

      if (!roomId) {
        return new Response('Invalid ticket room', { status: 401 });
      }

      if (!env.BRIDGE_ROOM) {
        console.error('[bridge] BRIDGE_ROOM binding missing');
        return new Response('Bridge not configured', { status: 503 });
      }

      try {
        // Create a WebSocketPair and hand the server side to the Durable Object.
        const pair = new (globalThis as any).WebSocketPair();
        const [client, server] = Object.values(pair) as [WebSocket, WebSocket];

        const id = env.BRIDGE_ROOM.idFromName(roomId);
        const stub = env.BRIDGE_ROOM.get(id);

        // Forward the server socket to the DO; DO will call acceptWebSocket().
        await stub.fetch(request.url, {
          method: 'POST',
          webSocket: server,
          headers: {
            Upgrade: 'websocket',
          },
        } as any);

        return new Response(null, { status: 101, webSocket: client });
      } catch (err) {
        console.error('[bridge] WebSocket upgrade failed:', err);
        const msg = err instanceof Error ? err.message : 'Bridge error';
        return new Response(`Bridge error: ${msg}`, { status: 500 });
      }
    }

    return handler.fetch(request, env, ctx);
  },
};

export { BridgeRoomDurableObject };
export { BridgeCodeDurableObject };
