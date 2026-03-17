/**
 * Room Durable Object: WebSocket handling, Lovense backend tunnels, routing.
 */

import { DurableObject } from 'cloudflare:workers';
import { decodeTicket, sessionIdFromProof } from './auth';
import { getSocketUrl, buildWebSocketUrl, LovenseApiError } from './lovense';
import {
  BRIDGE_CHAT_MESSAGE,
  BRIDGE_CHAT_TYPING,
  BRIDGE_CHAT_VOICE,
  BRIDGE_PING,
  BRIDGE_PONG,
  BRIDGE_SET_TOY_RULES,
  buildAppMessage,
  isDeviceOrStatusEvent,
  partnerStatusMsg,
  partnerToyRulesMsg,
  parseAppMessage,
  type RoomRules,
} from './protocol';
import {
  buildChatHistoryEvent,
  buildChatMessageEvent,
  CHAT_BUFFER_SIZE,
  CHAT_FLOOD_INTERVAL_SEC,
  validateChatText,
  VOICE_MAX_BASE64_LEN,
  VOICE_MAX_DURATION_MS,
} from './chat';
import {
  applyRulesAndForwardCommand,
  applySetToyRulesPayload,
  partnerHasRules,
} from './rules';

const ENGINE_OPEN = '0{"sid":"bridge-session","upgrades":[],"pingInterval":25000,"pingTimeout":50000}';
const PROBE_REQUEST = '2probe';
const PROBE_RESPONSE = '3probe';
const UPGRADE_ACK = '40';
const PING = '2';
const PONG = '3';
const WS_MESSAGE_MAX_BYTES = 256 * 1024;
const FORWARD_ONLY_EVENTS = new Set([BRIDGE_PING, BRIDGE_PONG, BRIDGE_CHAT_TYPING]);
const PING_INTERVAL_MS = 20_000;

export interface Env {
  JWT_SECRET: string;
  BRIDGE_REGISTRY: DurableObjectNamespace;
  BRIDGE_ROOM: DurableObjectNamespace;
  ALLOW_SELF_PAIRING?: string;
}

export class BridgeRoom extends DurableObject<Env> {
  private ctx: DurableObjectState;
  private roomId: string = '';
  private hostFrontend: WebSocket | null = null;
  private guestFrontend: WebSocket | null = null;
  private hostBackend: WebSocket | null = null;
  private guestBackend: WebSocket | null = null;
  private hostBackendQueue: string[] = [];
  private guestBackendQueue: string[] = [];
  private lastHostBackendMsg: string | null = null;
  private lastGuestBackendMsg: string | null = null;
  private hostAuthToken: string | null = null;
  private hostSessionId: string | null = null;
  private guestSessionId: string | null = null;
  private guestUsesHostBackend = false;
  private rules: RoomRules = {
    hostEnabledToyIds: null,
    hostToyMaxPower: null,
    hostLimits: null,
    guestEnabledToyIds: null,
    guestToyMaxPower: null,
    guestLimits: null,
  };
  private chatBuffer: { text: string; ts: number; role: 'host' | 'guest' }[] = [];
  private lastHostChatTs = 0;
  private lastGuestChatTs = 0;

  private cleanupAlarmScheduled = false;
  private readonly ROOM_IDLE_TIMEOUT_MS = 3600 * 1000; // 1 hour

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.ctx = ctx;
  }

  async alarm(): Promise<void> {
    if (this.hostFrontend || this.guestFrontend) return;
    try {
      const registryId = this.env.BRIDGE_REGISTRY.idFromName('bridge-registry');
      const stub = this.env.BRIDGE_REGISTRY.get(registryId);
      await stub.fetch(
        `https://internal/internal/remove-room?roomId=${encodeURIComponent(this.roomId)}`,
        { method: 'POST' }
      );
      console.log(`[BridgeRoom] Room cleaned up: roomId=${this.roomId}`);
    } catch (err) {
      console.error(`[BridgeRoom] Cleanup failed: roomId=${this.roomId}`, err);
    }
  }

  private maybeScheduleCleanupAlarm(): void {
    if (this.hostFrontend || this.guestFrontend) return;
    if (this.cleanupAlarmScheduled) return;
    this.cleanupAlarmScheduled = true;
    this.ctx.storage.setAlarm(Date.now() + this.ROOM_IDLE_TIMEOUT_MS);
  }

  private static normalizePath(path: string): string {
    if (path.startsWith('/bridge')) {
      const rest = path.slice(7) || '/';
      return rest.startsWith('/') ? rest : `/${rest}`;
    }
    return path;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = BridgeRoom.normalizePath(url.pathname);

    if (request.method === 'POST' && (path === '/internal/register' || path === '/getSocketUrl')) {
      return this.handleRegister(request);
    }
    if (request.method === 'GET' && (path === '/internal/ws' || path === '/ws')) {
      return this.handleWebSocketUpgrade(request);
    }

    return new Response('Not Found', { status: 404 });
  }

  private async handleRegister(request: Request): Promise<Response> {
    const secret = this.env.JWT_SECRET;
    if (!secret) {
      return Response.json({ error: 'JWT_SECRET not configured' }, { status: 500 });
    }

    let body: { authToken?: string; ticket?: string; sessionProof?: string };
    try {
      body = (await request.json()) as typeof body;
    } catch {
      return Response.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const { authToken, ticket, sessionProof } = body;
    if (!authToken || !ticket) {
      return Response.json({ error: 'authToken and ticket required' }, { status: 400 });
    }

    let roomId: string;
    let role: 'host' | 'guest';
    try {
      const decoded = await decodeTicket(ticket, secret);
      roomId = decoded.roomId;
      role = decoded.role;
    } catch {
      return Response.json({ detail: 'Invalid ticket' }, { status: 401 });
    }

    this.roomId = roomId;

    let socketInfo;
    try {
      socketInfo = await getSocketUrl(authToken);
    } catch (e) {
      if (e instanceof LovenseApiError) {
        return Response.json({ detail: e.message }, { status: e.status });
      }
      console.error('[BridgeRoom] Lovense getSocketUrl failed:', e);
      return Response.json(
        { detail: 'Lovense service temporarily unavailable' },
        { status: 502 }
      );
    }

    const wsUrl = buildWebSocketUrl(socketInfo, authToken);
    const guestSessionId = await sessionIdFromProof(sessionProof, secret);

    if (role === 'host') {
      this.hostAuthToken = authToken;
      this.hostSessionId = guestSessionId;
    }

    const allowSelfPairing =
      this.env.ALLOW_SELF_PAIRING === '1' ||
      this.env.ALLOW_SELF_PAIRING === 'true' ||
      this.env.ALLOW_SELF_PAIRING === 'yes';

    if (role === 'guest') {
      if (
        !allowSelfPairing &&
        this.hostSessionId &&
        guestSessionId &&
        guestSessionId === this.hostSessionId
      ) {
        return Response.json(
          {
            detail:
              'Self-pairing is disabled. Use a different browser or device (different session) to join as guest.',
          },
          { status: 403 }
        );
      }
      if (allowSelfPairing) {
        const sameSession = this.hostSessionId && guestSessionId === this.hostSessionId;
        const sameToken = this.hostAuthToken && this.hostAuthToken === authToken;
        if (sameSession || sameToken) {
          this.guestUsesHostBackend = true;
          return Response.json({ ok: true });
        }
      }
      this.guestSessionId = guestSessionId ?? undefined;
    }

    if (role === 'host' && !allowSelfPairing && this.guestSessionId && this.hostSessionId) {
      if (this.guestSessionId === this.hostSessionId && this.guestFrontend) {
        try {
          this.guestFrontend.close(1008, 'Same session as host; use different device');
        } catch {
          // ignore
        }
        this.guestFrontend = null;
      }
    }

    this.spawnBackendTunnel(wsUrl, role);
    return Response.json({ ok: true });
  }

  private spawnBackendTunnel(wsUrl: string, role: 'host' | 'guest'): void {
    // Use WebSocket constructor instead of fetch() — Cloudflare's fetch can reject wss:// URLs
    // with "Fetch API cannot load" in some contexts (e.g. Durable Objects).
    let ws: WebSocket;
    try {
      ws = new WebSocket(wsUrl);
    } catch (err) {
      console.error(`[BridgeRoom] Lovense backend connect failed: room=${this.roomId} role=${role}`, err);
      if (role === 'host') this.hostBackend = null;
      else this.guestBackend = null;
      return;
    }

    ws.addEventListener('open', () => {
      if (role === 'host') {
        this.hostBackend = ws;
      } else {
        this.guestBackend = ws;
        if (this.guestUsesHostBackend && this.hostBackend) {
          (this as { guestBackend: WebSocket | null }).guestBackend = this.hostBackend;
        }
      }
      console.log(`[BridgeRoom] Lovense backend connected: room=${this.roomId} role=${role}`);

      ws.addEventListener('message', (ev) => {
        const data = typeof ev.data === 'string' ? ev.data : new TextDecoder().decode(ev.data);
        if (data.startsWith('0{')) {
          ws.send('40');
        } else if (data.startsWith('42')) {
          this.routeBackendToFrontends(data, role);
        }
      });

      const { pingId, writeId } = this.runBackendLoops(ws, role);
      ws.addEventListener('close', () => {
        clearInterval(pingId);
        clearInterval(writeId);
        if (role === 'host') this.hostBackend = null;
        else if (!this.guestUsesHostBackend) this.guestBackend = null;
        console.log(`[BridgeRoom] Lovense backend closed: room=${this.roomId} role=${role}`);
      });
    });

    ws.addEventListener('error', (err) => {
      console.error(`[BridgeRoom] Lovense backend connect failed: room=${this.roomId} role=${role}`, err);
      if (role === 'host') this.hostBackend = null;
      else this.guestBackend = null;
    });
  }

  private runBackendLoops(ws: WebSocket, role: 'host' | 'guest'): { pingId: ReturnType<typeof setInterval>; writeId: ReturnType<typeof setInterval> } {
    const pingId = setInterval(() => {
      try {
        if (ws.readyState === WebSocket.OPEN) ws.send(PING);
      } catch {
        clearInterval(pingId);
      }
    }, PING_INTERVAL_MS);

    const queue = role === 'host' ? this.hostBackendQueue : this.guestBackendQueue;
    const writeId = setInterval(() => {
      if (queue.length > 0 && ws.readyState === WebSocket.OPEN) {
        const msg = queue.shift();
        if (msg) ws.send(msg);
      }
    }, 50);

    return { pingId, writeId };
  }

  private routeBackendToFrontends(data: string, fromBackendRole: 'host' | 'guest'): void {
    if (isDeviceOrStatusEvent(data)) {
      if (fromBackendRole === 'host') {
        this.lastHostBackendMsg = data;
        if (this.guestUsesHostBackend) this.lastGuestBackendMsg = data;
      } else {
        this.lastGuestBackendMsg = data;
      }
    }
    const frontend = fromBackendRole === 'host' ? this.guestFrontend : this.hostFrontend;
    if (frontend) this.sendToWebSocket(frontend, data);
  }

  private queueToBackend(role: 'host' | 'guest', msg: string): void {
    const backend = role === 'host' ? this.hostBackend : this.guestBackend;
    const queue = role === 'host' ? this.hostBackendQueue : this.guestBackendQueue;
    if (backend && backend.readyState === WebSocket.OPEN) {
      backend.send(msg);
    } else {
      queue.push(msg);
    }
  }

  private async handleWebSocketUpgrade(request: Request): Promise<Response> {
    const upgrade = request.headers.get('Upgrade');
    if (upgrade !== 'websocket') {
      return new Response('Expected WebSocket upgrade', { status: 426 });
    }

    const url = new URL(request.url);
    const ticket = url.searchParams.get('ticket');
    if (!ticket) {
      return new Response('ticket required', { status: 400 });
    }

    const secret = this.env.JWT_SECRET;
    if (!secret) {
      return new Response('Server error', { status: 500 });
    }

    let roomId: string;
    let role: 'host' | 'guest';
    try {
      const decoded = await decodeTicket(ticket, secret);
      roomId = decoded.roomId;
      role = decoded.role;
    } catch {
      return new Response('Invalid ticket', { status: 401 });
    }

    this.roomId = roomId;
    console.log(`[BridgeRoom] Frontend connected: room=${roomId} role=${role}`);

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    server.accept();

    if (role === 'host') {
      this.hostFrontend = server;
    } else {
      this.guestFrontend = server;
    }
    this.cleanupAlarmScheduled = false;

    this.replayState(server, role);

    server.send(ENGINE_OPEN);

    server.addEventListener('message', (ev) => {
      const raw = typeof ev.data === 'string' ? ev.data : new TextDecoder().decode(ev.data);
      if (raw.length > WS_MESSAGE_MAX_BYTES) return;
      this.handleFrame(server, raw, role);
    });

    server.addEventListener('close', () => {
      if (role === 'host') this.hostFrontend = null;
      else this.guestFrontend = null;
      const other = role === 'host' ? this.guestFrontend : this.hostFrontend;
      if (other) this.sendToWebSocket(other, partnerStatusMsg(false));
      this.maybeScheduleCleanupAlarm();
      console.log(`[BridgeRoom] Frontend disconnected: room=${this.roomId} role=${role}`);
    });

    return new Response(null, { status: 101, webSocket: client });
  }

  private replayState(ws: WebSocket, role: 'host' | 'guest'): void {
    const cached = role === 'host' ? this.lastGuestBackendMsg : this.lastHostBackendMsg;
    if (cached) this.sendToWebSocket(ws, cached);
    const other = role === 'host' ? this.guestFrontend : this.hostFrontend;
    if (other) this.sendToWebSocket(ws, partnerStatusMsg(true));
    if (other && partnerHasRules(this.rules, role)) {
      this.sendToWebSocket(ws, partnerToyRulesMsg(role === 'host' ? 'guest' : 'host', this.rules));
    }
    if (this.chatBuffer.length > 0) {
      this.sendToWebSocket(ws, buildChatHistoryEvent(this.chatBuffer));
    }
  }

  private sendToWebSocket(ws: WebSocket | null, msg: string | null): void {
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    if (msg) ws.send(msg);
  }

  private handleFrame(ws: WebSocket, data: string, role: 'host' | 'guest'): void {
    if (data === PROBE_REQUEST) {
      ws.send(PROBE_RESPONSE);
    } else if (data === '5') {
      ws.send(UPGRADE_ACK);
    } else if (data === UPGRADE_ACK) {
      ws.send(UPGRADE_ACK);
    } else if (data === PING) {
      ws.send(PONG);
    } else {
      this.handleAppMessage(ws, data, role);
    }
  }

  private handleAppMessage(ws: WebSocket, data: string, role: 'host' | 'guest'): void {
    const parsed = parseAppMessage(data);
    if (!parsed) return;
    const [event, payloadRaw] = parsed;

    if (event === BRIDGE_SET_TOY_RULES) {
      const payload = (payloadRaw as Record<string, unknown>) ?? {};
      const ok = applySetToyRulesPayload(
        {
          enabledToyIds: payload.enabledToyIds as string[] | undefined,
          maxPower: payload.maxPower as number | undefined,
          limits: payload.limits as Record<string, number> | undefined,
          targetRole: payload.targetRole as 'host' | 'guest' | undefined,
        },
        role,
        this.rules
      );
      if (ok) {
        const other = role === 'host' ? this.guestFrontend : this.hostFrontend;
        if (other) {
          this.sendToWebSocket(other, partnerToyRulesMsg(role, this.rules));
        }
      }
    } else if (FORWARD_ONLY_EVENTS.has(event)) {
      const other = role === 'host' ? this.guestFrontend : this.hostFrontend;
      if (other) this.sendToWebSocket(other, data);
    } else if (event === BRIDGE_CHAT_MESSAGE) {
      const payload = payloadRaw as { text?: string } | null;
      const text = (payload?.text ?? '').toString().trim();
      if (!text) return;
      const now = Date.now() / 1000;
      const lastTs = role === 'host' ? this.lastHostChatTs : this.lastGuestChatTs;
      if (now - lastTs < CHAT_FLOOD_INTERVAL_SEC) return;
      const [ok] = validateChatText(text);
      if (!ok) return;
      if (role === 'host') this.lastHostChatTs = now;
      else this.lastGuestChatTs = now;
      const ts = Math.floor(now * 1000);
      this.chatBuffer.push({ text, ts, role });
      if (this.chatBuffer.length > CHAT_BUFFER_SIZE) this.chatBuffer.shift();
      const out = buildChatMessageEvent(text, ts, role);
      this.sendToWebSocket(ws, out);
      const other = role === 'host' ? this.guestFrontend : this.hostFrontend;
      if (other) this.sendToWebSocket(other, out);
    } else if (event === BRIDGE_CHAT_VOICE) {
      const payload = payloadRaw as {
        id?: string;
        durationMs?: number;
        mime?: string;
        data?: string;
      } | null;
      if (!payload?.id || !payload?.mime || !payload?.data) return;
      if (payload.durationMs != null && payload.durationMs > VOICE_MAX_DURATION_MS) return;
      if (new TextEncoder().encode(payload.data).length > VOICE_MAX_BASE64_LEN) return;
      const now = Date.now() / 1000;
      const lastTs = role === 'host' ? this.lastHostChatTs : this.lastGuestChatTs;
      if (now - lastTs < CHAT_FLOOD_INTERVAL_SEC) return;
      if (role === 'host') this.lastHostChatTs = now;
      else this.lastGuestChatTs = now;
      const ts = Math.floor(now * 1000);
      const outPayload: Record<string, unknown> = {
        id: payload.id,
        ts,
        mime: payload.mime,
        data: payload.data,
        role,
      };
      if (payload.durationMs != null) outPayload.durationMs = payload.durationMs;
      const out = buildAppMessage(BRIDGE_CHAT_VOICE, outPayload);
      this.sendToWebSocket(ws, out);
      const other = role === 'host' ? this.guestFrontend : this.hostFrontend;
      if (other) this.sendToWebSocket(other, out);
    } else {
      const toGuestBackend = role === 'host';
      const targetBackendRole: 'host' | 'guest' =
        toGuestBackend && !this.guestUsesHostBackend ? 'guest' : 'host';
      const backend = targetBackendRole === 'host' ? this.hostBackend : this.guestBackend;
      if (!backend) return;
      const out = applyRulesAndForwardCommand(data, this.rules, toGuestBackend);
      if (out) this.queueToBackend(targetBackendRole, out);
    }
  }
}
