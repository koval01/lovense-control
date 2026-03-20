import { useCallback } from 'react';
import type { AppStore } from '@/store';
import { BridgeRegisterError } from './types';
import { registerLovenseWithBridge } from './register-session';
import type { BridgeSessionRefs } from './useBridgeSessionRefs';
import type { BridgeSessionStateBag } from './useBridgeSessionState';

export function useScheduleBridgeReconnect(
  reduxStore: AppStore,
  refs: BridgeSessionRefs,
  st: BridgeSessionStateBag
) {
  return useCallback(() => {
    const reduxGenAtSchedule = reduxStore.getState().connection.bridgeSocketGeneration;
    const loopId = (refs.reconnectGenRef.current += 1);
    const stillNeedsBridgeWs = () =>
      refs.roomIdRef.current != null || refs.preflightHostTicketRef.current != null;
    void (async () => {
      let delay = 1000;
      const maxDelay = 30_000;
      while (
        loopId === refs.reconnectGenRef.current &&
        !refs.intentionalDisconnectRef.current &&
        stillNeedsBridgeWs() &&
        reduxStore.getState().connection.bridgeSocketGeneration === reduxGenAtSchedule
      ) {
        const ticket = refs.roomSessionTicketRef.current;
        if (!ticket) {
          if (loopId === refs.reconnectGenRef.current) {
            st.setBridgeSessionRecovery('failed');
            st.setStatus('error');
            st.setError('No session ticket. Leave the room and join again.');
          }
          break;
        }
        try {
          await registerLovenseWithBridge(ticket);
          if (
            loopId !== refs.reconnectGenRef.current ||
            refs.intentionalDisconnectRef.current ||
            !stillNeedsBridgeWs() ||
            reduxStore.getState().connection.bridgeSocketGeneration !== reduxGenAtSchedule
          ) {
            return;
          }
          refs.bridgeReconnectSetupRef.current = true;
          refs.setupWebSocketRef.current(ticket, refs.isHostRef.current);
          return;
        } catch (e) {
          if (loopId !== refs.reconnectGenRef.current) return;
          const status = e instanceof BridgeRegisterError ? e.status : 0;
          if (status === 401) {
            st.setBridgeSessionRecovery('failed');
            st.setStatus('error');
            st.setError(e instanceof Error ? e.message : 'Session expired. Leave the room and sign in again.');
            return;
          }
          await new Promise((r) => setTimeout(r, delay));
          delay = Math.min(delay * 2, maxDelay);
        }
      }
    })();
  }, [reduxStore, refs]);
}
