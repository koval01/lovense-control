'use client';

export { CHAT_MAX_LENGTH } from '@/lib/bridge/chat';
export { PAIR_CODE_LENGTH } from '@/lib/bridge/constants';
export type { BridgeChatMessage, BridgeSessionRecovery, PartnerSetupPhase } from './bridge-session/types';
export { BridgeRegisterError } from './bridge-session/types';
export { useBridgeSession } from './bridge-session/useBridgeSession';
