type SocketIoEventHandler = (event: string, payload: unknown) => void;

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

  connect(url: string) {
    this.disconnect();

    const ws = new WebSocket(url);
    this.ws = ws;

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
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.socketIoConnected = false;
    this.clearPing();
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
