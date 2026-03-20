import { useCallback } from 'react';
import { useAppDispatch } from '@/store/hooks';
import { bumpBridgeSocketGeneration } from '@/store/slices/connectionSlice';
import type { BridgeSessionRefs } from './useBridgeSessionRefs';

export function useBridgeDisconnect(
  refs: BridgeSessionRefs,
  closeSocket: () => void,
  resetState: () => void
) {
  const dispatch = useAppDispatch();
  return useCallback(() => {
    refs.intentionalDisconnectRef.current = true;
    refs.reconnectGenRef.current += 1;
    refs.bridgeConnectionEpochRef.current += 1;
    closeSocket();
    dispatch(bumpBridgeSocketGeneration());
    resetState();
    refs.intentionalDisconnectRef.current = false;
  }, [refs, closeSocket, resetState, dispatch]);
}
