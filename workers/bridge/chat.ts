/**
 * Bridge chat: message validation, buffer size, event builders.
 * Ported from bridge/chat.py
 */

import { BRIDGE_CHAT_MESSAGE, buildAppMessage } from './protocol';

export const CHAT_MAX_LENGTH = 1000;
export const CHAT_BUFFER_SIZE = 10;
export const CHAT_EMOJI_MAX = 20;
export const CHAT_FLOOD_INTERVAL_SEC = 2.0;
export const VOICE_MAX_DURATION_MS = 60_000;
export const VOICE_MAX_BASE64_LEN = 200 * 1024;

const CHAT_DISALLOWED_REGEX = /[\x00-\x09\x0b-\x1f\x7f-\x9f]/u;
const EMOJI_REGEX =
  /[\u2600-\u26FF\u2700-\u27BF\uFE00-\uFE0F\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{1F1E0}-\u{1F1FF}]/gu;

function countEmojis(text: string): number {
  const m = text.match(EMOJI_REGEX);
  return m ? m.length : 0;
}

export function validateChatText(text: string): [boolean, string | null] {
  if (typeof text !== 'string') return [false, 'Invalid message'];
  if (text.length > CHAT_MAX_LENGTH) {
    return [false, `Message too long (max ${CHAT_MAX_LENGTH} characters)`];
  }
  if (CHAT_DISALLOWED_REGEX.test(text)) {
    return [false, 'Control characters are not allowed'];
  }
  if (countEmojis(text) > CHAT_EMOJI_MAX) {
    return [false, `Too many emojis (max ${CHAT_EMOJI_MAX} per message)`];
  }
  return [true, null];
}

export function buildChatMessageEvent(text: string, ts: number, role: 'host' | 'guest'): string {
  return buildAppMessage(BRIDGE_CHAT_MESSAGE, { text, ts, role });
}

export interface ChatEntry {
  text: string;
  ts: number;
  role: 'host' | 'guest';
}

export function buildChatHistoryEvent(messages: ChatEntry[]): string {
  return buildAppMessage('bridge_chat_history', { messages });
}
