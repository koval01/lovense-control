/**
 * Bridge protocol: parse/build Engine.IO app messages (Socket.IO type 42).
 * Ported from bridge/ws_events.py and bridge/protocol.py
 */

const PREFIX_APP = '42';
const MIN_APP_MESSAGE_LEN = 4;

export const BRIDGE_SET_TOY_RULES = 'bridge_set_toy_rules';
export const BRIDGE_PING = 'bridge_ping';
export const BRIDGE_PONG = 'bridge_pong';
export const BRIDGE_CHAT_TYPING = 'bridge_chat_typing';
export const BRIDGE_CHAT_MESSAGE = 'bridge_chat_message';
export const BRIDGE_CHAT_VOICE = 'bridge_chat_voice';
export const BRIDGE_PARTNER_STATUS = 'bridge_partner_status';
export const BRIDGE_PARTNER_TOY_RULES = 'bridge_partner_toy_rules';
export const BRIDGE_CHAT_HISTORY = 'bridge_chat_history';

export const DEVICE_OR_STATUS_EVENTS = new Set([
  'basicapi_update_device_info_tc',
  'basicApi_update_device_info',
  'basicapi_update_app_online_tc',
  'basicapi_update_app_status_tc',
]);

export const LOVENSE_TOY_COMMAND_EVENT = 'basicapi_send_toy_command_ts';

export interface SetToyRulesPayload {
  enabledToyIds?: string[];
  maxPower?: number;
  limits?: Record<string, number>;
  targetRole?: 'host' | 'guest';
}

export interface ChatMessagePayload {
  text: string;
}

export interface ChatVoicePayload {
  id: string;
  ts: number;
  mime: string;
  data: string;
  durationMs?: number;
}

export interface LovenseToyCommandPayload {
  toy: string;
  action: string;
  [key: string]: unknown;
}

export function parseAppMessage(data: string | ArrayBuffer): [string, unknown] | null {
  const str = typeof data === 'string' ? data : new TextDecoder().decode(data);
  const bytes = new TextEncoder().encode(str);
  if (bytes.length < MIN_APP_MESSAGE_LEN || str.slice(0, 2) !== PREFIX_APP) {
    return null;
  }
  const payloadStr = str.slice(2);
  if (payloadStr[0] !== '[') return null;
  try {
    const arr = JSON.parse(payloadStr) as unknown[];
    if (!Array.isArray(arr) || arr.length < 1) return null;
    const event = arr[0];
    if (typeof event !== 'string') return null;
    const payload = arr[1];
    return [event, payload];
  } catch {
    return null;
  }
}

export function getAppEventName(data: string | ArrayBuffer): string | null {
  const parsed = parseAppMessage(data);
  return parsed ? parsed[0] : null;
}

export function isDeviceOrStatusEvent(data: string | ArrayBuffer): boolean {
  const event = getAppEventName(data);
  return event !== null && DEVICE_OR_STATUS_EVENTS.has(event);
}

export function buildAppMessage(event: string, payload: Record<string, unknown>): string {
  return PREFIX_APP + JSON.stringify([event, payload]);
}

export function partnerStatusMsg(connected: boolean): string {
  return buildAppMessage(BRIDGE_PARTNER_STATUS, { connected });
}

export interface RoomRules {
  hostEnabledToyIds: Set<string> | null;
  hostToyMaxPower: number | null;
  hostLimits: Record<string, number> | null;
  guestEnabledToyIds: Set<string> | null;
  guestToyMaxPower: number | null;
  guestLimits: Record<string, number> | null;
}

export function partnerToyRulesMsg(fromRole: 'host' | 'guest', rules: RoomRules): string {
  if (fromRole === 'host') {
    const limits = rules.hostLimits ?? {};
    const payload: Record<string, unknown> = { limits };
    if (rules.hostEnabledToyIds != null) payload.enabledToyIds = [...rules.hostEnabledToyIds];
    if (rules.hostToyMaxPower != null) payload.maxPower = rules.hostToyMaxPower;
    return buildAppMessage(BRIDGE_PARTNER_TOY_RULES, payload);
  } else {
    const limits = rules.guestLimits ?? {};
    const payload: Record<string, unknown> = { limits };
    if (rules.guestEnabledToyIds != null) payload.enabledToyIds = [...rules.guestEnabledToyIds];
    if (rules.guestToyMaxPower != null) payload.maxPower = rules.guestToyMaxPower;
    return buildAppMessage(BRIDGE_PARTNER_TOY_RULES, payload);
  }
}
