/**
 * Toy access rules: apply enabled IDs, per-feature limits, max power to commands.
 * Ported from bridge/rules.py
 */

import {
  buildAppMessage,
  LOVENSE_TOY_COMMAND_EVENT,
  parseAppMessage,
  type LovenseToyCommandPayload,
  type RoomRules,
} from './protocol';

const MAX_ENABLED_TOY_IDS = 50;
const MAX_LIMITS_KEYS = 30;

function applyMaxPowerToAction(action: string, maxPowerPct: number): string {
  if (maxPowerPct >= 100) return action;
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
      const newLevel = Math.round((level * maxPowerPct) / 100);
      return `${name}:${newLevel}`;
    })
    .join(',');
}

function applyPerFeatureLimits(action: string, limits: Record<string, number>): string {
  if (!limits || Object.keys(limits).length === 0) return action;
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
    return null; // drop: toy not in enabled list
  }

  let action = payload.action;
  if (limits) action = applyPerFeatureLimits(action, limits);
  if (maxPower != null && maxPower < 100) action = applyMaxPowerToAction(action, maxPower);

  const outPayload = { ...payload, action };
  return buildAppMessage(LOVENSE_TOY_COMMAND_EVENT, outPayload);
}

export function applySetToyRulesPayload(
  payload: {
    enabledToyIds?: string[];
    maxPower?: number;
    limits?: Record<string, number>;
    targetRole?: 'host' | 'guest';
  },
  fromRole: 'host' | 'guest',
  rules: RoomRules
): boolean {
  if (payload.targetRole != null && payload.targetRole !== fromRole) {
    return false; // cannot set partner's rules
  }
  if (payload.enabledToyIds != null) {
    const ids = new Set(payload.enabledToyIds.slice(0, MAX_ENABLED_TOY_IDS));
    if (fromRole === 'host') {
      (rules as MutableRoomRules).hostEnabledToyIds = ids;
    } else {
      (rules as MutableRoomRules).guestEnabledToyIds = ids;
    }
  }
  if (payload.maxPower != null) {
    const v = payload.maxPower;
    const pct = v >= 0 ? Math.max(0, Math.min(100, v)) : null;
    if (pct !== null) {
      if (fromRole === 'host') {
        (rules as MutableRoomRules).hostToyMaxPower = pct;
      } else {
        (rules as MutableRoomRules).guestToyMaxPower = pct;
      }
    }
  }
  if (payload.limits != null) {
    const items = Object.entries(payload.limits).slice(0, MAX_LIMITS_KEYS);
    const clean: Record<string, number> = {};
    for (const [k, v] of items) {
      const n = typeof v === 'number' ? v : parseInt(String(v), 10);
      if (!isNaN(n)) clean[k] = n;
    }
    if (fromRole === 'host') {
      (rules as MutableRoomRules).hostLimits = clean;
    } else {
      (rules as MutableRoomRules).guestLimits = clean;
    }
  }
  return true;
}

interface MutableRoomRules extends RoomRules {
  hostEnabledToyIds: Set<string> | null;
  hostToyMaxPower: number | null;
  hostLimits: Record<string, number> | null;
  guestEnabledToyIds: Set<string> | null;
  guestToyMaxPower: number | null;
  guestLimits: Record<string, number> | null;
}

export function partnerHasRules(rules: RoomRules, role: 'host' | 'guest'): boolean {
  if (role === 'host') {
    return rules.guestEnabledToyIds != null || rules.guestLimits != null;
  }
  return rules.hostEnabledToyIds != null || rules.hostLimits != null;
}
