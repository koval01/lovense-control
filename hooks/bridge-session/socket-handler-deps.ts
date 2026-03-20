import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import type { BridgeToyCapability } from '@/lib/bridge/protocol';
import type { LovenseWsClient } from '@/lib/lovense/ws-client';
import type { BridgeChatMessage, BridgeStatus } from './types';

/** Narrowed Socket.IO app payload from bridge / Lovense tunnel. */
export type BridgeSocketPayload = {
  status?: number;
  toyList?: import('./types').RawToy[];
  data?: { qrcodeUrl?: string; qrcode?: string };
  connected?: boolean;
  enabledToyIds?: string[];
  maxPower?: number;
  limits?: Record<string, number>;
  id?: string;
  ts?: number;
  text?: string;
  role?: string;
  typing?: boolean;
  messages?: Array<{ text: string; ts: number; role: string }>;
  mime?: string;
  durationMs?: number;
  dataRaw?: unknown;
};

export interface SocketHandlerDeps {
  roleRef: MutableRefObject<'host' | 'guest'>;
  notificationTitle: string;
  selfSessionReadyRef: MutableRefObject<boolean>;
  audioObjectUrlsRef: MutableRefObject<string[]>;
  typingTimeoutRef: MutableRefObject<ReturnType<typeof setTimeout> | null>;
  setStatus: Dispatch<SetStateAction<BridgeStatus>>;
  setRemoteCapabilities: Dispatch<SetStateAction<BridgeToyCapability[]>>;
  setHasSelfDeviceInfo: Dispatch<SetStateAction<boolean>>;
  setLocalCapabilities: Dispatch<SetStateAction<BridgeToyCapability[]>>;
  setLocalEnabledToyIds: Dispatch<SetStateAction<string[]>>;
  setSelfSessionReady: Dispatch<SetStateAction<boolean>>;
  setPartnerAuthLatch: Dispatch<SetStateAction<boolean>>;
  setSelfQrUrl: Dispatch<SetStateAction<string | null>>;
  setSelfQrCode: Dispatch<SetStateAction<string | null>>;
  setPeerConnected: Dispatch<SetStateAction<boolean>>;
  setPartnerEverConnected: Dispatch<SetStateAction<boolean>>;
  setPartnerEnabledToyIds: Dispatch<SetStateAction<string[] | undefined>>;
  setPartnerLimits: Dispatch<SetStateAction<Record<string, number>>>;
  setRttMs: Dispatch<SetStateAction<number | null>>;
  setChatMessages: Dispatch<SetStateAction<BridgeChatMessage[]>>;
  setPartnerTyping: Dispatch<SetStateAction<boolean>>;
  client: LovenseWsClient;
}
