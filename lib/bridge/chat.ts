/**
 * Bridge chat: max length and client-side validation.
 * Must match bridge server (bridge/chat.py).
 */

export const CHAT_MAX_LENGTH = 1000;
export const CHAT_EMOJI_MAX = 20;
/** Cooldown between messages (ms). Must match bridge CHAT_FLOOD_INTERVAL_SEC. */
export const CHAT_FLOOD_INTERVAL_MS = 2000;

/** Disallow only C0/C1 control characters (newline U+000A is allowed). Enables emojis and all scripts. */
const CHAT_DISALLOWED_REGEX = /[\x00-\x09\x0b-\x1f\x7f-\x9f]/u;

/** One character from common emoji/pictographic blocks (BMP + supplementary). */
const CHAT_EMOJI_REGEX =
  /[\u2600-\u26FF\u2700-\u27BF\uFE00-\uFE0F\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{1F1E0}-\u{1F1FF}]/gu;

function countEmojis(text: string): number {
  const m = text.match(CHAT_EMOJI_REGEX);
  return m ? m.length : 0;
}

export interface ChatValidationResult {
  ok: boolean;
  error?: string;
}

/**
 * Validate chat text before send. Server will reject invalid messages.
 * Allows letters (any script), numbers, punctuation, emojis, symbols.
 * Limits emoji count per message to avoid heavy rendering.
 */
export function validateChatText(text: string): ChatValidationResult {
  if (typeof text !== 'string') return { ok: false, error: 'Invalid message' };
  if (text.length > CHAT_MAX_LENGTH) {
    return { ok: false, error: `Max ${CHAT_MAX_LENGTH} characters` };
  }
  if (CHAT_DISALLOWED_REGEX.test(text)) {
    return { ok: false, error: 'Control characters are not allowed' };
  }
  if (countEmojis(text) > CHAT_EMOJI_MAX) {
    return { ok: false, error: `Too many emojis (max ${CHAT_EMOJI_MAX} per message)` };
  }
  return { ok: true };
}
