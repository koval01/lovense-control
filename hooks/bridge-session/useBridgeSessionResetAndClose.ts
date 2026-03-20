import { useCallback } from 'react';
import { closeBridgeWebSocketInTab } from '@/lib/lovense/ws-client';
import type { BridgeSessionRefs } from './useBridgeSessionRefs';
import type { BridgeSessionStateBag } from './useBridgeSessionState';

export function useBridgeSessionResetAndClose(refs: BridgeSessionRefs, st: BridgeSessionStateBag) {
  const resetState = useCallback(() => {
    refs.preflightAbortGenerationRef.current += 1;
    refs.preflightAbortRef.current?.abort();
    refs.preflightAbortRef.current = null;
    refs.preflightSessionPromiseRef.current = null;
    st.setStatus('idle');
    st.setError(null);
    st.setPairCode(null);
    st.setRoomId(null);
    st.setIsHost(false);
    st.setPeerConnected(false);
    st.setSocketIoConnected(false);
    st.setRemoteCapabilities([]);
    st.setLocalCapabilities([]);
    st.setHasSelfDeviceInfo(false);
    st.setLocalEnabledToyIds([]);
    st.setPartnerEnabledToyIds(undefined);
    st.setPartnerLimits({});
    st.setSelfQrUrl(null);
    st.setSelfQrCode(null);
    refs.selfSessionReadyRef.current = false;
    st.setSelfSessionReady(false);
    st.setPreparingSession(false);
    st.setRttMs(null);
    st.setBridgeSessionRecovery('ok');
    st.setPartnerAuthLatch(false);
    refs.roomSessionTicketRef.current = null;
    refs.reconnectGenRef.current += 1;
    st.setChatMessages([]);
    st.setPartnerTyping(false);
    st.setPartnerEverConnected(false);
    refs.audioObjectUrlsRef.current.forEach((url) => {
      URL.revokeObjectURL(url);
    });
    refs.audioObjectUrlsRef.current = [];
    if (refs.pingIntervalRef.current) {
      clearInterval(refs.pingIntervalRef.current);
      refs.pingIntervalRef.current = null;
    }
    if (refs.typingTimeoutRef.current) {
      clearTimeout(refs.typingTimeoutRef.current);
      refs.typingTimeoutRef.current = null;
    }
    refs.preflightRoomIdRef.current = null;
    refs.preflightPairCodeRef.current = null;
    refs.preflightHostTicketRef.current = null;
    refs.preflightRetryAfterMsRef.current = 0;
    refs.preflightRetryAttemptsRef.current = 0;
    refs.bridgeWsBoundTicketRef.current = null;
    refs.localToyPolicyCooldownUntilRef.current = {};
    st.setLocalToyPolicyCooldownEpoch((e) => e + 1);
  }, [refs]);

  const closeSocket = useCallback(() => {
    refs.activeBridgeClientSerialRef.current = -1;
    refs.bridgeWsBoundTicketRef.current = null;
    if (refs.lovenseClientRef.current) {
      refs.lovenseClientRef.current.disconnect();
      refs.lovenseClientRef.current = null;
    }
    closeBridgeWebSocketInTab();
  }, [refs]);

  return { resetState, closeSocket };
}
