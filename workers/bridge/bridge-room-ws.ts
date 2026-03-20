import { decodeTicket } from './auth';
import {
  buildAppMessage,
  parseAppMessage,
  partnerStatusMsg,
  partnerToyRulesMsg,
  BRIDGE_SELF_APP_STATUS,
  BRIDGE_SELF_DEVICE_INFO,
} from './protocol';
import { buildChatHistoryEvent } from './chat';
import { partnerHasRules } from './rules';
import { BridgeRoomBackend } from './bridge-room-backend';
import { ENGINE_OPEN, WS_MESSAGE_MAX_BYTES } from './room-constants';

export abstract class BridgeRoomWs extends BridgeRoomBackend {
  protected async handleWebSocketUpgrade(request: Request): Promise<Response> {
    if (request.headers.get('Upgrade') !== 'websocket') {
      return new Response('Expected WebSocket upgrade', { status: 426 });
    }
    const url = new URL(request.url);
    const ticket = url.searchParams.get('ticket');
    if (!ticket) return new Response('ticket required', { status: 400 });
    const secret = this.env.JWT_SECRET;
    if (!secret) return new Response('Server error', { status: 500 });
    let roomId: string;
    let role: 'host' | 'guest';
    try {
      const decoded = await decodeTicket(ticket, secret);
      roomId = decoded.roomId;
      role = decoded.role;
    } catch {
      return new Response('Invalid ticket', { status: 401 });
    }
    this.roomId = roomId;
    console.log(`[BridgeRoom] Frontend connected: room=${roomId} role=${role}`);
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    server.accept();
    if (role === 'host') this.hostFrontend = server;
    else this.guestFrontend = server;
    this.cleanupAlarmScheduled = false;
    const otherOnConnect = role === 'host' ? this.guestFrontend : this.hostFrontend;
    if (otherOnConnect) this.sendToWebSocket(otherOnConnect, partnerStatusMsg(true));
    this.replayState(server, role);
    server.send(ENGINE_OPEN);
    server.addEventListener('message', (ev) => {
      const raw = typeof ev.data === 'string' ? ev.data : new TextDecoder().decode(ev.data);
      if (raw.length > WS_MESSAGE_MAX_BYTES) return;
      this.handleFrame(server, raw, role);
    });
    server.addEventListener('close', () => {
      if (role === 'host') this.hostFrontend = null;
      else this.guestFrontend = null;
      const other = role === 'host' ? this.guestFrontend : this.hostFrontend;
      if (other) this.sendToWebSocket(other, partnerStatusMsg(false));
      this.maybeScheduleCleanupAlarm();
      console.log(`[BridgeRoom] Frontend disconnected: room=${this.roomId} role=${role}`);
    });
    return new Response(null, { status: 101, webSocket: client });
  }

  protected replayState(ws: WebSocket, role: 'host' | 'guest'): void {
    const cached = role === 'host' ? this.lastGuestBackendMsg : this.lastHostBackendMsg;
    if (cached) this.sendToWebSocket(ws, cached);
    const ownCached = role === 'host' ? this.lastHostBackendMsg : this.lastGuestBackendMsg;
    if (ownCached) {
      const parsed = parseAppMessage(ownCached);
      if (parsed) {
        const [event, payload] = parsed;
        if (event === 'basicapi_update_device_info_tc' || event === 'basicApi_update_device_info') {
          this.sendToWebSocket(ws, buildAppMessage(BRIDGE_SELF_DEVICE_INFO, payload as Record<string, unknown>));
        } else if (event === 'basicapi_update_app_online_tc' || event === 'basicapi_update_app_status_tc') {
          this.sendToWebSocket(ws, buildAppMessage(BRIDGE_SELF_APP_STATUS, payload as Record<string, unknown>));
        }
      }
    }
    const other = role === 'host' ? this.guestFrontend : this.hostFrontend;
    if (other) this.sendToWebSocket(ws, partnerStatusMsg(true));
    if (other && partnerHasRules(this.rules, role)) {
      this.sendToWebSocket(ws, partnerToyRulesMsg(role === 'host' ? 'guest' : 'host', this.rules));
    }
    if (this.chatBuffer.length > 0) {
      this.sendToWebSocket(ws, buildChatHistoryEvent(this.chatBuffer));
    }
  }

  protected abstract handleFrame(ws: WebSocket, data: string, role: 'host' | 'guest'): void;
}
