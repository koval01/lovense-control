import type { LovenseWsConnectOptions } from './ws-client-types';
import type { LovenseWsClientHandlers } from './ws-client-types';
import { forceCloseSingletonTabSocket, setSingletonTabSocket } from './ws-singleton-tab';
import { dispatchLovenseSioDataMessage } from './parse-lovense-sio-payload';
import { runLovenseWsDisconnect } from './lovense-ws-disconnect';
import { attachLovenseWebSocketHandlers } from './attach-lovense-ws-handlers';

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
      setSingletonTabSocket(ws);
    }

    attachLovenseWebSocketHandlers({
      ws,
      handlers: this.handlers,
      onPingInterval: (interval) => {
        this.clearPing();
        this.pingInterval = interval;
      },
      onMessage: (m) => this.handleMessage(m),
      onSocketCleared: () => {
        this.socketIoConnected = false;
        this.clearPing();
        this.ws = null;
      },
    });
  }

  disconnect() {
    runLovenseWsDisconnect(this.ws, { handlers: this.handlers, clearPing: () => this.clearPing() }, (w) => {
      this.ws = w;
    }, (v) => {
      this.socketIoConnected = v;
    });
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

    dispatchLovenseSioDataMessage(message, (ev, payload) => {
      this.handlers.onSocketIoEvent?.(ev, payload);
    });
  }
}
