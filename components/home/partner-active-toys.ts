import type { Toy } from '@/lib/lovense-domain';

type BridgeSlice = {
  remoteToys: Record<string, Toy>;
  peerConnected: boolean;
  partnerEnabledToyIds: string[] | undefined;
};

export function partnerActiveToysFromBridge(bridge: BridgeSlice): Record<string, Toy> {
  const partnerEnabledSet =
    bridge.partnerEnabledToyIds !== undefined ? new Set(bridge.partnerEnabledToyIds) : null;
  return Object.fromEntries(
    Object.entries(bridge.remoteToys).filter(([toyId]) => {
      if (!bridge.peerConnected) return false;
      if (partnerEnabledSet !== null && !partnerEnabledSet.has(toyId)) return false;
      return true;
    })
  );
}
