export type SocketIoEventHandler = (event: string, payload: unknown) => void;

/** Optional flags for {@link LovenseWsClient.connect}. */
export type LovenseWsConnectOptions = {
  /**
   * Partner bridge only: at most one active WebSocket per tab. Opening another closes the previous
   * (even if the old client instance was dropped from React refs).
   */
  singletonInTab?: boolean;
};

export interface LovenseWsClientHandlers {
  onSocketOpen?: () => void;
  onSocketClose?: () => void;
  onSocketError?: (error: Event) => void;
  onSocketIoConnected?: () => void;
  onSocketIoEvent?: SocketIoEventHandler;
}
