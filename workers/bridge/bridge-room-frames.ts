import { dispatchRoomAppMessage } from './room-app-message-dispatch';
import type { BridgeRoomMessagePort } from './room-message-port';
import { BridgeRoomWs } from './bridge-room-ws';
import {
  PING,
  PONG,
  PROBE_REQUEST,
  PROBE_RESPONSE,
  TOY_ENABLE_MIN_INTERVAL_MS,
  UPGRADE_ACK,
} from './room-constants';

export class BridgeRoom extends BridgeRoomWs {
  protected sendToWebSocket(ws: WebSocket | null, msg: string | null): void {
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    if (msg) ws.send(msg);
  }

  protected canApplyEnabledToyChanges(
    role: 'host' | 'guest',
    prev: Set<string> | null,
    next: Set<string>
  ): boolean {
    const prevS = prev ?? new Set<string>();
    const now = Date.now();
    const map = role === 'host' ? this.hostToyEnableToggleAtMs : this.guestToyEnableToggleAtMs;
    const all = new Set<string>([...prevS, ...next]);
    for (const id of all) {
      if (prevS.has(id) === next.has(id)) continue;
      const last = map.get(id) ?? 0;
      if (now - last < TOY_ENABLE_MIN_INTERVAL_MS) return false;
    }
    return true;
  }

  protected recordEnabledToyToggles(
    role: 'host' | 'guest',
    prev: Set<string> | null,
    next: Set<string>
  ): void {
    const now = Date.now();
    const map = role === 'host' ? this.hostToyEnableToggleAtMs : this.guestToyEnableToggleAtMs;
    const prevS = prev ?? new Set<string>();
    for (const id of new Set<string>([...prevS, ...next])) {
      if (prevS.has(id) !== next.has(id)) map.set(id, now);
    }
  }

  protected handleFrame(ws: WebSocket, data: string, role: 'host' | 'guest'): void {
    if (data === PROBE_REQUEST) ws.send(PROBE_RESPONSE);
    else if (data === '5') ws.send(UPGRADE_ACK);
    else if (data === UPGRADE_ACK) ws.send(UPGRADE_ACK);
    else if (data === PING) ws.send(PONG);
    else this.handleAppMessage(ws, data, role);
  }

  private handleAppMessage(ws: WebSocket, data: string, role: 'host' | 'guest'): void {
    dispatchRoomAppMessage(this as unknown as BridgeRoomMessagePort, ws, data, role);
  }
}
