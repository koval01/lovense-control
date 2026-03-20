import {
  BRIDGE_CHAT_MESSAGE,
  BRIDGE_CHAT_VOICE,
  buildAppMessage,
} from './protocol';
import {
  buildChatMessageEvent,
  CHAT_BUFFER_SIZE,
  CHAT_FLOOD_INTERVAL_SEC,
  validateChatText,
  VOICE_MAX_BASE64_LEN,
  VOICE_MAX_DURATION_MS,
} from './chat';
import type { BridgeRoomMessagePort } from './room-message-port';

export function handleRoomChatText(
  room: BridgeRoomMessagePort,
  ws: WebSocket,
  role: 'host' | 'guest',
  payloadRaw: unknown
): void {
  const payload = payloadRaw as { text?: string } | null;
  const text = (payload?.text ?? '').toString().trim();
  if (!text) return;
  const now = Date.now() / 1000;
  const lastTs = role === 'host' ? room.lastHostChatTs : room.lastGuestChatTs;
  if (now - lastTs < CHAT_FLOOD_INTERVAL_SEC) return;
  const [ok] = validateChatText(text);
  if (!ok) return;
  if (role === 'host') room.lastHostChatTs = now;
  else room.lastGuestChatTs = now;
  const ts = Math.floor(now * 1000);
  room.chatBuffer.push({ text, ts, role });
  if (room.chatBuffer.length > CHAT_BUFFER_SIZE) room.chatBuffer.shift();
  const out = buildChatMessageEvent(text, ts, role);
  room.sendToWebSocket(ws, out);
  const other = role === 'host' ? room.guestFrontend : room.hostFrontend;
  if (other) room.sendToWebSocket(other, out);
}

export function handleRoomChatVoice(
  room: BridgeRoomMessagePort,
  ws: WebSocket,
  role: 'host' | 'guest',
  payloadRaw: unknown
): void {
  const payload = payloadRaw as {
    id?: string;
    durationMs?: number;
    mime?: string;
    data?: string;
  } | null;
  if (!payload?.id || !payload?.mime || !payload?.data) return;
  if (payload.durationMs != null && payload.durationMs > VOICE_MAX_DURATION_MS) return;
  if (new TextEncoder().encode(payload.data).length > VOICE_MAX_BASE64_LEN) return;
  const now = Date.now() / 1000;
  const lastTs = role === 'host' ? room.lastHostChatTs : room.lastGuestChatTs;
  if (now - lastTs < CHAT_FLOOD_INTERVAL_SEC) return;
  if (role === 'host') room.lastHostChatTs = now;
  else room.lastGuestChatTs = now;
  const ts = Math.floor(now * 1000);
  const outPayload: Record<string, unknown> = {
    id: payload.id,
    ts,
    mime: payload.mime,
    data: payload.data,
    role,
  };
  if (payload.durationMs != null) outPayload.durationMs = payload.durationMs;
  const out = buildAppMessage(BRIDGE_CHAT_VOICE, outPayload);
  room.sendToWebSocket(ws, out);
  const other = role === 'host' ? room.guestFrontend : room.hostFrontend;
  if (other) room.sendToWebSocket(other, out);
}

export function isChatTextEvent(event: string): boolean {
  return event === BRIDGE_CHAT_MESSAGE;
}

export function isChatVoiceEvent(event: string): boolean {
  return event === BRIDGE_CHAT_VOICE;
}
