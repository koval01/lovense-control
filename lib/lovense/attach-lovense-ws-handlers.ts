import type { LovenseWsClientHandlers } from './ws-client-types';
import { clearSingletonIfMatches } from './ws-singleton-tab';

type AttachParams = {
  ws: WebSocket;
  handlers: LovenseWsClientHandlers;
  onPingInterval: (interval: ReturnType<typeof setInterval> | null) => void;
  onMessage: (raw: string) => void;
  onSocketCleared: () => void;
};

export function attachLovenseWebSocketHandlers({
  ws,
  handlers,
  onPingInterval,
  onMessage,
  onSocketCleared,
}: AttachParams): void {
  ws.onopen = () => {
    ws.send('2probe');
    onPingInterval(
      setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send('2');
        }
      }, 20000)
    );
    handlers.onSocketOpen?.();
  };

  ws.onmessage = (event) => {
    const message = event.data.toString();
    if (message === '3probe') {
      ws.send('5');
      return;
    }
    onMessage(message);
  };

  ws.onclose = () => {
    clearSingletonIfMatches(ws);
    onSocketCleared();
    handlers.onSocketClose?.();
  };

  ws.onerror = (error) => {
    handlers.onSocketError?.(error);
  };
}
