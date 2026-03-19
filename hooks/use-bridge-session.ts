'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Toy } from '@/lib/lovense-domain';
import type { BridgeToyCapability } from '@/lib/bridge/protocol';
import { LovenseWsClient } from '@/lib/lovense/ws-client';
import { internalApiClient } from '@/lib/api/internal-client';
import { FEATURE_MAX_LEVELS } from '@/lib/lovense/constants';
import { buildToyFeatures } from '@/lib/lovense-domain';
import { CHAT_MAX_LENGTH, validateChatText as validateChatTextClient } from '@/lib/bridge/chat';
import { PAIR_CODE_LENGTH } from '@/lib/bridge/constants';
import {
  playNotificationSound,
  startTitleBlink,
  stopNotificationTitleBlink,
  subscribeTabVisible,
} from '@/lib/notification-utils';

type BridgeStatus = 'idle' | 'connecting' | 'waiting_partner' | 'online' | 'error';

/** Partner menu before joining a room: wait for bridge → QR / auth → join & create UI. */
export type PartnerSetupPhase = 'loading' | 'qr' | 'form';

export type BridgeChatMessage =
  | {
      id: string;
      kind: 'text';
      text: string;
      ts: number;
      fromSelf: boolean;
    }
  | {
      id: string;
      kind: 'audio';
      ts: number;
      fromSelf: boolean;
      mime: string;
      audioUrl: string;
      durationMs?: number;
    };

export { CHAT_MAX_LENGTH };
export { PAIR_CODE_LENGTH };

/** Raw toy shape from Lovense API device list (basicapi_update_device_info_tc). */
interface RawToy {
  id: string;
  name?: string;
  toyType?: string;
  connected?: boolean;
  battery?: number;
  shortFunctionNames?: string[];
  fullFunctionNames?: string[];
}

function normalizeSupportedFunctions(rawToy: RawToy): string[] {
  const full = Array.isArray(rawToy.fullFunctionNames) ? rawToy.fullFunctionNames : [];
  const short = Array.isArray(rawToy.shortFunctionNames) ? rawToy.shortFunctionNames : [];
  const shortToFull: Record<string, string> = {
    v: 'Vibrate',
    v1: 'Vibrate1',
    v2: 'Vibrate2',
    r: 'Rotate',
    p: 'Pump',
    t: 'Thrusting',
    f: 'Fingering',
    s: 'Suction',
    d: 'Depth',
    st: 'Stroke',
    o: 'Oscillate',
  };
  const merged = [...full, ...short.map((token) => shortToFull[token.toLowerCase()] || token)];
  return Array.from(new Set(merged.map((name) => name.trim()).filter(Boolean)));
}

function lovenseToyListToCapabilities(toyList: RawToy[]): BridgeToyCapability[] {
  return toyList
    .filter((t) => t.connected)
    .map((toy) => ({
      id: toy.id,
      name: toy.name || 'Unknown',
      toyType: toy.toyType,
      supportedFunctions: normalizeSupportedFunctions(toy),
      maxLevel: 20,
      maxTimeSec: 0,
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

function buildHttpAndWsUrls(raw: string | undefined | null) {
  if (!raw) return { httpBase: '', wsBase: '' };
  try {
    const url = new URL(raw);
    const path = (url.pathname || '/').replace(/\/+$/, '') || '';
    if (url.protocol.startsWith('http')) {
      const wsProtocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsBase = `${wsProtocol}//${url.host}${path}`;
      const httpBase = `${url.protocol}//${url.host}${path}`;
      return { httpBase, wsBase };
    }
    if (url.protocol.startsWith('ws')) {
      const httpProtocol = url.protocol === 'wss:' ? 'https:' : 'http:';
      const httpBase = `${httpProtocol}//${url.host}${path}`;
      const wsBase = `${url.protocol}//${url.host}${path}`;
      return { httpBase, wsBase };
    }
  } catch {
    // invalid URL, fall through
  }
  return { httpBase: '', wsBase: '' };
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  // btoa is available in browser; this hook runs client-side only.
  return btoa(binary);
}

function base64ToBlob(base64: string, mime: string): Blob {
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
}

const RAW_BRIDGE_URL = process.env.NEXT_PUBLIC_BRIDGE_SERVER_URL ?? '';
const { httpBase: BRIDGE_HTTP_BASE, wsBase: BRIDGE_WS_BASE } = buildHttpAndWsUrls(RAW_BRIDGE_URL);
const BRIDGE_AVAILABLE = Boolean(BRIDGE_HTTP_BASE && BRIDGE_WS_BASE);

/** Register path on the bridge: worker binds ticket to a Lovense backend tunnel. */
const BRIDGE_REGISTER_SESSION_PATH = '/register-session';

/**
 * Register this client's Lovense session with the bridge so it can connect to Lovense and tunnel.
 * Call before connecting the WebSocket. Fetches authToken from our app, then POSTs to bridge /register-session.
 * Ensures a session cookie exists (GET /api/session) so partner mode works without opening self mode first.
 */
async function registerLovenseWithBridge(ticket: string): Promise<void> {
  await internalApiClient.get('/api/session').catch(() => {});
  const { data: socketAuth } = await internalApiClient.post<{
    authToken: string;
    sessionProof?: string;
  }>('/api/lovense/socket', {});
  if (!socketAuth?.authToken) {
    throw new Error('No Lovense session. Please connect in self mode first or sign in.');
  }
  const body: { authToken: string; ticket: string; sessionProof?: string } = {
    authToken: socketAuth.authToken,
    ticket,
  };
  if (socketAuth.sessionProof) body.sessionProof = socketAuth.sessionProof;
  const res = await fetch(`${BRIDGE_HTTP_BASE}${BRIDGE_REGISTER_SESSION_PATH}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err = body as { error?: string; detail?: string };
    const msg = err.detail || err.error || `Bridge rejected session (${res.status})`;
    throw new Error(msg);
  }
}

/** Compute max power % from control limits (Max Level UI). Used for bridge_set_toy_rules. */
function maxPowerFromLimits(limits: Record<string, number> | undefined): number | undefined {
  if (!limits || Object.keys(limits).length === 0) return undefined;
  let minPct = 100;
  for (const [featureId, value] of Object.entries(limits)) {
    const maxLevel = FEATURE_MAX_LEVELS[featureId] ?? 20;
    const pct = Math.round((value / maxLevel) * 100);
    minPct = Math.min(minPct, pct);
  }
  return minPct >= 100 ? undefined : minPct;
}

export function useBridgeSession(options: {
  enabled: boolean;
  localToys: Record<string, Toy>;
  onIncomingCommand: (toyId: string, action: string, timeSec?: number, loopRunningSec?: number, loopPauseSec?: number) => void;
  /** Sync from existing UI: toy selector (which toys partner can control) and Max Level limits. */
  activeToyIds?: string[];
  limits?: Record<string, number>;
  /** Title for tab blink when new chat message arrives (e.g. "● New message"). */
  notificationTitle?: string;
}) {
  const { enabled, localToys, onIncomingCommand, activeToyIds, limits, notificationTitle = '● New message' } = options;
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
  const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const roleRef = useRef<'host' | 'guest'>('host');
  const audioObjectUrlsRef = useRef<string[]>([]);
  const preflightRoomIdRef = useRef<string | null>(null);
  const preflightPairCodeRef = useRef<string | null>(null);
  const preflightHostTicketRef = useRef<string | null>(null);
  /** Synchronous guard so a late QR payload cannot flash after session becomes ready. */
  const selfSessionReadyRef = useRef(false);

  const lovenseClientRef = useRef<LovenseWsClient | null>(null);

  const remoteToys = useMemo(() => mapRemoteCapabilitiesToToyMap(remoteCapabilities), [remoteCapabilities]);
  const localToysFromBridge = useMemo(() => mapRemoteCapabilitiesToToyMap(localCapabilities), [localCapabilities]);
  const localFeatureIdSet = useMemo(
    () => new Set(buildToyFeatures(localToysFromBridge).map((f) => f.id)),
    [localToysFromBridge]
  );

  const partnerSetupPhase = useMemo((): PartnerSetupPhase => {
    if (roomId !== null) return 'form';
    if (error && !socketIoConnected && !preparingSession) return 'form';
    if (preparingSession) return 'loading';
    if (!socketIoConnected) return 'loading';
    if (selfSessionReady) return 'form';
    return 'qr';
  }, [roomId, error, preparingSession, socketIoConnected, selfSessionReady]);

  const resetState = useCallback(() => {
    setStatus('idle');
    setError(null);
    setPairCode(null);
    setRoomId(null);
    setIsHost(false);
    setPeerConnected(false);
    setSocketIoConnected(false);
    setRemoteCapabilities([]);
    setLocalCapabilities([]);
    setHasSelfDeviceInfo(false);
    setLocalEnabledToyIds([]);
    setPartnerEnabledToyIds(undefined);
    setPartnerLimits({});
    setSelfQrUrl(null);
    setSelfQrCode(null);
    selfSessionReadyRef.current = false;
    setSelfSessionReady(false);
    setPreparingSession(false);
    setRttMs(null);
    setChatMessages([]);
    setPartnerTyping(false);
    audioObjectUrlsRef.current.forEach((url) => {
      URL.revokeObjectURL(url);
    });
    audioObjectUrlsRef.current = [];
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    preflightRoomIdRef.current = null;
    preflightPairCodeRef.current = null;
    preflightHostTicketRef.current = null;
  }, []);

  const closeSocket = useCallback(() => {
    if (lovenseClientRef.current) {
      lovenseClientRef.current.disconnect();
      lovenseClientRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      closeSocket();
      resetState();
      return;
    }
    if (!BRIDGE_AVAILABLE) {
      setStatus('error');
      setError('Partner bridge server is not configured.');
    }
    return () => {
      closeSocket();
    };
  }, [enabled, closeSocket, resetState]);

  const setupWebSocket = useCallback(
    (ticket: string, isHostRole: boolean) => {
      roleRef.current = isHostRole ? 'host' : 'guest';
      if (!BRIDGE_WS_BASE) {
        setStatus('error');
        setError('Partner bridge server is not configured.');
        return;
      }
      closeSocket();
      setStatus('connecting');
      setError(null);

      const wsUrl = `${BRIDGE_WS_BASE}/ws?ticket=${encodeURIComponent(ticket)}`;
      const client = new LovenseWsClient({
        onSocketClose: () => {
          setPeerConnected(false);
          setSocketIoConnected(false);
          setRttMs(null);
          if (enabled) {
            setStatus((prev) => (prev === 'idle' ? 'idle' : 'error'));
            setError((prev) => prev || 'Connection lost. Use Exit to leave and try again.');
          } else {
            setStatus('idle');
            setError(null);
          }
        },
        onSocketError: () => {
          setStatus('error');
          setError('Error while communicating with tunnel.');
        },
        onSocketIoConnected: () => {
          setStatus((prev) => (prev === 'idle' ? 'idle' : 'online'));
          setSocketIoConnected(true);
        },
        onSocketIoEvent: (event, payloadData) => {
          const payload = payloadData as {
            status?: number;
            toyList?: RawToy[];
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
            // For voice messages the raw payload also includes base64 data, which we do not type here explicitly.
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            dataRaw?: any;
          };
          // Any app-level message means the bridge Socket.IO is up; leave "connecting" if stuck
          setStatus((prev) => (prev === 'connecting' ? 'online' : prev));
          if (
            event === 'basicapi_update_device_info_tc' ||
            event === 'basicApi_update_device_info'
          ) {
            const toyList = payload?.toyList ?? [];
            setRemoteCapabilities(lovenseToyListToCapabilities(toyList));
          }
          if (event === 'bridge_self_device_info') {
            const toyList = payload?.toyList ?? [];
            setHasSelfDeviceInfo(true);
            const ownCaps = lovenseToyListToCapabilities(toyList);
            setLocalCapabilities(ownCaps);
            const ownIds = ownCaps.map((t) => t.id);
            setLocalEnabledToyIds((prev) => {
              const prevSet = new Set(prev);
              const nextSet = new Set<string>();
              ownIds.forEach((id) => {
                if (prevSet.size === 0 || prevSet.has(id)) nextSet.add(id);
              });
              return ownIds.filter((id) => nextSet.has(id));
            });
          }
          if (event === 'bridge_self_app_status') {
            if (payload?.status === 1) {
              selfSessionReadyRef.current = true;
              setSelfSessionReady(true);
              setSelfQrUrl(null);
              setSelfQrCode(null);
            } else {
              selfSessionReadyRef.current = false;
              setSelfSessionReady(false);
            }
          }
          if (event === 'basicapi_get_qrcode_tc') {
            if (selfSessionReadyRef.current) return;
            const qrCodeUrl = payload?.data?.qrcodeUrl;
            const qrCodeRaw = payload?.data?.qrcode;
            if (qrCodeUrl || qrCodeRaw) {
              setSelfQrUrl(qrCodeUrl ?? null);
              setSelfQrCode(typeof qrCodeRaw === 'string' ? qrCodeRaw : null);
            }
          }
          if (
            event === 'basicapi_update_app_online_tc' ||
            event === 'basicapi_update_app_status_tc'
          ) {
            if (payload?.status === 1) setStatus('online');
          }
          if (event === 'bridge_partner_status' && typeof payload?.connected === 'boolean') {
            setPeerConnected(payload.connected);
            if (payload.connected) {
              setStatus((prev) => (prev === 'connecting' ? 'online' : prev));
            } else {
              setStatus('waiting_partner');
            }
          }
          if (event === 'bridge_partner_toy_rules') {
            setStatus((prev) => (prev === 'connecting' ? 'online' : prev));
            if (Array.isArray(payload?.enabledToyIds)) setPartnerEnabledToyIds(payload.enabledToyIds);
            if (payload?.limits && typeof payload.limits === 'object') setPartnerLimits(payload.limits);
          }
          if (event === 'bridge_pong' && typeof payload?.ts === 'number') {
            setRttMs(Math.round(Date.now() - payload.ts));
          }
          if (event === 'bridge_ping' && typeof payload?.ts === 'number') {
            setPeerConnected(true);
            client.sendEvent('bridge_pong', { id: payload.id, ts: payload.ts });
          }
          if (event === 'bridge_chat_message' && payload?.text != null && typeof payload?.ts === 'number') {
            const fromSelf = payload.role === roleRef.current;
            const msg: BridgeChatMessage = {
              id: `${payload.ts}-${payload.role}-${Date.now()}`,
              kind: 'text',
              text: payload.text,
              ts: payload.ts,
              fromSelf,
            };
            setChatMessages((prev) => [...prev, msg]);
            if (!fromSelf) {
              playNotificationSound();
              startTitleBlink(notificationTitle);
            }
          }
          if (event === 'bridge_chat_history' && Array.isArray(payload?.messages)) {
            const myRole = roleRef.current;
            const list: BridgeChatMessage[] = payload.messages.map((m: { text: string; ts: number; role: string }, i: number) => ({
              id: `hist-${m.ts}-${m.role}-${i}`,
              kind: 'text',
              text: m.text,
              ts: m.ts,
              fromSelf: m.role === myRole,
            }));
            setChatMessages(list);
          }
          if (
            event === 'bridge_chat_voice' &&
            typeof payload?.data === 'string' &&
            typeof payload?.mime === 'string' &&
            typeof payload?.ts === 'number'
          ) {
            const fromSelf = payload.role === roleRef.current;
            try {
              const blob = base64ToBlob(payload.data, payload.mime);
              const url = URL.createObjectURL(blob);
              audioObjectUrlsRef.current.push(url);
              const msg: BridgeChatMessage = {
                id: payload.id || `${payload.ts}-${payload.role}-${Date.now()}`,
                kind: 'audio',
                ts: payload.ts,
                fromSelf,
                mime: payload.mime,
                audioUrl: url,
                durationMs: typeof payload.durationMs === 'number' ? payload.durationMs : undefined,
              };
              setChatMessages((prev) => [...prev, msg]);
              if (!fromSelf) {
                playNotificationSound();
                startTitleBlink(notificationTitle);
              }
            } catch {
              // Ignore malformed audio payloads
            }
          }
          if (event === 'bridge_chat_typing' && typeof payload?.typing === 'boolean') {
            setPartnerTyping(payload.typing);
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            if (payload.typing) {
              typingTimeoutRef.current = setTimeout(() => setPartnerTyping(false), 3000);
            }
          }
        },
      });
      lovenseClientRef.current = client;
      client.connect(wsUrl);
    },
    [closeSocket, enabled, notificationTitle]
  );

  useEffect(() => {
    const cleanup = subscribeTabVisible();
    return () => {
      cleanup();
      stopNotificationTitleBlink();
    };
  }, []);

  useEffect(() => {
    if (!peerConnected || !socketIoConnected) return;
    const client = lovenseClientRef.current;
    if (!client?.isSocketIoConnected) return;
    const sendPing = () => {
      lovenseClientRef.current?.sendEvent('bridge_ping', { id: crypto.randomUUID(), ts: Date.now() });
    };
    sendPing();
    const id = setInterval(sendPing, 4000);
    pingIntervalRef.current = id;
    return () => {
      clearInterval(id);
      pingIntervalRef.current = null;
    };
  }, [peerConnected, socketIoConnected]);

  useEffect(() => {
    if (!socketIoConnected || selfSessionReady || roomId !== null) return;
    const client = lovenseClientRef.current;
    if (!client?.isSocketIoConnected) return;
    const requestQr = () => {
      client.sendEvent('bridge_self_get_qr', { ackId: String(Math.floor(Date.now() / 1000)) });
    };
    requestQr();
    const id = setInterval(requestQr, 30000);
    return () => clearInterval(id);
  }, [socketIoConnected, selfSessionReady, roomId]);

  const startPreflightSession = useCallback(async () => {
    if (!BRIDGE_AVAILABLE || preflightHostTicketRef.current || roomId !== null) return;
    setPreparingSession(true);
    setError(null);
    setStatus('connecting');
    try {
      const res = await fetch(`${BRIDGE_HTTP_BASE}/rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hostDisplayName: null }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error || `Failed to start partner session (status ${res.status})`);
      }
      const json = (await res.json()) as { roomId: string; pairCode: string; hostTicket: string };
      preflightRoomIdRef.current = json.roomId;
      preflightPairCodeRef.current = json.pairCode;
      preflightHostTicketRef.current = json.hostTicket;
      await registerLovenseWithBridge(json.hostTicket);
      setupWebSocket(json.hostTicket, true);
    } catch (e: unknown) {
      setStatus('error');
      setError(e instanceof Error ? e.message : 'Failed to prepare partner session.');
    } finally {
      setPreparingSession(false);
    }
  }, [roomId, setupWebSocket]);

  useEffect(() => {
    if (!enabled || roomId !== null) return;
    if (!BRIDGE_AVAILABLE) return;
    if (preflightHostTicketRef.current) return;
    void startPreflightSession();
  }, [enabled, roomId, startPreflightSession]);

  const createRoom = useCallback(async () => {
    if (!BRIDGE_AVAILABLE) {
      setStatus('error');
      setError('Partner bridge server is not configured.');
      return;
    }
    try {
      if (preflightRoomIdRef.current && preflightPairCodeRef.current) {
        setRoomId(preflightRoomIdRef.current);
        setPairCode(preflightPairCodeRef.current);
        setIsHost(true);
        setStatus(peerConnected ? 'online' : 'waiting_partner');
        return;
      }
      setStatus('connecting');
      setError(null);
      const res = await fetch(`${BRIDGE_HTTP_BASE}/rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hostDisplayName: null }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error || `Failed to create room (status ${res.status})`);
      }
      const json = (await res.json()) as { roomId: string; pairCode: string; hostTicket: string };
      setRoomId(json.roomId);
      setPairCode(json.pairCode);
      setIsHost(true);
      setStatus('connecting');
      await registerLovenseWithBridge(json.hostTicket);
      setupWebSocket(json.hostTicket, true);
    } catch (e: unknown) {
      setStatus('error');
      setError(e instanceof Error ? e.message : 'Failed to create room.');
    }
  }, [peerConnected, setupWebSocket]);

  const joinRoom = useCallback(async (code: string) => {
    if (!BRIDGE_AVAILABLE) {
      setStatus('error');
      setError('Partner bridge server is not configured.');
      return;
    }
    const trimmed = code.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (trimmed.length !== PAIR_CODE_LENGTH) {
      setError(`Please enter the ${PAIR_CODE_LENGTH}-character code.`);
      return;
    }
    try {
      if (preflightHostTicketRef.current) {
        closeSocket();
        preflightRoomIdRef.current = null;
        preflightPairCodeRef.current = null;
        preflightHostTicketRef.current = null;
      }
      setStatus('connecting');
      setError(null);
      const res = await fetch(`${BRIDGE_HTTP_BASE}/rooms/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pairCode: trimmed, guestDisplayName: null }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const err = body as { error?: string; detail?: string };
        throw new Error(err.detail || err.error || `Failed to join room (status ${res.status})`);
      }
      const json = (await res.json()) as { roomId: string; guestTicket: string };
      await registerLovenseWithBridge(json.guestTicket);
      setRoomId(json.roomId);
      setPairCode(trimmed);
      setIsHost(false);
      setupWebSocket(json.guestTicket, false);
    } catch (e: unknown) {
      setStatus('error');
      setError(e instanceof Error ? e.message : 'Failed to join room.');
    }
  }, [closeSocket, setupWebSocket]);

  function buildLovenseCommandPayload(
    toyId: string,
    action: string,
    timeSec: number = 0,
    loopRunningSec?: number,
    loopPauseSec?: number
  ): Record<string, unknown> {
    const payload: Record<string, unknown> = {
      command: 'Function',
      action,
      timeSec,
      apiVer: 1,
      toy: toyId,
    };
    if (action !== 'Stop') payload.stopPrevious = 0;
    if (loopRunningSec !== undefined && loopPauseSec !== undefined) {
      payload.loopRunningSec = loopRunningSec;
      payload.loopPauseSec = loopPauseSec;
    }
    return payload;
  }

  const sendCommand = useCallback(
    (toyId: string, action: string, timeSec: number = 0, loopRunningSec?: number, loopPauseSec?: number) => {
      const client = lovenseClientRef.current;
      if (!client?.isSocketIoConnected || !peerConnected) return;
      client.sendEvent(
        'basicapi_send_toy_command_ts',
        buildLovenseCommandPayload(toyId, action, timeSec, loopRunningSec, loopPauseSec)
      );
    },
    [peerConnected]
  );

  const sendLovenseCommand = useCallback(
    (toyId: string, action: string, timeSec: number = 0, loopRunningSec?: number, loopPauseSec?: number) => {
      const client = lovenseClientRef.current;
      if (!client?.isSocketIoConnected || !peerConnected) return;
      client.sendEvent(
        'basicapi_send_toy_command_ts',
        buildLovenseCommandPayload(toyId, action, timeSec, loopRunningSec, loopPauseSec)
      );
    },
    [peerConnected]
  );

  const disconnect = useCallback(() => {
    closeSocket();
    resetState();
  }, [closeSocket, resetState]);

  const sendChatMessage = useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const { ok } = validateChatTextClient(trimmed);
    if (!ok) return;
    const client = lovenseClientRef.current;
    if (!client?.isSocketIoConnected) return;
    client.sendEvent('bridge_chat_message', { text: trimmed, ts: Date.now() });
  }, []);

  const sendChatVoice = useCallback(
    async (blob: Blob, mime: string, durationMs?: number) => {
      const client = lovenseClientRef.current;
      if (!client?.isSocketIoConnected) return;
      const ts = Date.now();
      const id = crypto.randomUUID();
      const arrayBuffer = await blob.arrayBuffer();
      const data = arrayBufferToBase64(arrayBuffer);
      client.sendEvent('bridge_chat_voice', {
        id,
        ts,
        mime,
        data,
        ...(typeof durationMs === 'number' ? { durationMs } : {}),
      });
    },
    []
  );

  const sendChatTyping = useCallback((typing: boolean) => {
    const client = lovenseClientRef.current;
    if (!client?.isSocketIoConnected) return;
    client.sendEvent('bridge_chat_typing', { typing });
  }, []);

  const sendBridgeSetToyRules = useCallback(
    (payload: { enabledToyIds?: string[]; maxPower?: number }) => {
      const client = lovenseClientRef.current;
      if (!client?.isSocketIoConnected) return;
      client.sendEvent('bridge_set_toy_rules', payload);
    },
    []
  );

  useEffect(() => {
    if (!lovenseClientRef.current?.isSocketIoConnected) return;
    if (activeToyIds === undefined && limits === undefined) return;
    if (!hasSelfDeviceInfo) return;
    const myToyIds = Object.keys(localToysFromBridge);
    const enabledToyIds = localEnabledToyIds.filter((id) => myToyIds.includes(id));
    const localLimits: Record<string, number> = {};
    if (limits) {
      for (const [featureId, value] of Object.entries(limits)) {
        if (localFeatureIdSet.has(featureId)) localLimits[featureId] = value;
      }
    }
    const maxPower = maxPowerFromLimits(localLimits);
    sendBridgeSetToyRules({
      enabledToyIds,
      ...(maxPower !== undefined && { maxPower }),
      ...(Object.keys(localLimits).length > 0 && { limits: localLimits }),
    });
  }, [status, activeToyIds, limits, hasSelfDeviceInfo, localEnabledToyIds, localFeatureIdSet, localToysFromBridge, sendBridgeSetToyRules]);

  const toggleLocalToyEnabled = useCallback((toyId: string) => {
    setLocalEnabledToyIds((prev) => (prev.includes(toyId) ? prev.filter((id) => id !== toyId) : [...prev, toyId]));
  }, []);

  return {
    status,
    error,
    roomId,
    pairCode,
    isHost,
    peerConnected,
    remoteToys,
    localToysFromBridge,
    localEnabledToyIds,
    toggleLocalToyEnabled,
    partnerEnabledToyIds,
    partnerLimits,
    selfQrUrl,
    selfQrCode,
    selfSessionReady,
    partnerSetupPhase,
    preparingSession,
    rttMs,
    chatMessages,
    partnerTyping,
    sendChatMessage,
    sendChatTyping,
    sendChatVoice,
    isBridgeAvailable: BRIDGE_AVAILABLE,
    createRoom,
    joinRoom,
    disconnect,
    sendCommand,
    sendLovenseCommand,
  };
}
