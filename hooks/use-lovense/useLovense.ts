import { useRef, useCallback } from 'react';
import type { Toy } from '@/lib/lovense-domain';
import { LovenseWsClient } from '@/lib/lovense/ws-client';
import { useAppDispatch, useAppSelector, useAppStore } from '@/store/hooks';
import { incrementReconnectAttempt, setStatus } from '@/store/slices/connectionSlice';
import type { LovenseStatus } from '@/store/slices/connectionSlice';
import { useLovenseLifecycleEffects } from './useLovenseLifecycleEffects';
import { runInitLovenseSession } from './init-lovense-session';
import { sendLovenseToyCommand } from './send-lovense-toy-command';

export type { Toy };

/**
 * Hook for Lovense Connect integration. Manages WebSocket connection to Lovense API,
 * session/QR flow, toy discovery, and command dispatch.
 */
export function useLovense(options?: { enabled?: boolean }) {
  const enabled = options?.enabled ?? true;
  const dispatch = useAppDispatch();
  const store = useAppStore();
  const { status, qrUrl, qrCode, toys, error, sessionStarted } = useAppSelector((state) => state.connection);

  const wsClientRef = useRef<LovenseWsClient | null>(null);
  const mountedRef = useRef(true);
  const qrRotateIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryCountRef = useRef(0);
  const statusRef = useRef<LovenseStatus>(enabled ? 'initializing' : 'idle');
  const initSessionRef = useRef<() => Promise<void>>(async () => {});

  const requestQr = useCallback(() => {
    wsClientRef.current?.sendEvent('basicapi_get_qrcode_ts', { ackId: String(Math.floor(Date.now() / 1000)) });
  }, []);

  const clearQrRotation = useCallback(() => {
    if (qrRotateIntervalRef.current) {
      clearInterval(qrRotateIntervalRef.current);
      qrRotateIntervalRef.current = null;
    }
  }, []);

  const scheduleReconnect = useCallback(() => {
    if (reconnectTimeoutRef.current || !mountedRef.current) return;

    const attempt = retryCountRef.current + 1;
    retryCountRef.current = attempt;
    dispatch(incrementReconnectAttempt());

    const delay = Math.min(30000, 2000 * attempt);
    reconnectTimeoutRef.current = setTimeout(() => {
      reconnectTimeoutRef.current = null;
      if (!mountedRef.current) return;
      dispatch(setStatus('connecting'));
      void initSessionRef.current();
    }, delay);
  }, [dispatch]);

  const initSession = useCallback(async () => {
    await runInitLovenseSession(dispatch, {
      mountedRef,
      dispatch,
      store,
      clearQrRotation,
      statusRef,
      scheduleReconnect,
      reconnectTimeoutRef,
      wsClientRef,
      retryCountRef,
    });
  }, [clearQrRotation, dispatch, scheduleReconnect, store]);

  useLovenseLifecycleEffects({
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
  });

  const sendCommand = useCallback(
    (toyId: string, action: string, timeSec: number = 0, loopRunningSec?: number, loopPauseSec?: number) => {
      sendLovenseToyCommand(wsClientRef, toyId, action, timeSec, loopRunningSec, loopPauseSec);
    },
    []
  );

  return { status, qrUrl, qrCode, toys, error, sendCommand };
}
