import type { SetStateAction } from 'react';
import type { BridgeStatus } from '../types';

export interface OnSocketCloseCtx {
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
  setPeerConnected: (v: boolean) => void;
  setSocketIoConnected: (v: boolean) => void;
  setRttMs: (v: number | null) => void;
  setStatus: (a: SetStateAction<BridgeStatus>) => void;
  setError: (a: SetStateAction<string | null>) => void;
  setBridgeSessionRecovery: (a: 'ok' | 'reconnecting' | 'failed') => void;
  scheduleBridgeReconnect: () => void;
}

export function createOnSocketClose(ctx: OnSocketCloseCtx) {
  return () => {
    if (ctx.myClientSerial !== ctx.activeBridgeClientSerialRef.current) return;
    if (ctx.myEpoch !== ctx.bridgeConnectionEpochRef.current) return;
    if (ctx.readBridgeGen() !== ctx.bridgeGenAtSetup) return;
    ctx.setPeerConnected(false);
    ctx.setSocketIoConnected(false);
    ctx.setRttMs(null);
    if (ctx.intentionalDisconnectRef.current) {
      if (!ctx.enabledRef.current) {
        ctx.setStatus('idle');
        ctx.setError(null);
      }
      return;
    }
    const shouldTryReconnect =
      ctx.enabledRef.current &&
      Boolean(ctx.roomSessionTicketRef.current) &&
      (ctx.roomIdRef.current != null || ctx.preflightHostTicketRef.current != null);
    if (shouldTryReconnect) {
      ctx.setBridgeSessionRecovery('reconnecting');
      ctx.setError(null);
      ctx.scheduleBridgeReconnect();
      return;
    }
    if (ctx.enabledRef.current) {
      ctx.setStatus((prev) => (prev === 'idle' ? 'idle' : 'error'));
      ctx.setError((prev) => prev || 'Connection lost. Use Exit to leave and try again.');
    } else {
      ctx.setStatus('idle');
      ctx.setError(null);
    }
  };
}
