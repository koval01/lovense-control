import { lovenseToyListToCapabilities } from '../toy-capabilities';
import type { BridgeSocketPayload, SocketHandlerDeps } from '../socket-handler-deps';

export function handleDeviceSocketEvents(
  event: string,
  payload: BridgeSocketPayload,
  d: SocketHandlerDeps
): void {
  if (event === 'basicapi_update_device_info_tc' || event === 'basicApi_update_device_info') {
    const toyList = payload?.toyList ?? [];
    d.setRemoteCapabilities(lovenseToyListToCapabilities(toyList));
  }
  if (event === 'bridge_self_device_info') {
    const toyList = payload?.toyList ?? [];
    d.setHasSelfDeviceInfo(true);
    const ownCaps = lovenseToyListToCapabilities(toyList);
    d.setLocalCapabilities(ownCaps);
    const ownIds = ownCaps.map((t) => t.id);
    d.setLocalEnabledToyIds((prev) => {
      const prevSet = new Set(prev);
      const nextSet = new Set<string>();
      ownIds.forEach((id) => {
        if (prevSet.size === 0 || prevSet.has(id)) nextSet.add(id);
      });
      return ownIds.filter((id) => nextSet.has(id));
    });
  }
}
