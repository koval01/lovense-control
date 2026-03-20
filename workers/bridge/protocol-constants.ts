const PREFIX_APP = '42';
const MIN_APP_MESSAGE_LEN = 4;

export { PREFIX_APP, MIN_APP_MESSAGE_LEN };

export const BRIDGE_SET_TOY_RULES = 'bridge_set_toy_rules';
export const BRIDGE_PING = 'bridge_ping';
export const BRIDGE_PONG = 'bridge_pong';
export const BRIDGE_CHAT_TYPING = 'bridge_chat_typing';
export const BRIDGE_CHAT_MESSAGE = 'bridge_chat_message';
export const BRIDGE_CHAT_VOICE = 'bridge_chat_voice';
export const BRIDGE_PARTNER_STATUS = 'bridge_partner_status';
export const BRIDGE_PARTNER_TOY_RULES = 'bridge_partner_toy_rules';
export const BRIDGE_CHAT_HISTORY = 'bridge_chat_history';
export const BRIDGE_SELF_DEVICE_INFO = 'bridge_self_device_info';
export const BRIDGE_SELF_APP_STATUS = 'bridge_self_app_status';
export const BRIDGE_SELF_GET_QR = 'bridge_self_get_qr';

export const DEVICE_OR_STATUS_EVENTS = new Set([
  'basicapi_update_device_info_tc',
  'basicApi_update_device_info',
  'basicapi_update_app_online_tc',
  'basicapi_update_app_status_tc',
]);

export const LOVENSE_TOY_COMMAND_EVENT = 'basicapi_send_toy_command_ts';
