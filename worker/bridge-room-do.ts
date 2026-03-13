import { DurableObject } from 'cloudflare:workers';
import { jwtVerify } from 'jose';
import type {
  BridgeClientMessage,
  BridgeCommandPayload,
  BridgeServerMessage,
  BridgeTicketPayload,
  BridgeToyCapability,
} from '../lib/bridge/protocol';

interface SessionMeta {
  roomId: string;
  userId: string;
  role: 'host' | 'guest';
  capabilities: BridgeToyCapability[];
  rateWindowStartMs: number;
  rateCount: number;
  nonceExpiryMsByValue: Map<string, number>;
}

const RATE_WINDOW_MS = 5000;
const MAX_COMMANDS_PER_WINDOW = 30;
const NONCE_TTL_MS = 60000;
const MAX_TOYS_PER_CAPABILITIES = 24;
const MAX_NONCES_TRACKED = 1024;

function toTextMessage(message: ArrayBuffer | string): string | null {
  if (typeof message === 'string') return message;
  try {
    return new TextDecoder().decode(message);
  } catch {
    return null;
  }
}

function clampNumber(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function sanitizeCapabilities(input: BridgeToyCapability[]): BridgeToyCapability[] {
  return input.slice(0, MAX_TOYS_PER_CAPABILITIES).map((toy) => {
    const maxLevel = clampNumber(Number(toy.maxLevel || 0), 1, 20);
    const maxTimeSec = clampNumber(Number(toy.maxTimeSec || 0), 1, 180);
    const supportedFunctions = Array.isArray(toy.supportedFunctions)
      ? toy.supportedFunctions
          .filter((name): name is string => typeof name === 'string')
          .map((name) => name.trim())
          .filter(Boolean)
          .slice(0, 20)
      : [];

    return {
      id: String(toy.id),
      name: String(toy.name || 'Unknown'),
      toyType: toy.toyType ? String(toy.toyType) : undefined,
      supportedFunctions,
      maxLevel,
      maxTimeSec,
    };
  });
}

function parseActionTokens(action: string): Array<{ name: string; level: number }> | null {
  if (action === 'Stop') return [];
  const segments = action
    .split(';')
    .map((segment) => segment.trim())
    .filter(Boolean);
  if (segments.length === 0) return null;

  const parsed: Array<{ name: string; level: number }> = [];
  for (const segment of segments) {
    const separatorIdx = segment.indexOf(':');
    if (separatorIdx <= 0) continue;
    const name = segment.slice(0, separatorIdx).trim();
    const rawLevel = Number(segment.slice(separatorIdx + 1).trim());
    if (!name || Number.isNaN(rawLevel)) continue;
    parsed.push({ name, level: rawLevel });
  }
  return parsed.length > 0 ? parsed : null;
}

function sanitizeCommand(
  payload: BridgeCommandPayload,
  receiverToy: BridgeToyCapability
): Omit<BridgeCommandPayload, 'nonce'> | null {
  const commandAction = String(payload.action || '');
  if (!commandAction) return null;
  if (commandAction === 'Stop') {
    return { toyId: payload.toyId, action: 'Stop', timeSec: 0 };
  }

  const parsedTokens = parseActionTokens(commandAction);
  if (!parsedTokens) return null;

  const allowed = new Set(
    (receiverToy.supportedFunctions || []).map((name) => name.trim().toLowerCase()).filter(Boolean)
  );

  const sanitizedTokens: string[] = [];
  for (const token of parsedTokens) {
    if (allowed.size > 0 && !allowed.has(token.name.toLowerCase())) {
      continue;
    }
    const clampedLevel = clampNumber(Math.round(token.level), 0, receiverToy.maxLevel);
    sanitizedTokens.push(`${token.name}:${clampedLevel}`);
  }

  if (sanitizedTokens.length === 0) return null;

  const next: Omit<BridgeCommandPayload, 'nonce'> = {
    toyId: payload.toyId,
    action: sanitizedTokens.join(';'),
    timeSec: clampNumber(Number(payload.timeSec || 0), 0, receiverToy.maxTimeSec),
  };

  if (payload.loopPauseSec !== undefined && payload.loopRunningSec !== undefined) {
    next.loopPauseSec = clampNumber(Number(payload.loopPauseSec || 0), 0, receiverToy.maxTimeSec);
    next.loopRunningSec = clampNumber(Number(payload.loopRunningSec || 0), 0, receiverToy.maxTimeSec);
  }

  return next;
}

export class BridgeRoomDurableObject extends DurableObject {
  private readonly sessions = new Map<WebSocket, SessionMeta>();
  private readonly runtimeState: any;
  private readonly runtimeEnv: any;

  constructor(state: any, env: any) {
    super(state, env);
    this.runtimeState = state;
    this.runtimeEnv = env;

    for (const ws of this.runtimeState.getWebSockets()) {
      const attachment = (ws as any).deserializeAttachment() as Omit<SessionMeta, 'nonceExpiryMsByValue'> | null;
      if (!attachment) continue;
      this.sessions.set(ws, {
        ...attachment,
        nonceExpiryMsByValue: new Map<string, number>(),
      });
    }
  }

  async fetch(request: Request): Promise<Response> {
    if ((request.headers.get('Upgrade') || '').toLowerCase() !== 'websocket') {
      return new Response('Expected websocket upgrade', { status: 426 });
    }

    const ticketParam = new URL(request.url).searchParams.get('ticket');
    if (!ticketParam) {
      return new Response('Missing ticket', { status: 401 });
    }

    const jwtSecret = this.runtimeEnv?.JWT_SECRET;
    if (!jwtSecret || typeof jwtSecret !== 'string') {
      console.error('[bridge] JWT_SECRET missing or invalid in DO env');
      return new Response('Bridge misconfigured: JWT_SECRET required', { status: 500 });
    }

    let ticketPayload: BridgeTicketPayload;
    try {
      const verified = await jwtVerify(ticketParam, new TextEncoder().encode(jwtSecret));
      ticketPayload = verified.payload as unknown as BridgeTicketPayload;
      if (ticketPayload.type !== 'bridge_ticket') {
        return new Response('Invalid ticket type', { status: 401 });
      }
    } catch {
      return new Response('Invalid or expired ticket', { status: 401 });
    }

    const existingUserIds = new Set(Array.from(this.sessions.values()).map((session) => session.userId));
    if (existingUserIds.size >= 2 && !existingUserIds.has(ticketPayload.userId)) {
      return new Response('Room is full', { status: 403 });
    }

    const [client, server] = Object.values(new (globalThis as any).WebSocketPair()) as [WebSocket, WebSocket];
    this.runtimeState.acceptWebSocket(server);

    const now = Date.now();
    const session: SessionMeta = {
      roomId: ticketPayload.roomId,
      userId: ticketPayload.userId,
      role: ticketPayload.role,
      capabilities: [],
      rateWindowStartMs: now,
      rateCount: 0,
      nonceExpiryMsByValue: new Map(),
    };
    this.sessions.set(server, session);

    (server as any).serializeAttachment({
      ...session,
      nonceExpiryMsByValue: undefined,
    });

    this.send(server, {
      type: 'hello-ack',
      userId: session.userId,
      roomId: session.roomId,
    });
    this.broadcastPeerState();
    this.broadcastCapabilities();
    console.info('[bridge] connected', { roomId: session.roomId, userId: session.userId, role: session.role });

    return new Response(null, { status: 101, webSocket: client } as ResponseInit);
  }

  webSocketMessage(ws: WebSocket, message: ArrayBuffer | string) {
    const session = this.sessions.get(ws);
    if (!session) return;

    const text = toTextMessage(message);
    if (!text) {
      this.send(ws, { type: 'error', code: 'INVALID_MESSAGE', message: 'Non-text messages are not supported' });
      return;
    }

    let parsed: BridgeClientMessage;
    try {
      parsed = JSON.parse(text) as BridgeClientMessage;
    } catch {
      this.send(ws, { type: 'error', code: 'INVALID_JSON', message: 'Malformed JSON' });
      return;
    }

    if (parsed.type === 'ping') {
      this.send(ws, { type: 'pong', ts: parsed.ts });
      return;
    }

    if (parsed.type === 'hello') {
      this.send(ws, { type: 'hello-ack', userId: session.userId, roomId: session.roomId });
      this.broadcastPeerState();
      return;
    }

    if (parsed.type === 'capabilities') {
      session.capabilities = sanitizeCapabilities(parsed.toys || []);
      this.broadcastCapabilities();
      return;
    }

    if (parsed.type !== 'command') {
      this.send(ws, { type: 'error', code: 'UNSUPPORTED_MESSAGE', message: 'Message type is not supported' });
      return;
    }

    const now = Date.now();
    if (now - session.rateWindowStartMs > RATE_WINDOW_MS) {
      session.rateWindowStartMs = now;
      session.rateCount = 0;
    }
    session.rateCount += 1;
    if (session.rateCount > MAX_COMMANDS_PER_WINDOW) {
      this.send(ws, { type: 'rate-limited', retryAfterMs: RATE_WINDOW_MS });
      console.warn('[bridge] rate_limited', { roomId: session.roomId, userId: session.userId });
      return;
    }

    const nonce = String(parsed.payload.nonce || '');
    if (!nonce) {
      this.send(ws, { type: 'error', code: 'MISSING_NONCE', message: 'nonce is required' });
      return;
    }

    for (const [nonceValue, expiryMs] of session.nonceExpiryMsByValue.entries()) {
      if (expiryMs < now) session.nonceExpiryMsByValue.delete(nonceValue);
    }
    if (session.nonceExpiryMsByValue.has(nonce)) {
      this.send(ws, { type: 'error', code: 'NONCE_REPLAY', message: 'Replay detected' });
      console.warn('[bridge] replay_blocked', { roomId: session.roomId, userId: session.userId });
      return;
    }
    session.nonceExpiryMsByValue.set(nonce, now + NONCE_TTL_MS);
    if (session.nonceExpiryMsByValue.size > MAX_NONCES_TRACKED) {
      const oldest = session.nonceExpiryMsByValue.keys().next().value;
      if (oldest) session.nonceExpiryMsByValue.delete(oldest);
    }

    const peerEntry = Array.from(this.sessions.entries()).find(([, candidate]) => candidate.userId !== session.userId);
    if (!peerEntry) {
      this.send(ws, { type: 'error', code: 'PEER_OFFLINE', message: 'Peer is not connected' });
      return;
    }
    const [peerSocket, peer] = peerEntry;

    const receiverToy = peer.capabilities.find((toy) => toy.id === parsed.payload.toyId);
    if (!receiverToy) {
      this.send(ws, { type: 'error', code: 'TOY_NOT_ALLOWED', message: 'Toy is not exposed by peer policy' });
      return;
    }

    const sanitized = sanitizeCommand(parsed.payload, receiverToy);
    if (!sanitized) {
      this.send(ws, { type: 'error', code: 'INVALID_COMMAND', message: 'Command rejected by policy' });
      console.warn('[bridge] command_rejected', { roomId: session.roomId, fromUserId: session.userId });
      return;
    }

    this.send(peerSocket, {
      type: 'partner-command',
      fromUserId: session.userId,
      payload: sanitized,
    });
    console.info('[bridge] command_forwarded', {
      roomId: session.roomId,
      fromUserId: session.userId,
      toUserId: peer.userId,
      toyId: sanitized.toyId,
    });
  }

  webSocketClose(ws: WebSocket) {
    const session = this.sessions.get(ws);
    if (session) {
      console.info('[bridge] disconnected', { roomId: session.roomId, userId: session.userId });
    }
    this.sessions.delete(ws);
    this.broadcastPeerState();
    this.broadcastCapabilities();
  }

  webSocketError(ws: WebSocket) {
    this.sessions.delete(ws);
    this.broadcastPeerState();
    this.broadcastCapabilities();
  }

  private send(ws: WebSocket, payload: BridgeServerMessage) {
    try {
      ws.send(JSON.stringify(payload));
    } catch {
      // Ignore send failures. The close handler will clean up state.
    }
  }

  private broadcastPeerState() {
    const sessionEntries = Array.from(this.sessions.entries());
    for (const [socket, session] of sessionEntries) {
      const peer = sessionEntries.find(([, candidate]) => candidate.userId !== session.userId)?.[1];
      this.send(socket, {
        type: 'peer-state',
        peer: peer
          ? {
              userId: peer.userId,
              connected: true,
            }
          : null,
      });
    }
  }

  private broadcastCapabilities() {
    const sessionEntries = Array.from(this.sessions.entries());
    for (const [socket, session] of sessionEntries) {
      const peer = sessionEntries.find(([, candidate]) => candidate.userId !== session.userId)?.[1];
      this.send(socket, {
        type: 'peer-capabilities',
        toys: peer?.capabilities || [],
      });
    }
  }
}
