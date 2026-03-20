import type { RoomRules } from './protocol';
import { MAX_ENABLED_TOY_IDS, MAX_FEATURE_LEVEL, MAX_LIMITS_KEYS } from './rules-constants';

export function validateSetToyRulesPayloadFields(payload: {
  enabledToyIds?: string[];
  maxPower?: number;
  limits?: Record<string, number>;
  targetRole?: 'host' | 'guest';
}): boolean {
  if (payload.maxPower != null) {
    const v =
      typeof payload.maxPower === 'number' ? payload.maxPower : parseInt(String(payload.maxPower), 10);
    if (isNaN(v) || v < 1 || v > 100) return false;
  }
  if (payload.limits != null) {
    for (const [, val] of Object.entries(payload.limits)) {
      const n = typeof val === 'number' ? val : parseInt(String(val), 10);
      if (isNaN(n) || n < 1 || n > MAX_FEATURE_LEVEL) return false;
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
  if (!validateSetToyRulesPayloadFields(payload)) return false;
  if (payload.targetRole != null && payload.targetRole !== fromRole) {
    return false;
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
    const v = typeof payload.maxPower === 'number' ? payload.maxPower : parseInt(String(payload.maxPower), 10);
    if (!isNaN(v) && v >= 1 && v <= 100) {
      const pct = Math.round(v);
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
      if (!isNaN(n) && n >= 1 && n <= MAX_FEATURE_LEVEL) clean[k] = n;
    }
    if (fromRole === 'host') {
      (rules as MutableRoomRules).hostLimits = clean;
    } else {
      (rules as MutableRoomRules).guestLimits = clean;
    }
  }
  return true;
}

export function partnerHasRules(rules: RoomRules, role: 'host' | 'guest'): boolean {
  if (role === 'host') {
    return rules.guestEnabledToyIds != null || rules.guestLimits != null;
  }
  return rules.hostEnabledToyIds != null || rules.hostLimits != null;
}
