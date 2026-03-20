import { internalApiClient } from '@/lib/api/internal-client';
import { BridgeRegisterError } from './types';
import { BRIDGE_HTTP_BASE, BRIDGE_REGISTER_SESSION_PATH } from './bridge-urls';

/**
 * Register this client's Lovense session with the bridge so it can connect to Lovense and tunnel.
 * Call before connecting the WebSocket. Fetches authToken from our app, then POSTs to bridge /register-session.
 * Ensures a session cookie exists (GET /api/session) so partner mode works without opening self mode first.
 */
export async function registerLovenseWithBridge(ticket: string): Promise<void> {
  await internalApiClient.get('/api/session').catch(() => {});
  const { data: socketAuth } = await internalApiClient.post<{
    authToken: string;
    sessionProof?: string;
  }>('/api/lovense/socket', {});
  if (!socketAuth?.authToken) {
    throw new Error('No Lovense session. Please connect in self mode first or sign in.');
  }
  const body: { authToken: string; ticket: string; sessionProof?: string } = {
    authToken: socketAuth.authToken,
    ticket,
  };
  if (socketAuth.sessionProof) body.sessionProof = socketAuth.sessionProof;
  const res = await fetch(`${BRIDGE_HTTP_BASE}${BRIDGE_REGISTER_SESSION_PATH}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const bodyJson = await res.json().catch(() => ({}));
    const err = bodyJson as { error?: string; detail?: string };
    const msg = err.detail || err.error || `Bridge rejected session (${res.status})`;
    throw new BridgeRegisterError(msg, res.status);
  }
}
