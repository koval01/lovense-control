'use client';

import { useCallback, useEffect } from 'react';
import type { Toy } from '@/lib/lovense-domain';
import { useAppStore } from '@/store/hooks';
import { BRIDGE_AVAILABLE } from './bridge-urls';
import { buildBridgeSessionReturn } from './buildBridgeSessionReturn';
import { useBridgeSessionRefs } from './useBridgeSessionRefs';
import { useBridgeSessionState } from './useBridgeSessionState';
import { useBridgeSessionDerived } from './useBridgeSessionDerived';
import { useBridgeSessionResetAndClose } from './useBridgeSessionResetAndClose';
import { useScheduleBridgeReconnect } from './useScheduleBridgeReconnect';
import { useSetupBridgeWebSocket } from './useSetupBridgeWebSocket';
import { useStartPreflightSession } from './useStartPreflightSession';
import { useCreateRoom } from './useCreateRoom';
import { useJoinRoom } from './useJoinRoom';
import { useBridgeSessionSideEffects, useBridgePreflightEffects } from './useBridgeSessionSideEffects';
import { useBridgePingAndQrEffects } from './useBridgePingAndQrEffects';
import { useBridgeDisconnect } from './useBridgeDisconnect';
import { useBridgeSendCommands } from './useBridgeSendCommands';
import { useBridgeToyRulesSyncEffect } from './useBridgeToyRulesSyncEffect';
import { useBridgeLocalToyPolicy } from './useBridgeLocalToyPolicy';

export function useBridgeSession(options: {
  enabled: boolean;
  localToys: Record<string, Toy>;
  onIncomingCommand: (
    toyId: string,
    action: string,
    timeSec?: number,
    loopRunningSec?: number,
    loopPauseSec?: number
  ) => void;
  activeToyIds?: string[];
  limits?: Record<string, number>;
  notificationTitle?: string;
}) {
  const { enabled, activeToyIds, limits, notificationTitle = '● New message' } = options;
  const reduxStore = useAppStore();
  const readBridgeGen = useCallback(() => reduxStore.getState().connection.bridgeSocketGeneration, [reduxStore]);
  const refs = useBridgeSessionRefs();
  const st = useBridgeSessionState();
  const { resetState, closeSocket } = useBridgeSessionResetAndClose(refs, st);
  const scheduleBridgeReconnect = useScheduleBridgeReconnect(reduxStore, refs, st);
  const setupWebSocket = useSetupBridgeWebSocket(
    refs,
    st,
    readBridgeGen,
    closeSocket,
    scheduleBridgeReconnect,
    notificationTitle
  );
  useEffect(() => {
    refs.setupWebSocketRef.current = setupWebSocket;
  }, [refs, setupWebSocket]);
  const startPreflightSession = useStartPreflightSession(refs, st, readBridgeGen, setupWebSocket, st.roomId);
  const createRoom = useCreateRoom(refs, st, readBridgeGen, setupWebSocket, st.peerConnected);
  const joinRoom = useJoinRoom(refs, st, readBridgeGen, setupWebSocket, closeSocket);
  const derived = useBridgeSessionDerived({
    roomId: st.roomId,
    error: st.error,
    preparingSession: st.preparingSession,
    socketIoConnected: st.socketIoConnected,
    selfSessionReady: st.selfSessionReady,
    partnerAuthLatch: st.partnerAuthLatch,
    remoteCapabilities: st.remoteCapabilities,
    localCapabilities: st.localCapabilities,
  });
  useBridgeSessionSideEffects(enabled, refs, st, closeSocket, resetState, st.roomId, st.isHost);
  useBridgePingAndQrEffects(refs, st.peerConnected, st.socketIoConnected, st.selfSessionReady, st.roomId);
  useBridgePreflightEffects(enabled, st.roomId, refs, startPreflightSession);
  const disconnect = useBridgeDisconnect(refs, closeSocket, resetState);
  const cmds = useBridgeSendCommands(refs, st.bridgeSessionRecovery, st.peerConnected);
  useBridgeToyRulesSyncEffect(
    refs,
    st,
    activeToyIds,
    limits,
    derived.localToysFromBridge,
    derived.localFeatureIdSet,
    cmds.sendBridgeSetToyRules
  );
  const policy = useBridgeLocalToyPolicy(refs, st);
  return buildBridgeSessionReturn(
    st,
    derived,
    BRIDGE_AVAILABLE,
    createRoom,
    joinRoom,
    disconnect,
    cmds.sendCommand,
    cmds.sendLovenseCommand,
    cmds.sendChatMessage,
    cmds.sendChatTyping,
    cmds.sendChatVoice,
    policy.toggleLocalToyEnabled,
    policy.isLocalToyPolicyToggleFrozen
  );
}
