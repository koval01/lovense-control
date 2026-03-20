export type BridgeStatus = 'idle' | 'connecting' | 'waiting_partner' | 'online' | 'error';

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

/** Raw toy shape from Lovense API device list (basicapi_update_device_info_tc). */
export interface RawToy {
  id: string;
  name?: string;
  toyType?: string;
  connected?: boolean;
  battery?: number;
  shortFunctionNames?: string[];
  fullFunctionNames?: string[];
}
