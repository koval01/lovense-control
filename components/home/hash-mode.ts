import type { ConnectionMode } from '@/store/slices/connectionSlice';

export function hashToMode(): ConnectionMode {
  if (typeof window === 'undefined') return 'unselected';
  const h = window.location.hash.slice(1).toLowerCase();
  if (h === 'self') return 'self';
  if (h === 'partner') return 'partner';
  return 'unselected';
}

export function modeToHash(mode: ConnectionMode): string {
  if (mode === 'self') return '#self';
  if (mode === 'partner') return '#partner';
  return '#';
}
