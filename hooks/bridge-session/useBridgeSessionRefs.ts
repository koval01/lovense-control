import { useMemo, useRef } from 'react';
import type { LovenseWsClient } from '@/lib/lovense/ws-client';

export function useBridgeSessionRefs() {
  const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const roleRef = useRef<'host' | 'guest'>('host');
  const audioObjectUrlsRef = useRef<string[]>([]);
  const preflightRoomIdRef = useRef<string | null>(null);
  const preflightPairCodeRef = useRef<string | null>(null);
  const preflightHostTicketRef = useRef<string | null>(null);
  const preflightRetryAfterMsRef = useRef<number>(0);
  const preflightRetryAttemptsRef = useRef<number>(0);
  const preflightAbortRef = useRef<AbortController | null>(null);
  const preflightAbortGenerationRef = useRef(0);
  const preflightSessionPromiseRef = useRef<Promise<void> | null>(null);
  const bridgeClientSeqRef = useRef(0);
  const activeBridgeClientSerialRef = useRef(0);
  const bridgeWsBoundTicketRef = useRef<string | null>(null);
  const selfSessionReadyRef = useRef(false);
  const roomIdRef = useRef<string | null>(null);
  const isHostRef = useRef(false);
  const enabledRef = useRef(false);
  const intentionalDisconnectRef = useRef(false);
  const roomSessionTicketRef = useRef<string | null>(null);
  const reconnectGenRef = useRef(0);
  const setupWebSocketRef = useRef<(ticket: string, isHostRole: boolean) => void>(() => {});
  const bridgeConnectionEpochRef = useRef(0);
  const bridgeReconnectSetupRef = useRef(false);
  const lovenseClientRef = useRef<LovenseWsClient | null>(null);
  const localToyPolicyCooldownUntilRef = useRef<Record<string, number>>({});

  return useMemo(
    () => ({
      pingIntervalRef,
      typingTimeoutRef,
      roleRef,
      audioObjectUrlsRef,
      preflightRoomIdRef,
      preflightPairCodeRef,
      preflightHostTicketRef,
      preflightRetryAfterMsRef,
      preflightRetryAttemptsRef,
      preflightAbortRef,
      preflightAbortGenerationRef,
      preflightSessionPromiseRef,
      bridgeClientSeqRef,
      activeBridgeClientSerialRef,
      bridgeWsBoundTicketRef,
      selfSessionReadyRef,
      roomIdRef,
      isHostRef,
      enabledRef,
      intentionalDisconnectRef,
      roomSessionTicketRef,
      reconnectGenRef,
      setupWebSocketRef,
      bridgeConnectionEpochRef,
      bridgeReconnectSetupRef,
      lovenseClientRef,
      localToyPolicyCooldownUntilRef,
    }),
    [
      pingIntervalRef,
      typingTimeoutRef,
      roleRef,
      audioObjectUrlsRef,
      preflightRoomIdRef,
      preflightPairCodeRef,
      preflightHostTicketRef,
      preflightRetryAfterMsRef,
      preflightRetryAttemptsRef,
      preflightAbortRef,
      preflightAbortGenerationRef,
      preflightSessionPromiseRef,
      bridgeClientSeqRef,
      activeBridgeClientSerialRef,
      bridgeWsBoundTicketRef,
      selfSessionReadyRef,
      roomIdRef,
      isHostRef,
      enabledRef,
      intentionalDisconnectRef,
      roomSessionTicketRef,
      reconnectGenRef,
      setupWebSocketRef,
      bridgeConnectionEpochRef,
      bridgeReconnectSetupRef,
      lovenseClientRef,
      localToyPolicyCooldownUntilRef,
    ]
  );
}

export type BridgeSessionRefs = ReturnType<typeof useBridgeSessionRefs>;
