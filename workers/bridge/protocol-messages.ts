import {
  BRIDGE_PARTNER_STATUS,
  BRIDGE_PARTNER_TOY_RULES,
  PREFIX_APP,
} from './protocol-constants';
import type { RoomRules } from './protocol-types';

export function buildAppMessage(event: string, payload: Record<string, unknown>): string {
  return PREFIX_APP + JSON.stringify([event, payload]);
}

export function partnerStatusMsg(connected: boolean): string {
  return buildAppMessage(BRIDGE_PARTNER_STATUS, { connected });
}

export function partnerToyRulesMsg(fromRole: 'host' | 'guest', rules: RoomRules): string {
  if (fromRole === 'host') {
    const limits = rules.hostLimits ?? {};
    const payload: Record<string, unknown> = { limits };
    if (rules.hostEnabledToyIds != null) payload.enabledToyIds = [...rules.hostEnabledToyIds];
    if (rules.hostToyMaxPower != null) payload.maxPower = rules.hostToyMaxPower;
    return buildAppMessage(BRIDGE_PARTNER_TOY_RULES, payload);
  }
  const limits = rules.guestLimits ?? {};
  const payload: Record<string, unknown> = { limits };
  if (rules.guestEnabledToyIds != null) payload.enabledToyIds = [...rules.guestEnabledToyIds];
  if (rules.guestToyMaxPower != null) payload.maxPower = rules.guestToyMaxPower;
  return buildAppMessage(BRIDGE_PARTNER_TOY_RULES, payload);
}
