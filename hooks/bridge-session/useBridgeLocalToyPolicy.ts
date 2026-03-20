import { useCallback } from 'react';
import { LOCAL_TOY_POLICY_UI_COOLDOWN_MS } from './bridge-urls';
import type { BridgeSessionRefs } from './useBridgeSessionRefs';
import type { BridgeSessionStateBag } from './useBridgeSessionState';

export function useBridgeLocalToyPolicy(refs: BridgeSessionRefs, st: BridgeSessionStateBag) {
  const isLocalToyPolicyToggleFrozen = useCallback(
    (toyId: string) => (refs.localToyPolicyCooldownUntilRef.current[toyId] ?? 0) > Date.now(),
    [refs, st.localToyPolicyCooldownEpoch]
  );

  const toggleLocalToyEnabled = useCallback(
    (toyId: string) => {
      const now = Date.now();
      if ((refs.localToyPolicyCooldownUntilRef.current[toyId] ?? 0) > now) return;
      refs.localToyPolicyCooldownUntilRef.current[toyId] = now + LOCAL_TOY_POLICY_UI_COOLDOWN_MS;
      st.setLocalToyPolicyCooldownEpoch((e) => e + 1);
      window.setTimeout(() => {
        delete refs.localToyPolicyCooldownUntilRef.current[toyId];
        st.setLocalToyPolicyCooldownEpoch((e) => e + 1);
      }, LOCAL_TOY_POLICY_UI_COOLDOWN_MS);
      st.setLocalEnabledToyIds((prev) => (prev.includes(toyId) ? prev.filter((id) => id !== toyId) : [...prev, toyId]));
    },
    [refs, st.setLocalEnabledToyIds, st.setLocalToyPolicyCooldownEpoch]
  );

  return { isLocalToyPolicyToggleFrozen, toggleLocalToyEnabled };
}
