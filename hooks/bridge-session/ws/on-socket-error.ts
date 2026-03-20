import type { SetStateAction } from 'react';
import type { BridgeStatus } from '../types';

export interface OnSocketErrorCtx {
  myClientSerial: number;
  myEpoch: number;
  bridgeGenAtSetup: number;
  activeBridgeClientSerialRef: { current: number };
  bridgeConnectionEpochRef: { current: number };
  readBridgeGen: () => number;
  intentionalDisconnectRef: { current: boolean };
  enabledRef: { current: boolean };
  roomSessionTicketRef: { current: string | null };
  roomIdRef: { current: string | null };
  preflightHostTicketRef: { current: string | null };
  setBridgeSessionRecovery: (a: 'ok' | 'reconnecting' | 'failed') => void;
  setError: (a: string | null) => void;
  setStatus: (a: SetStateAction<BridgeStatus>) => void;
  scheduleBridgeReconnect: () => void;
}

export function createOnSocketError(ctx: OnSocketErrorCtx) {
  return () => {
    if (ctx.myClientSerial !== ctx.activeBridgeClientSerialRef.current) return;
    if (ctx.myEpoch !== ctx.bridgeConnectionEpochRef.current) return;
    if (ctx.readBridgeGen() !== ctx.bridgeGenAtSetup) return;
    if (
      !ctx.intentionalDisconnectRef.current &&
      ctx.enabledRef.current &&
      ctx.roomSessionTicketRef.current &&
      (ctx.roomIdRef.current != null || ctx.preflightHostTicketRef.current != null)
    ) {
      ctx.setBridgeSessionRecovery('reconnecting');
      ctx.setError(null);
      ctx.scheduleBridgeReconnect();
      return;
    }
    ctx.setStatus('error');
    ctx.setError('Error while communicating with tunnel.');
  };
}
