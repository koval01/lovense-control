/**
 * Bridge server URL for partner mode.
 * Used when NEXT_PUBLIC_BRIDGE_SERVER_URL is not set (e.g. Cloudflare Pages
 * build env vars are unreliable). Update this for your production deployment.
 * Env vars still take precedence when available.
 *
 * Same-domain: use /bridge path (e.g. https://lovense.koval-dev.org/bridge)
 * so bridge shares domain with the app. Configure Workers Route:
 * lovense.koval-dev.org/bridge/* -> lovense-bridge worker.
 */
export const BRIDGE_SERVER_URL =
  process.env.NEXT_PUBLIC_BRIDGE_SERVER_URL ||
  process.env.BRIDGE_SERVER_URL ||
  'https://lovense.koval-dev.org/bridge';
