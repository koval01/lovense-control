/**
 * Persists that the user has at least once connected to Lovense in self mode (scanned QR).
 * Used in partner mode to require a real Lovense session before creating a room.
 */
const LOVENSE_EVER_CONNECTED_KEY = 'lovense-control-lovense-ever-connected';

export function hasLovenseEverConnected(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(LOVENSE_EVER_CONNECTED_KEY) === '1';
  } catch {
    return false;
  }
}

export function setLovenseEverConnected(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOVENSE_EVER_CONNECTED_KEY, '1');
  } catch {
    // ignore
  }
}
