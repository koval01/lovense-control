import { BridgeRoomPipeline } from './bridge-room-pipeline';
import { PING, PING_INTERVAL_MS } from './room-constants';

export abstract class BridgeRoomBackend extends BridgeRoomPipeline {
  protected spawnBackendTunnel(wsUrl: string, role: 'host' | 'guest'): void {
    let ws: WebSocket;
    try {
      ws = new WebSocket(wsUrl);
    } catch (err) {
      console.error(`[BridgeRoom] Lovense backend connect failed: room=${this.roomId} role=${role}`, err);
      if (role === 'host') this.hostBackend = null;
      else this.guestBackend = null;
      return;
    }
    ws.addEventListener('open', () => {
      if (role === 'host') {
        this.hostBackend = ws;
      } else {
        this.guestBackend = ws;
        if (this.guestUsesHostBackend && this.hostBackend) {
          (this as { guestBackend: WebSocket | null }).guestBackend = this.hostBackend;
        }
      }
      console.log(`[BridgeRoom] Lovense backend connected: room=${this.roomId} role=${role}`);
      ws.addEventListener('message', (ev) => {
        const data = typeof ev.data === 'string' ? ev.data : new TextDecoder().decode(ev.data);
        if (data.startsWith('0{')) ws.send('40');
        else if (data.startsWith('42')) this.routeBackendToFrontends(data, role);
      });
      const { pingId, writeId } = this.runBackendLoops(ws, role);
      ws.addEventListener('close', () => {
        clearInterval(pingId);
        clearInterval(writeId);
        if (role === 'host') this.hostBackend = null;
        else if (!this.guestUsesHostBackend) this.guestBackend = null;
        console.log(`[BridgeRoom] Lovense backend closed: room=${this.roomId} role=${role}`);
      });
    });
    ws.addEventListener('error', (err) => {
      console.error(`[BridgeRoom] Lovense backend connect failed: room=${this.roomId} role=${role}`, err);
      if (role === 'host') this.hostBackend = null;
      else this.guestBackend = null;
    });
  }

  protected runBackendLoops(
    ws: WebSocket,
    role: 'host' | 'guest'
  ): { pingId: ReturnType<typeof setInterval>; writeId: ReturnType<typeof setInterval> } {
    const pingId = setInterval(() => {
      try {
        if (ws.readyState === WebSocket.OPEN) ws.send(PING);
      } catch {
        clearInterval(pingId);
      }
    }, PING_INTERVAL_MS);
    const queue = role === 'host' ? this.hostBackendQueue : this.guestBackendQueue;
    const writeId = setInterval(() => {
      if (queue.length > 0 && ws.readyState === WebSocket.OPEN) {
        const msg = queue.shift();
        if (msg) ws.send(msg);
      }
    }, 50);
    return { pingId, writeId };
  }
}
