import { useEffect } from 'react';
import { maxPowerFromLimits } from './limits';
import type { BridgeSessionRefs } from './useBridgeSessionRefs';
import type { BridgeSessionStateBag } from './useBridgeSessionState';

export function useBridgeToyRulesSyncEffect(
  refs: BridgeSessionRefs,
  st: BridgeSessionStateBag,
  activeToyIds: string[] | undefined,
  limits: Record<string, number> | undefined,
  localToysFromBridge: Record<string, import('@/lib/lovense-domain').Toy>,
  localFeatureIdSet: Set<string>,
  sendBridgeSetToyRules: (payload: {
    enabledToyIds?: string[];
    maxPower?: number;
    limits?: Record<string, number>;
  }) => void
) {
  useEffect(() => {
    if (st.bridgeSessionRecovery !== 'ok' || !refs.lovenseClientRef.current?.isSocketIoConnected) return;
    if (activeToyIds === undefined && limits === undefined) return;
    if (!st.hasSelfDeviceInfo) return;
    const myToyIds = Object.keys(localToysFromBridge);
    const enabledToyIds = st.localEnabledToyIds.filter((id) => myToyIds.includes(id));
    const localLimits: Record<string, number> = {};
    if (limits) {
      for (const [featureId, value] of Object.entries(limits)) {
        if (localFeatureIdSet.has(featureId)) localLimits[featureId] = Math.max(1, value);
      }
    }
    const maxPower = maxPowerFromLimits(localLimits);
    sendBridgeSetToyRules({
      enabledToyIds,
      ...(maxPower !== undefined && { maxPower }),
      ...(Object.keys(localLimits).length > 0 && { limits: localLimits }),
    });
  }, [
    st.bridgeSessionRecovery,
    st.status,
    st.hasSelfDeviceInfo,
    st.localEnabledToyIds,
    activeToyIds,
    limits,
    localFeatureIdSet,
    localToysFromBridge,
    sendBridgeSetToyRules,
    refs,
  ]);
}
