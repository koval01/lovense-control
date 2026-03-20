import { BRIDGE_SELF_GET_QR, buildAppMessage } from './protocol';
import { applyRulesAndForwardCommand } from './rules';
import type { BridgeRoomMessagePort } from './room-message-port';

export function handleRoomSelfGetQr(room: BridgeRoomMessagePort, role: 'host' | 'guest'): void {
  const backendRole = room.ownerBackendRole(role);
  const ackId = Math.floor(Date.now() / 1000).toString();
  room.queueToBackend(backendRole, buildAppMessage('basicapi_get_qrcode_ts', { ackId }));
}

export function handleRoomForwardOnly(
  room: BridgeRoomMessagePort,
  role: 'host' | 'guest',
  data: string
): void {
  const other = role === 'host' ? room.guestFrontend : room.hostFrontend;
  if (other) room.sendToWebSocket(other, data);
}

export function handleRoomToyCommandForward(room: BridgeRoomMessagePort, data: string, role: 'host' | 'guest'): void {
  if (!room.hostFrontend || !room.guestFrontend) return;
  const toGuestBackend = role === 'host';
  const targetBackendRole: 'host' | 'guest' =
    toGuestBackend && !room.guestUsesHostBackend ? 'guest' : 'host';
  const backend = targetBackendRole === 'host' ? room.hostBackend : room.guestBackend;
  if (!backend) return;
  const out = applyRulesAndForwardCommand(data, room.rules, toGuestBackend);
  if (out) room.queueToBackend(targetBackendRole, out);
}
