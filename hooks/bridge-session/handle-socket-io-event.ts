import type { BridgeSocketPayload, SocketHandlerDeps } from './socket-handler-deps';
import { handleDeviceSocketEvents } from './socket-handlers/devices';
import { handleSelfSessionSocketEvents } from './socket-handlers/self-session';
import { handlePartnerAndPingSocketEvents } from './socket-handlers/partner-ping';
import { handleChatSocketEvents } from './socket-handlers/chat';

export function handleBridgeSocketIoEvent(
  event: string,
  payloadData: unknown,
  d: SocketHandlerDeps
): void {
  const payload = payloadData as BridgeSocketPayload;
  d.setStatus((prev) => (prev === 'connecting' ? 'online' : prev));
  handleDeviceSocketEvents(event, payload, d);
  handleSelfSessionSocketEvents(event, payload, d);
  handlePartnerAndPingSocketEvents(event, payload, d);
  handleChatSocketEvents(event, payload, d);
}
