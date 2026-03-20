import type { BridgeChatMessage, BridgeSessionRecovery } from '@/hooks/use-bridge-session';
import type { BridgeStatus } from '@/hooks/bridge-session/types';
import type { Toy } from '@/lib/lovense-domain';

export interface HomePartnerBridgeApi {
  status: BridgeStatus;
  bridgeSessionRecovery: BridgeSessionRecovery;
  isHost: boolean;
  peerConnected: boolean;
  pairCode: string | null;
  rttMs: number | null;
  sendLovenseCommand: (
    toyId: string,
    action: string,
    timeSec?: number,
    loopRunningSec?: number,
    loopPauseSec?: number
  ) => void;
  localToysFromBridge: Record<string, Toy>;
  localEnabledToyIds: string[];
  partnerEnabledToyIds: string[] | undefined;
  partnerLimits: Record<string, number>;
  toggleLocalToyEnabled: (toyId: string) => void;
  isLocalToyPolicyToggleFrozen: (toyId: string) => boolean;
  chatMessages: BridgeChatMessage[];
  partnerTyping: boolean;
  sendChatMessage: (text: string) => void;
  sendChatTyping: (typing: boolean) => void;
  sendChatVoice: (blob: Blob, mime: string, durationMs?: number) => Promise<void> | void;
}
