import {
  buildAppMessage,
  LOVENSE_TOY_COMMAND_EVENT,
  parseAppMessage,
  type LovenseToyCommandPayload,
  type RoomRules,
} from './protocol';

function isStopAction(action: string): boolean {
  const a = action.trim();
  return /^stop$/i.test(a) || a.toLowerCase().startsWith('stop:');
}

function applyMaxPowerToAction(action: string, maxPowerPct: number): string {
  if (maxPowerPct >= 100) return action;
  if (isStopAction(action)) return action;
  return action
    .split(',')
    .map((part) => {
      const trimmed = part.trim();
      const colon = trimmed.indexOf(':');
      if (colon === -1) return trimmed;
      const name = trimmed.slice(0, colon);
      const levelStr = trimmed.slice(colon + 1);
      const level = parseInt(levelStr, 10);
      if (isNaN(level)) return trimmed;
      let newLevel = Math.round((level * maxPowerPct) / 100);
      if (level > 0 && newLevel < 1) newLevel = 1;
      return `${name}:${newLevel}`;
    })
    .join(',');
}

function applyPerFeatureLimits(action: string, limits: Record<string, number>): string {
  if (!limits || Object.keys(limits).length === 0) return action;
  if (isStopAction(action)) return action;
  return action
    .split(',')
    .map((part) => {
      const trimmed = part.trim();
      const colon = trimmed.indexOf(':');
      if (colon === -1) return trimmed;
      const name = trimmed.slice(0, colon);
      const levelStr = trimmed.slice(colon + 1);
      let level = parseInt(levelStr, 10);
      if (isNaN(level)) return trimmed;
      const cap = limits[name];
      if (cap != null) level = Math.min(level, cap);
      return `${name}:${level}`;
    })
    .join(',');
}

function parseCommandPayload(data: string): LovenseToyCommandPayload | null {
  const parsed = parseAppMessage(data);
  if (!parsed) return null;
  const [event, payloadRaw] = parsed;
  if (event !== LOVENSE_TOY_COMMAND_EVENT || typeof payloadRaw !== 'object' || !payloadRaw) {
    return null;
  }
  const p = payloadRaw as Record<string, unknown>;
  if (typeof p.toy !== 'string' || typeof p.action !== 'string') return null;
  return p as LovenseToyCommandPayload;
}

export function applyRulesAndForwardCommand(
  data: string,
  rules: RoomRules,
  toGuestBackend: boolean
): string | null {
  const payload = parseCommandPayload(data);
  if (!payload) return data;

  const enabledIds = toGuestBackend ? rules.guestEnabledToyIds : rules.hostEnabledToyIds;
  const maxPower = toGuestBackend ? rules.guestToyMaxPower : rules.hostToyMaxPower;
  const limits = toGuestBackend ? rules.guestLimits : rules.hostLimits;

  if (enabledIds != null && !enabledIds.has(payload.toy)) {
    return null;
  }

  let action = payload.action;
  if (limits) action = applyPerFeatureLimits(action, limits);
  if (maxPower != null && maxPower < 100) action = applyMaxPowerToAction(action, maxPower);

  const outPayload = { ...payload, action };
  return buildAppMessage(LOVENSE_TOY_COMMAND_EVENT, outPayload);
}
