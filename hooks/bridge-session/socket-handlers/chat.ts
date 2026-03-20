import { playNotificationSound, startTitleBlink } from '@/lib/notification-utils';
import type { BridgeChatMessage } from '../types';
import { base64ToBlob } from '../encoding';
import type { BridgeSocketPayload, SocketHandlerDeps } from '../socket-handler-deps';

export function handleChatSocketEvents(
  event: string,
  payload: BridgeSocketPayload,
  d: SocketHandlerDeps
): void {
  if (event === 'bridge_chat_message' && payload?.text != null && typeof payload?.ts === 'number') {
    const fromSelf = payload.role === d.roleRef.current;
    const msg: BridgeChatMessage = {
      id: `${payload.ts}-${payload.role}-${Date.now()}`,
      kind: 'text',
      text: payload.text,
      ts: payload.ts,
      fromSelf,
    };
    d.setChatMessages((prev) => [...prev, msg]);
    if (!fromSelf) {
      playNotificationSound();
      startTitleBlink(d.notificationTitle);
    }
  }
  if (event === 'bridge_chat_history' && Array.isArray(payload?.messages)) {
    const myRole = d.roleRef.current;
    const list: BridgeChatMessage[] = payload.messages.map(
      (m: { text: string; ts: number; role: string }, i: number) => ({
        id: `hist-${m.ts}-${m.role}-${i}`,
        kind: 'text' as const,
        text: m.text,
        ts: m.ts,
        fromSelf: m.role === myRole,
      })
    );
    d.setChatMessages(list);
  }
  if (
    event === 'bridge_chat_voice' &&
    typeof payload?.data === 'string' &&
    typeof payload?.mime === 'string' &&
    typeof payload?.ts === 'number'
  ) {
    const fromSelf = payload.role === d.roleRef.current;
    try {
      const blob = base64ToBlob(payload.data, payload.mime);
      const url = URL.createObjectURL(blob);
      d.audioObjectUrlsRef.current.push(url);
      const msg: BridgeChatMessage = {
        id: payload.id || `${payload.ts}-${payload.role}-${Date.now()}`,
        kind: 'audio',
        ts: payload.ts,
        fromSelf,
        mime: payload.mime,
        audioUrl: url,
        durationMs: typeof payload.durationMs === 'number' ? payload.durationMs : undefined,
      };
      d.setChatMessages((prev) => [...prev, msg]);
      if (!fromSelf) {
        playNotificationSound();
        startTitleBlink(d.notificationTitle);
      }
    } catch {
      /* malformed audio */
    }
  }
  if (event === 'bridge_chat_typing' && typeof payload?.typing === 'boolean') {
    d.setPartnerTyping(payload.typing);
    if (d.typingTimeoutRef.current) clearTimeout(d.typingTimeoutRef.current);
    if (payload.typing) {
      d.typingTimeoutRef.current = setTimeout(() => d.setPartnerTyping(false), 3000);
    }
  }
}
