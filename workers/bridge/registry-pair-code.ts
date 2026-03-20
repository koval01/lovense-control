export const PAIR_CODE_LENGTH = 8;
export const PAIR_CODE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
export const KV_PREFIX_PAIR = 'pc:';
export const KV_PREFIX_ROOM = 'room:';

export function generatePairCode(): string {
  let result = '';
  const chars = PAIR_CODE_CHARS;
  for (let i = 0; i < PAIR_CODE_LENGTH; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}
