import { useCallback } from 'react';
import { createBridgeLovenseWsClient } from './create-bridge-lovense-ws-client';
import { BRIDGE_WS_BASE } from './bridge-urls';
import type { BridgeSessionRefs } from './useBridgeSessionRefs';
import type { BridgeSessionStateBag } from './useBridgeSessionState';

export function useSetupBridgeWebSocket(
  refs: BridgeSessionRefs,
  st: BridgeSessionStateBag,
  readBridgeGen: () => number,
  closeSocket: () => void,
  scheduleBridgeReconnect: () => void,
  notificationTitle: string
) {
  return useCallback(
    (ticket: string, isHostRole: boolean) => {
      if (!refs.enabledRef.current) return;
      refs.roleRef.current = isHostRole ? 'host' : 'guest';
      if (!BRIDGE_WS_BASE) {
        st.setStatus('error');
        st.setError('Partner bridge server is not configured.');
        return;
      }
      const fromAutoReconnect = refs.bridgeReconnectSetupRef.current;
      refs.bridgeReconnectSetupRef.current = false;
      const bridgeGenAtSetup = readBridgeGen();
      refs.roomSessionTicketRef.current = ticket;
      const existing = refs.lovenseClientRef.current;
      if (
        existing &&
        existing.isWebSocketActive() &&
        refs.bridgeWsBoundTicketRef.current === ticket &&
        readBridgeGen() === bridgeGenAtSetup
      ) {
        if (fromAutoReconnect && existing.isSocketIoConnected) {
          st.setBridgeSessionRecovery('ok');
          st.setSocketIoConnected(true);
          st.setStatus((prev) => (prev === 'idle' ? 'idle' : 'online'));
        }
        return;
      }
      closeSocket();
      refs.roomSessionTicketRef.current = ticket;
      if (readBridgeGen() !== bridgeGenAtSetup) return;
      if (!fromAutoReconnect) st.setStatus('connecting');
      st.setError(null);
      const myEpoch = (refs.bridgeConnectionEpochRef.current += 1);
      const myClientSerial = (refs.bridgeClientSeqRef.current += 1);
      const wsUrl = `${BRIDGE_WS_BASE}/ws?ticket=${encodeURIComponent(ticket)}`;
      const client = createBridgeLovenseWsClient(
        refs,
        st,
        readBridgeGen,
        scheduleBridgeReconnect,
        notificationTitle,
        myEpoch,
        myClientSerial,
        bridgeGenAtSetup
      );
      refs.lovenseClientRef.current = client;
      refs.bridgeWsBoundTicketRef.current = ticket;
      if (readBridgeGen() !== bridgeGenAtSetup) {
        refs.activeBridgeClientSerialRef.current = -1;
        try {
          client.disconnect();
        } catch {
          /* ignore */
        }
        refs.lovenseClientRef.current = null;
        refs.bridgeWsBoundTicketRef.current = null;
        return;
      }
      refs.activeBridgeClientSerialRef.current = myClientSerial;
      if (refs.lovenseClientRef.current !== client) {
        refs.activeBridgeClientSerialRef.current = -1;
        try {
          client.disconnect();
        } catch {
          /* ignore */
        }
        return;
      }
      client.connect(wsUrl, { singletonInTab: true });
    },
    [refs, readBridgeGen, closeSocket, scheduleBridgeReconnect, notificationTitle]
  );
}
