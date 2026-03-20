export const LIMITS_STORAGE_KEY = 'lovense-control-limits';

export function loadStoredLimits(): Record<string, number> | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(LIMITS_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') return null;
    const out: Record<string, number> = {};
    for (const [id, val] of Object.entries(parsed)) {
      if (typeof val === 'number' && val >= 0 && Number.isFinite(val)) out[id] = val;
    }
    return out;
  } catch {
    return null;
  }
}
