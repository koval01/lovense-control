import { useCallback } from 'react';
import { PAIR_CODE_LENGTH } from '@/lib/bridge/constants';
import { BRIDGE_AVAILABLE, BRIDGE_HTTP_BASE } from './bridge-urls';
import { registerLovenseWithBridge } from './register-session';
import type { BridgeSessionRefs } from './useBridgeSessionRefs';
import type { BridgeSessionStateBag } from './useBridgeSessionState';

export function useJoinRoom(
  refs: BridgeSessionRefs,
  st: BridgeSessionStateBag,
  readBridgeGen: () => number,
  setupWebSocket: (ticket: string, isHostRole: boolean) => void,
  closeSocket: () => void
) {
  return useCallback(
    async (code: string) => {
      if (!BRIDGE_AVAILABLE) {
        st.setStatus('error');
        st.setError('Partner bridge server is not configured.');
        return;
      }
      const trimmed = code.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
      if (trimmed.length !== PAIR_CODE_LENGTH) {
        st.setError(`Please enter the ${PAIR_CODE_LENGTH}-character code.`);
        return;
      }
      try {
        if (refs.preflightHostTicketRef.current) {
          refs.preflightAbortGenerationRef.current += 1;
          refs.preflightAbortRef.current?.abort();
          refs.preflightSessionPromiseRef.current = null;
          closeSocket();
          refs.preflightRoomIdRef.current = null;
          refs.preflightPairCodeRef.current = null;
          refs.preflightHostTicketRef.current = null;
        }
        st.setStatus('connecting');
        st.setError(null);
        const genJoin = readBridgeGen();
        const res = await fetch(`${BRIDGE_HTTP_BASE}/rooms/join`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pairCode: trimmed, guestDisplayName: null }),
        });
        if (readBridgeGen() !== genJoin) return;
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          const err = body as { error?: string; detail?: string };
          throw new Error(err.detail || err.error || `Failed to join room (status ${res.status})`);
        }
        const json = (await res.json()) as { roomId: string; guestTicket: string };
        if (readBridgeGen() !== genJoin) return;
        await registerLovenseWithBridge(json.guestTicket);
        if (readBridgeGen() !== genJoin) return;
        st.setRoomId(json.roomId);
        st.setPairCode(trimmed);
        st.setIsHost(false);
        setupWebSocket(json.guestTicket, false);
      } catch (e: unknown) {
        st.setStatus('error');
        st.setError(e instanceof Error ? e.message : 'Failed to join room.');
      }
    },
    [refs, readBridgeGen, setupWebSocket, closeSocket]
  );
}
