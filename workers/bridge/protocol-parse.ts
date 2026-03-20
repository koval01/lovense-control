import { DEVICE_OR_STATUS_EVENTS, MIN_APP_MESSAGE_LEN, PREFIX_APP } from './protocol-constants';

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
