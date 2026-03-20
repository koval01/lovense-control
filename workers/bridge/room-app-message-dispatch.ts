import { BRIDGE_SELF_GET_QR, parseAppMessage } from './protocol';
import { FORWARD_ONLY_EVENTS } from './room-forward-events';
import {
  handleRoomChatText,
  handleRoomChatVoice,
  isChatTextEvent,
  isChatVoiceEvent,
} from './room-app-message-chat';
import { handleRoomForwardOnly, handleRoomSelfGetQr, handleRoomToyCommandForward } from './room-app-message-forward';
import { handleRoomSetToyRules, isSetToyRulesEvent } from './room-app-message-rules';
import type { BridgeRoomMessagePort } from './room-message-port';

export function dispatchRoomAppMessage(
  room: BridgeRoomMessagePort,
  ws: WebSocket,
  data: string,
  role: 'host' | 'guest'
): void {
  const parsed = parseAppMessage(data);
  if (!parsed) return;
  const [event, payloadRaw] = parsed;

  if (isSetToyRulesEvent(event)) {
    handleRoomSetToyRules(room, role, payloadRaw);
  } else if (event === BRIDGE_SELF_GET_QR) {
    handleRoomSelfGetQr(room, role);
  } else if (FORWARD_ONLY_EVENTS.has(event)) {
    handleRoomForwardOnly(room, role, data);
  } else if (isChatTextEvent(event)) {
    handleRoomChatText(room, ws, role, payloadRaw);
  } else if (isChatVoiceEvent(event)) {
    handleRoomChatVoice(room, ws, role, payloadRaw);
  } else {
    handleRoomToyCommandForward(room, data, role);
  }
}
