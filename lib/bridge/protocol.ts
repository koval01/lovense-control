export interface BridgeToyCapability {
  id: string;
  name: string;
  toyType?: string;
  supportedFunctions?: string[];
  maxLevel: number;
  maxTimeSec: number;
}

export interface BridgeRoomPeerState {
  userId: string;
  connected: boolean;
}

export interface BridgeCommandPayload {
  toyId: string;
  action: string;
  timeSec?: number;
  loopRunningSec?: number;
  loopPauseSec?: number;
  nonce: string;
}

export interface BridgeLovenseCommandPayload {
  /**
   * Original Lovense Socket.IO event name.
   * For commands this will usually be "basicapi_send_toy_command_ts".
   */
  event: string;
  /**
   * Raw Lovense payload object that would normally be sent by the browser.
   * Example:
   * { command: "Function", action: "Vibrate1:5", timeSec: 0, apiVer: 1, toy: "ABC", stopPrevious: 0 }
   */
  payload: Record<string, unknown>;
  /**
   * Client-generated id for tracking / idempotency.
   */
  nonce: string;
}

export type BridgeClientMessage =
  | { type: 'hello'; version: 1 }
  | { type: 'capabilities'; toys: BridgeToyCapability[] }
  | { type: 'command'; payload: BridgeCommandPayload }
  | { type: 'lovense-command'; payload: BridgeLovenseCommandPayload }
  | { type: 'ping'; ts: number };

export type BridgeServerMessage =
  | { type: 'hello-ack'; userId: string; roomId: string }
  | { type: 'peer-state'; peer: BridgeRoomPeerState | null }
  | { type: 'peer-capabilities'; toys: BridgeToyCapability[] }
  | {
      type: 'partner-command';
      fromUserId: string;
      payload: Omit<BridgeCommandPayload, 'nonce'>;
    }
  | { type: 'error'; code: string; message: string }
  | { type: 'rate-limited'; retryAfterMs: number }
  | { type: 'pong'; ts: number };

export interface BridgeInviteTokenPayload {
  type: 'bridge_invite';
  roomId: string;
  hostUserId: string;
}

export interface BridgeTicketPayload {
  type: 'bridge_ticket';
  roomId: string;
  userId: string;
  role: 'host' | 'guest';
}
