/**
 * Browser notifications: sound and tab title blink when a new chat message arrives.
 */

let titleBlinkInterval: ReturnType<typeof setInterval> | null = null;
let originalTitle = '';

function stopTitleBlink() {
  if (titleBlinkInterval) {
    clearInterval(titleBlinkInterval);
    titleBlinkInterval = null;
  }
  if (typeof document !== 'undefined' && originalTitle) {
    document.title = originalTitle;
  }
}

/**
 * Play a short notification sound (Web Audio API, no file needed).
 */
export function playNotificationSound(): void {
  if (typeof window === 'undefined') return;
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AC) return;
  try {
    const ctx = new AC();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.15);
    if (ctx.state === 'suspended') ctx.resume();
  } catch {
    // ignore
  }
}

/**
 * Start blinking the tab title between original and alert text. Stops when tab becomes visible.
 * @param alertTitle - Text to show when "blinked" (e.g. "● New message")
 */
export function startTitleBlink(alertTitle: string): void {
  if (typeof document === 'undefined') return;
  if (document.visibilityState === 'visible') return;
  originalTitle = document.title || 'Lovense Control';
  stopTitleBlink();
  let showAlert = true;
  document.title = showAlert ? alertTitle : originalTitle;
  titleBlinkInterval = setInterval(() => {
    showAlert = !showAlert;
    document.title = showAlert ? alertTitle : originalTitle;
  }, 1000);
}

/**
 * Subscribe to tab visibility: when tab becomes visible, stop blink and restore title.
 */
export function subscribeTabVisible(): () => void {
  if (typeof document === 'undefined') return () => {};
  const handler = () => {
    if (document.visibilityState === 'visible') stopTitleBlink();
  };
  document.addEventListener('visibilitychange', handler);
  return () => document.removeEventListener('visibilitychange', handler);
}

/**
 * Stop title blink (e.g. when leaving partner mode).
 */
export function stopNotificationTitleBlink(): void {
  stopTitleBlink();
}
