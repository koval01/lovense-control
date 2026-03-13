'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Toy } from '@/lib/lovense-domain';
import { internalApiClient, extractRequestError } from '@/lib/api/internal-client';
import type { BridgeClientMessage, BridgeServerMessage, BridgeToyCapability } from '@/lib/bridge/protocol';

type BridgeStatus = 'idle' | 'connecting' | 'waiting_partner' | 'online' | 'error';

interface CreateRoomResponse {
  roomId: string;
  code: string;
  ticket: string;
}

interface JoinRoomResponse {
  roomId: string;
  ticket: string;
}

interface TestPeerResponse {
  ticket: string;
}

function mapLocalToysToCapabilities(toys: Record<string, Toy>): BridgeToyCapability[] {
  return Object.values(toys)
    .filter((toy) => toy.connected)
    .map((toy) => ({
      id: toy.id,
      name: toy.name,
      toyType: toy.toyType,
      supportedFunctions: toy.supportedFunctions || [],
      maxLevel: 12,
      maxTimeSec: 30,
    }));
}

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

function createWsUrl(ticket: string): string {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}/bridge/ws?ticket=${encodeURIComponent(ticket)}`;
}

export function useBridgeSession(options: {
  enabled: boolean;
  localToys: Record<string, Toy>;
  onIncomingCommand: (toyId: string, action: string, timeSec?: number) => void;
}) {
  const { enabled, localToys, onIncomingCommand } = options;
  const wsRef = useRef<WebSocket | null>(null);
  const testPeerWsRef = useRef<WebSocket | null>(null);
  const localCapabilitiesRef = useRef<BridgeToyCapability[]>([]);
  const [status, setStatus] = useState<BridgeStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [pairCode, setPairCode] = useState<string | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [peerConnected, setPeerConnected] = useState(false);
  const [isLocalTestPeerActive, setIsLocalTestPeerActive] = useState(false);
  const [remoteCapabilities, setRemoteCapabilities] = useState<BridgeToyCapability[]>([]);

  const remoteToys = useMemo(() => mapRemoteCapabilitiesToToyMap(remoteCapabilities), [remoteCapabilities]);

  const sendMessage = useCallback((payload: BridgeClientMessage) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify(payload));
  }, []);

  const clearTestPeer = useCallback(() => {
    testPeerWsRef.current?.close();
    testPeerWsRef.current = null;
    setIsLocalTestPeerActive(false);
  }, []);

  const disconnect = useCallback(() => {
    clearTestPeer();
    wsRef.current?.close();
    wsRef.current = null;
    setPeerConnected(false);
    setRemoteCapabilities([]);
    setPairCode(null);
    setRoomId(null);
    setStatus('idle');
    setError(null);
  }, [clearTestPeer]);

  const connectWithTicket = useCallback(
    (ticket: string, nextRoomId: string) => {
      const ws = new WebSocket(createWsUrl(ticket));
      wsRef.current = ws;
      setStatus('connecting');
      setError(null);

      ws.onopen = () => {
        sendMessage({ type: 'hello', version: 1 });
        sendMessage({ type: 'capabilities', toys: localCapabilitiesRef.current });
        setStatus('waiting_partner');
      };

      ws.onmessage = (event) => {
        let message: BridgeServerMessage;
        try {
          message = JSON.parse(String(event.data)) as BridgeServerMessage;
        } catch {
          return;
        }

        if (message.type === 'hello-ack') {
          setRoomId(message.roomId || nextRoomId);
          return;
        }

        if (message.type === 'peer-state') {
          const connected = Boolean(message.peer?.connected);
          setPeerConnected(connected);
          setStatus(connected ? 'online' : 'waiting_partner');
          return;
        }

        if (message.type === 'peer-capabilities') {
          setRemoteCapabilities(message.toys || []);
          return;
        }

        if (message.type === 'partner-command') {
          onIncomingCommand(message.payload.toyId, message.payload.action, message.payload.timeSec ?? 0);
          return;
        }

        if (message.type === 'rate-limited') {
          setError('Partner control rate limit exceeded. Please slow down.');
          return;
        }

        if (message.type === 'error') {
          setError(message.message || 'Bridge error');
          return;
        }
      };

      ws.onclose = () => {
        wsRef.current = null;
        setPeerConnected(false);
        setRemoteCapabilities([]);
        setStatus('idle');
      };

      ws.onerror = () => {
        setStatus('error');
        setError('Bridge connection failed');
      };
    },
    [onIncomingCommand, sendMessage]
  );

  const createRoom = useCallback(async () => {
    try {
      const { data } = await internalApiClient.post<CreateRoomResponse>('/api/bridge/create', {});
      setPairCode(data.code);
      setRoomId(data.roomId);
      connectWithTicket(data.ticket, data.roomId);
    } catch (error) {
      setStatus('error');
      setError(extractRequestError(error, 'Failed to create bridge room'));
    }
  }, [connectWithTicket]);

  const joinRoom = useCallback(
    async (code: string) => {
      try {
        const { data } = await internalApiClient.post<JoinRoomResponse>('/api/bridge/join', {
          code,
        });
        setRoomId(data.roomId);
        connectWithTicket(data.ticket, data.roomId);
      } catch (error) {
        setStatus('error');
        setError(extractRequestError(error, 'Failed to join bridge room'));
      }
    },
    [connectWithTicket]
  );

  const startLocalTestPeer = useCallback(async () => {
    if (!roomId || testPeerWsRef.current) return;
    try {
      const { data } = await internalApiClient.post<TestPeerResponse>('/api/bridge/test-peer', { roomId });
      const ws = new WebSocket(createWsUrl(data.ticket));
      testPeerWsRef.current = ws;
      setIsLocalTestPeerActive(true);

      ws.onopen = () => {
        const localSend = (payload: BridgeClientMessage) => {
          if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(payload));
        };
        localSend({ type: 'hello', version: 1 });
        localSend({
          type: 'capabilities',
          toys: [
            {
              id: 'test-peer-vibe-1',
              name: 'Local test partner toy',
              toyType: 'Simulator',
              supportedFunctions: ['Vibrate'],
              maxLevel: 12,
              maxTimeSec: 30,
            },
          ],
        });

        ws.onmessage = (event) => {
          let message: BridgeServerMessage;
          try {
            message = JSON.parse(String(event.data)) as BridgeServerMessage;
          } catch {
            return;
          }

          if (message.type === 'partner-command') {
            onIncomingCommand(message.payload.toyId, message.payload.action, message.payload.timeSec ?? 0);
          }
        };
      };

      ws.onclose = () => {
        clearTestPeer();
      };
      ws.onerror = () => {
        clearTestPeer();
      };
    } catch (error) {
      setError(extractRequestError(error, 'Failed to start local test peer'));
      clearTestPeer();
    }
  }, [clearTestPeer, roomId]);

  const sendPartnerCommand = useCallback(
    (toyId: string, action: string, timeSec = 0) => {
      if (!peerConnected) return;
      sendMessage({
        type: 'command',
        payload: {
          toyId,
          action,
          timeSec,
          nonce: crypto.randomUUID(),
        },
      });
    },
    [peerConnected, sendMessage]
  );

  useEffect(() => {
    localCapabilitiesRef.current = mapLocalToysToCapabilities(localToys);
    sendMessage({ type: 'capabilities', toys: localCapabilitiesRef.current });
  }, [localToys, sendMessage]);

  useEffect(() => {
    if (!enabled) {
      disconnect();
    }
    return () => {
      clearTestPeer();
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [clearTestPeer, disconnect, enabled]);

  return {
    status,
    error,
    roomId,
    pairCode,
    peerConnected,
    isLocalTestPeerActive,
    remoteToys,
    createRoom,
    joinRoom,
    startLocalTestPeer,
    stopLocalTestPeer: clearTestPeer,
    disconnect,
    sendCommand: sendPartnerCommand,
  };
}
