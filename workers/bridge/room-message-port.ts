import type { RoomRules } from './protocol';

export type ChatBufferEntry = { text: string; ts: number; role: 'host' | 'guest' };

/** Narrow surface passed to `room-app-message` helpers (BridgeRoom satisfies structurally). */
export interface BridgeRoomMessagePort {
  rules: RoomRules;
  hostFrontend: WebSocket | null;
  guestFrontend: WebSocket | null;
  hostBackend: WebSocket | null;
  guestBackend: WebSocket | null;
  guestUsesHostBackend: boolean;
  lastHostChatTs: number;
  lastGuestChatTs: number;
  chatBuffer: ChatBufferEntry[];
  sendToWebSocket(ws: WebSocket | null, msg: string | null): void;
  queueToBackend(role: 'host' | 'guest', msg: string): void;
  canApplyEnabledToyChanges(
    role: 'host' | 'guest',
    prev: Set<string> | null,
    next: Set<string>
  ): boolean;
  recordEnabledToyToggles(
    role: 'host' | 'guest',
    prev: Set<string> | null,
    next: Set<string>
  ): void;
  forceStopToyOnOwnerBackend(ownerRole: 'host' | 'guest', toyId: string): void;
  ownerBackendRole(ownerRole: 'host' | 'guest'): 'host' | 'guest';
}
