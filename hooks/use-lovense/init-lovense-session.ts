import type { MutableRefObject } from 'react';
import type { AppDispatch } from '@/store';
import {
  initializeLovenseSession,
  resetReconnectAttempt,
  setError,
  setStatus,
} from '@/store/slices/connectionSlice';
import type { ConnectLovenseWsCtx } from './connect-lovense-ws';
import { connectLovenseWs } from './connect-lovense-ws';

export type InitLovenseSessionCtx = ConnectLovenseWsCtx & {
  retryCountRef: MutableRefObject<number>;
};

export async function runInitLovenseSession(dispatch: AppDispatch, ctx: InitLovenseSessionCtx): Promise<void> {
  const { retryCountRef, mountedRef, scheduleReconnect, ...connectCtx } = ctx;

  try {
    const payload = await dispatch(initializeLovenseSession()).unwrap();
    if (!mountedRef.current) return;

    retryCountRef.current = 0;
    dispatch(resetReconnectAttempt());
    dispatch(setStatus('connecting'));

    connectLovenseWs(payload.wsUrl, { ...connectCtx, mountedRef, scheduleReconnect });
  } catch (error) {
    if (!mountedRef.current) return;
    const message = typeof error === 'string' ? error : 'Failed to initialize session';
    dispatch(setStatus('error'));
    dispatch(setError(message));
    scheduleReconnect();
  }
}
