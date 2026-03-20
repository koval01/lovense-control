import type { MutableRefObject } from 'react';
import type { AppDispatch, AppStore } from '@/store';
import { setError, setStatus, type LovenseStatus } from '@/store/slices/connectionSlice';
import { LovenseWsClient } from '@/lib/lovense/ws-client';
import { createLovenseSocketIoHandler } from './lovense-socket-io-handler';

export type ConnectLovenseWsCtx = {
  mountedRef: MutableRefObject<boolean>;
  dispatch: AppDispatch;
  store: AppStore;
  clearQrRotation: () => void;
  statusRef: MutableRefObject<LovenseStatus>;
  scheduleReconnect: () => void;
  reconnectTimeoutRef: MutableRefObject<ReturnType<typeof setTimeout> | null>;
  wsClientRef: MutableRefObject<LovenseWsClient | null>;
};

export function connectLovenseWs(wsUrl: string, ctx: ConnectLovenseWsCtx): void {
  const {
    mountedRef,
    dispatch,
    store,
    clearQrRotation,
    statusRef,
    scheduleReconnect,
    reconnectTimeoutRef,
    wsClientRef,
  } = ctx;

  const onSocketIoEvent = createLovenseSocketIoHandler({
    dispatch,
    store,
    clearQrRotation,
    statusRef,
  });

  const client = new LovenseWsClient({
    onSocketClose: () => {
      if (!mountedRef.current) return;
      dispatch(setStatus('error'));
      dispatch(setError('Connection lost. Attempting to reconnect...'));
      scheduleReconnect();
    },
    onSocketError: (wsError) => {
      console.error('WS Error', wsError);
      dispatch(setError('WebSocket error'));
      if (!reconnectTimeoutRef.current) {
        scheduleReconnect();
      }
    },
    onSocketIoEvent,
  });

  wsClientRef.current = client;
  client.connect(wsUrl);
}
