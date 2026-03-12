import { useEffect, useRef, useCallback } from 'react';
import type { Toy } from '@/lib/lovense-domain';
import { LovenseWsClient } from '@/lib/lovense/ws-client';
import { useAppDispatch, useAppSelector, useAppStore } from '@/store/hooks';
import {
  incrementReconnectAttempt,
  initializeLovenseSession,
  resetConnectionRuntime,
  resetReconnectAttempt,
  setEnabled,
  setError,
  setQrUrl,
  setSessionStarted,
  setStatus,
  setToys,
  type LovenseStatus,
} from '@/store/slices/connectionSlice';

export type { Toy };

/** Raw toy shape from Lovense API device list. */
interface RawToy {
  id: string;
  name?: string;
  toyType?: string;
  connected?: boolean;
  battery?: number;
  shortFunctionNames?: string[];
  fullFunctionNames?: string[];
}

function normalizeSupportedFunctions(rawToy: RawToy): string[] {
  const full = Array.isArray(rawToy.fullFunctionNames) ? rawToy.fullFunctionNames : [];
  const short = Array.isArray(rawToy.shortFunctionNames) ? rawToy.shortFunctionNames : [];
  const shortToFull: Record<string, string> = {
    v: 'Vibrate',
    v1: 'Vibrate1',
    v2: 'Vibrate2',
    r: 'Rotate',
    p: 'Pump',
    t: 'Thrusting',
    f: 'Fingering',
    s: 'Suction',
    d: 'Depth',
    st: 'Stroke',
    o: 'Oscillate',
  };

  const merged = [...full, ...short.map((token) => shortToFull[token.toLowerCase()] || token)];
  return Array.from(
    new Set(
      merged
        .map((name) => name.trim())
        .filter((name) => Boolean(name))
    )
  );
}

/**
 * Hook for Lovense Connect integration. Manages WebSocket connection to Lovense API,
 * session/QR flow, toy discovery, and command dispatch.
 *
 * @returns status, qrUrl, toys, error, sendCommand
 */
export function useLovense(options?: { enabled?: boolean }) {
  const enabled = options?.enabled ?? true;
  const dispatch = useAppDispatch();
  const store = useAppStore();
  const { status, qrUrl, toys, error, sessionStarted } = useAppSelector((state) => state.connection);

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
    try {
      const payload = await dispatch(initializeLovenseSession()).unwrap();
      if (!mountedRef.current) return;

      retryCountRef.current = 0;
      dispatch(resetReconnectAttempt());
      dispatch(setStatus('connecting'));

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
        onSocketIoEvent: (event, payloadData) => {
          const payload = payloadData as { status?: number; toyList?: RawToy[]; data?: { qrcodeUrl?: string } };

          if (event === 'basicapi_update_app_online_tc' || event === 'basicapi_update_app_status_tc') {
            const isOnline = payload?.status === 1;
            if (isOnline) {
              dispatch(setSessionStarted(true));
              clearQrRotation();
              dispatch(setStatus('online'));
              dispatch(setQrUrl(null));
            } else {
              if (statusRef.current === 'online') return;
              dispatch(setSessionStarted(false));
              dispatch(setStatus('qr_ready'));
            }
            return;
          }

          if (event === 'basicapi_update_device_info_tc') {
            const toyList = payload?.toyList || [];
            const previousToys = store.getState().connection.toys;
            const nextToys = { ...previousToys };
            const currentIds = new Set<string>();

            toyList.forEach((toy) => {
              currentIds.add(toy.id);
              if (toy.connected) {
                const supportedFunctions = normalizeSupportedFunctions(toy);
                nextToys[toy.id] = {
                  id: toy.id,
                  name: toy.name || 'Unknown',
                  connected: true,
                  battery: toy.battery ?? 0,
                  toyType: toy.toyType || toy.name,
                  supportedFunctions,
                };
              } else {
                delete nextToys[toy.id];
              }
            });

            Object.keys(nextToys).forEach((id) => {
              if (!currentIds.has(id)) delete nextToys[id];
            });

            dispatch(setToys(nextToys));
            return;
          }

          if (event === 'basicapi_get_qrcode_tc') {
            const qrCodeUrl = payload?.data?.qrcodeUrl;
            if (qrCodeUrl && statusRef.current !== 'online') {
              dispatch(setQrUrl(qrCodeUrl));
              dispatch(setStatus('qr_ready'));
            }
          }
        },
      });

      wsClientRef.current = client;
      client.connect(payload.wsUrl);
    } catch (error) {
      if (!mountedRef.current) return;
      const message = typeof error === 'string' ? error : 'Failed to initialize session';
      dispatch(setStatus('error'));
      dispatch(setError(message));
      scheduleReconnect();
    }
  }, [clearQrRotation, dispatch, scheduleReconnect, store]);

  useEffect(() => {
    initSessionRef.current = initSession;
  }, [initSession]);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

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
  }, [clearQrRotation, dispatch, enabled, initSession]);

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
  }, [status, sessionStarted, clearQrRotation, requestQr]);

  const sendCommand = useCallback(
    (toyId: string, action: string, timeSec: number = 0, loopRunningSec?: number, loopPauseSec?: number) => {
      const command: Record<string, unknown> = {
        command: 'Function',
        action,
        timeSec,
        apiVer: 1,
        toy: toyId,
      };

      if (action !== 'Stop') {
        command.stopPrevious = 0;
      }

      if (loopRunningSec !== undefined && loopPauseSec !== undefined) {
        command.loopRunningSec = loopRunningSec;
        command.loopPauseSec = loopPauseSec;
      }

      wsClientRef.current?.sendEvent('basicapi_send_toy_command_ts', command);
    },
    []
  );

  return { status, qrUrl, toys, error, sendCommand };
}
