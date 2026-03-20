import type { LovenseWsClientHandlers } from './ws-client-types';
import { clearSingletonIfMatches } from './ws-singleton-tab';

type DisconnectCtx = {
  handlers: LovenseWsClientHandlers;
  clearPing: () => void;
};

export function runLovenseWsDisconnect(
  w: WebSocket | null,
  ctx: DisconnectCtx,
  setWs: (w: WebSocket | null) => void,
  setSocketIoConnected: (v: boolean) => void
): void {
  if (!w) {
    setSocketIoConnected(false);
    ctx.clearPing();
    return;
  }
  try {
    clearSingletonIfMatches(w);
    w.onopen = null;
    w.onmessage = null;
    w.onerror = null;
    w.onclose = null;
    const active = w.readyState === WebSocket.CONNECTING || w.readyState === WebSocket.OPEN;
    if (active) {
      w.close(1000, 'client-disconnect');
    }
    setWs(null);
    setSocketIoConnected(false);
    ctx.clearPing();
    if (active) {
      ctx.handlers.onSocketClose?.();
    }
  } catch {
    setWs(null);
    setSocketIoConnected(false);
    ctx.clearPing();
  }
}
