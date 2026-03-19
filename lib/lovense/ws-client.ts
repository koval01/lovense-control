type SocketIoEventHandler = (event: string, payload: unknown) => void;

/** Optional flags for {@link LovenseWsClient.connect}. */
export type LovenseWsConnectOptions = {
  /**
   * Partner bridge only: at most one active WebSocket per tab. Opening another closes the previous
   * (even if the old client instance was dropped from React refs).
   */
  singletonInTab?: boolean;
};

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

interface LovenseWsClientHandlers {
  onSocketOpen?: () => void;
  onSocketClose?: () => void;
  onSocketError?: (error: Event) => void;
  onSocketIoConnected?: () => void;
  onSocketIoEvent?: SocketIoEventHandler;
}

export class LovenseWsClient {
  private ws: WebSocket | null = null;
  private pingInterval: ReturnType<typeof setInterval> | null = null;
  private socketIoConnected = false;
  private readonly handlers: LovenseWsClientHandlers;

  constructor(handlers: LovenseWsClientHandlers) {
    this.handlers = handlers;
  }

  get isSocketIoConnected(): boolean {
    return this.socketIoConnected;
  }

  /** True while the browser WebSocket is still establishing or fully open (before/after Socket.IO `40`). */
  isWebSocketActive(): boolean {
    if (!this.ws) return false;
    const { readyState } = this.ws;
    return readyState === WebSocket.CONNECTING || readyState === WebSocket.OPEN;
  }

  connect(url: string, options?: LovenseWsConnectOptions) {
    this.disconnect();

    if (options?.singletonInTab) {
      forceCloseSingletonTabSocket();
    }

    const ws = new WebSocket(url);
    this.ws = ws;
    if (options?.singletonInTab) {
      singletonTabWebSocket = ws;
    }

    ws.onopen = () => {
      ws.send('2probe');
      this.pingInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send('2');
        }
      }, 20000);
      this.handlers.onSocketOpen?.();
    };

    ws.onmessage = (event) => {
      const message = event.data.toString();
      if (message === '3probe') {
        ws.send('5');
        return;
      }
      this.handleMessage(message);
    };

    ws.onclose = () => {
      if (singletonTabWebSocket === ws) {
        singletonTabWebSocket = null;
      }
      this.socketIoConnected = false;
      this.clearPing();
      this.ws = null;
      this.handlers.onSocketClose?.();
    };

    ws.onerror = (error) => {
      this.handlers.onSocketError?.(error);
    };
  }

  disconnect() {
    const w = this.ws;
    if (!w) {
      this.socketIoConnected = false;
      this.clearPing();
      return;
    }
    try {
      if (singletonTabWebSocket === w) {
        singletonTabWebSocket = null;
      }
      w.onopen = null;
      w.onmessage = null;
      w.onerror = null;
      w.onclose = null;
      const active = w.readyState === WebSocket.CONNECTING || w.readyState === WebSocket.OPEN;
      if (active) {
        w.close(1000, 'client-disconnect');
      }
      this.ws = null;
      this.socketIoConnected = false;
      this.clearPing();
      if (active) {
        this.handlers.onSocketClose?.();
      }
    } catch {
      this.ws = null;
      this.socketIoConnected = false;
      this.clearPing();
    }
  }

  sendEvent(event: string, payload?: unknown) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN || !this.socketIoConnected) {
      return;
    }
    const data = payload !== undefined ? [event, payload] : [event];
    this.ws.send(`42${JSON.stringify(data)}`);
  }

  private clearPing() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private handleMessage(message: string) {
    if (message === '3' || message === '3probe') return;

    if (message.startsWith('40')) {
      this.socketIoConnected = true;
      this.handlers.onSocketIoConnected?.();
      return;
    }

    if (!message.startsWith('42')) return;

    try {
      const data = JSON.parse(message.substring(2)) as [string, unknown];
      const event = data[0];
      let payload = data[1];
      if (typeof payload === 'string') {
        try {
          payload = JSON.parse(payload);
        } catch {
          // ignore malformed payload and pass through string
        }
      }
      this.handlers.onSocketIoEvent?.(event, payload);
    } catch (error) {
      console.error('Error parsing SIO message', error);
    }
  }
}
