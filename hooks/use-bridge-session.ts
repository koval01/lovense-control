'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Toy } from '@/lib/lovense-domain';
import type { BridgeToyCapability } from '@/lib/bridge/protocol';
import { closeBridgeWebSocketInTab, LovenseWsClient } from '@/lib/lovense/ws-client';
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
import { useAppDispatch, useAppStore } from '@/store/hooks';
import { bumpBridgeSocketGeneration } from '@/store/slices/connectionSlice';

type BridgeStatus = 'idle' | 'connecting' | 'waiting_partner' | 'online' | 'error';

/** Partner menu before joining a room: wait for bridge → QR / auth → join & create UI. */
export type PartnerSetupPhase = 'loading' | 'qr' | 'form';

/** Bridge WebSocket session while in a room: auto-reconnect vs hard failure. */
export type BridgeSessionRecovery = 'ok' | 'reconnecting' | 'failed';

export class BridgeRegisterError extends Error {
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'BridgeRegisterError';
    this.status = status;
  }
}

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

/** Partner: min gap between local enable/disable taps per toy (UI; server uses 900 ms). */
const LOCAL_TOY_POLICY_UI_COOLDOWN_MS = 1000;

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
    throw new BridgeRegisterError(msg, res.status);
  }
}

/** Compute max power % from control limits (Max Level UI). Used for bridge_set_toy_rules. */
function maxPowerFromLimits(limits: Record<string, number> | undefined): number | undefined {
  if (!limits || Object.keys(limits).length === 0) return undefined;
  let minPct = 100;
  for (const [featureId, value] of Object.entries(limits)) {
    const maxLevel = FEATURE_MAX_LEVELS[featureId] ?? 20;
    const pct = Math.round((Math.max(1, value) / maxLevel) * 100);
    minPct = Math.min(minPct, pct);
  }
  if (minPct >= 100) return undefined;
  return Math.max(1, minPct);
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
  const reduxStore = useAppStore();
  const dispatch = useAppDispatch();
  const readBridgeGen = useCallback(() => reduxStore.getState().connection.bridgeSocketGeneration, [reduxStore]);
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
  /** True after the other peer has been connected at least once this session (for “partner dropped” copy). */
  const [partnerEverConnected, setPartnerEverConnected] = useState(false);
  const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const roleRef = useRef<'host' | 'guest'>('host');
  const audioObjectUrlsRef = useRef<string[]>([]);
  const preflightRoomIdRef = useRef<string | null>(null);
  const preflightPairCodeRef = useRef<string | null>(null);
  const preflightHostTicketRef = useRef<string | null>(null);
  /** Aborts in-flight POST /rooms for preflight when leaving partner mode or starting a new preflight. */
  const preflightAbortRef = useRef<AbortController | null>(null);
  /** Bumped on cleanup / reset so late preflight async work cannot call setupWebSocket after exit. */
  const preflightAbortGenerationRef = useRef(0);
  /** Single in-flight partner preflight (effect + Strict Mode + createRoom cannot run two POST /rooms in parallel). */
  const preflightSessionPromiseRef = useRef<Promise<void> | null>(null);
  /** Monotonic id per bridge WS instance; closeSocket sets active to -1 so stale onClose cannot fire reconnect. */
  const bridgeClientSeqRef = useRef(0);
  const activeBridgeClientSerialRef = useRef(0);
  /** Ticket used for the current in-flight or open bridge WebSocket (avoids duplicate sockets on repeated setupWebSocket). */
  const bridgeWsBoundTicketRef = useRef<string | null>(null);
  /** Synchronous guard so a late QR payload cannot flash after session becomes ready. */
  const selfSessionReadyRef = useRef(false);
  const roomIdRef = useRef<string | null>(null);
  const isHostRef = useRef(false);
  const enabledRef = useRef(false);
  /** True while calling disconnect() / leaving partner mode so socket close does not auto-reconnect. */
  const intentionalDisconnectRef = useRef(false);
  /** JWT used for the current bridge WebSocket (reconnect / register-session). */
  const roomSessionTicketRef = useRef<string | null>(null);
  /** Bumped to cancel in-flight reconnect backoff when a new close happens or user exits. */
  const reconnectGenRef = useRef(0);
  const setupWebSocketRef = useRef<(ticket: string, isHostRole: boolean) => void>(() => {});
  /** Incremented on each setupWebSocket so stale onClose/onError from replaced sockets are ignored. */
  const bridgeConnectionEpochRef = useRef(0);
  /** Next setupWebSocket call is auto-reconnect: avoid flipping UI to full-screen "connecting". */
  const bridgeReconnectSetupRef = useRef(false);

  const [bridgeSessionRecovery, setBridgeSessionRecovery] = useState<BridgeSessionRecovery>('ok');
  /** After Lovense app auth once, never show QR setup again until full reset (avoids UI flicker). */
  const [partnerAuthLatch, setPartnerAuthLatch] = useState(false);

  const lovenseClientRef = useRef<LovenseWsClient | null>(null);
  const localToyPolicyCooldownUntilRef = useRef<Record<string, number>>({});
  const [localToyPolicyCooldownEpoch, setLocalToyPolicyCooldownEpoch] = useState(0);

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
    if (selfSessionReady || partnerAuthLatch) return 'form';
    return 'qr';
  }, [roomId, error, preparingSession, socketIoConnected, selfSessionReady, partnerAuthLatch]);

  const resetState = useCallback(() => {
    preflightAbortGenerationRef.current += 1;
    preflightAbortRef.current?.abort();
    preflightAbortRef.current = null;
    preflightSessionPromiseRef.current = null;
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
    setBridgeSessionRecovery('ok');
    setPartnerAuthLatch(false);
    roomSessionTicketRef.current = null;
    reconnectGenRef.current += 1;
    setChatMessages([]);
    setPartnerTyping(false);
    setPartnerEverConnected(false);
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
    bridgeWsBoundTicketRef.current = null;
    localToyPolicyCooldownUntilRef.current = {};
    setLocalToyPolicyCooldownEpoch((e) => e + 1);
  }, []);

  const closeSocket = useCallback(() => {
    activeBridgeClientSerialRef.current = -1;
    bridgeWsBoundTicketRef.current = null;
    if (lovenseClientRef.current) {
      lovenseClientRef.current.disconnect();
      lovenseClientRef.current = null;
    }
    /** Orphan bridge sockets (no ref) still hold singletonInTab — always clear on tear-down. */
    closeBridgeWebSocketInTab();
  }, []);

  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  useEffect(() => {
    roomIdRef.current = roomId;
  }, [roomId]);

  useEffect(() => {
    isHostRef.current = isHost;
  }, [isHost]);

  useEffect(() => {
    if (!enabled) {
      intentionalDisconnectRef.current = true;
      closeSocket();
      resetState();
      intentionalDisconnectRef.current = false;
      return;
    }
    if (!BRIDGE_AVAILABLE) {
      setStatus('error');
      setError('Partner bridge server is not configured.');
    }
    return () => {
      intentionalDisconnectRef.current = true;
      closeSocket();
      intentionalDisconnectRef.current = false;
    };
  }, [enabled, closeSocket, resetState]);

  const scheduleBridgeReconnect = useCallback(() => {
    const reduxGenAtSchedule = reduxStore.getState().connection.bridgeSocketGeneration;
    const loopId = (reconnectGenRef.current += 1);
    /** In-room or host preflight (QR / join form before promote). */
    const stillNeedsBridgeWs = () =>
      roomIdRef.current != null || preflightHostTicketRef.current != null;
    void (async () => {
      let delay = 1000;
      const maxDelay = 30_000;
      while (
        loopId === reconnectGenRef.current &&
        !intentionalDisconnectRef.current &&
        stillNeedsBridgeWs() &&
        reduxStore.getState().connection.bridgeSocketGeneration === reduxGenAtSchedule
      ) {
        const ticket = roomSessionTicketRef.current;
        if (!ticket) {
          if (loopId === reconnectGenRef.current) {
            setBridgeSessionRecovery('failed');
            setStatus('error');
            setError('No session ticket. Leave the room and join again.');
          }
          break;
        }
        try {
          await registerLovenseWithBridge(ticket);
          if (
            loopId !== reconnectGenRef.current ||
            intentionalDisconnectRef.current ||
            !stillNeedsBridgeWs() ||
            reduxStore.getState().connection.bridgeSocketGeneration !== reduxGenAtSchedule
          ) {
            return;
          }
          bridgeReconnectSetupRef.current = true;
          setupWebSocketRef.current(ticket, isHostRef.current);
          return;
        } catch (e) {
          if (loopId !== reconnectGenRef.current) return;
          const st = e instanceof BridgeRegisterError ? e.status : 0;
          if (st === 401) {
            setBridgeSessionRecovery('failed');
            setStatus('error');
            setError(e instanceof Error ? e.message : 'Session expired. Leave the room and sign in again.');
            return;
          }
          await new Promise((r) => setTimeout(r, delay));
          delay = Math.min(delay * 2, maxDelay);
        }
      }
    })();
  }, [reduxStore]);

  const setupWebSocket = useCallback(
    (ticket: string, isHostRole: boolean) => {
      if (!enabledRef.current) return;
      roleRef.current = isHostRole ? 'host' : 'guest';
      if (!BRIDGE_WS_BASE) {
        setStatus('error');
        setError('Partner bridge server is not configured.');
        return;
      }
      const fromAutoReconnect = bridgeReconnectSetupRef.current;
      bridgeReconnectSetupRef.current = false;
      const bridgeGenAtSetup = readBridgeGen();
      roomSessionTicketRef.current = ticket;

      const existing = lovenseClientRef.current;
      if (
        existing &&
        existing.isWebSocketActive() &&
        bridgeWsBoundTicketRef.current === ticket &&
        readBridgeGen() === bridgeGenAtSetup
      ) {
        if (fromAutoReconnect && existing.isSocketIoConnected) {
          setBridgeSessionRecovery('ok');
          setSocketIoConnected(true);
          setStatus((prev) => (prev === 'idle' ? 'idle' : 'online'));
        }
        return;
      }

      closeSocket();
      roomSessionTicketRef.current = ticket;
      if (readBridgeGen() !== bridgeGenAtSetup) {
        return;
      }
      if (!fromAutoReconnect) {
        setStatus('connecting');
      }
      setError(null);

      const myEpoch = (bridgeConnectionEpochRef.current += 1);
      const myClientSerial = (bridgeClientSeqRef.current += 1);
      const wsUrl = `${BRIDGE_WS_BASE}/ws?ticket=${encodeURIComponent(ticket)}`;
      const client = new LovenseWsClient({
        onSocketClose: () => {
          if (myClientSerial !== activeBridgeClientSerialRef.current) return;
          if (myEpoch !== bridgeConnectionEpochRef.current) return;
          if (readBridgeGen() !== bridgeGenAtSetup) return;
          setPeerConnected(false);
          setSocketIoConnected(false);
          setRttMs(null);
          if (intentionalDisconnectRef.current) {
            if (!enabledRef.current) {
              setStatus('idle');
              setError(null);
            }
            return;
          }
          const shouldTryReconnect =
            enabledRef.current &&
            Boolean(roomSessionTicketRef.current) &&
            (roomIdRef.current != null || preflightHostTicketRef.current != null);
          if (shouldTryReconnect) {
            setBridgeSessionRecovery('reconnecting');
            setError(null);
            scheduleBridgeReconnect();
            return;
          }
          if (enabledRef.current) {
            setStatus((prev) => (prev === 'idle' ? 'idle' : 'error'));
            setError((prev) => prev || 'Connection lost. Use Exit to leave and try again.');
          } else {
            setStatus('idle');
            setError(null);
          }
        },
        onSocketError: () => {
          if (myClientSerial !== activeBridgeClientSerialRef.current) return;
          if (myEpoch !== bridgeConnectionEpochRef.current) return;
          if (readBridgeGen() !== bridgeGenAtSetup) return;
          if (
            !intentionalDisconnectRef.current &&
            enabledRef.current &&
            roomSessionTicketRef.current &&
            (roomIdRef.current != null || preflightHostTicketRef.current != null)
          ) {
            setBridgeSessionRecovery('reconnecting');
            setError(null);
            scheduleBridgeReconnect();
            return;
          }
          setStatus('error');
          setError('Error while communicating with tunnel.');
        },
        onSocketIoConnected: () => {
          if (myClientSerial !== activeBridgeClientSerialRef.current) return;
          if (myEpoch !== bridgeConnectionEpochRef.current) return;
          if (readBridgeGen() !== bridgeGenAtSetup) return;
          setStatus((prev) => (prev === 'idle' ? 'idle' : 'online'));
          setSocketIoConnected(true);
          setBridgeSessionRecovery('ok');
        },
        onSocketIoEvent: (event, payloadData) => {
          if (myClientSerial !== activeBridgeClientSerialRef.current) return;
          if (readBridgeGen() !== bridgeGenAtSetup) return;
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
              setPartnerAuthLatch(true);
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
              setPartnerEverConnected(true);
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
            setPartnerEverConnected(true);
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
      // Register immediately so a concurrent setupWebSocket hits closeSocket and disconnects this instance.
      lovenseClientRef.current = client;
      bridgeWsBoundTicketRef.current = ticket;
      if (readBridgeGen() !== bridgeGenAtSetup) {
        activeBridgeClientSerialRef.current = -1;
        try {
          client.disconnect();
        } catch {
          /* ignore */
        }
        lovenseClientRef.current = null;
        bridgeWsBoundTicketRef.current = null;
        return;
      }
      activeBridgeClientSerialRef.current = myClientSerial;
      if (lovenseClientRef.current !== client) {
        activeBridgeClientSerialRef.current = -1;
        try {
          client.disconnect();
        } catch {
          /* ignore */
        }
        return;
      }
      client.connect(wsUrl, { singletonInTab: true });
    },
    [closeSocket, scheduleBridgeReconnect, notificationTitle, readBridgeGen]
  );

  setupWebSocketRef.current = setupWebSocket;

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
    if (!BRIDGE_AVAILABLE || roomId !== null) return;
    if (preflightHostTicketRef.current) return;

    const existing = preflightSessionPromiseRef.current;
    if (existing) {
      await existing;
      return;
    }

    const gen0 = readBridgeGen();
    const inflightGen = preflightAbortGenerationRef.current;
    const stillValid = () =>
      inflightGen === preflightAbortGenerationRef.current && readBridgeGen() === gen0 && enabledRef.current;

    preflightAbortRef.current?.abort();
    const ac = new AbortController();
    preflightAbortRef.current = ac;
    setPreparingSession(true);
    setError(null);
    setStatus('connecting');

    const promiseSlot: { current: Promise<void> | null } = { current: null };
    const p = (async () => {
      try {
        const res = await fetch(`${BRIDGE_HTTP_BASE}/rooms`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ hostDisplayName: null }),
          signal: ac.signal,
        });
        if (!stillValid()) return;
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error((body as { error?: string }).error || `Failed to start partner session (status ${res.status})`);
        }
        const json = (await res.json()) as { roomId: string; pairCode: string; hostTicket: string };
        if (!stillValid()) return;
        preflightRoomIdRef.current = json.roomId;
        preflightPairCodeRef.current = json.pairCode;
        preflightHostTicketRef.current = json.hostTicket;
        await registerLovenseWithBridge(json.hostTicket);
        if (!stillValid()) return;
        setupWebSocket(json.hostTicket, true);
      } catch (e: unknown) {
        if (e instanceof DOMException && e.name === 'AbortError') return;
        if (e instanceof Error && e.name === 'AbortError') return;
        if (!stillValid()) return;
        setStatus('error');
        setError(e instanceof Error ? e.message : 'Failed to prepare partner session.');
      } finally {
        if (preflightAbortRef.current === ac) {
          preflightAbortRef.current = null;
        }
        setPreparingSession(false);
        if (preflightSessionPromiseRef.current === promiseSlot.current) {
          preflightSessionPromiseRef.current = null;
        }
      }
    })();

    promiseSlot.current = p;
    preflightSessionPromiseRef.current = p;
    await p;
  }, [roomId, setupWebSocket, readBridgeGen]);

  /** Invalidate in-flight preflight whenever partner gate or room changes (effect below had no cleanup on early return). */
  useEffect(() => {
    return () => {
      preflightAbortGenerationRef.current += 1;
      preflightAbortRef.current?.abort();
    };
  }, [enabled, roomId, startPreflightSession]);

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
      const pendingPreflight = preflightSessionPromiseRef.current;
      if (pendingPreflight) {
        try {
          await pendingPreflight;
        } catch {
          /* aborted or failed — may promote below or fall back to POST */
        }
      }
      if (preflightRoomIdRef.current && preflightPairCodeRef.current) {
        setRoomId(preflightRoomIdRef.current);
        setPairCode(preflightPairCodeRef.current);
        setIsHost(true);
        setStatus(peerConnected ? 'online' : 'waiting_partner');
        return;
      }
      setStatus('connecting');
      setError(null);
      const genCreate = readBridgeGen();
      const res = await fetch(`${BRIDGE_HTTP_BASE}/rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hostDisplayName: null }),
      });
      if (readBridgeGen() !== genCreate) return;
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error || `Failed to create room (status ${res.status})`);
      }
      const json = (await res.json()) as { roomId: string; pairCode: string; hostTicket: string };
      if (readBridgeGen() !== genCreate) return;
      setRoomId(json.roomId);
      setPairCode(json.pairCode);
      setIsHost(true);
      setStatus('connecting');
      await registerLovenseWithBridge(json.hostTicket);
      if (readBridgeGen() !== genCreate) return;
      setupWebSocket(json.hostTicket, true);
    } catch (e: unknown) {
      setStatus('error');
      setError(e instanceof Error ? e.message : 'Failed to create room.');
    }
  }, [peerConnected, setupWebSocket, readBridgeGen]);

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
        preflightAbortGenerationRef.current += 1;
        preflightAbortRef.current?.abort();
        preflightSessionPromiseRef.current = null;
        closeSocket();
        preflightRoomIdRef.current = null;
        preflightPairCodeRef.current = null;
        preflightHostTicketRef.current = null;
      }
      setStatus('connecting');
      setError(null);
      const genJoin = readBridgeGen();
      const res = await fetch(`${BRIDGE_HTTP_BASE}/rooms/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pairCode: trimmed, guestDisplayName: null }),
      });
      if (readBridgeGen() !== genJoin) return;
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const err = body as { error?: string; detail?: string };
        throw new Error(err.detail || err.error || `Failed to join room (status ${res.status})`);
      }
      const json = (await res.json()) as { roomId: string; guestTicket: string };
      if (readBridgeGen() !== genJoin) return;
      await registerLovenseWithBridge(json.guestTicket);
      if (readBridgeGen() !== genJoin) return;
      setRoomId(json.roomId);
      setPairCode(trimmed);
      setIsHost(false);
      setupWebSocket(json.guestTicket, false);
    } catch (e: unknown) {
      setStatus('error');
      setError(e instanceof Error ? e.message : 'Failed to join room.');
    }
  }, [closeSocket, setupWebSocket, readBridgeGen]);

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
      if (bridgeSessionRecovery !== 'ok' || !client?.isSocketIoConnected || !peerConnected) return;
      client.sendEvent(
        'basicapi_send_toy_command_ts',
        buildLovenseCommandPayload(toyId, action, timeSec, loopRunningSec, loopPauseSec)
      );
    },
    [peerConnected, bridgeSessionRecovery]
  );

  const sendLovenseCommand = useCallback(
    (toyId: string, action: string, timeSec: number = 0, loopRunningSec?: number, loopPauseSec?: number) => {
      const client = lovenseClientRef.current;
      if (bridgeSessionRecovery !== 'ok' || !client?.isSocketIoConnected || !peerConnected) return;
      client.sendEvent(
        'basicapi_send_toy_command_ts',
        buildLovenseCommandPayload(toyId, action, timeSec, loopRunningSec, loopPauseSec)
      );
    },
    [peerConnected, bridgeSessionRecovery]
  );

  const disconnect = useCallback(() => {
    intentionalDisconnectRef.current = true;
    reconnectGenRef.current += 1;
    bridgeConnectionEpochRef.current += 1;
    closeSocket();
    dispatch(bumpBridgeSocketGeneration());
    resetState();
    intentionalDisconnectRef.current = false;
  }, [closeSocket, resetState, dispatch]);

  const sendChatMessage = useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const { ok } = validateChatTextClient(trimmed);
    if (!ok) return;
    const client = lovenseClientRef.current;
    if (bridgeSessionRecovery !== 'ok' || !client?.isSocketIoConnected) return;
    client.sendEvent('bridge_chat_message', { text: trimmed, ts: Date.now() });
  }, [bridgeSessionRecovery]);

  const sendChatVoice = useCallback(
    async (blob: Blob, mime: string, durationMs?: number) => {
      const client = lovenseClientRef.current;
      if (bridgeSessionRecovery !== 'ok' || !client?.isSocketIoConnected) return;
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
    [bridgeSessionRecovery]
  );

  const sendChatTyping = useCallback((typing: boolean) => {
    const client = lovenseClientRef.current;
    if (bridgeSessionRecovery !== 'ok' || !client?.isSocketIoConnected) return;
    client.sendEvent('bridge_chat_typing', { typing });
  }, [bridgeSessionRecovery]);

  const sendBridgeSetToyRules = useCallback(
    (payload: { enabledToyIds?: string[]; maxPower?: number; limits?: Record<string, number> }) => {
      const client = lovenseClientRef.current;
      if (bridgeSessionRecovery !== 'ok' || !client?.isSocketIoConnected) return;
      client.sendEvent('bridge_set_toy_rules', payload);
    },
    [bridgeSessionRecovery]
  );

  useEffect(() => {
    if (bridgeSessionRecovery !== 'ok' || !lovenseClientRef.current?.isSocketIoConnected) return;
    if (activeToyIds === undefined && limits === undefined) return;
    if (!hasSelfDeviceInfo) return;
    const myToyIds = Object.keys(localToysFromBridge);
    const enabledToyIds = localEnabledToyIds.filter((id) => myToyIds.includes(id));
    const localLimits: Record<string, number> = {};
    if (limits) {
      for (const [featureId, value] of Object.entries(limits)) {
        if (localFeatureIdSet.has(featureId)) localLimits[featureId] = Math.max(1, value);
      }
    }
    const maxPower = maxPowerFromLimits(localLimits);
    sendBridgeSetToyRules({
      enabledToyIds,
      ...(maxPower !== undefined && { maxPower }),
      ...(Object.keys(localLimits).length > 0 && { limits: localLimits }),
    });
  }, [
    bridgeSessionRecovery,
    status,
    activeToyIds,
    limits,
    hasSelfDeviceInfo,
    localEnabledToyIds,
    localFeatureIdSet,
    localToysFromBridge,
    sendBridgeSetToyRules,
  ]);

  const isLocalToyPolicyToggleFrozen = useCallback(
    (toyId: string) => (localToyPolicyCooldownUntilRef.current[toyId] ?? 0) > Date.now(),
    [localToyPolicyCooldownEpoch]
  );

  const toggleLocalToyEnabled = useCallback((toyId: string) => {
    const now = Date.now();
    if ((localToyPolicyCooldownUntilRef.current[toyId] ?? 0) > now) return;
    localToyPolicyCooldownUntilRef.current[toyId] = now + LOCAL_TOY_POLICY_UI_COOLDOWN_MS;
    setLocalToyPolicyCooldownEpoch((e) => e + 1);
    window.setTimeout(() => {
      delete localToyPolicyCooldownUntilRef.current[toyId];
      setLocalToyPolicyCooldownEpoch((e) => e + 1);
    }, LOCAL_TOY_POLICY_UI_COOLDOWN_MS);
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
    isLocalToyPolicyToggleFrozen,
    partnerEnabledToyIds,
    partnerLimits,
    selfQrUrl,
    selfQrCode,
    selfSessionReady,
    partnerSetupPhase,
    bridgeSessionRecovery,
    partnerEverConnected,
    socketIoConnected,
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
