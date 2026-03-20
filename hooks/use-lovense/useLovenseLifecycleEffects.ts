import { useEffect } from 'react';
import type { MutableRefObject } from 'react';
import type { AppDispatch } from '@/store';
import { setLovenseEverConnected } from '@/lib/connection-persistence';
import { resetConnectionRuntime, setEnabled, setError, setStatus } from '@/store/slices/connectionSlice';
import type { LovenseWsClient } from '@/lib/lovense/ws-client';
import type { LovenseStatus } from '@/store/slices/connectionSlice';

type Params = {
  dispatch: AppDispatch;
  enabled: boolean;
  initSession: () => Promise<void>;
  initSessionRef: MutableRefObject<() => Promise<void>>;
  status: LovenseStatus;
  sessionStarted: boolean;
  clearQrRotation: () => void;
  requestQr: () => void;
  mountedRef: MutableRefObject<boolean>;
  wsClientRef: MutableRefObject<LovenseWsClient | null>;
  qrRotateIntervalRef: MutableRefObject<ReturnType<typeof setInterval> | null>;
  reconnectTimeoutRef: MutableRefObject<ReturnType<typeof setTimeout> | null>;
  statusRef: MutableRefObject<LovenseStatus>;
};

export function useLovenseLifecycleEffects({
  dispatch,
  enabled,
  initSession,
  initSessionRef,
  status,
  sessionStarted,
  clearQrRotation,
  requestQr,
  mountedRef,
  wsClientRef,
  qrRotateIntervalRef,
  reconnectTimeoutRef,
  statusRef,
}: Params): void {
  useEffect(() => {
    initSessionRef.current = initSession;
  }, [initSession, initSessionRef]);

  useEffect(() => {
    statusRef.current = status;
  }, [status, statusRef]);

  useEffect(() => {
    dispatch(setEnabled(enabled));

    if (!enabled) {
      mountedRef.current = false;
      wsClientRef.current?.disconnect();
      wsClientRef.current = null;
      clearQrRotation();
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      dispatch(resetConnectionRuntime());
      return;
    }

    mountedRef.current = true;
    dispatch(setStatus('initializing'));
    dispatch(setError(null));
    void initSession();

    return () => {
      mountedRef.current = false;
      wsClientRef.current?.disconnect();
      wsClientRef.current = null;
      clearQrRotation();
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
  }, [clearQrRotation, dispatch, enabled, initSession, mountedRef, reconnectTimeoutRef, wsClientRef]);

  useEffect(() => {
    if (sessionStarted) setLovenseEverConnected();
  }, [sessionStarted]);

  useEffect(() => {
    const isSocketIoConnected = wsClientRef.current?.isSocketIoConnected ?? false;
    if (status === 'qr_ready' && !sessionStarted && isSocketIoConnected) {
      if (!qrRotateIntervalRef.current) {
        requestQr();
        qrRotateIntervalRef.current = setInterval(() => {
          if (wsClientRef.current?.isSocketIoConnected && !sessionStarted) {
            requestQr();
          }
        }, 30000);
      }
    } else {
      clearQrRotation();
    }
  }, [status, sessionStarted, clearQrRotation, requestQr, qrRotateIntervalRef, wsClientRef]);
}
