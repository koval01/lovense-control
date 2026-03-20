import {
  DEFAULT_X,
  DEFAULT_Y,
  FLOATING_STORAGE_KEY,
  HEIGHT,
  MIN_HEIGHT,
  WIDTH,
} from './partner-chat-floating-constants';

export function loadPartnerChatFloatingPosition(): { x: number; y: number } {
  if (typeof window === 'undefined') return { x: DEFAULT_X, y: DEFAULT_Y };
  const margin = 16;
  try {
    const raw = localStorage.getItem(FLOATING_STORAGE_KEY);
    if (!raw) {
      return {
        x: window.innerWidth - WIDTH - margin,
        y: window.innerHeight - HEIGHT - margin,
      };
    }
    const { x, y } = JSON.parse(raw);
    if (typeof x === 'number' && typeof y === 'number') {
      const xClamp = Math.max(margin, Math.min(window.innerWidth - WIDTH - margin, x));
      const yClamp = Math.max(margin, Math.min(window.innerHeight - MIN_HEIGHT - margin, y));
      return { x: xClamp, y: yClamp };
    }
  } catch {
    // ignore
  }
  return {
    x: window.innerWidth - WIDTH - margin,
    y: window.innerHeight - HEIGHT - margin,
  };
}

export function savePartnerChatFloatingPosition(x: number, y: number): void {
  try {
    localStorage.setItem(FLOATING_STORAGE_KEY, JSON.stringify({ x, y }));
  } catch {
    // ignore
  }
}
