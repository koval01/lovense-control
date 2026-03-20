import { useCallback } from 'react';
import { BRIDGE_AVAILABLE, BRIDGE_HTTP_BASE } from './bridge-urls';
import { registerLovenseWithBridge } from './register-session';
import type { BridgeSessionRefs } from './useBridgeSessionRefs';
import type { BridgeSessionStateBag } from './useBridgeSessionState';

export function useCreateRoom(
  refs: BridgeSessionRefs,
  st: BridgeSessionStateBag,
  readBridgeGen: () => number,
  setupWebSocket: (ticket: string, isHostRole: boolean) => void,
  peerConnected: boolean
) {
  return useCallback(async () => {
    if (!BRIDGE_AVAILABLE) {
      st.setStatus('error');
      st.setError('Partner bridge server is not configured.');
      return;
    }
    try {
      if (refs.preflightRoomIdRef.current && refs.preflightPairCodeRef.current) {
        st.setRoomId(refs.preflightRoomIdRef.current);
        st.setPairCode(refs.preflightPairCodeRef.current);
        st.setIsHost(true);
        st.setStatus(peerConnected ? 'online' : 'waiting_partner');
        return;
      }
      const pendingPreflight = refs.preflightSessionPromiseRef.current;
      if (pendingPreflight) {
        try {
          await pendingPreflight;
        } catch {
          /* aborted */
        }
      }
      if (refs.preflightRoomIdRef.current && refs.preflightPairCodeRef.current) {
        st.setRoomId(refs.preflightRoomIdRef.current);
        st.setPairCode(refs.preflightPairCodeRef.current);
        st.setIsHost(true);
        st.setStatus(peerConnected ? 'online' : 'waiting_partner');
        return;
      }
      st.setStatus('connecting');
      st.setError(null);
      const genCreate = readBridgeGen();
      const res = await fetch(`${BRIDGE_HTTP_BASE}/rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hostDisplayName: null }),
      });
      if (readBridgeGen() !== genCreate) return;
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error || `Failed to create room (status ${res.status})`);
      }
      const json = (await res.json()) as { roomId: string; pairCode: string; hostTicket: string };
      if (readBridgeGen() !== genCreate) return;
      st.setRoomId(json.roomId);
      st.setPairCode(json.pairCode);
      st.setIsHost(true);
      st.setStatus('connecting');
      await registerLovenseWithBridge(json.hostTicket);
      if (readBridgeGen() !== genCreate) return;
      setupWebSocket(json.hostTicket, true);
    } catch (e: unknown) {
      st.setStatus('error');
      st.setError(e instanceof Error ? e.message : 'Failed to create room.');
    }
  }, [refs, readBridgeGen, setupWebSocket, peerConnected]);
}
