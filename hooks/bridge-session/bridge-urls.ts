export function buildHttpAndWsUrls(raw: string | undefined | null) {
  if (!raw) return { httpBase: '', wsBase: '' };
  try {
    const url = new URL(raw);
    const path = (url.pathname || '/').replace(/\/+$/, '') || '';
    if (url.protocol.startsWith('http')) {
      const wsProtocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsBase = `${wsProtocol}//${url.host}${path}`;
      const httpBase = `${url.protocol}//${url.host}${path}`;
      return { httpBase, wsBase };
    }
    if (url.protocol.startsWith('ws')) {
      const httpProtocol = url.protocol === 'wss:' ? 'https:' : 'http:';
      const httpBase = `${httpProtocol}//${url.host}${path}`;
      const wsBase = `${url.protocol}//${url.host}${path}`;
      return { httpBase, wsBase };
    }
  } catch {
    // invalid URL, fall through
  }
  return { httpBase: '', wsBase: '' };
}

const RAW_BRIDGE_URL = process.env.NEXT_PUBLIC_BRIDGE_SERVER_URL ?? '';
export const { httpBase: BRIDGE_HTTP_BASE, wsBase: BRIDGE_WS_BASE } = buildHttpAndWsUrls(RAW_BRIDGE_URL);
export const BRIDGE_AVAILABLE = Boolean(BRIDGE_HTTP_BASE && BRIDGE_WS_BASE);

/** Partner: min gap between local enable/disable taps per toy (UI; server uses 900 ms). */
export const LOCAL_TOY_POLICY_UI_COOLDOWN_MS = 1000;

/** Register path on the bridge: worker binds ticket to a Lovense backend tunnel. */
export const BRIDGE_REGISTER_SESSION_PATH = '/register-session';
