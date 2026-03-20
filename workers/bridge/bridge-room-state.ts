import { DurableObject } from 'cloudflare:workers';
import type { RoomRules } from './protocol';
import type { Env } from './env';

/** Shared durable state for BridgeRoom (split across bridge-room-*.ts for file size). */
export abstract class BridgeRoomState extends DurableObject<Env> {
  protected ctx: DurableObjectState;
  protected roomId = '';
  protected hostFrontend: WebSocket | null = null;
  protected guestFrontend: WebSocket | null = null;
  protected hostBackend: WebSocket | null = null;
  protected guestBackend: WebSocket | null = null;
  protected hostBackendQueue: string[] = [];
  protected guestBackendQueue: string[] = [];
  protected lastHostBackendMsg: string | null = null;
  protected lastGuestBackendMsg: string | null = null;
  protected hostAuthToken: string | null = null;
  protected hostSessionId: string | null = null;
  protected guestSessionId: string | null = null;
  protected hostSessionReady = false;
  protected guestSessionReady = false;
  protected guestUsesHostBackend = false;
  protected rules: RoomRules = {
    hostEnabledToyIds: null,
    hostToyMaxPower: null,
    hostLimits: null,
    guestEnabledToyIds: null,
    guestToyMaxPower: null,
    guestLimits: null,
  };
  protected chatBuffer: { text: string; ts: number; role: 'host' | 'guest' }[] = [];
  protected lastHostChatTs = 0;
  protected lastGuestChatTs = 0;
  protected hostToyEnableToggleAtMs = new Map<string, number>();
  protected guestToyEnableToggleAtMs = new Map<string, number>();
  protected cleanupAlarmScheduled = false;
  protected readonly ROOM_IDLE_TIMEOUT_MS = 3600 * 1000;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.ctx = ctx;
  }
}
