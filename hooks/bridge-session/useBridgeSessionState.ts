import { useState } from 'react';
import type { BridgeToyCapability } from '@/lib/bridge/protocol';
import type { BridgeChatMessage, BridgeSessionRecovery, BridgeStatus } from './types';

export function useBridgeSessionState() {
  const [status, setStatus] = useState<BridgeStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [pairCode, setPairCode] = useState<string | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [peerConnected, setPeerConnected] = useState(false);
  const [remoteCapabilities, setRemoteCapabilities] = useState<BridgeToyCapability[]>([]);
  const [localCapabilities, setLocalCapabilities] = useState<BridgeToyCapability[]>([]);
  const [hasSelfDeviceInfo, setHasSelfDeviceInfo] = useState(false);
  const [localEnabledToyIds, setLocalEnabledToyIds] = useState<string[]>([]);
  const [partnerEnabledToyIds, setPartnerEnabledToyIds] = useState<string[] | undefined>(undefined);
  const [partnerLimits, setPartnerLimits] = useState<Record<string, number>>({});
  const [selfQrUrl, setSelfQrUrl] = useState<string | null>(null);
  const [selfQrCode, setSelfQrCode] = useState<string | null>(null);
  const [selfSessionReady, setSelfSessionReady] = useState(false);
  const [preparingSession, setPreparingSession] = useState(false);
  const [rttMs, setRttMs] = useState<number | null>(null);
  const [socketIoConnected, setSocketIoConnected] = useState(false);
  const [chatMessages, setChatMessages] = useState<BridgeChatMessage[]>([]);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [partnerEverConnected, setPartnerEverConnected] = useState(false);
  const [bridgeSessionRecovery, setBridgeSessionRecovery] = useState<BridgeSessionRecovery>('ok');
  const [partnerAuthLatch, setPartnerAuthLatch] = useState(false);
  const [localToyPolicyCooldownEpoch, setLocalToyPolicyCooldownEpoch] = useState(0);

  return {
    status,
    setStatus,
    error,
    setError,
    pairCode,
    setPairCode,
    roomId,
    setRoomId,
    isHost,
    setIsHost,
    peerConnected,
    setPeerConnected,
    remoteCapabilities,
    setRemoteCapabilities,
    localCapabilities,
    setLocalCapabilities,
    hasSelfDeviceInfo,
    setHasSelfDeviceInfo,
    localEnabledToyIds,
    setLocalEnabledToyIds,
    partnerEnabledToyIds,
    setPartnerEnabledToyIds,
    partnerLimits,
    setPartnerLimits,
    selfQrUrl,
    setSelfQrUrl,
    selfQrCode,
    setSelfQrCode,
    selfSessionReady,
    setSelfSessionReady,
    preparingSession,
    setPreparingSession,
    rttMs,
    setRttMs,
    socketIoConnected,
    setSocketIoConnected,
    chatMessages,
    setChatMessages,
    partnerTyping,
    setPartnerTyping,
    partnerEverConnected,
    setPartnerEverConnected,
    bridgeSessionRecovery,
    setBridgeSessionRecovery,
    partnerAuthLatch,
    setPartnerAuthLatch,
    localToyPolicyCooldownEpoch,
    setLocalToyPolicyCooldownEpoch,
  };
}

export type BridgeSessionStateBag = ReturnType<typeof useBridgeSessionState>;
