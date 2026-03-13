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

export type BridgeClientMessage =
  | { type: 'hello'; version: 1 }
  | { type: 'capabilities'; toys: BridgeToyCapability[] }
  | { type: 'command'; payload: BridgeCommandPayload }
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
