import type { PartnerSetupPhase } from './types';
import type { BridgeSessionStateBag } from './useBridgeSessionState';

export function buildBridgeSessionReturn(
  st: BridgeSessionStateBag,
  derived: {
    remoteToys: Record<string, import('@/lib/lovense-domain').Toy>;
    localToysFromBridge: Record<string, import('@/lib/lovense-domain').Toy>;
    partnerSetupPhase: PartnerSetupPhase;
  },
  isBridgeAvailable: boolean,
  createRoom: () => Promise<void>,
  joinRoom: (code: string) => Promise<void>,
  disconnect: () => void,
  sendCommand: (
    toyId: string,
    action: string,
    timeSec?: number,
    loopRunningSec?: number,
    loopPauseSec?: number
  ) => void,
  sendLovenseCommand: (
    toyId: string,
    action: string,
    timeSec?: number,
    loopRunningSec?: number,
    loopPauseSec?: number
  ) => void,
  sendChatMessage: (text: string) => void,
  sendChatTyping: (typing: boolean) => void,
  sendChatVoice: (blob: Blob, mime: string, durationMs?: number) => Promise<void>,
  toggleLocalToyEnabled: (toyId: string) => void,
  isLocalToyPolicyToggleFrozen: (toyId: string) => boolean
) {
  return {
    status: st.status,
    error: st.error,
    roomId: st.roomId,
    pairCode: st.pairCode,
    isHost: st.isHost,
    peerConnected: st.peerConnected,
    remoteToys: derived.remoteToys,
    localToysFromBridge: derived.localToysFromBridge,
    localEnabledToyIds: st.localEnabledToyIds,
    toggleLocalToyEnabled,
    isLocalToyPolicyToggleFrozen,
    partnerEnabledToyIds: st.partnerEnabledToyIds,
    partnerLimits: st.partnerLimits,
    selfQrUrl: st.selfQrUrl,
    selfQrCode: st.selfQrCode,
    selfSessionReady: st.selfSessionReady,
    partnerSetupPhase: derived.partnerSetupPhase,
    bridgeSessionRecovery: st.bridgeSessionRecovery,
    partnerEverConnected: st.partnerEverConnected,
    socketIoConnected: st.socketIoConnected,
    preparingSession: st.preparingSession,
    rttMs: st.rttMs,
    chatMessages: st.chatMessages,
    partnerTyping: st.partnerTyping,
    sendChatMessage,
    sendChatTyping,
    sendChatVoice,
    isBridgeAvailable,
    createRoom,
    joinRoom,
    disconnect,
    sendCommand,
    sendLovenseCommand,
  };
}
