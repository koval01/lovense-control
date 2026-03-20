import { useEffect } from 'react';
import type { BridgeSessionRefs } from './useBridgeSessionRefs';

export function useBridgePingAndQrEffects(
  refs: BridgeSessionRefs,
  peerConnected: boolean,
  socketIoConnected: boolean,
  selfSessionReady: boolean,
  roomId: string | null
) {
  useEffect(() => {
    if (!peerConnected || !socketIoConnected) return;
    const client = refs.lovenseClientRef.current;
    if (!client?.isSocketIoConnected) return;
    const sendPing = () => {
      refs.lovenseClientRef.current?.sendEvent('bridge_ping', { id: crypto.randomUUID(), ts: Date.now() });
    };
    sendPing();
    const id = setInterval(sendPing, 4000);
    refs.pingIntervalRef.current = id;
    return () => {
      clearInterval(id);
      refs.pingIntervalRef.current = null;
    };
  }, [peerConnected, socketIoConnected, refs]);

  useEffect(() => {
    if (!socketIoConnected || selfSessionReady || roomId !== null) return;
    const client = refs.lovenseClientRef.current;
    if (!client?.isSocketIoConnected) return;
    const requestQr = () => {
      client.sendEvent('bridge_self_get_qr', { ackId: String(Math.floor(Date.now() / 1000)) });
    };
    requestQr();
    const id = setInterval(requestQr, 30000);
    return () => clearInterval(id);
  }, [socketIoConnected, selfSessionReady, roomId, refs]);
}
