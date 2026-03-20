import type { SetStateAction } from 'react';
import type { BridgeStatus } from '../types';
import type { BridgeSessionRecovery } from '../types';

export interface OnSocketIoConnectedCtx {
  myClientSerial: number;
  myEpoch: number;
  bridgeGenAtSetup: number;
  activeBridgeClientSerialRef: { current: number };
  bridgeConnectionEpochRef: { current: number };
  readBridgeGen: () => number;
  setStatus: (a: SetStateAction<BridgeStatus>) => void;
  setSocketIoConnected: (v: boolean) => void;
  setBridgeSessionRecovery: (a: BridgeSessionRecovery) => void;
}

export function createOnSocketIoConnected(ctx: OnSocketIoConnectedCtx) {
  return () => {
    if (ctx.myClientSerial !== ctx.activeBridgeClientSerialRef.current) return;
    if (ctx.myEpoch !== ctx.bridgeConnectionEpochRef.current) return;
    if (ctx.readBridgeGen() !== ctx.bridgeGenAtSetup) return;
    ctx.setStatus((prev) => (prev === 'idle' ? 'idle' : 'online'));
    ctx.setSocketIoConnected(true);
    ctx.setBridgeSessionRecovery('ok');
  };
}
