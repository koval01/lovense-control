import { useCallback } from 'react';
import { BRIDGE_AVAILABLE, BRIDGE_HTTP_BASE } from './bridge-urls';
import { registerLovenseWithBridge } from './register-session';
import type { BridgeSessionRefs } from './useBridgeSessionRefs';
import type { BridgeSessionStateBag } from './useBridgeSessionState';

export function useStartPreflightSession(
  refs: BridgeSessionRefs,
  st: BridgeSessionStateBag,
  readBridgeGen: () => number,
  setupWebSocket: (ticket: string, isHostRole: boolean) => void,
  roomId: string | null
) {
  return useCallback(async () => {
    if (!BRIDGE_AVAILABLE || roomId !== null) return;
    if (refs.preflightHostTicketRef.current) return;
    if (Date.now() < refs.preflightRetryAfterMsRef.current) return;
    const existing = refs.preflightSessionPromiseRef.current;
    if (existing) {
      await existing;
      return;
    }
    const gen0 = readBridgeGen();
    const inflightGen = refs.preflightAbortGenerationRef.current;
    const stillValid = () =>
      inflightGen === refs.preflightAbortGenerationRef.current && readBridgeGen() === gen0 && refs.enabledRef.current;
    refs.preflightAbortRef.current?.abort();
    const ac = new AbortController();
    refs.preflightAbortRef.current = ac;
    st.setPreparingSession(true);
    st.setError(null);
    st.setStatus('connecting');
    const promiseSlot: { current: Promise<void> | null } = { current: null };
    const p = (async () => {
      try {
        const res = await fetch(`${BRIDGE_HTTP_BASE}/rooms`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ hostDisplayName: null }),
          signal: ac.signal,
        });
        if (!stillValid()) return;
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error((body as { error?: string }).error || `Failed to start partner session (status ${res.status})`);
        }
        const json = (await res.json()) as { roomId: string; pairCode: string; hostTicket: string };
        if (!stillValid()) return;
        refs.preflightRoomIdRef.current = json.roomId;
        refs.preflightPairCodeRef.current = json.pairCode;
        refs.preflightHostTicketRef.current = json.hostTicket;
        refs.preflightRetryAfterMsRef.current = 0;
        refs.preflightRetryAttemptsRef.current = 0;
        await registerLovenseWithBridge(json.hostTicket);
        if (!stillValid()) return;
        setupWebSocket(json.hostTicket, true);
      } catch (e: unknown) {
        if (e instanceof DOMException && e.name === 'AbortError') return;
        if (e instanceof Error && e.name === 'AbortError') return;
        if (!stillValid()) return;
        st.setStatus('error');
        st.setError(e instanceof Error ? e.message : 'Failed to prepare partner session.');
        const attempt = (refs.preflightRetryAttemptsRef.current += 1);
        const cappedAttempt = Math.min(attempt, 6);
        const delayMs = Math.min(30_000, 1000 * 2 ** (cappedAttempt - 1));
        refs.preflightRetryAfterMsRef.current = Date.now() + delayMs;
      } finally {
        if (refs.preflightAbortRef.current === ac) refs.preflightAbortRef.current = null;
        st.setPreparingSession(false);
        if (refs.preflightSessionPromiseRef.current === promiseSlot.current) {
          refs.preflightSessionPromiseRef.current = null;
        }
      }
    })();
    promiseSlot.current = p;
    refs.preflightSessionPromiseRef.current = p;
    await p;
  }, [refs, readBridgeGen, setupWebSocket, roomId]);
}
