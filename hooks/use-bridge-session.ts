'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Toy } from '@/lib/lovense-domain';
import type { BridgeToyCapability } from '@/lib/bridge/protocol';

type BridgeStatus = 'idle' | 'connecting' | 'waiting_partner' | 'online' | 'error';

function mapRemoteCapabilitiesToToyMap(toys: BridgeToyCapability[]): Record<string, Toy> {
  return Object.fromEntries(
    toys.map((toy) => [
      toy.id,
      {
        id: toy.id,
        name: toy.name,
        connected: true,
        battery: 100,
        toyType: toy.toyType,
        supportedFunctions: toy.supportedFunctions || [],
      },
    ])
  );
}

const BRIDGE_SERVER_URL = process.env.NEXT_PUBLIC_BRIDGE_SERVER_URL ?? '';
const BRIDGE_AVAILABLE = Boolean(BRIDGE_SERVER_URL);

export function useBridgeSession(options: {
  enabled: boolean;
  localToys: Record<string, Toy>;
  onIncomingCommand: (toyId: string, action: string, timeSec?: number) => void;
}) {
  const { enabled } = options;
  const [status, setStatus] = useState<BridgeStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [pairCode, setPairCode] = useState<string | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [peerConnected, setPeerConnected] = useState(false);
  const [isLocalTestPeerActive, setIsLocalTestPeerActive] = useState(false);
  const [remoteCapabilities] = useState<BridgeToyCapability[]>([]);

  useEffect(() => {
    if (!enabled) {
      setStatus('idle');
      setError(null);
      setPairCode(null);
      setRoomId(null);
      setPeerConnected(false);
      setIsLocalTestPeerActive(false);
    } else if (!BRIDGE_AVAILABLE) {
      setStatus('error');
      setError('Partner bridge server is not configured.');
    }
  }, [enabled]);

  const remoteToys = useMemo(() => mapRemoteCapabilitiesToToyMap(remoteCapabilities), [remoteCapabilities]);

  const noOp = useCallback((_arg?: unknown) => {
    if (!BRIDGE_AVAILABLE) {
      setError('Partner bridge server is not configured.');
    } else {
      setError('Partner bridge integration is not implemented yet.');
    }
  }, []);

  return {
    status,
    error,
    roomId,
    pairCode,
    peerConnected,
    isLocalTestPeerActive,
    remoteToys,
    isBridgeAvailable: BRIDGE_AVAILABLE,
    createRoom: noOp,
    joinRoom: noOp,
    startLocalTestPeer: noOp,
    stopLocalTestPeer: () => {
      setIsLocalTestPeerActive(false);
    },
    disconnect: () => {
      setStatus('idle');
      setError(null);
      setPairCode(null);
      setRoomId(null);
      setPeerConnected(false);
      setIsLocalTestPeerActive(false);
    },
    sendCommand: () => {
      // commands are no-op while bridge is not implemented
    },
  };
}
