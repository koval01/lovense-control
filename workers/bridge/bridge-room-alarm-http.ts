import { BridgeRoomState } from './bridge-room-state';

export abstract class BridgeRoomAlarmHttp extends BridgeRoomState {
  async alarm(): Promise<void> {
    if (this.hostFrontend || this.guestFrontend) return;
    try {
      const registryId = this.env.BRIDGE_REGISTRY.idFromName('bridge-registry');
      const stub = this.env.BRIDGE_REGISTRY.get(registryId);
      await stub.fetch(
        `https://internal/internal/remove-room?roomId=${encodeURIComponent(this.roomId)}`,
        { method: 'POST' }
      );
      console.log(`[BridgeRoom] Room cleaned up: roomId=${this.roomId}`);
    } catch (err) {
      console.error(`[BridgeRoom] Cleanup failed: roomId=${this.roomId}`, err);
    }
  }

  protected maybeScheduleCleanupAlarm(): void {
    if (this.hostFrontend || this.guestFrontend) return;
    if (this.cleanupAlarmScheduled) return;
    this.cleanupAlarmScheduled = true;
    this.ctx.storage.setAlarm(Date.now() + this.ROOM_IDLE_TIMEOUT_MS);
  }

  private static normalizePath(path: string): string {
    if (path.startsWith('/bridge')) {
      const rest = path.slice(7) || '/';
      return rest.startsWith('/') ? rest : `/${rest}`;
    }
    return path;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = BridgeRoomAlarmHttp.normalizePath(url.pathname);
    if (
      request.method === 'POST' &&
      (path === '/internal/register' || path === '/register-session' || path === '/getSocketUrl')
    ) {
      return this.handleRegister(request);
    }
    if (request.method === 'GET' && path === '/internal/ready') {
      return Response.json({
        hostReady: this.hostSessionReady,
        guestReady: this.guestSessionReady,
      });
    }
    if (request.method === 'GET' && (path === '/internal/ws' || path === '/ws')) {
      return this.handleWebSocketUpgrade(request);
    }
    return new Response('Not Found', { status: 404 });
  }

  protected abstract handleRegister(request: Request): Promise<Response>;
  protected abstract handleWebSocketUpgrade(request: Request): Promise<Response>;
}
