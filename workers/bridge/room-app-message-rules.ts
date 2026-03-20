import { BRIDGE_SET_TOY_RULES, partnerToyRulesMsg } from './protocol';
import { applySetToyRulesPayload, validateSetToyRulesPayloadFields } from './rules';
import type { BridgeRoomMessagePort } from './room-message-port';

export function handleRoomSetToyRules(
  room: BridgeRoomMessagePort,
  role: 'host' | 'guest',
  payloadRaw: unknown
): void {
  const payload = (payloadRaw as Record<string, unknown>) ?? {};
  const rulesPayload = {
    enabledToyIds: payload.enabledToyIds as string[] | undefined,
    maxPower: payload.maxPower as number | undefined,
    limits: payload.limits as Record<string, number> | undefined,
    targetRole: payload.targetRole as 'host' | 'guest' | undefined,
  };
  if (!validateSetToyRulesPayloadFields(rulesPayload)) return;

  const prevEnabledIds =
    role === 'host'
      ? room.rules.hostEnabledToyIds
        ? new Set(room.rules.hostEnabledToyIds)
        : null
      : room.rules.guestEnabledToyIds
        ? new Set(room.rules.guestEnabledToyIds)
        : null;

  if (rulesPayload.enabledToyIds != null) {
    const nextSet = new Set(rulesPayload.enabledToyIds.slice(0, 50));
    if (!room.canApplyEnabledToyChanges(role, prevEnabledIds, nextSet)) return;
  }

  const ok = applySetToyRulesPayload(rulesPayload, role, room.rules);
  if (!ok) return;

  if (rulesPayload.enabledToyIds != null) {
    const nextSet = new Set(rulesPayload.enabledToyIds.slice(0, 50));
    room.recordEnabledToyToggles(role, prevEnabledIds, nextSet);
    const nextEnabledIds = role === 'host' ? room.rules.hostEnabledToyIds : room.rules.guestEnabledToyIds;
    if (prevEnabledIds && nextEnabledIds) {
      for (const toyId of prevEnabledIds) {
        if (!nextEnabledIds.has(toyId)) {
          room.forceStopToyOnOwnerBackend(role, toyId);
        }
      }
    }
  }
  const other = role === 'host' ? room.guestFrontend : room.hostFrontend;
  if (other) {
    room.sendToWebSocket(other, partnerToyRulesMsg(role, room.rules));
  }
}

export function isSetToyRulesEvent(event: string): boolean {
  return event === BRIDGE_SET_TOY_RULES;
}
