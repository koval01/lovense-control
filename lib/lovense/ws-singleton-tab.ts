/** Last bridge WS opened with `singletonInTab` — survives orphan clients after Strict Mode / races. */
let singletonTabWebSocket: WebSocket | null = null;

function forceCloseSingletonTabSocket(): void {
  if (!singletonTabWebSocket) return;
  try {
    const w = singletonTabWebSocket;
    singletonTabWebSocket = null;
    w.onopen = null;
    w.onmessage = null;
    w.onerror = null;
    w.onclose = null;
    if (w.readyState === WebSocket.CONNECTING || w.readyState === WebSocket.OPEN) {
      w.close(1000, 'replaced');
    }
  } catch {
    singletonTabWebSocket = null;
  }
}

/**
 * Force-close the partner bridge WebSocket for this tab (see `singletonInTab` on {@link LovenseWsClient.connect}).
 * Use when leaving partner mode so no connection stays open without a hook ref.
 */
export function closeBridgeWebSocketInTab(): void {
  forceCloseSingletonTabSocket();
}

export function setSingletonTabSocket(ws: WebSocket | null): void {
  singletonTabWebSocket = ws;
}

export function clearSingletonIfMatches(ws: WebSocket): void {
  if (singletonTabWebSocket === ws) {
    singletonTabWebSocket = null;
  }
}

export { forceCloseSingletonTabSocket };
