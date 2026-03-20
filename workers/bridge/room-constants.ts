/** Socket.io / bridge framing and tunable limits for BridgeRoom. */

export const ENGINE_OPEN =
  '0{"sid":"bridge-session","upgrades":[],"pingInterval":25000,"pingTimeout":50000}';
export const PROBE_REQUEST = '2probe';
export const PROBE_RESPONSE = '3probe';
export const UPGRADE_ACK = '40';
export const PING = '2';
export const PONG = '3';
export const WS_MESSAGE_MAX_BYTES = 256 * 1024;
export const PING_INTERVAL_MS = 20_000;
/** Min time between enable/disable toggles for the same toyId (same role). */
export const TOY_ENABLE_MIN_INTERVAL_MS = 900;
