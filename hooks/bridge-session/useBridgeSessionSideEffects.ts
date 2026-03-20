import { useEffect } from 'react';
import {
  stopNotificationTitleBlink,
  subscribeTabVisible,
} from '@/lib/notification-utils';
import { BRIDGE_AVAILABLE } from './bridge-urls';
import type { BridgeSessionRefs } from './useBridgeSessionRefs';
import type { BridgeSessionStateBag } from './useBridgeSessionState';

export function useBridgeSessionSideEffects(
  enabled: boolean,
  refs: BridgeSessionRefs,
  st: BridgeSessionStateBag,
  closeSocket: () => void,
  resetState: () => void,
  roomId: string | null,
  isHost: boolean
) {
  useEffect(() => {
    refs.enabledRef.current = enabled;
  }, [enabled, refs]);

  useEffect(() => {
    refs.roomIdRef.current = roomId;
  }, [roomId, refs]);

  useEffect(() => {
    refs.isHostRef.current = isHost;
  }, [isHost, refs]);

  useEffect(() => {
    if (!enabled) {
      refs.intentionalDisconnectRef.current = true;
      closeSocket();
      resetState();
      refs.intentionalDisconnectRef.current = false;
      return;
    }
    if (!BRIDGE_AVAILABLE) {
      st.setStatus('error');
      st.setError('Partner bridge server is not configured.');
    }
    return () => {
      refs.intentionalDisconnectRef.current = true;
      closeSocket();
      refs.intentionalDisconnectRef.current = false;
    };
  }, [enabled, closeSocket, resetState, refs]);

  useEffect(() => {
    const cleanup = subscribeTabVisible();
    return () => {
      cleanup();
      stopNotificationTitleBlink();
    };
  }, []);

}

export function useBridgePreflightEffects(
  enabled: boolean,
  roomId: string | null,
  refs: BridgeSessionRefs,
  startPreflightSession: () => Promise<void>
) {
  useEffect(() => {
    return () => {
      refs.preflightAbortGenerationRef.current += 1;
      refs.preflightAbortRef.current?.abort();
    };
  }, [enabled, roomId, startPreflightSession, refs]);

  useEffect(() => {
    if (!enabled || roomId !== null) return;
    if (!BRIDGE_AVAILABLE) return;
    if (refs.preflightHostTicketRef.current) return;
    void startPreflightSession();
  }, [enabled, roomId, startPreflightSession, refs]);
}
