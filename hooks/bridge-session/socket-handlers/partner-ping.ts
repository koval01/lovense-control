import type { BridgeSocketPayload, SocketHandlerDeps } from '../socket-handler-deps';

export function handlePartnerAndPingSocketEvents(
  event: string,
  payload: BridgeSocketPayload,
  d: SocketHandlerDeps
): void {
  if (event === 'bridge_partner_status' && typeof payload?.connected === 'boolean') {
    d.setPeerConnected(payload.connected);
    if (payload.connected) {
      d.setPartnerEverConnected(true);
      d.setStatus((prev) => (prev === 'connecting' ? 'online' : prev));
    } else {
      d.setStatus('waiting_partner');
    }
  }
  if (event === 'bridge_partner_toy_rules') {
    d.setStatus((prev) => (prev === 'connecting' ? 'online' : prev));
    if (Array.isArray(payload?.enabledToyIds)) d.setPartnerEnabledToyIds(payload.enabledToyIds);
    if (payload?.limits && typeof payload.limits === 'object') d.setPartnerLimits(payload.limits);
  }
  if (event === 'bridge_pong' && typeof payload?.ts === 'number') {
    d.setRttMs(Math.round(Date.now() - payload.ts));
  }
  if (event === 'bridge_ping' && typeof payload?.ts === 'number') {
    d.setPeerConnected(true);
    d.setPartnerEverConnected(true);
    d.client.sendEvent('bridge_pong', { id: payload.id, ts: payload.ts });
  }
}
